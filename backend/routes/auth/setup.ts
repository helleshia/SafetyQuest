import { randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { database, type Workspace } from "../../lib/db";
import { ApiError, hash, limitAttempts, passwordHash, startSession } from "../../lib/auth";
import { body, endpoint, json } from "../../lib/http";
import { emptyAdminState } from "../../../shared/admin-schema";
import { strongPasswordSchema } from "../../lib/password-policy";
export const POST = endpoint(async request => {
  const data = z.object({ name: z.string().trim().min(1).max(100), email: z.email().transform(s => s.toLowerCase()), password: strongPasswordSchema, setupToken: z.string().min(1).max(256) }).parse(await body(request));
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || expected.length < 32) throw new ApiError(503, "Set ADMIN_SETUP_TOKEN to a random value of at least 32 characters in backend/.env first.");
  await limitAttempts("initial-admin-setup");
  if (!timingSafeEqual(Buffer.from(hash(data.setupToken)), Buffer.from(hash(expected)))) throw new ApiError(403, "Incorrect setup token.");
  const { db, client } = await database();
  const state = emptyAdminState();
  const account = { id: randomUUID(), name: data.name, email: data.email, role: "Super Admin" as const, status: "Active" as const, section: "", completed: 0, score: 0, consent: false, assent: false, emailVerified: false, mfaEnrolled: false, createdAt: new Date().toISOString() };
  state.users = [account];
  const password = await passwordHash(data.password);
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      if (await db.collection("workspaces").findOne({ _id: "school" as never }, { session })) throw new ApiError(409, "An administrator is already configured. Sign in instead.");
      await db.collection<Workspace>("workspaces").insertOne({ _id: "school", revision: 0, state }, { session });
      await db.collection("credentials").insertOne({ userId: account.id, password }, { session });
      await db.collection("audit").insertOne({ id: randomUUID(), action: "Administrator configured", detail: "Initial administrator account created", actor: account.email, time: new Date().toISOString() }, { session });
    });
  } finally { await session.endSession(); }
  await startSession(account.id, account.role);
  return json({ account }, 201);
});
