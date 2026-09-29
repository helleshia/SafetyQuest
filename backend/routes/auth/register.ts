import { randomBytes, randomUUID } from "node:crypto";
import { database, type Workspace } from "../../lib/db";
import { ApiError, hash, limitAttempts, passwordHash } from "../../lib/auth";
import { body, endpoint, json } from "../../lib/http";
import { ensureIndex } from "../../lib/indexes";
import { registrationAccount, registrationSchema } from "../../lib/registration";
import { newRegistrationCode, registrationCodeHash, sendRegistrationCode, type Registration } from "../../lib/registration-code";

export const POST = endpoint(async request => {
  const data = registrationSchema.parse(await body(request));
  await limitAttempts(`register:${data.email}`);
  const { db } = await database();
  const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  if (!workspace) throw new ApiError(503, "The school must configure its administrator before registration opens.");
  if (workspace.state.users.some(user => user.email.trim().toLowerCase() === data.email)) {
    throw new ApiError(409, "An account already uses this email. Sign in or contact the school about your account.");
  }

  const token = randomBytes(32).toString("hex");
  const id = hash(token);
  const code = newRegistrationCode();
  const registrations = db.collection<Registration>("registrations");

  // Hash and ensure the TTL index at the same time — both are needed before insert.
  const [password] = await Promise.all([
    passwordHash(data.password),
    ensureIndex(db, "registrations", { expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  await registrations.insertOne({
    _id: id,
    account: registrationAccount(data, randomUUID(), new Date().toISOString()),
    password,
    codeHash: registrationCodeHash(id, code),
    expiresAt: new Date(Date.now() + 600_000),
    attempts: 0,
  });

  // Return as soon as the pending registration exists. Email can lag; the verify
  // screen has Resend if the first message is slow or missing.
  void sendRegistrationCode(data.email, code).catch(async error => {
    console.error("Registration email failed:", error instanceof Error ? error.message : "unknown");
  });

  return json({
    status: "Verification required",
    token,
    email: data.email,
    message: "Enter the 6-digit code sent to your email. If it does not arrive, tap Resend on the next screen.",
  }, 201);
});
