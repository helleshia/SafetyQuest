import type { AssessmentRow, Assignment, GuardianLink, Module, Section, User } from "../shared/demo";
import { attemptScore, officialResults, passMarkFor } from "../../shared/scoring";

// Fictional display names for the parent UI preview only. This is not an identity master list.
// The admin preview can now add a separate fictional studentName without changing the token.
const PREVIEW_NAMES: Record<string, string> = {
  st13: "Maya Mendoza",
  st20: "Elias Mendoza",
  st26: "Noah Mendoza",
  st32: "Liana Mendoza",
};
export const childName = (student: User) => student.studentName?.trim() || PREVIEW_NAMES[student.id] || "Linked student";
/** The name a pending or revoked link would resolve to, used only for the parent's own request list. */
export const previewNameFor = (studentId: string) => PREVIEW_NAMES[studentId] ?? "Linked student";

export function linkedChildren(users: User[], links: GuardianLink[], parentId: string) {
  const allowed = new Set(links.filter(link => link.parentId === parentId && link.status === "Active").map(link => link.studentId));
  return users.filter(user => user.role === "Student" && user.status === "Active" && allowed.has(user.id));
}

/** Every relationship on this account, in any state, for the parent's own access list. */
export function guardianLinks(links: GuardianLink[], parentId: string) {
  return links.filter(link => link.parentId === parentId);
}

export function searchChildren(children: User[], query: string) {
  const needle = query.trim().toLowerCase();
  return children.filter(child => `${childName(child)} ${child.name}`.toLowerCase().includes(needle));
}

/** The child's official result for each module, newest first: the same score
    their app shows, with the teacher's grade taking over the device score. */
export function publishedResults(assessments: AssessmentRow[], studentId: string) {
  return officialResults(assessments, studentId);
}

/** The pass mark the child's own class uses, as on the app. */
export function passMarkOf(sections: Section[], child: User, fallback: number) {
  return passMarkFor(sections.find(section => section.id === child.section), fallback);
}

export function assignedActivities(assignments: Assignment[], child: User) {
  return assignments.filter(item => item.sectionId === child.section && item.status === "Published" && (!item.tokens.length || item.tokens.includes(child.name)));
}

/* --- Check-in --------------------------------------------------------------
   The parent types their child's name and student ID before any record opens.
   Only the student ID is checked, and only against guardian links already on
   this account. The typed name becomes a label on the parent's own screen; the
   admin preview may separately hold fictional student names. A wrong ID gets one identical message
   whether or not that student exists, so the form can never be used to probe
   the roster.
--------------------------------------------------------------------------- */

/** "sq g5 013", "SQ-G5-013" and "sqg5013" all compare equal. */
export const normalizeToken = (value: string) => value.replace(/[^a-z0-9]/gi, "").toUpperCase();

const NOT_YOURS = "That student ID doesn't match a verified child on your account. Check the ID on the slip your child's teacher gave you — it looks like SQ-G5-013.";

export type CheckIn = { ok: true; studentId: string } | { ok: false; message: string };

export function verifyChildDetails(users: User[], links: GuardianLink[], parentId: string, name: string, studentId: string): CheckIn {
  if (name.trim().length < 2) return { ok: false, message: "Enter the name you call your child, so we can label their screens for you." };
  const token = normalizeToken(studentId);
  if (!token) return { ok: false, message: "Enter your child's student ID, for example SQ-G5-013." };

  const student = users.find(user => user.role === "Student" && normalizeToken(user.name) === token);
  const link = student && links.find(item => item.parentId === parentId && item.studentId === student.id);
  if (!student || !link) return { ok: false, message: NOT_YOURS };

  if (link.status === "Pending") return { ok: false, message: "Your request for this student ID is still awaiting verification by the responsible teacher. You will be notified once it is confirmed." };
  if (link.status === "Revoked") return { ok: false, message: "Access to this student record was ended. Ask the responsible section teacher if you believe this is a mistake." };
  if (student.status !== "Active") return { ok: false, message: "This student record is not active yet. Your child's teacher can tell you what is still needed." };
  return { ok: true, studentId: student.id };
}

/* --- Derived progress ------------------------------------------------------ */

export type PhaseState = "Complete" | "In progress" | "Not started";
export type ModuleProgress = { moduleId: number; name: string; domain: string; lesson: PhaseState; practical: number | null };

/**
 * Parents see published modules only, in curriculum order. The child's stored
 * completion count decides how far they have travelled; scores come from
 * published reviews, so an unreviewed attempt shows no number.
 */
export function moduleProgress(modules: Module[], assessments: AssessmentRow[], child: User): ModuleProgress[] {
  const published = modules.filter(module => module.status === "Published").sort((a, b) => a.id - b.id);
  const results = publishedResults(assessments, child.id);
  const done = Math.min(published.length, Math.max(0, child.completed));
  return published.map((module, index): ModuleProgress => {
    const row = results.find(item => item.moduleId === module.id);
    return {
      moduleId: module.id,
      name: module.name,
      domain: module.domain,
      lesson: index < done ? "Complete" : index === done ? "In progress" : "Not started",
      practical: row ? attemptScore(row) : null,
    };
  });
}

/** Badges are earned in order, one for roughly every two completed modules. */
export function earnedBadges<T>(ladder: T[], child: User) {
  return ladder.slice(0, Math.min(ladder.length, Math.floor(Math.max(0, child.completed) / 2)));
}
