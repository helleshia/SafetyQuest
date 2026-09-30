import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, hash, requireAdmin } from "../../lib/auth";
import { body, endpoint, json, siteOrigin } from "../../lib/http";
import { ensureIndex } from "../../lib/indexes";
import { inviteAdminEmail, mailConfigured, sendMail } from "../../lib/mail";
import type { Workspace } from "../../lib/db";

const MINUTES = 60 * 24; // 24 hours

type Invite = {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: "Super Admin";
  expiresAt: Date;
};

/** Invite a Super Admin by email. They verify on the link and set their password. */
export const POST = endpoint(async request => {
  const data = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.email().transform(s => s.toLowerCase()),
  }).parse(await body(request));

  if (!mailConfigured()) {
    throw new ApiError(503, "Email is not configured. Add SMTP settings in backend/.env before inviting administrators.");
  }

  const { db, workspace, account } = await requireAdmin();
  const email = data.email;
  if (workspace.state.users.some(user => user.email.trim().toLowerCase() === email)) {
    throw new ApiError(409, "This email already belongs to an account.");
  }

  const userId = randomUUID();
  const nextUser = {
    id: userId,
    name: data.name,
    email,
    role: "Super Admin" as const,
    status: "Pending" as const,
    section: "",
    completed: 0,
    score: 0,
    consent: false,
    assent: false,
    emailVerified: false,
  };

  const updated = await db.collection<Workspace>("workspaces").updateOne(
    { _id: "school", revision: workspace.revision },
    {
      $push: { "state.users": nextUser },
      $inc: { revision: 1 },
    },
  );
  if (!updated.matchedCount) throw new ApiError(409, "School records changed. Please try again.");

  const token = randomBytes(32).toString("hex");
  const invites = db.collection<Invite>("admin_invites");
  await ensureIndex(db, "admin_invites", { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await invites.insertOne({
    _id: hash(token),
    userId,
    email,
    name: data.name,
    role: "Super Admin",
    expiresAt: new Date(Date.now() + MINUTES * 60_000),
  });

  const link = `${siteOrigin(request)}/?invite=${token}`;
  try {
    await sendMail({ to: email, ...inviteAdminEmail(data.name, link, MINUTES) });
  } catch {
    // Roll back the directory row if the email never left.
    await db.collection<Workspace>("workspaces").updateOne(
      { _id: "school" },
      { $pull: { "state.users": { id: userId } }, $inc: { revision: 1 } },
    );
    await invites.deleteOne({ _id: hash(token) });
    throw new ApiError(502, "The invitation email could not be sent. Check SMTP settings and try again.");
  }

  await db.collection("audit").insertOne({
    id: randomUUID(),
    action: "Super Admin invited",
    detail: `${data.name} (${email}) · verification email sent`,
    actor: account.email,
    time: new Date().toISOString(),
  });

  return json({ ok: true, userId, message: `Invitation sent to ${email}. They will create a password on the link, then verify with an OTP emailed to them.` }, 201);
});
