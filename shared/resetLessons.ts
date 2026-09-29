/** Lesson resets, shared by the server that performs them and the consoles that ask.
    The shapes below are structural on purpose: the backend passes stored records and
    the previews pass demo records, and neither side has to know about the other. */

export type ResetScope = { sectionId?: string; moduleId?: number };

type Learner = { id: string; role: string; section: string; completed: number; score: number };
type Attempt = { studentId: string; sectionId: string; moduleId: number };
type Progress = { studentId: string; moduleId: number };

const inScope = (row: Attempt, scope: ResetScope) =>
  (scope.sectionId === undefined || row.sectionId === scope.sectionId)
  && (scope.moduleId === undefined || row.moduleId === scope.moduleId);

export const attemptsInScope = <T extends Attempt>(assessments: T[], scope: ResetScope) =>
  assessments.filter(row => inScope(row, scope));

export const studentsInScope = <T extends Learner>(users: T[], scope: ResetScope) =>
  users.filter(user => user.role === "Student" && (scope.sectionId === undefined || user.section === scope.sectionId));

/** Attempts outside the scope are kept exactly as they were. */
export const clearAttempts = <T extends Attempt>(assessments: T[], scope: ResetScope) =>
  assessments.filter(row => !inScope(row, scope));

/** Extra tries a teacher granted are cleared with the attempts they were for.
    Otherwise a reset hands them back: a learner granted three retakes last week
    would start the fresh lesson with four tries instead of one. */
export function clearGrants<T extends { sectionId: string; moduleId: number; extraTries?: Record<string, number> | null }>(assignments: T[], scope: ResetScope): T[] {
  return assignments.map(row => {
    if (!inScope({ studentId: "", sectionId: row.sectionId, moduleId: row.moduleId }, scope) || !row.extraTries) return row;
    const { extraTries: _cleared, ...rest } = row;
    return rest as T;
  });
}

/** Rolls back how far each learner has worked. Resetting one lesson moves a learner
    back to just before it; resetting every lesson returns them to the start. */
export function rollBack<T extends Learner>(users: T[], scope: ResetScope): T[] {
  return users.map(user => {
    if (user.role !== "Student") return user;
    if (scope.sectionId !== undefined && user.section !== scope.sectionId) return user;
    if (scope.moduleId === undefined) return { ...user, completed: 0, score: 0 };
    return user.completed >= scope.moduleId ? { ...user, completed: scope.moduleId - 1 } : user;
  });
}

/** Which Learn/Check records a reset clears: the learners in scope, and the one
    lesson when a lesson is named. The lesson a learner read is reset with the
    practical, so they read it again before trying again. */
export function progressInScope<T extends Learner>(users: T[], scope: ResetScope) {
  return {
    studentId: { $in: studentsInScope(users, scope).map(user => user.id) },
    ...(scope.moduleId === undefined ? {} : { moduleId: scope.moduleId }),
  };
}

/** How many learners a reset touches, and how many recorded attempts it removes.
    A learner who has only read a lesson or taken its Check counts too, since the
    reset clears that as well. */
export function resetCounts<L extends Learner, A extends Attempt>(users: L[], assessments: A[], scope: ResetScope, progress: Progress[] = []) {
  const attempts = attemptsInScope(assessments, scope);
  const worked = (id: string) => attempts.some(row => row.studentId === id)
    || progress.some(row => row.studentId === id && (scope.moduleId === undefined || row.moduleId === scope.moduleId));
  const affected = studentsInScope(users, scope).filter(student =>
    scope.moduleId === undefined
      ? student.completed > 0 || worked(student.id)
      : student.completed >= scope.moduleId || worked(student.id));
  return { attempts: attempts.length, students: affected.length };
}

/** One line for the audit log, whatever the scope was. */
export const resetLabel = (scope: ResetScope) =>
  scope.moduleId !== undefined ? "one lesson in one class"
    : scope.sectionId !== undefined ? "every lesson in one class"
    : "every lesson across the deployment";
