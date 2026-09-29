import { ApiError } from "./auth";
import { mailConfigured, sendMail } from "./mail";
import type { ParentContact } from "./mobile-contract";

export function canNotify(kind: ParentContact["kind"]) {
  return kind === "email" ? mailConfigured() : Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

export async function notifyParent(contact: ParentContact, subject: string, text: string) {
  if (!canNotify(contact.kind)) throw new ApiError(503, `${contact.kind === "email" ? "Email" : "SMS"} delivery is not configured. Ask your school to enable it${contact.kind === "phone" ? ", or use email" : ""}.`);
  if (contact.kind === "email") {
    await sendMail({ to: contact.value, subject, text });
    return;
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: contact.value, From: process.env.TWILIO_FROM!, Body: text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new ApiError(503, "The SMS provider could not accept the message. Please try again.");
}
