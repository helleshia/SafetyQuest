import { randomInt } from "node:crypto";
import { z } from "zod";
import { ApiError, hash, limitAttempts, passwordHash } from "../../lib/auth";
import { body, endpoint, json } from "../../lib/http";
import { database, type Workspace } from "../../lib/db";
import { ensureIndex } from "../../lib/indexes";
import { inviteOtpEmail, mailConfigured, sendMail } from "../../lib/mail";
import { strongPasswordSchema } from "../../lib/password-policy";

type Invite = {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: "Super Admin";
  expiresAt: Date;
};

type InviteOtp = { _id: string; codeHash: string; expiresAt: Date; attempts: number };

const OTP_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

const incoming = z.discriminatedUnion("step", [
  z.object({ step: z.literal("lookup"), token: tokenSchema }),
  z.object({ step: z.literal("send-otp"), token: tokenSchema }),
  z.object({
    step: z.literal("accept"),
    token: tokenSchema,
    password: strongPasswordSchema,
    code: z.string().regex(/^\d{6}$/),
  }),
]);

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "your email";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

/** Invited Super Admins open their email link, set a password, then confirm with an OTP. */
export const POST = endpoint(async request => {
  const data = incoming.parse(await body(request));
  const id = hash(data.token);
  await limitAttempts(`accept-invite:${id}`);
  const { db, client } = await database();
  const invite = await db.collection<Invite>("admin_invites").findOne({ _id: id });
  if (!invite || invite.expiresAt <= new Date()) {
    throw new ApiError(410, "This invitation expired or was already used. Ask a Super Admin to send a new one.");
  }

  if (data.step === "lookup") {
    return json({ name: invite.name, email: invite.email, role: invite.role });
  }

  const otps = db.collection<InviteOtp>("invite_otps");
  await ensureIndex(db, "invite_otps", { expiresAt: 1 }, { expireAfterSeconds: 0 });

  if (data.step === "send-otp") {
    await limitAttempts(`invite-otp:${id}`);
    if (!mailConfigured()) {
      throw new ApiError(503, "Email is not configured. Ask your school to set up SMTP before verifying.");
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await otps.updateOne(
      { _id: id },
      { $set: { codeHash: hash(code), expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000), attempts: 0 } },
      { upsert: true },
    );
    try {
      await sendMail({ to: invite.email, ...inviteOtpEmail(invite.name, code, OTP_MINUTES) });
    } catch {
      await otps.deleteOne({ _id: id });
      throw new ApiError(502, "The verification code could not be emailed. Try again in a moment.");
    }
    return json({
      sent: true,
      to: maskEmail(invite.email),
      expiresInMinutes: OTP_MINUTES,
      message: `A 6-digit code was sent to ${maskEmail(invite.email)}.`,
    });
  }

  // accept — password + OTP
  await limitAttempts(`invite-otp-check:${id}`);
  const record = await otps.findOne({ _id: id });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(410, "That code has expired. Request a new one.");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await otps.deleteOne({ _id: id });
    throw new ApiError(429, "Too many incorrect codes. Request a new one.");
  }
  if (record.codeHash !== hash(data.code.trim())) {
    await otps.updateOne({ _id: id }, { $inc: { attempts: 1 } });
    const left = MAX_ATTEMPTS - record.attempts - 1;
    throw new ApiError(401, `That code is not correct. ${left} attempt${left === 1 ? "" : "s"} left.`);
  }

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const consumed = await db.collection<Invite>("admin_invites").deleteOne(
        { _id: id, expiresAt: { $gt: new Date() } },
        { session },
      );
      if (!consumed.deletedCount) throw new ApiError(410, "This invitation expired or was already used.");

      const workspaces = db.collection<Workspace>("workspaces");
      const workspace = await workspaces.findOne({ _id: "school" }, { session });
      if (!workspace) throw new ApiError(503, "School workspace is unavailable.");
      const users = workspace.state.users.map(user =>
        user.id === invite.userId
          ? { ...user, status: "Active" as const, emailVerified: true }
          : user,
      );
      if (!users.some(user => user.id === invite.userId)) {
        throw new ApiError(404, "The invited account is no longer in the school directory.");
      }
      const updated = await workspaces.updateOne(
        { _id: "school", revision: workspace.revision },
        { $set: { "state.users": users }, $inc: { revision: 1 } },
        { session },
      );
      if (!updated.matchedCount) throw new ApiError(409, "School records changed. Please try again.");

      await db.collection("credentials").updateOne(
        { userId: invite.userId },
        { $set: { userId: invite.userId, password: await passwordHash(data.password) } },
        { upsert: true, session },
      );
      await otps.deleteOne({ _id: id }, { session });
    });
  } finally {
    await session.endSession();
  }

  return json({
    ok: true,
    message: "Email verified and password saved. You can sign in as Super Admin.",
  });
});
