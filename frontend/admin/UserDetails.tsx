import { useEffect, useRef, useState } from "react";
import Icon from "../shared/Icon";
import { api } from "../shared/api";
import type { User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Field, Note, Panel, Pill } from "../shared/ui";
import { displayStudentName } from "./academicValidation";
import "./users.css";
import { attemptScore } from "../../shared/scoring";

const initials = (value: string) => value.split(/[\s·-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";

export default function UserDetails({ user, onBack, onStatus, onAssign }: {
  user: User; onBack: () => void; onStatus: (next: User["status"]) => void; onAssign: () => void;
}) {
  const { sections, links, assessments, modules, setSections, setLinks, log, say, nameOf, sectionOf, moduleOf } = useData();
  const heading = useRef<HTMLHeadingElement>(null);
  const isStudent = user.role === "Student";
  const assigned = sections.filter(section => section.teacherId === user.id);
  const guardianLinks = links.filter(link => link.parentId === user.id);
  const records = assessments.filter(row => row.studentId === user.id);
  const percent = modules.length ? Math.round(user.completed / modules.length * 100) : 0;
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [user.id]);

  return <article className="users-detail-page" aria-labelledby="user-details-heading">
    <button type="button" className="sa-ghost users-back" onClick={onBack}><Icon name="arrow" className="users-back-icon" />Back to {isStudent ? "student" : user.role.toLowerCase()} directory</button>

    <header className="users-detail-header">
      <span className={`users-avatar role-${user.role.replace(/\s+/g, "-").toLowerCase()}`}>{isStudent ? <Icon name="person" /> : initials(user.name)}</span>
      <div className="users-detail-heading">
        <p className="users-eyebrow">{user.role} account</p>
        <h2 id="user-details-heading" ref={heading} tabIndex={-1}>{isStudent ? displayStudentName(user) : user.name}</h2>
        <div className="users-detail-context">
          {isStudent ? <span className="sa-mono">Student ID: {user.name}</span> : <span>{user.email}</span>}
          <Pill>{user.status}</Pill>
        </div>
        <p className="users-detail-scope">{isStudent ? `${sectionOf(user.section)} · randomized token record` : "Deployment-scoped access · credentials are never displayed"}</p>
      </div>
    </header>

    <div className="users-detail-overview">
      <Panel title="Account details" icon="person" wide>
        <dl className="users-fields">
          {isStudent ? <>
            <div><dt>Student name</dt><dd>{displayStudentName(user)}</dd></div>
            <div><dt>Student ID</dt><dd className="sa-mono">{user.name}</dd></div>
            <div><dt>Account status</dt><dd><Pill>{user.status}</Pill></dd></div>
            <div><dt>Section</dt><dd>{sectionOf(user.section)}</dd></div>
            <div><dt>Physical consent</dt><dd>{user.consent ? "Verified offline" : "Not verified"}</dd></div>
            <div><dt>Child assent</dt><dd>{user.assent ? "Given in app" : "Not recorded"}</dd></div>
          </> : <>
            <div><dt>Work email</dt><dd>{user.email}</dd></div>
            <div><dt>Account status</dt><dd><Pill>{user.status}</Pill></dd></div>
            <div><dt>Email verification</dt><dd>{user.emailVerified ? "Verified" : "Not verified"}</dd></div>
            <div><dt>MFA</dt><dd>{user.mfaEnrolled ? "Enrolled" : "Not enrolled"}</dd></div>
            <div><dt>Created</dt><dd>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not recorded"}</dd></div>
            <div><dt>Last login</dt><dd>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</dd></div>
          </>}
        </dl>
      </Panel>

      <Panel title={isStudent ? "Learning progress" : "Access summary"} icon={isStudent ? "curriculum" : "sections"} wide>
        {isStudent ? <>
          <div className="users-progress"><strong>{user.completed}<span> / {modules.length}</span></strong><span>Modules completed</span></div>
          <span className="users-progress-track"><i style={{ width: `${percent}%` }} /></span>
          <p className="users-progress-caption">{percent}% of the module library completed · average score {user.score}%</p>
        </> : <dl className="users-fields users-fields-single">
          <div><dt>{user.role === "Teacher" ? "Assigned sections" : user.role === "Parent" ? "Active child links" : "Scope"}</dt>
            <dd>{user.role === "Teacher" ? `${assigned.length} section${assigned.length === 1 ? "" : "s"}` : user.role === "Parent" ? `${guardianLinks.filter(link => link.status === "Active").length} of ${guardianLinks.length} link${guardianLinks.length === 1 ? "" : "s"} active` : "Whole deployment"}</dd></div>
          <div><dt>Can view learner records</dt><dd>{user.role === "Teacher" ? "Assigned sections only" : user.role === "Parent" ? "Verified children only" : "Aggregate and token-level records"}</dd></div>
          <div><dt>Can sign in as another user</dt><dd>No — impersonation is not available to any role</dd></div>
        </dl>}
      </Panel>
    </div>

    {user.role === "Teacher" && <Panel title="Assigned sections" icon="sections" note="Approving an account does not grant section access; each assignment is granted separately." wide>
      {!assigned.length ? <Empty text="No sections assigned yet." /> : <ul className="sa-chip-list">{assigned.map(section => <li key={section.id}>{section.name}
        <button type="button" onClick={() => { setSections(current => current.map(row => (row.id === section.id ? { ...row, teacherId: "" } : row))); log("Section assignment revoked", `${section.name} unassigned from ${user.name}`); say(`${section.name} unassigned. Access ends immediately.`); }} aria-label={`Revoke ${section.name}`}><Icon name="close" /></button>
      </li>)}</ul>}
    </Panel>}

    {user.role === "Parent" && <Panel title="Guardian links" icon="consent" note="Each link is verified offline by the assigned section teacher." wide>
      {!guardianLinks.length ? <Empty text="No child links requested." /> : <div className="users-table-scroll"><table className="sa-table">
        <thead><tr><th>Student token</th><th>State</th><th>Verified by</th><th /></tr></thead>
        <tbody>{guardianLinks.map(link => <tr key={link.id}>
          <td className="sa-mono">{nameOf(link.studentId)}</td><td><Pill>{link.status}</Pill></td><td>{link.verifiedBy || "—"}</td>
          <td className="sa-cell-actions">{link.status !== "Revoked" && <button type="button" className="sa-ghost sa-danger" onClick={() => { setLinks(current => current.map(row => (row.id === link.id ? { ...row, status: "Revoked" } : row))); log("Guardian link revoked", `${user.name} · ${nameOf(link.studentId)}`); say("Link revoked. Parent access to that child ends immediately."); }}>Revoke</button>}</td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>}

    {isStudent && <Panel title="Module results" icon="assessment" note="Read-only. Administrators cannot overwrite quiz answers, simulation events, or teacher grades." wide>
      {!records.length ? <Empty text="No recorded attempts." /> : <div className="users-table-scroll"><table className="sa-table">
        <thead><tr><th>Module</th><th>Practice</th><th>Data quality</th><th>Review</th></tr></thead>
        <tbody>{records.map(row => <tr key={row.id}>
          <td><strong>{moduleOf(row.moduleId)}</strong></td><td>{attemptScore(row)}%</td><td><Pill>{row.quality}</Pill></td><td><Pill>{row.review}</Pill></td>
        </tr>)}</tbody>
      </table></div>}
      <Note>Opening a detailed student record is written to the audit log.</Note>
    </Panel>}

    {user.role === "Teacher" && <SignInAccess user={user} />}

    <Panel title="Administrative actions" icon="settings" note="Every action below is recorded in the audit log with the acting administrator." wide>
      <div className="sa-action-row">
        {user.status === "Pending" && (user.role === "Teacher" || user.role === "Parent") && <button type="button" className="sa-primary" onClick={() => onStatus("Active")}><Icon name="check" />Approve account</button>}
        {user.role === "Teacher" && user.status === "Active" && <button type="button" className="sa-ghost" onClick={onAssign}><Icon name="sections" />Assign section</button>}
        {user.status === "Active" && <button type="button" className="sa-ghost" onClick={() => onStatus("Suspended")}>Suspend</button>}
        {user.status === "Suspended" && <button type="button" className="sa-ghost" onClick={() => onStatus("Active")}>Reactivate</button>}
        <button type="button" className="sa-ghost" disabled title="Email recovery service is not configured">Recovery unavailable</button>
        {isStudent && <p className="sa-footnote">Mobile authentication is not connected yet.</p>}
      </div>
      <Note>Passwords, activation credentials, and recovery codes are never displayed or exported — including to another administrator. Administrators cannot sign in as a teacher, parent, or child.</Note>
    </Panel>
  </article>;
}

/** There is no invitation email in this build, so an administrator sets the first
    password and hands it over in person. The teacher changes it from their Profile. */
function SignInAccess({ user }: { user: User }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const ready = password.trim().length >= 8 && !busy;

  async function save() {
    setBusy(true); setError(""); setDone("");
    try {
      await api("/api/admin/credentials", "POST", { userId: user.id, password });
      setDone(`${user.name} can now sign in with ${user.email}. Hand the password over in person, and ask them to change it.`);
      setPassword("");
    } catch (problem) {
      setError((problem as Error).message);
    } finally { setBusy(false); }
  }

  return <Panel title="Sign-in access" icon="settings" note="A teacher cannot open the teacher console until an account password is set here." wide>
    <div className="sa-form">
      <Field label="Set a sign-in password" hint="At least 8 characters. Stored as a salted hash, never in reversible form. Setting it signs the account out everywhere.">
        <input type="password" value={password} onChange={event => { setPassword(event.target.value); setError(""); setDone(""); }} autoComplete="new-password" placeholder="At least 8 characters" />
      </Field>
      {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
      {done && <p className="sa-note" role="status">{done}</p>}
      <div className="sa-action-row">
        <button type="button" className="sa-primary" disabled={!ready} onClick={save}><Icon name="check" />{busy ? "Saving…" : "Set password"}</button>
      </div>
    </div>
    {!user.email && <Note>Add an email address to this account first — it is the sign-in name.</Note>}
  </Panel>;
}
