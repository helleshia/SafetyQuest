import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, passwordHash, requireAdmin } from "../../lib/auth";
import { canSignIn, refusalFor } from "../../lib/rbac";
import { body, endpoint, json } from "../../lib/http";
import { strongPasswordSchema } from "../../lib/password-policy";

/** Sets a sign-in password for a teacher, parent or student account. An administrator
    hands the new password over in person and the account holder changes it afterwards.
    Administrators cannot set each other's passwords. */
export const POST = endpoint(async request => {
  const data = z.object({
    userId: z.string().min(1).max(120),
    password: strongPasswordSchema,
  }).parse(await body(request));

  const { db, workspace, account } = await requireAdmin();
  const target = workspace.state.users.find(user => user.id === data.userId);
  if (!target) throw new ApiError(404, "That account does not exist.");
  if (target.role === "Super Admin") throw new ApiError(403, "An administrator cannot set another administrator’s password.");
  const student = target.role === "Student";
  // Students sign in on the mobile app, not the website, so they are the one role
  // outside the web sign-in table that this still applies to.
  if (!student && !canSignIn(target.role)) throw new ApiError(403, refusalFor(target.role));
  if (target.status !== "Active") throw new ApiError(409, student ? "This student account is not active, so it has no password to reset." : "Approve the account before giving it a password.");
  if (!student && !target.email) throw new ApiError(409, "Add an email address to the account first — it is the sign-in name.");
  if (student) {
    // A student who never finished setup in the app has no password yet; they choose
    // their own there. Setting one here would not let them in without that setup.
    const [credentials, mobile] = await Promise.all([
      db.collection("credentials").findOne({ userId: target.id }),
      db.collection("mobile_accounts").findOne({ _id: target.id } as never),
    ]);
    if (!credentials || !mobile) throw new ApiError(409, "This student has not set up their app account yet. They choose their own password when they first open the app.");
  }

  await db.collection("credentials").updateOne(
    { userId: target.id },
    { $set: { userId: target.id, password: await passwordHash(data.password) } },
    { upsert: true },
  );
  // A password change ends any session that account already had.
  await db.collection("sessions").deleteMany({ userId: target.id });
  if (student) await db.collection("mobile_sessions").deleteMany({ userId: target.id });
  await db.collection("audit").insertOne({
    id: randomUUID(),
    action: `${target.role} password reset`,
    detail: `${target.studentName || target.name}${target.email ? ` (${target.email})` : ` (${target.name})`} · sign-in password set by an administrator`,
    actor: account.email,
    time: new Date().toISOString(),
  });

  return json({ ok: true });
});
