import { useState } from "react";
import Icon from "../shared/Icon";
import { api } from "../shared/api";
import { useData } from "../shared/store";
import { Field, Note, Panel, Pill } from "../shared/ui";
import { PageHead } from "./TeacherUI";
import { useScope } from "./TeacherApp";

type Stage = "idle" | "code" | "password";
type Sent = { to: string; expiresInMinutes: number; delivered: boolean };

export default function Profile() {
  const { users, say, log } = useData();
  const scope = useScope();
  const teacher = users.find(user => user.id === scope.teacherId);
  const [contact, setContact] = useState("");

  const initials = (teacher?.name ?? "T").split(" ").map(part => part[0]).slice(0, 2).join("");
  const grades = [...new Set(scope.mySections.map(section => section.grade))].sort();

  return <div className="tc-page">
    <PageHead icon="person" eyebrow="Profile" title="Your account"
      actions={<div className="tc-identity">
        <span className="tc-photo">
          {initials}
          <button type="button" className="tc-photo-edit" aria-label="Change profile photo" onClick={() => say("Photo upload is not part of this build yet.")}><Icon name="edit" /></button>
        </span>
        <div className="tc-identity-text">
          <strong>{teacher?.name}</strong>
          <small>Teacher · {scope.mySections.length} handled class{scope.mySections.length === 1 ? "" : "es"}</small>
          <Pill>{teacher?.status ?? "Active"}</Pill>
        </div>
      </div>}>
      Your own details and sign-in security. Your role and your class assignments are set by a Super Admin — a teacher cannot grant either to themselves.
    </PageHead>

    <div className="tc-grid-2">
      <Panel title="Personal information" icon="person" note="Your details and the password you sign in with.">
        <div className="sa-form">
          <Field label="Full name"><input defaultValue={teacher?.name} /></Field>
          <Field label="Teacher ID" hint="Assigned when your account was approved. Read only."><input value={`SQT-${(teacher?.id ?? "").toUpperCase().slice(0, 8)}`} readOnly /></Field>
          <Field label="Email address" hint="This is your sign-in name. Changing it requires re-verification."><input defaultValue={teacher?.email} type="email" /></Field>
          <Field label="Contact number"><input value={contact} onChange={event => setContact(event.target.value)} type="tel" placeholder="+63 900 000 0000" /></Field>
          <div className="sa-action-row">
            <button type="button" className="sa-primary" onClick={() => { log("Profile updated", `${teacher?.name} updated their own profile`); say("Profile saved."); }}><Icon name="check" />Save changes</button>
          </div>
        </div>

        <h3 className="sa-sub">Password</h3>
        <ChangePassword email={teacher?.email ?? ""} />
      </Panel>

      <Panel title="Teaching and account information" icon="graduation" note="Set by a Super Admin. Shown here so you can check it is correct.">
        <dl className="tc-fields">
          <div><dt>Position / role</dt><dd>Class Adviser · Teacher</dd></div>
          <div><dt>Grade level{grades.length === 1 ? "" : "s"}</dt><dd>{grades.length ? grades.map(grade => `Grade ${grade}`).join(", ") : "None assigned"}</dd></div>
          <div><dt>Account status</dt><dd>{teacher?.status ?? "Active"}</dd></div>
          <div><dt>Account role</dt><dd>Teacher · one role per adult account</dd></div>
          <div><dt>Date joined</dt><dd>{teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Not recorded"}</dd></div>
          <div><dt>Last sign-in</dt><dd>{teacher?.lastLogin ? new Date(teacher.lastLogin).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not recorded"}</dd></div>
        </dl>

        <h3 className="sa-sub">Assigned classes</h3>
        {scope.mySections.length === 0
          ? <p className="sa-empty">No classes assigned yet.</p>
          : <ul className="tc-chips">
            {scope.mySections.map(section => <li key={section.id}><Icon name="sections" />{section.name}</li>)}
          </ul>}
        <Note>If a class is missing or should not be here, ask a Super Admin to correct the assignment.</Note>
      </Panel>
    </div>

    <div className="tc-signout">
      <div>
        <strong>Log out</strong>
        <small>Ends this session on this device. Your classes, records, and published feedback are unaffected.</small>
      </div>
      <button type="button" className="sa-danger-button" onClick={scope.onSignOut}><Icon name="logout" />Log out</button>
    </div>
  </div>;
}

/** A password change takes a one-time code as well as a signed-in session: ask for
    the code, check it, and only then open the new-password fields. */
function ChangePassword({ email }: { email: string }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [sent, setSent] = useState<Sent | null>(null);
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function run<T>(payload: unknown, after: (result: T) => void) {
    setBusy(true); setError("");
    try { after(await api<T>("/api/auth/password", "POST", payload)); }
    catch (problem) { setError((problem as Error).message); }
    finally { setBusy(false); }
  }

  const request = () => void run<Sent>({ step: "request" }, result => {
    setSent(result); setCode(""); setDone(""); setStage("code");
  });
  const verify = () => void run<{ ok: boolean }>({ step: "verify", code: code.trim() }, () => setStage("password"));
  function save() {
    if (next !== confirm) { setError("The new password and its confirmation do not match."); return; }
    void run<{ ok: boolean }>({ step: "confirm", code: code.trim(), password: next }, () => {
      setStage("idle"); setSent(null); setCode(""); setNext(""); setConfirm("");
      setDone("Password changed. Use the new one the next time you sign in.");
    });
  }

  if (stage === "idle") return <div className="tc-password">
    <p>You sign in with <strong>{email || "your email address"}</strong>. To change your password, we send a one-time code to that address first.</p>
    {done && <p className="tc-password-done" role="status"><Icon name="check" />{done}</p>}
    {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
    <button type="button" className="sa-ghost" disabled={busy} onClick={request}><Icon name="mail" />{busy ? "Sending…" : "Change password"}</button>
  </div>;

  return <div className="tc-password">
    <ol className="tc-otp-steps">
      <li className={stage === "code" ? "is-current" : "is-done"}><span>1</span>Enter the code</li>
      <li className={stage === "password" ? "is-current" : ""}><span>2</span>Set a new password</li>
    </ol>

    {sent && <p className="tc-otp-sent">
      <Icon name="mail" />
      <span>
        A six-digit code was {sent.delivered ? "emailed" : "issued"} to <strong>{sent.to}</strong>. It expires in {sent.expiresInMinutes} minutes.
        {!sent.delivered && <em className="tc-otp-dev">Email is not configured on this server, so the code was printed to the server console instead. It is a credential, so it is never sent to this page.</em>}
      </span>
    </p>}

    {stage === "code" ? <div className="sa-form">
      <Field label="One-time code" hint="Six digits. Ask for a new code if it expires.">
        <input value={code} onChange={event => { setCode(event.target.value); setError(""); }} inputMode="numeric" autoComplete="one-time-code" maxLength={10} placeholder="000000" autoFocus />
      </Field>
      {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
      <div className="sa-action-row">
        <button type="button" className="sa-primary" disabled={busy || code.trim().length < 4} onClick={verify}><Icon name="check" />{busy ? "Checking…" : "Verify code"}</button>
        <button type="button" className="sa-ghost" disabled={busy} onClick={request}>Send a new code</button>
        <button type="button" className="sa-ghost" disabled={busy} onClick={() => { setStage("idle"); setError(""); }}>Cancel</button>
      </div>
    </div> : <div className="sa-form">
      <p className="tc-password-ok"><Icon name="check" />Code verified. Set your new password.</p>
      <div className="sa-form-pair">
        <Field label="New password" hint="At least 8 characters. Stored as a salted hash, never in reversible form.">
          <input type="password" value={next} onChange={event => { setNext(event.target.value); setError(""); }} minLength={8} autoComplete="new-password" autoFocus />
        </Field>
        <Field label="Confirm new password">
          <input type="password" value={confirm} onChange={event => { setConfirm(event.target.value); setError(""); }} minLength={8} autoComplete="new-password" />
        </Field>
      </div>
      {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
      <div className="sa-action-row">
        <button type="button" className="sa-primary" disabled={busy || next.length < 8 || !confirm} onClick={save}><Icon name="check" />{busy ? "Saving…" : "Save new password"}</button>
        <button type="button" className="sa-ghost" disabled={busy} onClick={() => { setStage("idle"); setNext(""); setConfirm(""); setError(""); }}>Cancel</button>
      </div>
    </div>}
  </div>;
}
