import { useState } from "react";
import type { Role, User } from "../shared/demo";
import { useData } from "../shared/store";
import { api } from "../shared/api";
import { Field, Modal, Note } from "../shared/ui";

export default function UserEditor({ role, user, onClose }: { role: Role; user?: User; onClose: () => void }) {
  const { users, sections, assessments, links, assignments, setUsers, setAssignments, log, say, refresh } = useData();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const student = role === "Student";
  const inviteAdmin = !user && role === "Super Admin";
  const lockedSection = !!user && (assessments.some(row => row.studentId === user.id) || links.some(row => row.studentId === user.id) || assignments.some(row => row.sectionId === user.section && row.tokens.includes(user.name)));

  return <Modal title={`${user ? "Edit" : "Add"} ${role.toLowerCase()}`} onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault(); setError("");
      const data = new FormData(event.currentTarget);
      const fullName = String(data.get("name") ?? "").trim();
      const email = student ? "" : String(data.get("email") ?? "").trim().toLowerCase();
      const name = student ? String(data.get("studentId") ?? "").trim().toUpperCase() : fullName;
      const section = student ? String(data.get("section") ?? "") : "";
      if (!fullName || !name) { setError("Enter the name and required account details."); return; }
      if (users.some(row => row.id !== user?.id && (student ? row.role === "Student" && row.name.toUpperCase() === name : row.email.toLowerCase() === email))) { setError(student ? "This student ID is already in use." : "This email is already in use."); return; }
      if (student && !sections.some(row => row.id === section)) { setError("Choose an existing section."); return; }

      if (inviteAdmin) {
        setBusy(true);
        void api<{ message: string }>("/api/admin/invite", "POST", { name: fullName, email })
          .then(async result => {
            log("Super Admin invited", `${fullName} (${email})`);
            say(result.message);
            if (typeof refresh === "function") refresh();
            else setUsers(rows => [...rows, { id: crypto.randomUUID(), name: fullName, email, role: "Super Admin", status: "Pending", section: "", completed: 0, score: 0, consent: false, assent: false }]);
            onClose();
          })
          .catch(err => setError((err as Error).message))
          .finally(() => setBusy(false));
        return;
      }

      const next: User = { ...(user ?? { id: crypto.randomUUID(), role, status: "Pending", completed: 0, score: 0, consent: false, assent: false }), name, email, section, ...(student ? { studentName: fullName } : {}) };
      setUsers(rows => user ? rows.map(row => row.id === user.id ? next : row) : [...rows, next]);
      if (student && user && user.name !== name) setAssignments(rows => rows.map(row => row.sectionId === user.section ? { ...row, tokens: row.tokens.map(token => token === user.name ? name : token) } : row));
      log(user ? "Account updated" : "Account record created", `${role}: ${name}`);
      say(user ? "Account changes saved." : "Account record created."); onClose();
    }}>
      <Field label="Full name"><input name="name" required maxLength={100} defaultValue={student ? user?.studentName : user?.name} autoFocus disabled={busy} /></Field>
      {student ? <>
        <Field label="Student ID"><input name="studentId" required maxLength={100} defaultValue={user?.name} disabled={busy} /></Field>
        <Field label="Section" hint={lockedSection ? "This section is locked because the student has linked records." : undefined}><select name="section" required defaultValue={user?.section ?? ""} disabled={lockedSection || busy}><option value="" disabled>Select section</option>{sections.filter(row => !row.archived || row.id === user?.section).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
        {lockedSection && <input type="hidden" name="section" value={user!.section} />}
      </> : <Field label="Email address"><input name="email" type="email" required defaultValue={user?.email} disabled={busy} /></Field>}
      <Field label="Role"><input value={role} readOnly /></Field>
      {inviteAdmin && <Note>Sends an invitation email. They open the link, create their own password, then verify with a one-time code (OTP) sent to that email before signing in.</Note>}
      {!user && !inviteAdmin && <Note>Creates a pending directory record. Sign-in credentials and student activation are managed separately.</Note>}
      {user && !student && <Note>Changing the email clears its verification and signs out existing sessions.</Note>}
      {error && <p role="alert" className="account-error">{error}</p>}
      <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="sa-primary" disabled={busy}>{busy ? "Sending…" : inviteAdmin ? "Send invitation" : "Save account"}</button></div>
    </form>
  </Modal>;
}
