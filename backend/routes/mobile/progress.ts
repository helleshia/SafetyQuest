import { z } from "zod";
import { ApiError, limitAttempts } from "../../lib/auth";
import { database } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { requireStudent } from "../../lib/mobile-auth";
import { progressId, type LearningProgress } from "../../lib/mobile-contract";
import { answerSchema } from "../../../shared/admin-schema";

const progressSchema = z.object({
  moduleId: z.number().int().positive(),
  learned: z.boolean().optional(),
  quiz: z.number().int().min(0).max(100).optional(),
  // Every Check answer, from the lesson's own questions.
  answers: z.array(answerSchema).max(40).optional(),
}).strict().refine(
  data => data.learned !== undefined || data.quiz !== undefined,
  { message: "Send learned and/or quiz progress." },
);

/** Upserts Phase 1 Learn / Check progress so teachers can see it before Practice. */
export const POST = endpoint(async request => {
  const data = progressSchema.parse(await body(request));
  const { workspace, student } = await requireStudent(request);
  await limitAttempts(`mobile-progress:${student.id}`);
  const module = workspace.state.modules.find(row => row.id === data.moduleId && row.status === "Published");
  if (!module) throw new ApiError(404, "That lesson is not available.");
  const { db } = await database();
  const id = progressId(student.id, data.moduleId);
  const existing = await db.collection<LearningProgress>("learning_progress").findOne({ _id: id });
  const next: LearningProgress = {
    _id: id,
    studentId: student.id,
    sectionId: student.section,
    moduleId: data.moduleId,
    learned: data.learned === true || existing?.learned === true,
    quiz: Math.max(existing?.quiz ?? 0, data.quiz ?? 0),
    // The latest Check run's answers replace the previous run's.
    ...(data.answers ? { answers: data.answers } : existing?.answers ? { answers: existing.answers } : {}),
    updatedAt: new Date().toISOString(),
  };
  await db.collection<LearningProgress>("learning_progress").updateOne(
    { _id: id },
    { $set: next },
    { upsert: true },
  );
  return json({ ok: true, learned: next.learned, quiz: next.quiz });
});
