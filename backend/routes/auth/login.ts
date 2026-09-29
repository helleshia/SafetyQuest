import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database, type Workspace } from "../../lib/db";
import { ApiError, limitAttempts, startSession, upgradeHashIfNeeded, verifyPassword } from "../../lib/auth";
import { canSignIn, refusalFor } from "../../lib/rbac";
import { body, endpoint, json } from "../../lib/http";

const FAIL_LIMIT = 5;

type LoginFail = { _id: string; count: number; updatedAt: Date };

async function clearFailures(db: Awaited<ReturnType<typeof database>>["db"], email: string) {
  await db.collection<LoginFail>("login_failures").deleteOne({ _id: email });
}

async function recordFailure(db: Awaited<ReturnType<typeof database>>["db"], email: string, userId?: string) {
  const fails = db.collection<LoginFail>("login_failures");
  const result = await fails.findOneAndUpdate(
    { _id: email },
    { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true, returnDocument: "after" },
  );
  const count = result?.count ?? 1;
  if (userId && count >= FAIL_LIMIT) {
    await Promise.all([
      db.collection<Workspace>("workspaces").updateOne(
        { _id: "school" },
        { $set: { "state.users.$[user].status": "Suspended" }, $inc: { revision: 1 } },
        { arrayFilters: [{ "user.id": userId }] },
      ),
      fails.deleteOne({ _id: email }),
      db.collection("sessions").deleteMany({ userId }),
    ]);
    void db.collection("audit").insertOne({
      id: randomUUID(),
      action: "Account locked",
      detail: `Suspended after ${FAIL_LIMIT} failed sign-in attempts`,
      actor: email,
      time: new Date().toISOString(),
    });
    throw new ApiError(403, `This account was disabled after ${FAIL_LIMIT} incorrect password attempts. Ask a Super Admin to reactivate it.`);
  }
  const left = FAIL_LIMIT - count;
  throw new ApiError(401, left > 0
    ? `Email or password is incorrect. ${left} attempt${left === 1 ? "" : "s"} left before this account is disabled.`
    : "Email or password is incorrect, or this account is inactive.");
}

export const POST = endpoint(async request => {
  const data = z.object({ email: z.email().transform(s => s.toLowerCase()), password: z.string().min(1).max(128) }).parse(await body(request));
  await limitAttempts(`login:${data.email}`);
  const { db } = await database();
  const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  const found = workspace?.state.users.find(u => u.email.toLowerCase() === data.email);
  if (found && !canSignIn(found.role)) throw new ApiError(403, refusalFor(found.role));
  const account = found && canSignIn(found.role) ? found : undefined;

  if (account?.status === "Suspended") {
    throw new ApiError(403, "This account is disabled. Ask a Super Admin to reactivate it, then try again.");
  }
  if (account?.status === "Pending") {
    throw new ApiError(403, "Your account is pending Super Admin approval. Please wait for the school to approve your registration.");
  }

  const credentials = account && await db.collection("credentials").findOne({ userId: account.id }, { projection: { password: 1 } });
  const valid = await verifyPassword(data.password, credentials?.password ?? `${"0".repeat(32)}:${"0".repeat(128)}`);

  if (!account || !valid) {
    if (account && account.status === "Active") await recordFailure(db, data.email, account.id);
    throw new ApiError(401, "Email or password is incorrect, or this account is inactive.");
  }

  const now = new Date().toISOString();
  // Session first so the browser can move on; bookkeeping runs in parallel and
  // must not block the cookie. Hash upgrades happen after a successful sign-in.
  await startSession(account.id, account.role);
  void Promise.all([
    clearFailures(db, data.email),
    db.collection<Workspace>("workspaces").updateOne(
      { _id: "school" },
      { $set: { "state.users.$[user].lastLogin": now }, $inc: { revision: 1 } },
      { arrayFilters: [{ "user.id": account.id }] },
    ),
    db.collection("audit").insertOne({
      id: randomUUID(),
      action: `${account.role} signed in`,
      detail: "Successful sign-in",
      actor: account.email,
      time: now,
    }),
    upgradeHashIfNeeded(account.id, data.password, credentials!.password),
  ]);

  return json({ account: { ...account, lastLogin: now } });
});
