import type { AssessmentRow, Assignment, Module, Section, User } from "../shared/demo";
import type { LearningProgressRow } from "../shared/store";
import { attemptScore, averageScore, latestAttempt, officialAttempt, officialResultsFor } from "../../shared/scoring";

/** A learner's standing in one lesson: did they finish Learn/Check, did they attempt the
    practical, and how did that attempt score against the class pass mark. */
export type LessonStanding = {
  student: User;
  lessonDone: boolean;
  quizBest: number | null;
  practicalDone: boolean;
  /** The attempt behind the score, or the newest one still waiting on the teacher. */
  attempt?: AssessmentRow;
  awaiting: boolean;
  score: number | null;
  passed: boolean | null;
  reaction: number | null;
  feedback: string;
};

export const TOTAL_LESSONS = 15;

export const passMarkOf = (section: Section | undefined, fallback: number) => section?.passingScore ?? fallback;

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

/** True while now is inside the assignment's open→due window (empty dates = always). */
export function assignmentInWindow(opens: string, due: string, now = Date.now()) {
  const openAt = scheduleTime(opens);
  const dueAt = scheduleTime(due, true);
  if (openAt !== null && openAt > now) return false;
  if (dueAt !== null && dueAt < now) return false;
  return true;
}

/** Published lessons a class is currently working on (inside the date window). */
export function activeLessons(assignments: Assignment[], modules: Module[], sectionId: string) {
  return assignments
    .filter(item => item.sectionId === sectionId && item.status === "Published" && assignmentInWindow(item.opens, item.due))
    .map(item => ({ assignment: item, module: modules.find(module => module.id === item.moduleId) }))
    .filter((row): row is { assignment: Assignment; module: Module } => Boolean(row.module));
}

/** Every lesson in the course, paired with this class's availability record.
    A lesson is available once its assignment exists and is published; the same
    record carries the date it opened and the date it should be finished. */
export type ClassLesson = { module: Module; assignment?: Assignment; available: boolean; opens: string; due: string };
export function allLessons(assignments: Assignment[], modules: Module[], sectionId: string): ClassLesson[] {
  return modules.map(module => {
    const assignment = assignments.find(item => item.sectionId === sectionId && item.moduleId === module.id);
    return {
      module,
      assignment,
      available: assignment?.status === "Published",
      opens: assignment?.opens ?? "",
      due: assignment?.due ?? "",
    };
  });
}

/* Dates are held in the readable form the rest of the preview uses, and converted
   only for the date inputs that need ISO. */
export function toInputDate(display: string) {
  const parsed = new Date(display);
  return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}
export function fromInputDate(iso: string) {
  if (!iso) return "";
  const parsed = new Date(`${iso}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
export const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};
/** A due date that has passed, on a lesson the class can still open. */
export const isOverdue = (due: string) => {
  const parsed = new Date(due);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
};

/** Phase 1 Learn/Check is done once the mobile app reports it, or a published practice exists. */
export const lessonDone = (student: User, moduleId: number, progress: LearningProgressRow[] = [], assessments: AssessmentRow[] = []) => {
  if (progress.some(row => row.studentId === student.id && row.moduleId === moduleId && row.learned)) return true;
  return assessments.some(row => row.studentId === student.id && row.moduleId === moduleId && row.quality === "Complete" && ["Published", "Revised", "Awaiting review", "Reviewed draft"].includes(row.review));
};

export function standingFor(student: User, moduleId: number, rows: AssessmentRow[], passMark: number, progress: LearningProgressRow[] = []): LessonStanding {
  // The same attempt the learner's app shows: newest Complete one that is published.
  const official = officialAttempt(rows, student.id, moduleId);
  const attempt = official ?? latestAttempt(rows, student.id, moduleId);
  const phase1 = progress.find(row => row.studentId === student.id && row.moduleId === moduleId);
  const score = official ? attemptScore(official) : null;
  return {
    student,
    lessonDone: lessonDone(student, moduleId, progress, rows),
    quizBest: phase1 ? Math.max(phase1.quiz, official?.accuracy ?? 0) : attempt ? attempt.accuracy : null,
    practicalDone: Boolean(attempt),
    attempt,
    awaiting: !official && Boolean(attempt),
    score,
    passed: score === null ? null : score >= passMark,
    reaction: attempt && attempt.quality === "Complete" ? attempt.reaction : null,
    feedback: attempt?.feedback ?? "",
  };
}

export type ClassStats = {
  section: Section;
  students: User[];
  progress: number;
  average: number;
  attempts: AssessmentRow[];
  lessons: number;
  passMark: number;
};

export function statsFor(section: Section, users: User[], assessments: AssessmentRow[], assignments: Assignment[], modules: Module[], fallbackPass: number): ClassStats {
  const students = users.filter(user => user.role === "Student" && user.section === section.id);
  const attempts = assessments.filter(row => row.sectionId === section.id);
  return {
    section,
    students,
    progress: students.length ? Math.round(students.reduce((sum, student) => sum + Math.min(student.completed, TOTAL_LESSONS), 0) / (students.length * TOTAL_LESSONS) * 100) : 0,
    average: averageScore(officialResultsFor(attempts)) ?? 0,
    attempts,
    lessons: activeLessons(assignments, modules, section.id).length,
    passMark: passMarkOf(section, fallbackPass),
  };
}

/** Learners who have finished the least of the course so far. */
export function lowProgress(stats: ClassStats[], limit = 5) {
  return stats
    .flatMap(item => item.students.map(student => ({ student, section: item.section, done: Math.min(student.completed, TOTAL_LESSONS) })))
    .filter(row => row.done < TOTAL_LESSONS / 2)
    .sort((a, b) => a.done - b.done)
    .slice(0, limit);
}

/** Learners with a practice lesson open to them that they have not attempted yet. */
export function unfinishedPracticals(stats: ClassStats[], assignments: Assignment[], modules: Module[], limit = 5) {
  return stats
    .flatMap(item => {
      const lessons = activeLessons(assignments, modules, item.section.id).filter(row => row.assignment.phases === "Learn and Practice");
      return item.students.flatMap(student => lessons
        .filter(row => !item.attempts.some(attempt => attempt.studentId === student.id && attempt.moduleId === row.module.id))
        .map(row => ({ student, section: item.section, lesson: row.module, due: row.assignment.due })));
    })
    .slice(0, limit);
}

/** Open lessons a learner has not started (no Learn progress and no attempt). */
export function untakenLessons(
  stats: ClassStats[],
  assignments: Assignment[],
  modules: Module[],
  progress: LearningProgressRow[] = [],
  limit = 8,
) {
  return stats
    .flatMap(item => {
      const lessons = activeLessons(assignments, modules, item.section.id);
      return item.students.flatMap(student => lessons
        .filter(row => {
          const started = progress.some(p => p.studentId === student.id && p.moduleId === row.module.id && p.learned);
          const attempted = item.attempts.some(attempt => attempt.studentId === student.id && attempt.moduleId === row.module.id);
          return !started && !attempted;
        })
        .map(row => ({ student, section: item.section, lesson: row.module, due: row.assignment.due })));
    })
    .slice(0, limit);
}
