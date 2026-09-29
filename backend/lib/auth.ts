import bcrypt from "bcryptjs";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { loadSchoolState } from "./curriculum";
import { database, type Workspace } from "./db";
import { ensureAuthIndexes, ensureIndex } from "./indexes";
import { ABSOLUTE_HOURS, IDLE_MINUTES, readSession, signSession } from "./jwt";
import { RBAC, type Role } from "./rbac";

const derive = promisify(scrypt);
export const COOKIE = "safetyquest_session";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
/* Passwords are stored as bcrypt hashes. Earlier accounts were hashed with scrypt,
   so both formats are recognised on the way in and an old one is quietly upgraded
   the next time its owner signs in. Nobody is locked out by the change.
   Cost 10 is still strong for a school thesis system and ~4× faster than 12. */
const BCRYPT_ROUNDS = 10;
const isBcrypt = (stored: string) => stored.startsWith("$2");

export async function passwordHash(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** True when the password matches, whichever format it was stored in. */
export async function verifyPassword(password: string, stored: string) {
  if (isBcrypt(stored)) return bcrypt.compare(password, stored);
  // Legacy scrypt: "salt:key", both hex.
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const key = await derive(password, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Re-hashes a correct password that is still in the old format. */
export async function upgradeHashIfNeeded(userId: string, password: string, stored: string) {
  if (isBcrypt(stored)) return;
  try {
    const { db } = await database();
    await db.collection("credentials").updateOne({ userId }, { $set: { password: await passwordHash(password) } });
  } catch {
    // An upgrade that fails must never block a sign-in that already succeeded.
  }
}
type Session = { _id: string; userId: string; expiresAt: Date; idleExpiresAt: Date };

const cookieOptions = () => ({
  httpOnly: true as const,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  // The cookie outlives the idle window on purpose: the server decides when a
  // session is over, and an expired token must still reach it to be told so.
  maxAge: ABSOLUTE_HOURS * 3600,
});

export async function startSession(userId: string, role: string) {
  const { db } = await database();
  await ensureIndex(db, "sessions", { expiresAt: 1 }, { expireAfterSeconds: 0 });

  const sid = randomBytes(24).toString("hex");
  const absolute = new Date(Date.now() + ABSOLUTE_HOURS * 3600_000);
  const token = await signSession({ sid, uid: userId, role }, absolute);
  await db.collection<Session>("sessions").insertOne({
    _id: hash(sid),
    userId,
    expiresAt: absolute,
    idleExpiresAt: new Date(Date.now() + IDLE_MINUTES * 60_000),
  });
  (await cookies()).set(COOKIE, token, cookieOptions());
}

/** Ends the session this request belongs to. */
export async function endSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  const jar = await cookies();
  if (token) {
    const claims = await readSession(token);
    if (claims) {
      const { db } = await database();
      await db.collection<Session>("sessions").deleteOne({ _id: hash(claims.sid) });
    }
  }
  jar.delete(COOKIE);
}
export type AccountRole = "Super Admin" | "Teacher" | "Parent" | "Student";

/** Resolves the signed-in account and refuses anything outside `roles`. Every
    protected route goes through here, so a role check is never left to the client. */
export async function requireUser(roles: AccountRole[]) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) throw new ApiError(401, "Sign in to continue.");

  // 1. The token must be ours and unexpired. A tampered or stale one stops here.
  const claims = await readSession(token);
  if (!claims) throw new ApiError(440, "You were signed out after 5 minutes of inactivity. Sign in again.");

  const { db } = await database();
  const sessions = db.collection<Session>("sessions");
  const now = new Date();

  // 2. The stored session is the authority, so revoking one takes effect at once.
  const session = await sessions.findOne({ _id: hash(claims.sid) });
  if (!session || session.expiresAt <= now) {
    if (session) await sessions.deleteOne({ _id: session._id });
    throw new ApiError(401, "Your session has expired. Sign in again.");
  }
  if (session.idleExpiresAt <= now) {
    await sessions.deleteOne({ _id: session._id });
    throw new ApiError(440, `You were signed out after ${IDLE_MINUTES} minutes of inactivity. Sign in again.`);
  }

  let workspace: Workspace;
  try {
    const loaded = await loadSchoolState();
    workspace = { _id: "school", revision: loaded.revision, state: loaded.state };
  } catch {
    throw new ApiError(503, "School workspace is not configured.");
  }
  const account = workspace.state.users.find(user => user.id === session.userId);
  if (!account || account.status !== "Active") throw new ApiError(403, "This account is not active.");
  const rules = RBAC[account.role as Role];
  if (!rules?.webSignIn) throw new ApiError(403, rules?.refusal ?? "This account cannot sign in here.");
  if (!roles.includes(account.role as AccountRole)) throw new ApiError(403, `Access is limited to ${roles.join(" or ")} accounts.`);

  // 3. This request counts as activity: push the idle window and re-issue the token.
  const idleExpiresAt = new Date(now.getTime() + IDLE_MINUTES * 60_000);
  await sessions.updateOne({ _id: session._id }, { $set: { idleExpiresAt } });
  jar.set(COOKIE, await signSession(claims, session.expiresAt), cookieOptions());

  return { db, workspace, account };
}
export const requireAdmin = () => requireUser(["Super Admin"]);
export const requireTeacher = () => requireUser(["Teacher"]);
export async function limitAttempts(key: string) {
  const { db } = await database();
  await ensureAuthIndexes(db);
  const bucket = Math.floor(Date.now() / 900000);
  const collection = db.collection<{ _id: string; count: number; expiresAt: Date }>("auth_limits");
  const result = await collection.findOneAndUpdate({ _id: hash(`${key}:${bucket}`) }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 1800000) } }, { upsert: true, returnDocument: "after" });
  if ((result?.count ?? 0) > 10) throw new ApiError(429, "Too many attempts. Try again in 15 minutes.");
}
