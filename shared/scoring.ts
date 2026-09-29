/* The one scoring rule the mobile app, the backend and every web console share.

   A module's official score for a learner is their most recent Complete attempt
   that a teacher has published (automatically or by review). A teacher's grade
   overrides the automatic practical percent. Interrupted runs and attempts still
   awaiting review never count. A learner's overall score is the average of their
   official module scores, one per module, so extra retries do not weigh more. */

type Attempt = {
  studentId: string;
  moduleId: number;
  practical: number;
  grade?: number | null;
  quality: string;
  review: string;
  submitted?: string | null;
};

export const COUNTED_REVIEWS = ["Published", "Revised"] as const;

export const isCounted = (row: Attempt) =>
  row.quality === "Complete" && (COUNTED_REVIEWS as readonly string[]).includes(row.review);

/** The score shown for one attempt: the teacher's grade when set, otherwise the device score. */
export const attemptScore = (row: Pick<Attempt, "practical" | "grade">) =>
  Math.max(0, Math.min(100, Math.round(row.grade ?? row.practical)));

const submittedAt = (row: Attempt) => {
  const ms = Date.parse(row.submitted ?? "");
  return Number.isNaN(ms) ? -Infinity : ms;
};

/** Newest first. Attempts are appended as they arrive, so a later index breaks ties. */
function newestFirst<T extends Attempt>(rows: T[]) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => submittedAt(b.row) - submittedAt(a.row) || b.index - a.index)
    .map(item => item.row);
}

/** The attempt that carries this learner's official score for a module, if any. */
export function officialAttempt<T extends Attempt>(rows: T[], studentId: string, moduleId: number): T | undefined {
  return newestFirst(rows.filter(row => row.studentId === studentId && row.moduleId === moduleId && isCounted(row)))[0];
}

/** The newest attempt of any kind, for showing that something is waiting on the teacher. */
export function latestAttempt<T extends Attempt>(rows: T[], studentId: string, moduleId: number): T | undefined {
  return newestFirst(rows.filter(row => row.studentId === studentId && row.moduleId === moduleId))[0];
}

/** One official attempt per module for a learner, newest first. */
export function officialResults<T extends Attempt>(rows: T[], studentId: string): T[] {
  const seen = new Set<number>();
  return newestFirst(rows.filter(row => row.studentId === studentId && isCounted(row))).filter(row => {
    if (seen.has(row.moduleId)) return false;
    seen.add(row.moduleId);
    return true;
  });
}

/** Official results for many learners at once, one per learner and module. */
export function officialResultsFor<T extends Attempt>(rows: T[]): T[] {
  const ids = [...new Set(rows.map(row => row.studentId))];
  return ids.flatMap(id => officialResults(rows, id));
}

export const averageScore = (rows: Pick<Attempt, "practical" | "grade">[]) =>
  rows.length ? Math.round(rows.reduce((sum, row) => sum + attemptScore(row), 0) / rows.length) : null;

/** A learner's modules finished and overall score, derived from their attempts. */
export function studentTotals(rows: Attempt[], studentId: string) {
  const results = officialResults(rows, studentId);
  return { completed: results.length, score: averageScore(results) ?? 0 };
}

/** Every student's `completed` and `score`, recomputed from the assessment records
    so no screen can show a stale copy. Other accounts pass through unchanged. */
export function withStudentTotals<U extends { id: string; role: string; completed: number; score: number }>(users: U[], rows: Attempt[]): U[] {
  return users.map(user => user.role === "Student" ? { ...user, ...studentTotals(rows, user.id) } : user);
}

/** Stars for one simulation, exactly as the app awards them at the end of a run:
    5 of 6 safe steps (83%) earns 3, 4 of 6 (67%) earns 2, 2 of 6 (33%) earns 1.
    The official score is used, so a teacher's grade moves the stars with it. */
export const starsFor = (percent: number) => percent >= 83 ? 3 : percent >= 67 ? 2 : percent >= 33 ? 1 : 0;

/** Stars a learner has collected: the stars of each module's official result, added up. */
export const totalStars = (rows: Pick<Attempt, "practical" | "grade">[]) =>
  rows.reduce((sum, row) => sum + starsFor(attemptScore(row)), 0);

/** A section's own pass mark wins over the school default, exactly as on the app. */
export const passMarkFor = (section: { passingScore?: number | null } | undefined, fallback: number) =>
  section?.passingScore ?? fallback;
