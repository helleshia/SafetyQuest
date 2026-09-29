import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, passwordHash, requireAdmin } from "../../lib/auth";
import { canSignIn, refusalFor } from "../../lib/rbac";
import { body, endpoint, json } from "../../lib/http";
import { strongPasswordSchema } from "../../lib/password-policy";

/** Sets a sign-in password for a teacher account. There is no invitation email in
    this build, so an administrator hands the first password over in person and the
    teacher changes it afterwards. Administrators cannot set each other's passwords. */
export const POST = endpoint(async request => {
  const data = z.object({
    userId: z.string().min(1).max(120),
    password: strongPasswordSchema,
  }).parse(await body(request));

  const { db, workspace, account } = await requireAdmin();
  const target = workspace.state.users.find(user => user.id === data.userId);
  if (!target) throw new ApiError(404, "That account does not exist.");
  if (!canSignIn(target.role)) throw new ApiError(403, refusalFor(target.role));
  if (target.role === "Super Admin") throw new ApiError(403, "An administrator cannot set another administrator\u2019s password.");
  if (target.status !== "Active") throw new ApiError(409, "Approve the account before giving it a password.");
  if (!target.email) throw new ApiError(409, "Add an email address to the account first — it is the sign-in name.");

  await db.collection("credentials").updateOne(
    { userId: target.id },
    { $set: { userId: target.id, password: await passwordHash(data.password) } },
    { upsert: true },
  );
  // A password change ends any session that account already had.
  await db.collection("sessions").deleteMany({ userId: target.id });
  await db.collection("audit").insertOne({
    id: randomUUID(),
    action: `${target.role} password set`,
    detail: `${target.name} (${target.email}) · sign-in password set by an administrator`,
    actor: account.email,
    time: new Date().toISOString(),
  });

  return json({ ok: true });
});
