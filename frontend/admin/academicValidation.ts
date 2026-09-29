import type { AcademicYear, AssessmentRow, Assignment, GuardianLink, Section, User } from "../shared/demo";

export const normalizeStudentId = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");
export const normalizeYear = (value: string) => value.trim().replace(/[–—]/g, "-").replace(/\s+/g, "");
export const displayStudentName = (student: User) => student.studentName?.trim() || "Name not recorded";

export function yearError(value: string, years: AcademicYear[], exceptId = "") {
  const name = normalizeYear(value);
  if (!/^\d{4}-\d{4}$/.test(name)) return "Enter an academic year like 2027-2028.";
  const [start, end] = name.split("-").map(Number);
  if (start < 1900 || start > 2200 || end !== start + 1) return "The ending year must be exactly one year after the starting year.";
  if (years.some(year => year.id !== exceptId && normalizeYear(year.name) === name)) return "This academic year already exists.";
  return "";
}

export function studentError(name: string, token: string, users: User[], exceptId = "") {
  if (!name.trim()) return "Enter the student's full name.";
  const normalized = normalizeStudentId(token);
  if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(normalized)) return "Student ID must be 2–40 letters, numbers, or hyphens.";
  if (users.some(user => user.role === "Student" && user.id !== exceptId && normalizeStudentId(user.name) === normalized)) return "This student ID is already used by another account.";
  return "";
}

export function sectionDeleteReason(sectionId: string, users: User[], assignments: Assignment[], assessments: AssessmentRow[]) {
  if (users.some(user => user.role === "Student" && user.section === sectionId)) return "This section contains student accounts. Remove or transfer those accounts first, or archive the section to keep their records.";
  if (assignments.some(row => row.sectionId === sectionId) || assessments.some(row => row.sectionId === sectionId)) return "This section has assignment or assessment history. Archive it instead to preserve those records.";
  return "";
}

export function studentDeleteReason(studentId: string, assessments: AssessmentRow[], links: GuardianLink[], assignments: Assignment[], token: string) {
  if (assessments.some(row => row.studentId === studentId) || links.some(row => row.studentId === studentId) || assignments.some(row => row.tokens.includes(token))) return "This student has learning history, guardian links, or individual assignments. Change the account status to Suspended instead of deleting it.";
  return "";
}
