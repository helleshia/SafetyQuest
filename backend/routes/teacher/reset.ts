import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, limitAttempts, requireTeacher, verifyPassword } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { clearAttempts, clearGrants, progressInScope, resetCounts, rollBack, type ResetScope } from "../../../shared/resetLessons";
import { withStudentTotals } from "../../../shared/scoring";

/** A teacher may reset only their own class, and only after confirming with their
    own password. Both checks happen here, not in the console. */
export const POST = endpoint(async request => {
  const data = z.object({
    password: z.string().min(1).max(128),
    sectionId: z.string().min(1).max(120),
    moduleId: z.number().int().positive().max(100000).optional(),
  }).parse(await body(request));

  const { db, workspace, account } = await requireTeacher();
  await limitAttempts(`reset:${account.id}`);

  const section = workspace.state.sections.find(item => item.id === data.sectionId);
  if (!section || section.teacherId !== account.id || section.archived) {
    throw new ApiError(403, "That class is not assigned to you.");
  }

  const credentials = await db.collection<{ userId: string; password: string }>("credentials").findOne({ userId: account.id });
  const valid = credentials ? await verifyPassword(data.password, credentials.password) : false;
  if (!valid) throw new ApiError(401, "That password is not correct. Nothing was reset.");

  const scope: ResetScope = { sectionId: data.sectionId, moduleId: data.moduleId };
  const counts = resetCounts(workspace.state.users, workspace.state.assessments, scope);
  const assessments = clearAttempts(workspace.state.assessments, scope);
  const assignments = clearGrants(workspace.state.assignments, scope);
  const users = withStudentTotals(rollBack(workspace.state.users, scope), assessments);

  const { client } = await database();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await db.collection<Workspace>("workspaces").updateOne(
        { _id: "school", revision: workspace.revision },
        { $set: { "state.users": users, "state.assessments": assessments, "state.assignments": assignments }, $inc: { revision: 1 } },
        { session },
      );
      if (!result.matchedCount) throw new ApiError(409, "Another session changed these records. Reload the latest data and try again.");
      // The lesson they read and the Check they took are reset too.
      await db.collection("learning_progress").deleteMany(progressInScope(workspace.state.users, scope), { session });
      await db.collection("audit").insertOne({
        id: randomUUID(),
        action: data.moduleId ? "Lesson reset" : "All lessons reset",
        detail: `${section.name} · ${counts.attempts} attempts removed · ${counts.students} learners rolled back`,
        actor: account.email,
        time: new Date().toISOString(),
      }, { session });
    });
  } finally {
    await session.endSession();
  }

  return json({ ok: true, ...counts });
});
