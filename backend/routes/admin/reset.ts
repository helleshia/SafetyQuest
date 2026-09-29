import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, limitAttempts, requireAdmin, verifyPassword } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { clearAttempts, clearGrants, progressInScope, resetCounts, rollBack, resetLabel, type ResetScope } from "../../../shared/resetLessons";
import { withStudentTotals } from "../../../shared/scoring";

/** Deleting learner work is the one action that re-checks the password. The check
    happens here rather than in the console, so a crafted request cannot skip it. */
export const POST = endpoint(async request => {
  const data = z.object({
    password: z.string().min(1).max(128),
    sectionId: z.string().min(1).max(120).optional(),
    moduleId: z.number().int().positive().max(100000).optional(),
  }).parse(await body(request));

  const { db, workspace, account } = await requireAdmin();
  // Rate limit the password attempt itself, per administrator.
  await limitAttempts(`reset:${account.id}`);

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
        action: "Lessons reset",
        detail: `Reset ${resetLabel(scope)} · ${counts.attempts} attempts removed · ${counts.students} learners rolled back`,
        actor: account.email,
        time: new Date().toISOString(),
      }, { session });
    });
  } finally {
    await session.endSession();
  }

  const audit = await db.collection("audit").find({}, { projection: { _id: 0 } }).sort({ time: -1 }).limit(1000).toArray();
  return json({ ...workspace.state, users, assessments, assignments, revision: workspace.revision + 1, audit, accountId: account.id });
});
