import { useState, type FormEvent } from "react";
import { api } from "../shared/api";
import { useData } from "../shared/store";
import { Field, Modal, Note } from "../shared/ui";
import { normalizeStudentId, studentError } from "../admin/academicValidation";

/** Single-student enroll for a teacher’s own class. */
export default function TeacherAddStudent({ sectionId, sectionName, onClose }: { sectionId: string; sectionName: string; onClose: () => void }) {
  const { users, refresh, say } = useData();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const studentName = String(data.get("name") ?? "").trim();
    const studentId = normalizeStudentId(String(data.get("student-id") ?? ""));
    const invalid = studentError(studentName, studentId, users);
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    try {
      const result = await api<{ message: string }>("/api/teacher/students", "POST", {
        sectionId,
        students: [{ studentName, studentId }],
      });
      say(result.message);
      refresh();
      onClose();
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <Modal title="Add student" note={sectionName} onClose={onClose}>
    <form className="sa-form" onSubmit={event => void submit(event)}>
      <Note>Add a learner to this class when Super Admin is unavailable. They activate the account themselves in the mobile app.</Note>
      <Field label="Student full name"><input name="name" required maxLength={100} placeholder="Student's full name" autoFocus disabled={busy} /></Field>
      <Field label="Student ID" hint="Must be unique across the school."><input name="student-id" required maxLength={40} placeholder="SQ-G4-037" disabled={busy} /></Field>
      {error && <p className="account-error" role="alert">{error}</p>}
      <div className="sa-action-row">
        <button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="sa-primary" disabled={busy}>{busy ? "Saving…" : "Add student"}</button>
      </div>
    </form>
  </Modal>;
}
