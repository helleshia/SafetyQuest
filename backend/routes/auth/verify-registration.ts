import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database, type Workspace } from "../../lib/db";
import { ApiError, hash, limitAttempts } from "../../lib/auth";
import { body, endpoint, json } from "../../lib/http";
import { newRegistrationCode, registrationCodeHash, sendRegistrationCode, type Registration } from "../../lib/registration-code";

const incoming = z.discriminatedUnion("step", [
  z.object({ step: z.literal("verify"), token: z.string().regex(/^[a-f0-9]{64}$/), code: z.string().regex(/^\d{6}$/) }),
  z.object({ step: z.literal("resend"), token: z.string().regex(/^[a-f0-9]{64}$/) }),
]);
export const POST = endpoint(async request => {
  const data = incoming.parse(await body(request));
  const id = hash(data.token);
  await limitAttempts(`registration-check:${id}`);
  const { db, client } = await database();
  const registrations = db.collection<Registration>("registrations");
  const record = await registrations.findOne({ _id: id });
  if (!record || record.expiresAt <= new Date()) throw new ApiError(410, "Registration expired. Please sign up again to receive a new code.");
  if (data.step === "resend") {
    await limitAttempts(`register:${record.account.email}`);
    const code = newRegistrationCode();
    const codeHash = registrationCodeHash(id, code);
    const result = await registrations.updateOne({ _id: id, codeHash: record.codeHash }, { $set: { codeHash } });
    if (!result.matchedCount) throw new ApiError(409, "Registration changed. Please try again.");
    await sendRegistrationCode(record.account.email, code);
    return json({ message: "A new code was emailed. Use the latest code before your registration expires." });
  }
  // Reserve an attempt atomically; concurrent requests cannot bypass the limit.
  const attempted = await registrations.findOneAndUpdate({ _id: id, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { returnDocument: "after" });
  if (!attempted) throw new ApiError(429, "Code expired or too many attempts. Please sign up again.");
  if (attempted.codeHash !== registrationCodeHash(id, data.code)) throw new ApiError(400, "Incorrect verification code. Please check your email.");
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const consumed = await registrations.deleteOne({ _id: id, codeHash: attempted.codeHash, expiresAt: { $gt: new Date() } }, { session });
      if (!consumed.deletedCount) throw new ApiError(410, "This code expired or was already used.");
      const workspaces = db.collection<Workspace>("workspaces");
      const workspace = await workspaces.findOne({ _id: "school" }, { session });
      if (!workspace) throw new ApiError(503, "School registration is unavailable.");
      if (workspace.state.users.some(user => user.email.trim().toLowerCase() === attempted.account.email)) throw new ApiError(409, "This email already has an account. Please sign in or contact the school.");
      const account = { ...attempted.account, emailVerified: true, status: "Pending" as const };
      const updated = await workspaces.updateOne({ _id: "school", revision: workspace.revision }, { $push: { "state.users": account }, $inc: { revision: 1 } }, { session });
      if (!updated.matchedCount) throw new ApiError(409, "School records changed. Please try verification again.");
      await db.collection("credentials").insertOne({ userId: account.id, password: attempted.password }, { session });
      await db.collection("audit").insertOne({ id: randomUUID(), action: "Email verified; approval pending", detail: `${account.role} registration submitted for approval`, actor: account.email, time: new Date().toISOString() }, { session });
    });
  } finally { await session.endSession(); }
  return json({ status: "Pending", message: "Email verified. Your account is now pending Super Admin approval. You can sign in once approved." });
});
