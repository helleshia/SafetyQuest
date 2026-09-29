import { z } from "zod";

/** Shared rules for creating or changing a password (web + invite + reset). */
export const PASSWORD_HINT =
  "Use 8–72 characters with at least one letter and one number. Avoid spaces-only passwords.";

const WEAK = new Set([
  "password", "password1", "password123", "12345678", "123456789", "qwerty123",
  "admin123", "welcome1", "letmein1", "safetyquest", "safetyquest1",
]);

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("at least 8 characters");
  if (password.length > 128 || Buffer.byteLength(password, "utf8") > 72) issues.push("at most 72 characters");
  if (!/[A-Za-z]/.test(password)) issues.push("a letter");
  if (!/[0-9]/.test(password)) issues.push("a number");
  if (WEAK.has(password.toLowerCase())) issues.push("something less common than a well-known password");
  return issues;
}

export const strongPasswordSchema = z.string().min(8).max(128).superRefine((value, ctx) => {
  if (Buffer.byteLength(value, "utf8") > 72) {
    ctx.addIssue({ code: "custom", message: "Password must be at most 72 UTF-8 bytes." });
    return;
  }
  const issues = passwordIssues(value);
  if (issues.length) {
    ctx.addIssue({ code: "custom", message: `Password needs ${issues.join(", ")}.` });
  }
});

/** Client-side check before submit. */
export function passwordOk(password: string) {
  return passwordIssues(password).length === 0;
}
