import { z } from "zod";
import { strongPasswordSchema } from "./password-policy.ts";

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().pipe(z.email()).transform(value => value.toLowerCase()),
  password: strongPasswordSchema,
  role: z.enum(["Teacher", "Parent"]),
}).strict().refine(data => `${data.firstName} ${data.lastName}`.length <= 100, "Full name must be at most 100 characters.");

export function registrationAccount(data: z.infer<typeof registrationSchema>, id: string, createdAt: string) {
  return { id, name: `${data.firstName} ${data.lastName}`, email: data.email, role: data.role,
    status: "Pending" as const, section: "", completed: 0, score: 0, consent: false,
    assent: false, emailVerified: false, mfaEnrolled: false, createdAt };
}
