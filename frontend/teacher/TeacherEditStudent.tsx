import { useState, type FormEvent } from "react";
import { api } from "../shared/api";
import type { AssessmentRow, Assignment, GuardianLink, User } from "../shared/demo";
import { useData } from "../shared/store";
import { Field, Modal, Note } from "../shared/ui";
import { normalizeStudentId, studentDeleteReason, studentError } from "../admin/academicValidation";

const nameOf = (student: User) => student.studentName?.trim() || student.name;

/** Why a learner cannot be deleted outright, or "" when they can. Anyone with history can only be suspended. */
export function removeBlocker(student: User, assessments: AssessmentRow[], links: GuardianLink[], assignments: Assignment[]) {
  return studentDeleteReason(student.id, assessments, links, assignments, student.name);
}

/** Change a learner's name or student ID in the teacher's own class. */
export function TeacherEditStudent({ student, sectionName, onClose }: { student: User; sectionName: string; onClose: () => void }) {
  const { users, refresh, say } = useData();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const studentName = String(data.get("name") ?? "").trim();
    const studentId = normalizeStudentId(String(data.get("student-id") ?? ""));
    const invalid = studentError(studentName, studentId, users, student.id);
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    try {
      const result = await api<{ message: string }>("/api/teacher/students", "PATCH", { id: student.id, studentName, studentId });
      say(result.message);
      refresh();
      onClose();
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <Modal title="Edit student" note={sectionName} onClose={onClose}>
    <form className="sa-form" onSubmit={event => void submit(event)}>
      <Field label="Student full name"><input name="name" required maxLength={100} defaultValue={student.studentName ?? ""} autoFocus disabled={busy} /></Field>
      <Field label="Student ID" hint="Must be unique across the school. The learner signs in with the new ID from now on."><input name="student-id" required maxLength={40} defaultValue={student.name} disabled={busy} /></Field>
      {error && <p className="account-error" role="alert">{error}</p>}
      <div className="sa-action-row">
        <button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="sa-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  </Modal>;
}

/** Remove a learner from the class, or suspend or restore one whose history must be kept. */
export function TeacherRemoveStudent({ student, sectionName, blocker, onClose }: { student: User; sectionName: string; blocker: string; onClose: () => void }) {
  const { refresh, say } = useData();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const suspended = student.status === "Suspended";
  // A learner with history is suspended or restored rather than deleted. One who has not
  // activated yet has no history to protect, so the server only refuses to suspend them.
  const cannotSuspend = Boolean(blocker) && student.status === "Pending";

  async function confirm() {
    setBusy(true); setError("");
    try {
      const result = blocker
        ? await api<{ message: string }>("/api/teacher/students", "PATCH", { id: student.id, status: suspended ? "Active" : "Suspended" })
        : await api<{ message: string }>("/api/teacher/students", "DELETE", { id: student.id });
      say(blocker ? `${nameOf(student)} was ${suspended ? "restored" : "suspended"}.` : result.message);
      refresh();
      onClose();
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <Modal title={blocker ? (suspended ? "Restore student?" : "Suspend student?") : "Remove student?"} note={`${nameOf(student)} · ${sectionName}`} onClose={onClose}>
    <Note>{blocker
      ? `${blocker} ${suspended ? "Restoring lets them sign in to the app again." : "Suspending locks them out of the app and keeps every record."}`
      : "This removes the learner and their app account from the class. This cannot be undone."}</Note>
    {cannotSuspend && <p className="account-error" role="alert">This learner has not activated their account yet, so there is nothing to suspend. Ask a Super Admin to remove them.</p>}
    {error && <p className="account-error" role="alert">{error}</p>}
    <div className="sa-action-row">
      <button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button>
      <button type="button" className={suspended ? "sa-primary" : "sa-danger-button"} disabled={busy || cannotSuspend} onClick={() => void confirm()}>
        {busy ? "Working…" : blocker ? (suspended ? "Restore student" : "Suspend student") : "Remove student"}
      </button>
    </div>
  </Modal>;
}
