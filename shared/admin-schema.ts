import { z } from "zod";
import { CURRICULUM_MODULES } from "./curriculum.ts";

const text = z.string().max(2000);
const id = z.string().min(1).max(120);
const count = z.number().int().nonnegative();
const optionalBoolean = z.preprocess(value => value === null ? undefined : value, z.boolean().optional());
/** Null from older records is treated as unset (same as missing). */
export const nullableFlag = optionalBoolean;
const nullToUndef = <T extends z.ZodType>(schema: T) => z.preprocess(value => value === null ? undefined : value, schema);
export const nullableNumber = (schema: z.ZodNumber) => nullToUndef(schema.optional());
export const nullableString = (schema: z.ZodString = z.string()) => nullToUndef(schema.optional());
export const nullableArray = <T extends z.ZodType>(schema: T) => nullToUndef(z.array(schema).optional());
/** One answer as the learner gave it, written by the app from the lesson itself:
    the real question, every option, what was picked and what was expected. */
export const answerSchema = z.object({
  prompt: z.string().max(1000),
  kind: z.string().max(40),
  choices: z.array(z.string().max(500)).max(12),
  answer: z.number().int().nonnegative().optional(),
  chosen: z.number().int().nonnegative().optional(),
  chose: z.string().max(2000),
  expected: z.string().max(2000),
  correct: z.boolean(),
  seconds: z.number().min(0).max(600).optional(),
  explain: z.string().max(2000).optional(),
});
export type AnswerRecord = z.infer<typeof answerSchema>;
/** The Check answers and the simulation steps behind one attempt. */
export const attemptDetailSchema = z.object({
  quiz: z.array(answerSchema).max(40),
  steps: z.array(answerSchema).max(40),
});

export const userSchema = z.object({
  id, name: z.string().trim().min(1).max(100), studentName: nullableString(text),
  email: z.union([z.email(), z.literal("")]), role: z.enum(["Super Admin", "Teacher", "Parent", "Student"]),
  status: z.enum(["Active", "Pending", "Suspended"]), section: text, completed: count,
  score: z.number().min(0).max(100), consent: z.boolean(), assent: z.boolean(), activated: optionalBoolean,
  enrolled: nullableString(text), lastActive: nullableString(text), createdAt: nullableString(text), lastLogin: nullableString(text),
  emailVerified: optionalBoolean, mfaEnrolled: optionalBoolean,
});
export const settingsSchema = z.object({ term: text, termStart: text, termEnd: text, practicalPass: z.number().min(0).max(100), languages: text, simulationsPerWeek: count, noticeVersion: text, provisioning: z.enum(["Invitation only", "Open registration with approval"]), reactionWeighting: z.boolean() });
const rows = <T extends z.ZodType>(schema: T) => z.array(schema).max(10000);
export const stateSchema = z.object({
  academicYears: rows(z.object({ id, name: z.string().regex(/^\d{4}[-–]\d{4}$/), status: z.enum(["Active", "Archived"]) })),
  academicTerms: rows(z.object({ id, academicYearId: id, name: text, status: z.enum(["Active", "Planned"]), starts: text, ends: text })),
  grades: rows(z.object({ id, academicYearId: id, level: z.string().regex(/^(?:[1-9]|1[0-2])$/) })),
  users: rows(userSchema),
  sections: rows(z.object({ id, name: z.string().trim().min(1).max(80), grade: text, teacherId: text, code: text, enrollment: z.boolean(), archived: optionalBoolean, termId: nullableString(text), lessonsOpen: optionalBoolean, practicalOpen: optionalBoolean, passingScore: nullableNumber(z.number().min(0).max(100)) })),
  modules: rows(z.object({ id: count, name: text, domain: text, status: z.enum(["Draft", "In review", "Changes requested", "Approved", "Published", "Archived"]), version: count, lessonPages: count, questions: count, scenarios: count, key: z.string().trim().min(1).max(80).optional() })),
  links: rows(z.object({ id, parentId: id, studentId: id, status: z.enum(["Active", "Pending", "Revoked"]), verifiedBy: text })),
  announcements: rows(z.object({ id, title: z.string().trim().min(1).max(200), message: z.string().min(1).max(10000), audience: text, date: text })),
  assessments: rows(z.object({ id, studentId: id, sectionId: id, moduleId: count, practical: z.number(), accuracy: z.number(), reaction: z.number(), quality: z.enum(["Complete", "Interrupted"]), review: z.enum(["Published", "Reviewed draft", "Awaiting review", "Revised"]), grade: nullableNumber(z.number().min(0).max(100)), feedback: nullableString(text), revisions: nullableArray(z.object({ from: z.number(), to: z.number(), reason: text, author: text, at: text })), comments: nullableArray(z.object({ id, author: text, at: text, text: z.string().max(4000) })), submitted: nullableString(text), detail: nullToUndef(attemptDetailSchema.optional()) })),
  assignments: rows(z.object({ id, moduleId: count, version: count, sectionId: id, tokens: rows(text), opens: text, due: text, phases: z.enum(["Learn only", "Learn and Practice"]), retries: count, simulation: z.boolean(), status: z.enum(["Draft", "Published", "Withdrawn"]), extraTries: z.record(z.string(), z.number().int().min(0).max(20)).optional() })),
  settings: settingsSchema,
});
export type AdminState = z.infer<typeof stateSchema>;
export type AdminAudit = { id: string; action: string; detail: string; time: string; actor: string };
export type AdminSnapshot = AdminState & { revision: number; audit: AdminAudit[]; accountId: string };
export const emptyAdminState = (): AdminState => ({
  academicYears: [], academicTerms: [], grades: [], users: [], sections: [],
  modules: CURRICULUM_MODULES.map(row => ({ ...row })),
  links: [], announcements: [], assessments: [], assignments: [],
  settings: { term: "No academic year configured", termStart: "", termEnd: "", practicalPass: 70, languages: "", simulationsPerWeek: 0, noticeVersion: "", provisioning: "Invitation only", reactionWeighting: false },
});

/** Validate relationships on the server as well as form-level client checks. */
/** JSON with object keys sorted and unset fields dropped, so two records with
    the same content compare equal whatever order their fields were written in. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(Object.keys(item).sort().filter(key => item[key] !== undefined && item[key] !== null).map(key => [key, item[key]]));
  });
}
export const sameContent = (a: unknown, b: unknown) => canonical(a) === canonical(b);

export function validateState(state: AdminState, previous: AdminState, accountId: string) {
  const fail = (message: string): never => { throw new Error(message); };
  const unique = (values: (string | number)[], label: string) => { if (new Set(values).size !== values.length) fail(`Duplicate ${label}.`); };
  for (const [key, value] of Object.entries(state)) if (Array.isArray(value)) unique(value.map(row => row.id), `${key} ID`);
  unique(state.users.filter(u => u.email).map(u => u.email.toLowerCase()), "email address");
  unique(state.users.filter(u => u.role === "Student").map(u => u.name.toUpperCase()), "student ID");
  unique(state.academicYears.map(y => y.name.replace("–", "-")), "academic year");
  unique(state.grades.map(g => `${g.academicYearId}:${g.level}`), "grade level");
  unique(state.sections.map(s => `${s.termId}:${s.grade}:${s.name.toLowerCase()}`), "section name");
  for (const year of state.academicYears) { const [start, end] = year.name.split(/[-–]/).map(Number); if (end !== start + 1) fail("Academic years must be consecutive."); }
  const me = state.users.find(u => u.id === accountId);
  if (!me || me.role !== "Super Admin" || me.status !== "Active") fail("You cannot remove or deactivate your own administrator account.");
  for (const old of previous.users) {
    const next = state.users.find(user => user.id === old.id);
    if (!next && (previous.links.some(link => link.parentId === old.id || link.studentId === old.id) || previous.assessments.some(row => row.studentId === old.id) || (old.role === "Student" && previous.assignments.some(row => row.tokens.includes(old.name))))) fail("This account has linked records. Suspend it instead of deleting it.");
    if (next && old.role === "Student" && next.section !== old.section && (previous.links.some(link => link.studentId === old.id) || previous.assessments.some(row => row.studentId === old.id) || previous.assignments.some(row => row.sectionId === old.section && row.tokens.includes(old.name)))) fail("A student with linked records cannot be moved to another section through user editing.");
  }
  for (const user of state.users) {
    if (user.role !== "Student" && !user.email) fail("Adult accounts need an email address.");
    if (user.role === "Student" && !state.sections.some(s => s.id === user.section)) fail("Student section does not exist.");
    const old = previous.users.find(u => u.id === user.id);
    if (old && old.role !== user.role) fail("Changing an existing account role is not supported.");
    for (const field of ["completed", "score", "consent", "assent", "activated", "emailVerified", "mfaEnrolled", "lastLogin", "createdAt"] as const) {
      if (old && (user[field] ?? undefined) !== (old[field] ?? undefined)) fail(`The ${field} field cannot be changed through administration.`);
      if (!old && ["completed", "score", "consent", "assent", "activated", "emailVerified", "mfaEnrolled", "lastLogin"].includes(field) && user[field]) fail(`New records cannot include ${field}.`);
    }
  }
  // Compare what the records say, not how they are written: stored rows keep
  // fields in the order they were added (a teacher's feedback lands after
  // "submitted"), while the parsed copy follows the schema's order.
  if (sameContent(state.assessments, previous.assessments) === false) fail("Assessment records are read-only for administrators.");
  for (const term of state.academicTerms) if (!state.academicYears.some(y => y.id === term.academicYearId)) fail("Term academic year does not exist.");
  for (const grade of state.grades) if (!state.academicYears.some(y => y.id === grade.academicYearId)) fail("Grade academic year does not exist.");
  for (const section of state.sections) {
    const term = state.academicTerms.find(t => t.id === section.termId);
    if (!term || !state.grades.some(g => g.academicYearId === term.academicYearId && g.level === section.grade)) fail("Section needs an existing term and grade.");
    if (section.teacherId && !state.users.some(u => u.id === section.teacherId && u.role === "Teacher")) fail("Assigned teacher does not exist.");
  }
  for (const link of state.links) if (!state.users.some(u => u.id === link.parentId && u.role === "Parent") || !state.users.some(u => u.id === link.studentId && u.role === "Student")) fail("Guardian link references a missing account.");
  for (const row of [...state.assessments, ...state.assignments]) if (!state.sections.some(s => s.id === row.sectionId) || !state.modules.some(m => m.id === row.moduleId)) fail("Learning records reference a missing section or module.");
  for (const row of state.assessments) if (!state.users.some(u => u.id === row.studentId && u.role === "Student")) fail("Assessment student does not exist.");
}
