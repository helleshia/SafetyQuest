import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, hash, limitAttempts, passwordHash, requireUser } from "../../lib/auth";
import { body, endpoint, json } from "../../lib/http";
import { ensureIndex } from "../../lib/indexes";
import { mailConfigured, passwordCodeEmail, sendMail } from "../../lib/mail";
import { strongPasswordSchema } from "../../lib/password-policy";

type Otp = { _id: string; codeHash: string; expiresAt: Date; attempts: number };

const MINUTES = 10;
const MAX_ATTEMPTS = 5;

/** Masked so a confirmation can say where the code went without printing the address. */
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "your email";
  const head = name.slice(0, 2);
  return `${head}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

const incoming = z.discriminatedUnion("step", [
  z.object({ step: z.literal("request") }),
  z.object({ step: z.literal("verify"), code: z.string().min(4).max(10) }),
  z.object({ step: z.literal("confirm"), code: z.string().min(4).max(10), password: strongPasswordSchema }),
]);

/** Changing a password takes a one-time code as well as a signed-in session, so a
    borrowed unlocked screen is not enough on its own. The code is stored hashed,
    expires, and is destroyed once it is used. */
export const POST = endpoint(async request => {
  const data = incoming.parse(await body(request));
  const { db, account } = await requireUser(["Super Admin", "Teacher", "Parent"]);
  const codes = db.collection<Otp>("password_otps");
  await ensureIndex(db, "password_otps", { expiresAt: 1 }, { expireAfterSeconds: 0 });

  if (data.step === "request") {
    await limitAttempts(`otp-request:${account.id}`);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await codes.updateOne(
      { _id: account.id },
      { $set: { codeHash: hash(code), expiresAt: new Date(Date.now() + MINUTES * 60_000), attempts: 0 } },
      { upsert: true },
    );
    await db.collection("audit").insertOne({
      id: randomUUID(), action: "Password change requested", detail: "A one-time code was issued",
      actor: account.email, time: new Date().toISOString(),
    });
    // The code is a credential: it goes to the account's inbox, never to the browser.
    let delivered = false;
    if (mailConfigured()) {
      try {
        await sendMail({ to: account.email, ...passwordCodeEmail(code, MINUTES) });
        delivered = true;
      } catch (problem) {
        // A mail outage must not hand the code to whoever is holding the screen, so
        // the request fails instead and the stored code simply expires unused.
        console.error("Could not send the one-time code:", problem instanceof Error ? problem.message : "unknown error");
        throw new ApiError(502, "The code could not be emailed right now. Try again in a moment, or ask your administrator to check the mail settings.");
      }
    } else if (process.env.NODE_ENV !== "production") {
      // No mail configured in development: print it to the server console only.
      console.info(`[safetyquest] one-time password code for ${account.email}: ${code} (expires in ${MINUTES} minutes)`);
    } else {
      throw new ApiError(503, "Email delivery is not configured on this server, so a code cannot be sent.");
    }
    return json({ sent: true, to: maskEmail(account.email), expiresInMinutes: MINUTES, delivered });
  }

  await limitAttempts(`otp-check:${account.id}`);
  const record = await codes.findOne({ _id: account.id });
  if (!record || record.expiresAt.getTime() < Date.now()) throw new ApiError(410, "That code has expired. Ask for a new one.");
  if (record.attempts >= MAX_ATTEMPTS) {
    await codes.deleteOne({ _id: account.id });
    throw new ApiError(429, "Too many incorrect codes. Ask for a new one.");
  }
  if (record.codeHash !== hash(data.code.trim())) {
    await codes.updateOne({ _id: account.id }, { $inc: { attempts: 1 } });
    throw new ApiError(401, `That code is not correct. ${MAX_ATTEMPTS - record.attempts - 1} attempt${MAX_ATTEMPTS - record.attempts - 1 === 1 ? "" : "s"} left.`);
  }

  if (data.step === "verify") return json({ ok: true });

  await db.collection("credentials").updateOne(
    { userId: account.id },
    { $set: { userId: account.id, password: await passwordHash(data.password) } },
    { upsert: true },
  );
  await codes.deleteOne({ _id: account.id });
  // A new password ends every session that account had anywhere else.
  await db.collection("sessions").deleteMany({ userId: account.id });
  await db.collection("audit").insertOne({
    id: randomUUID(), action: "Password changed", detail: "Confirmed with a one-time code",
    actor: account.email, time: new Date().toISOString(),
  });
  return json({ ok: true });
});
