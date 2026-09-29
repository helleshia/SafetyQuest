import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin, ApiError } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { stateSchema, validateState } from "../../../shared/admin-schema";
import { withStudentTotals } from "../../../shared/scoring";
export const GET = endpoint(async () => {
  const { db, workspace, account } = await requireAdmin();
  const [audit, progress] = await Promise.all([
    db.collection("audit").find({}, { projection: { _id: 0 } }).sort({ time: -1 }).limit(100).toArray(),
    db.collection("learning_progress").find({}, { projection: { _id: 0, studentId: 1, moduleId: 1, learned: 1, quiz: 1 } }).toArray(),
  ]);
  // Learn/Check records, so a reset can tell who has started a lesson.
  return json({ ...workspace.state, progress, users: withStudentTotals(workspace.state.users, workspace.state.assessments), revision: workspace.revision, audit, accountId: account.id });
});
export const PUT = endpoint(async request => {
  const data = z.object({ revision: z.number().int().nonnegative(), state: stateSchema, events: z.array(z.object({ action: z.string().min(1).max(120), detail: z.string().max(2000) })).max(50) }).parse(await body(request));
  const { workspace, account } = await requireAdmin();
  if (data.revision !== workspace.revision) throw new ApiError(409, "Another session changed these records. Reload the latest data and apply your change again.");
  try { validateState(data.state, workspace.state, account.id); } catch (error) { throw new ApiError(400, (error as Error).message); }
  // Scores are derived from the assessment records, never typed in.
  data.state.users = withStudentTotals(data.state.users, data.state.assessments);
  for (const user of data.state.users) if (!workspace.state.users.some(old => old.id === user.id)) user.createdAt = new Date().toISOString();
  const emailChanged = workspace.state.users.filter(old => data.state.users.some(user => user.id === old.id && user.email !== old.email));
  for (const user of data.state.users) if (emailChanged.some(old => old.id === user.id)) user.emailVerified = false;
  const deletedAccounts = workspace.state.users.filter(old => !data.state.users.some(user => user.id === old.id));
  const deleted = deletedAccounts.map(user => user.id);
  const deletedEmails = deletedAccounts.map(user => user.email).filter(Boolean);
  const activeYear = data.state.academicYears.find(y => y.status === "Active");
  const activeTerm = data.state.academicTerms.find(t => t.academicYearId === activeYear?.id && t.status === "Active");
  data.state.settings.term = activeYear ? `SY ${activeYear.name}${activeTerm ? ` / ${activeTerm.name}` : ""}` : "No academic year configured";
  const changed = Object.keys(data.state).filter(key => JSON.stringify(data.state[key as keyof typeof data.state]) !== JSON.stringify(workspace.state[key as keyof typeof data.state]));
  const { db, client } = await database(); const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await db.collection<Workspace>("workspaces").updateOne({ _id: "school", revision: data.revision }, { $set: { state: data.state }, $inc: { revision: 1 } }, { session });
      if (!result.matchedCount) throw new ApiError(409, "Data changed in another session. Reload before saving again.");
      const events = [{ action: "Workspace updated", detail: changed.length ? `Saved: ${changed.join(", ")}` : "Administrative activity recorded" }, ...data.events];
      await db.collection("audit").insertMany(events.map(event => ({ ...event, id: randomUUID(), actor: account.email, time: new Date().toISOString() })), { session });
      const revoked = workspace.state.users.filter(old => !data.state.users.some(user => user.id === old.id && user.status === "Active"));
      if (revoked.length) await db.collection("sessions").deleteMany({ userId: { $in: revoked.map(u => u.id) } }, { session });
      if (emailChanged.length) await db.collection("sessions").deleteMany({ userId: { $in: emailChanged.map(user => user.id) } }, { session });
      if (deleted.length) {
        await db.collection("credentials").deleteMany({ userId: { $in: deleted } }, { session });
        await db.collection("password_otps").deleteMany({ _id: { $in: deleted } } as never, { session });
        await db.collection("sessions").deleteMany({ userId: { $in: deleted } }, { session });
        // Clean legacy account documents too. The workspace user remains the
        // source of truth, but older deployments may also have this collection.
        await db.collection("accounts").deleteMany({ $or: [{ userId: { $in: deleted } }, { id: { $in: deleted } }, { _id: { $in: deleted } }, ...(deletedEmails.length ? [{ email: { $in: deletedEmails } }] : [])] } as never, { session });
        await db.collection("registrations").deleteMany({ $or: [{ "account.id": { $in: deleted } }, ...(deletedEmails.length ? [{ "account.email": { $in: deletedEmails } }] : [])] }, { session });
      }
    });
  } finally { await session.endSession(); }
  const audit = await db.collection("audit").find({}, { projection: { _id: 0 } }).sort({ time: -1 }).limit(100).toArray();
  return json({ ...data.state, revision: data.revision + 1, audit, accountId: account.id });
});
