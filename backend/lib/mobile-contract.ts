import { z } from "zod";
import type { AdminState, AnswerRecord } from "../../shared/admin-schema.ts";
import { reaches, scopesFor } from "../../shared/announcements.ts";
import { attemptScore, officialAttempt, officialResults, passMarkFor, studentTotals, totalStars } from "../../shared/scoring.ts";
import { strongPasswordSchema } from "./password-policy.ts";

export const studentIdSchema = z.string().trim().min(1).max(100).transform(value => value.toUpperCase());
export const mobilePasswordSchema = strongPasswordSchema;
const parentEmailSchema = z.object({ kind: z.literal("email"), value: z.string().trim().pipe(z.email()).transform(value => value.toLowerCase()) }).strict();
// Older accounts may hold a phone contact, so stored contacts keep both kinds.
export const parentContactSchema = z.discriminatedUnion("kind", [
  parentEmailSchema,
  z.object({ kind: z.literal("phone"), value: z.string().trim().transform(value => value.replace(/[\s()-]/g, "")).transform(value => /^09\d{9}$/.test(value) ? `+63${value.slice(1)}` : value).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Use a mobile number with country code, e.g. +639171234567.")) }).strict(),
]);
export const mobileRegistrationSchema = z.object({
  studentId: studentIdSchema,
  password: mobilePasswordSchema,
  confirmPassword: z.string(),
  // New setups take an email only: it is where the parent is told about the
  // account, and the address that links their web account to this student.
  parentContact: parentEmailSchema,
}).strict().refine(data => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });
export type ParentContact = z.infer<typeof parentContactSchema>;

/** Stable IDs shared with Flutter `LessonContent.key`. Name matching is fallback only. */
export { APP_READY_KEYS, MODULE_KEYS_BY_ID } from "../../shared/curriculum.ts";
import { APP_READY_KEYS, MODULE_KEYS_BY_ID } from "../../shared/curriculum.ts";

export function moduleKey(module: AdminState["modules"][number]) {
  return module.key ?? MODULE_KEYS_BY_ID[module.id] ?? `module-${module.id}`;
}

export function moduleReady(module: AdminState["modules"][number]) {
  return APP_READY_KEYS.has(moduleKey(module));
}

// The administrative name field is the school-issued student ID.
export function findMobileStudent(state: AdminState, studentId: string) {
  return state.users.find(user => user.role === "Student" && user.status === "Active" && user.name.toUpperCase() === studentId.toUpperCase());
}

// A Pending student activates their own account by finishing mobile setup, so
// setup also accepts Pending. Suspended students stay locked out.
const canSetUp = (status: AdminState["users"][number]["status"]) => status === "Active" || status === "Pending";
export function findSetupStudent(state: AdminState, studentId: string) {
  return state.users.find(user => user.role === "Student" && canSetUp(user.status) && user.name.toUpperCase() === studentId.toUpperCase());
}

type Student = AdminState["users"][number];

/** Teacher dates may be ISO (`2026-03-26`) or display form (`Mar 26, 2026`). */
function scheduleTime(value: string | undefined, endOfDay = false): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  if (!endOfDay) return ms;
  const day = new Date(ms);
  day.setHours(23, 59, 59, 999);
  return day.getTime();
}

/** Published assignments for this learner that are inside their open→due window. */
const openAssignments = (state: AdminState, student: Student) => {
  const now = Date.now();
  return state.assignments.filter(row => {
    if (row.status !== "Published" || row.sectionId !== student.section) return false;
    if (row.tokens.length > 0 && !row.tokens.includes(student.name)) return false;
    const opens = scheduleTime(row.opens);
    const due = scheduleTime(row.due, true);
    if (opens !== null && opens > now) return false;
    if (due !== null && due < now) return false;
    return true;
  });
};

/** Whether this student may run the Phase 2 simulation for a module, and how many
    tries remain. Every learner gets exactly one try; the practical locks once it is
    used (finished or left midway) and only a try the teacher grants to that learner
    opens it again. The assignment's class-wide `retries` field is not a try. */
export function practiceAccess(state: AdminState, student: Student, moduleId: number) {
  const section = state.sections.find(row => row.id === student.section);
  const module = state.modules.find(row => row.id === moduleId && row.status === "Published");
  const assignment = openAssignments(state, student).find(row => row.moduleId === moduleId && row.phases === "Learn and Practice");
  const open = Boolean(module && assignment && section && !section.archived && section.lessonsOpen !== false && section.practicalOpen !== false);
  const used = state.assessments.filter(row => row.studentId === student.id && row.moduleId === moduleId).length;
  const bonus = assignment?.extraTries?.[student.id] ?? 0;
  return { practice: open, attemptsLeft: open ? Math.max(0, 1 + bonus - used) : 0 };
}

export type LearningProgress = {
  _id: string;
  studentId: string;
  sectionId: string;
  moduleId: number;
  learned: boolean;
  quiz: number;
  /** The latest Check answers, as the app recorded them. */
  answers?: AnswerRecord[];
  updatedAt: string;
};

export function progressId(studentId: string, moduleId: number) {
  return `${studentId}:${moduleId}`;
}

/** Posts a learner should see: their teacher's posts to their section, and school
    posts for students (whole school, their grade, or their section). Newest first,
    as the consoles store them. */
export function studentAnnouncements(state: AdminState, section: AdminState["sections"][number] | undefined) {
  if (!section) return [];
  const scopes = scopesFor([section]);
  const own = section.name.trim().toLowerCase();
  return state.announcements.filter(item => reaches(item.audience, "students", scopes)).slice(0, 30).map(item => ({
    id: item.id,
    title: item.title,
    message: item.message,
    date: item.date,
    from: item.audience.trim().toLowerCase() === own ? "Your teacher" : "Your school",
  }));
}

export function mobileSnapshot(
  state: AdminState,
  userId: string,
  progress: LearningProgress[] = [],
) {
  const student = state.users.find(user => user.id === userId && user.role === "Student");
  if (!student) throw new Error("Student not found");
  const section = state.sections.find(row => row.id === student.section);
  const assignments = openAssignments(state, student);
  const moduleIds = new Set(assignments.map(row => row.moduleId));
  const totals = studentTotals(state.assessments, userId);
  const completedIds = new Set(officialResults(state.assessments, userId).map(row => row.moduleId));
  const progressByModule = new Map(progress.map(row => [row.moduleId, row]));
  const passMark = passMarkFor(section, state.settings.practicalPass);
  // Badges stay after the open window ends. Count official results and any
  // Complete practical that already met the pass mark (including awaiting review).
  const earnedIds = new Set<number>(completedIds);
  for (const row of state.assessments) {
    if (row.studentId !== userId || row.quality !== "Complete") continue;
    if (attemptScore(row) >= passMark) earnedIds.add(row.moduleId);
  }
  const lessons = section?.lessonsOpen === false || section?.archived ? [] : state.modules.filter(row => row.status === "Published" && moduleIds.has(row.id)).map(row => {
    const key = moduleKey(row);
    const saved = progressByModule.get(row.id);
    const assignment = assignments.find(item => item.moduleId === row.id);
    const attempt = officialAttempt(state.assessments, userId, row.id);
    const practicalScore = attempt ? attemptScore(attempt) : 0;
    return {
      id: row.id,
      key,
      name: row.name,
      domain: row.domain,
      pages: row.lessonPages,
      ready: moduleReady(row),
      completed: completedIds.has(row.id),
      learned: saved?.learned === true || completedIds.has(row.id),
      quizBest: Math.max(saved?.quiz ?? 0, attempt?.accuracy ?? 0),
      practicalBest: practicalScore,
      feedback: attempt?.feedback?.trim() || "",
      // Average decision time of the scored run, in seconds, for the scorecard.
      reaction: attempt ? attempt.reaction : null,
      opens: assignment?.opens ?? "",
      due: assignment?.due ?? "",
      ...practiceAccess(state, student, row.id),
    };
  });
  const classmates = state.users.filter(user => user.role === "Student" && user.status === "Active" && user.section === student.section);
  const standings = classmates.flatMap((user, index) => {
    const results = officialResults(state.assessments, user.id).filter(row => row.sectionId === student.section);
    if (!results.length) return [];
    const score = Math.round(results.reduce((sum, row) => sum + attemptScore(row), 0) / results.length);
    return [{ label: user.id === student.id ? "You" : `Explorer ${String(index + 1).padStart(2, "0")}`, isYou: user.id === student.id, completed: results.length, stars: totalStars(results), score }];
  }).sort((a, b) => b.stars - a.stars || b.score - a.score);
  // Ranked by simulation stars collected. Equal stars are split by the average
  // score; only learners equal on both share a place.
  const ahead = (row: typeof standings[number], other: typeof standings[number]) =>
    other.stars > row.stars || (other.stars === row.stars && other.score > row.score);
  // Badges stay earned after a lesson's open window ends.
  const earnedKeys = [...earnedIds]
    .map(id => {
      const row = state.modules.find(module => module.id === id);
      return row ? moduleKey(row) : null;
    })
    .filter((key): key is string => Boolean(key));

  return {
    announcements: studentAnnouncements(state, section),
    student: { studentId: student.name, name: student.studentName || "Safety explorer", section: section?.name ?? "", completed: totals.completed, score: totals.score, passMark },
    lessons,
    earnedKeys,
    // No names, student IDs, contacts or unpublished scores of classmates leave here.
    leaderboard: { scope: "Your classroom", entries: standings.map(row => ({ ...row, rank: standings.filter(other => ahead(row, other)).length + 1 })) },
  };
}
