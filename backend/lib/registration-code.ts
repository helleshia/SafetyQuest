import { randomInt } from "node:crypto";
import { ApiError, hash } from "./auth";
import { mailConfigured, registrationCodeEmail, sendMail } from "./mail";
import type { registrationAccount } from "./registration";

export type Registration = { _id: string; account: ReturnType<typeof registrationAccount>; password: string; codeHash: string; expiresAt: Date; attempts: number };
export const newRegistrationCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const registrationCodeHash = (id: string, code: string) => hash(`${id}:${code}`);
export async function sendRegistrationCode(email: string, code: string) {
  if (!mailConfigured()) throw new ApiError(503, "Email verification is unavailable. Please ask the school to configure email delivery.");
  try {
    await sendMail({ to: email, ...registrationCodeEmail(code) });
  } catch { throw new ApiError(502, "The verification email could not be sent. Please try again."); }
}
