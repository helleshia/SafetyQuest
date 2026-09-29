import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, limitAttempts } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { requireStudent } from "../../lib/mobile-auth";
import { practiceAccess, progressId, type LearningProgress } from "../../lib/mobile-contract";
import { answerSchema } from "../../../shared/admin-schema";
import { loadSchoolState } from "../../lib/curriculum";
import { studentTotals } from "../../../shared/scoring";

// `quiz` is the Phase 1 quiz result and `practical` the Phase 2 simulation
// score, both in percent; `reaction` is the average decision time in seconds.
const attemptSchema = z.object({
  moduleId: z.number().int().nonnegative(),
  quiz: z.number().int().min(0).max(100),
  practical: z.number().int().min(0).max(100),
  reaction: z.number().min(0).max(600),
  quality: z.enum(["Complete", "Interrupted"]),
  // Each simulation step played, from the lesson's own content.
  steps: z.array(answerSchema).max(40).optional(),
}).strict();

/** Records one simulation attempt. Complete runs publish automatically with the
    device score so class averages and the scorecard update right away. Interrupted
    or incomplete runs stay awaiting review for the teacher to check. */
export const POST = endpoint(async request => {
  const data = attemptSchema.parse(await body(request));
  const { workspace: first, student } = await requireStudent(request);
  await limitAttempts(`mobile-attempt:${student.id}`);
  const autoPublish = data.quality === "Complete";
  const { db } = await database();
  // The Check answers were sent when the learner finished Phase 1; they travel
  // with the attempt so the teacher sees both parts in one record.
  const phase1 = await db.collection<LearningProgress>("learning_progress").findOne({ _id: progressId(student.id, data.moduleId) });
  const attempt = {
    id: randomUUID(), studentId: student.id, sectionId: student.section, moduleId: data.moduleId,
    practical: data.practical, accuracy: data.quiz, reaction: Math.round(data.reaction * 10) / 10,
    quality: data.quality,
    review: autoPublish ? "Published" as const : "Awaiting review" as const,
    // Automatic grade mirrors the practical %; teachers only override when needed.
    ...(autoPublish ? { grade: data.practical } : {}),
    submitted: new Date().toISOString(),
    detail: { quiz: phase1?.answers ?? [], steps: data.steps ?? [] },
  };
  // A teacher saving at the same moment moves the revision. Re-read and try again
  // rather than bounce the learner's run, re-checking the one-try rule each time.
  let workspace: Pick<Workspace, "revision" | "state"> = first;
  for (let round = 0; round < 4; round++) {
    if (round > 0) workspace = await loadSchoolState();
    const access = practiceAccess(workspace.state, student, data.moduleId);
    if (!access.practice) throw new ApiError(403, "Practice is not open for this lesson right now. Ask your teacher.");
    if (access.attemptsLeft < 1) throw new ApiError(409, "You have used your try for this simulation. Ask your teacher if you need another.");
    // The learner's overall score moves with the new attempt, so the web consoles
    // and the app read the same number straight away.
    const totals = studentTotals([...workspace.state.assessments, attempt], student.id);
    // The revision guard keeps two submissions from both spending the last try.
    const saved = await db.collection<Workspace>("workspaces").updateOne(
      { _id: "school", revision: workspace.revision },
      {
        $push: { "state.assessments": attempt },
        $set: { "state.users.$[learner].score": totals.score, "state.users.$[learner].completed": totals.completed },
        $inc: { revision: 1 },
      },
      { arrayFilters: [{ "learner.id": student.id }] },
    );
    if (saved.modifiedCount) {
      return json({
        ok: true,
        attemptsLeft: access.attemptsLeft - 1,
        published: autoPublish,
        score: data.practical,
        grade: autoPublish ? data.practical : undefined,
      });
    }
  }
  // Still colliding after several rounds: a server-side fault, so the app keeps the run and resends it.
  throw new ApiError(503, "The school server is busy. Your run will be sent again shortly.");
});
