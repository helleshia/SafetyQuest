import nodemailer, { type Transporter } from "nodemailer";

/* Outbound email. Credentials come from backend/.env and stay on the server: the
   transport is created once per process and reused, the way the Mongo client is. */

const cache = globalThis as typeof globalThis & { mailer?: Transporter };

export const mailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function transport() {
  if (!mailConfigured()) throw new Error("MAIL_NOT_CONFIGURED");
  if (!cache.mailer) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    cache.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 587 upgrades to TLS with STARTTLS; 465 is TLS from the first byte.
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS ?? "").replace(/\s+/g, "") },
    });
  }
  return cache.mailer;
}

/** Authenticates against the mail server without sending anything. */
export async function verifyMail() {
  return transport().verify();
}

export async function sendMail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  await transport().sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

/** The one-time code email. Plain, short, and it never repeats back anything about
    the child — an inbox is not a place to put a learner's records. */
export function passwordCodeEmail(code: string, minutes: number) {
  const text = [
    "Someone asked to change the password on your SafetyQuest account.",
    "",
    `Your one-time code is ${code}`,
    "",
    `The code expires in ${minutes} minutes and can be used once.`,
    "If this was not you, ignore this email and tell your school administrator — your password has not changed.",
  ].join("\n");

  const html = `<div style="margin:0;padding:24px;background:#f3f1ed;font-family:'DM Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#42151b">
  <div style="max-width:520px;margin:0 auto;padding:28px;background:#fffdf9;border:1px solid rgba(66,21,27,.12);border-radius:18px">
    <p style="margin:0;color:#a44832;font-size:11px;font-weight:700;letter-spacing:.14em">SAFETYQUEST</p>
    <h1 style="margin:10px 0 14px;font-size:22px;font-weight:600;letter-spacing:-.02em">Your one-time code</h1>
    <p style="margin:0 0 18px;color:#766f6a;font-size:14px;line-height:1.6">Someone asked to change the password on your SafetyQuest account. Enter this code to continue.</p>
    <p style="margin:0 0 18px;padding:16px;background:rgba(236,110,77,.1);border-radius:12px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.22em">${code}</p>
    <p style="margin:0 0 8px;color:#766f6a;font-size:13px;line-height:1.6">It expires in ${minutes} minutes and can be used once.</p>
    <p style="margin:0;color:#766f6a;font-size:13px;line-height:1.6">If this was not you, ignore this email and tell your school administrator. Your password has not changed.</p>
  </div>
</div>`;

  return { subject: "Your SafetyQuest one-time code", text, html };
}

export function registrationCodeEmail(code: string) {
  const text = [
    "Verify your SafetyQuest email.",
    "",
    `Your verification code is ${code}.`,
    "It expires in 10 minutes and can be used once.",
    "After verification, your account will wait for Super Admin approval.",
    "If you did not register, ignore this email.",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f3f1ed;font-family:Arial,Helvetica,sans-serif;color:#42151b">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your SafetyQuest verification code is ${code}. It expires in 10 minutes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ed"><tr><td align="center" style="padding:34px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #e4ddd8;border-radius:20px;overflow:hidden">
      <tr><td style="height:7px;background:#ec6e4d;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:30px 34px 12px">
        <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#a44832">SAFETYQUEST</div>
        <h1 style="margin:14px 0 9px;font-size:28px;line-height:1.15;color:#42151b">Verify your email</h1>
        <p style="margin:0;color:#766f6a;font-size:14px;line-height:1.6">You are one step away from joining your SafetyQuest learning space.</p>
      </td></tr>
      <tr><td style="padding:18px 34px 26px">
        <div style="padding:17px 18px;border:1px solid #ead7d0;border-radius:14px;background:#fcf0eb">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#a44832;text-transform:uppercase">Your verification code</div>
          <div style="margin-top:10px;color:#42151b;font-size:34px;font-weight:700;letter-spacing:8px;line-height:1.1">${code}</div>
          <div style="margin-top:9px;color:#766f6a;font-size:12px;line-height:1.5">Expires in 10 minutes · one use only</div>
        </div>
        <p style="margin:20px 0 0;color:#766f6a;font-size:13px;line-height:1.65">Enter this code on the SafetyQuest verification screen. After verification, your account will wait for Super Admin approval before you can sign in.</p>
      </td></tr>
      <tr><td style="padding:17px 34px;border-top:1px solid #eee8e3;background:#faf7f4;color:#766f6a;font-size:12px;line-height:1.6">If you did not create a SafetyQuest account, you can safely ignore this email.</td></tr>
    </table>
    <p style="margin:16px 0 0;color:#9b8e89;font-size:11px;line-height:1.5">SafetyQuest · Learn today. Be ready when it matters.</p>
  </td></tr></table>
  </body></html>`;

  return { subject: "Verify your SafetyQuest email", text, html };
}

/** Invite a Super Admin to open the link, create a password, and confirm with OTP. */
export function inviteAdminEmail(name: string, link: string, minutes: number) {
  const text = [
    `Hi ${name},`,
    "",
    "You have been invited to SafetyQuest as a Super Admin.",
    "Open this link to create your password. We will email a one-time code so you can verify your address:",
    link,
    "",
    `This invitation expires in ${minutes} minutes.`,
    "If you were not expecting this, ignore this email and tell your school.",
  ].join("\n");

  const html = `<div style="margin:0;padding:24px;background:#f3f1ed;font-family:'DM Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#42151b">
  <div style="max-width:520px;margin:0 auto;padding:28px;background:#fffdf9;border:1px solid rgba(66,21,27,.12);border-radius:18px">
    <p style="margin:0;color:#a44832;font-size:11px;font-weight:700;letter-spacing:.14em">SAFETYQUEST</p>
    <h1 style="margin:10px 0 14px;font-size:22px;font-weight:600;letter-spacing:-.02em">You're invited</h1>
    <p style="margin:0 0 18px;color:#766f6a;font-size:14px;line-height:1.6">Hi ${name}, you have been invited as a Super Admin. Open the link, create your password, then enter the one-time code we send to verify your email.</p>
    <p style="margin:0 0 18px"><a href="${link}" style="display:inline-block;padding:12px 18px;background:#ec6e4d;color:#fff;text-decoration:none;border-radius:12px;font-weight:700">Create password and verify</a></p>
    <p style="margin:0;color:#766f6a;font-size:13px;line-height:1.6">This link expires in ${minutes} minutes. If the button does not work, paste this address into your browser:<br /><span style="word-break:break-all;color:#42151b">${link}</span></p>
  </div>
</div>`;

  return { subject: "You're invited to SafetyQuest", text, html };
}

/** One-time code for an invited Super Admin finishing signup. */
export function inviteOtpEmail(name: string, code: string, minutes: number) {
  const text = [
    `Hi ${name},`,
    "",
    "Use this code to finish verifying your SafetyQuest Super Admin invite.",
    "",
    `Your one-time code is ${code}`,
    "",
    `It expires in ${minutes} minutes and can be used once.`,
    "If you did not request this, ignore this email.",
  ].join("\n");

  const html = `<div style="margin:0;padding:24px;background:#f3f1ed;font-family:'DM Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#42151b">
  <div style="max-width:520px;margin:0 auto;padding:28px;background:#fffdf9;border:1px solid rgba(66,21,27,.12);border-radius:18px">
    <p style="margin:0;color:#a44832;font-size:11px;font-weight:700;letter-spacing:.14em">SAFETYQUEST</p>
    <h1 style="margin:10px 0 14px;font-size:22px;font-weight:600;letter-spacing:-.02em">Your verification code</h1>
    <p style="margin:0 0 18px;color:#766f6a;font-size:14px;line-height:1.6">Hi ${name}, enter this code with the password you just created to finish joining as Super Admin.</p>
    <p style="margin:0 0 18px;padding:16px;background:rgba(236,110,77,.1);border-radius:12px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.22em">${code}</p>
    <p style="margin:0;color:#766f6a;font-size:13px;line-height:1.6">It expires in ${minutes} minutes and can be used once.</p>
  </div>
</div>`;

  return { subject: "Your SafetyQuest verification code", text, html };
}

