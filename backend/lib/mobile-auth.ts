import { randomBytes } from "node:crypto";
import { ApiError, hash } from "./auth";
import { loadSchoolState } from "./curriculum";
import { database, type Workspace } from "./db";
import { ensureIndex } from "./indexes";
import type { ParentContact } from "./mobile-contract";

export type MobileAccount = { _id: string; parentContact: ParentContact; contactVerifiedAt: Date; notification: "pending" | "accepted" };
export type MobileSession = { _id: string; userId: string; expiresAt: Date };
export async function mobileToken(userId: string) {
  const { db } = await database();
  const sessions = db.collection<MobileSession>("mobile_sessions");
  await ensureIndex(db, "mobile_sessions", { expiresAt: 1 }, { expireAfterSeconds: 0 });
  const token = randomBytes(32).toString("hex");
  await sessions.insertOne({ _id: hash(token), userId, expiresAt: new Date(Date.now() + 30 * 86400000) });
  return token;
}

export async function requireStudent(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new ApiError(401, "Sign in to your student account.");
  const { db } = await database();
  const session = await db.collection<MobileSession>("mobile_sessions").findOne({ _id: hash(token), expiresAt: { $gt: new Date() } });
  if (!session) throw new ApiError(401, "Your session has expired. Please sign in again.");
  let workspace: Workspace;
  try {
    const loaded = await loadSchoolState();
    workspace = { _id: "school", revision: loaded.revision, state: loaded.state };
  } catch {
    throw new ApiError(503, "School workspace is not configured.");
  }
  const student = workspace.state.users.find(user => user.id === session.userId && user.role === "Student" && user.status === "Active");
  if (!student) throw new ApiError(403, "Your student account is not active. Ask your teacher for help.");
  const account = await db.collection<MobileAccount>("mobile_accounts").findOne({ _id: student.id });
  if (!account) throw new ApiError(403, "Complete your mobile account setup first.");
  return { db, workspace, student, account, sessionId: session._id };
}
