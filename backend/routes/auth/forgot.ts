import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, hash, limitAttempts, passwordHash } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { ensureIndex } from "../../lib/indexes";
import { mailConfigured, passwordCodeEmail, sendMail } from "../../lib/mail";
import { canSignIn } from "../../lib/rbac";
import { strongPasswordSchema } from "../../lib/password-policy";

type ForgotOtp = {
  _id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
};

const MINUTES = 10;
const MAX_ATTEMPTS = 5;

/** Masked so the UI can show where the code went without printing the address. */
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "your email";
  const head = name.slice(0, 2);
  return `${head}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

const incoming = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("request"),
    email: z.email().transform(value => value.trim().toLowerCase()),
  }),
  z.object({
    step: z.literal("verify"),
    email: z.email().transform(value => value.trim().toLowerCase()),
    code: z.string().min(4).max(10),
  }),
  z.object({
    step: z.literal("confirm"),
    email: z.email().transform(value => value.trim().toLowerCase()),
    code: z.string().min(4).max(10),
    password: strongPasswordSchema,
  }),
]);

/** Public adult password recovery. Always returns a generic success on request so
    the response never reveals whether an email belongs to an account. */
export const POST = endpoint(async request => {
  const data = incoming.parse(await body(request));
  const { db } = await database();
  const codes = db.collection<ForgotOtp>("forgot_otps");
  await ensureIndex(db, "forgot_otps", { expiresAt: 1 }, { expireAfterSeconds: 0 });

  const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  const found = workspace?.state.users.find(user => user.email.trim().toLowerCase() === data.email);
  const account = found && canSignIn(found.role) && found.status === "Active" ? found : undefined;

  if (data.step === "request") {
    await limitAttempts(`forgot-request:${data.email}`);
    // Same shape whether or not the account exists.
    const generic = {
      sent: true as const,
      to: maskEmail(data.email),
      expiresInMinutes: MINUTES,
      delivered: false,
    };
    if (!account) return json(generic);

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await codes.updateOne(
      { _id: hash(data.email) },
      {
        $set: {
          userId: account.id,
          email: data.email,
          codeHash: hash(code),
          expiresAt: new Date(Date.now() + MINUTES * 60_000),
          attempts: 0,
        },
      },
      { upsert: true },
    );
    await db.collection("audit").insertOne({
      id: randomUUID(),
      action: "Password recovery requested",
      detail: "A one-time reset code was issued",
      actor: account.email,
      time: new Date().toISOString(),
    });

    if (mailConfigured()) {
      try {
        await sendMail({ to: account.email, ...passwordCodeEmail(code, MINUTES) });
        return json({ ...generic, delivered: true });
      } catch (problem) {
        console.error("Could not send password recovery code:", problem instanceof Error ? problem.message : "unknown error");
        throw new ApiError(502, "The code could not be emailed right now. Try again in a moment.");
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.info(`[safetyquest] password recovery code for ${account.email}: ${code} (expires in ${MINUTES} minutes)`);
      return json(generic);
    }
    throw new ApiError(503, "Email delivery is not configured on this server, so a code cannot be sent.");
  }

  await limitAttempts(`forgot-check:${data.email}`);
  const record = await codes.findOne({ _id: hash(data.email) });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(410, "That code has expired. Ask for a new one.");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await codes.deleteOne({ _id: hash(data.email) });
    throw new ApiError(429, "Too many incorrect codes. Ask for a new one.");
  }
  if (record.codeHash !== hash(data.code.trim())) {
    await codes.updateOne({ _id: hash(data.email) }, { $inc: { attempts: 1 } });
    const left = MAX_ATTEMPTS - record.attempts - 1;
    throw new ApiError(401, `That code is not correct. ${left} attempt${left === 1 ? "" : "s"} left.`);
  }

  if (data.step === "verify") return json({ ok: true });

  if (!account || account.id !== record.userId) {
    throw new ApiError(410, "That code has expired. Ask for a new one.");
  }

  await db.collection("credentials").updateOne(
    { userId: account.id },
    { $set: { userId: account.id, password: await passwordHash(data.password) } },
    { upsert: true },
  );
  await codes.deleteOne({ _id: hash(data.email) });
  await db.collection("sessions").deleteMany({ userId: account.id });
  await db.collection("audit").insertOne({
    id: randomUUID(),
    action: "Password recovered",
    detail: "Confirmed with a one-time recovery code",
    actor: account.email,
    time: new Date().toISOString(),
  });
  return json({ ok: true });
});
