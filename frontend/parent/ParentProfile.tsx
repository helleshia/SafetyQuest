import { useState } from "react";
import Icon from "../shared/Icon";
import { api } from "../shared/api";
import { useData } from "../shared/store";
import { Field, Note, Panel, Pill } from "../shared/ui";
import { PageHead } from "../teacher/TeacherUI";
import { useParent } from "./ParentApp";

type Stage = "idle" | "code" | "password";
type Sent = { to: string; expiresInMinutes: number; delivered: boolean; code?: string };

export default function ParentProfile() {
  const { users, sections, say, log } = useData();
  const scope = useParent();
  const parent = users.find(user => user.id === scope.parentId);
  const section = sections.find(item => item.id === scope.child.section);
  const [contact, setContact] = useState("");
  const [editing, setEditing] = useState(false);
  const initials = (parent?.name ?? "P").split(" ").map(part => part[0]).slice(0, 2).join("");

  return <div className="tc-page parent-profile-page">
    <PageHead icon="person" eyebrow="Profile" title="Your account"
      actions={<div className="tc-identity">
        <span className="tc-photo">
          {initials}
          <button type="button" className="tc-photo-edit" aria-label="Change profile photo" onClick={() => say("Photo upload is not part of this build yet.")}><Icon name="edit" /></button>
        </span>
        <div className="tc-identity-text">
          <strong>{parent?.name}</strong>
          <small>Parent / Guardian</small>
          <Pill>{parent?.status ?? "Active"}</Pill>
        </div>
      </div>}
    >
      Your details, your child&apos;s information, and sign-in security in one place.
    </PageHead>

    <div className="tc-grid-2">
      <Panel title="Parent information" icon="person" note="Your details and the password you use to sign in.">
        <div className="sa-form">
          <Field label="Full name"><input defaultValue={parent?.name} readOnly={!editing} /></Field>
          <Field label="Email address" hint="This is your sign-in name. Changing it requires re-verification."><input defaultValue={parent?.email} readOnly={!editing} type="email" /></Field>
          <Field label="Contact number"><input value={contact} onChange={event => setContact(event.target.value)} readOnly={!editing} type="tel" placeholder="+63 900 000 0000" /></Field>
          <div className="sa-action-row">
            {!editing
              ? <button type="button" className="sa-primary" onClick={() => setEditing(true)}><Icon name="edit" />Edit information</button>
              : <><button type="button" className="sa-primary" onClick={() => { log("Profile updated", `${parent?.name} updated their own parent profile`); say("Profile saved."); setEditing(false); }}><Icon name="check" />Save changes</button><button type="button" className="sa-ghost" onClick={() => setEditing(false)}>Cancel</button></>}
          </div>
        </div>

        <h3 className="sa-sub">Password</h3>
        <ChangePassword email={parent?.email ?? ""} />
      </Panel>

      <Panel title="Child and account information" icon="users" note="Read-only information managed by the school.">
        <dl className="tc-fields">
          <div><dt>Child name</dt><dd>{scope.label}</dd></div>
          <div><dt>Grade level</dt><dd>{section?.grade ?? "Not assigned"}</dd></div>
          <div><dt>Section</dt><dd>{section?.name ?? "Not assigned"}</dd></div>
          <div><dt>Account status</dt><dd>{scope.child.status}</dd></div>
          <div><dt>Date joined</dt><dd>{parent?.createdAt ?? "Aug 17, 2026"}</dd></div>
          <div><dt>Account role</dt><dd>Parent / Guardian</dd></div>
        </dl>
        <Note>Your child&apos;s grade, section, and learning records are managed by the school. They cannot be edited from this account.</Note>
      </Panel>
    </div>

    <div className="tc-signout">
      <div>
        <strong>Log out</strong>
        <small>Ends this session on this device. Your child&apos;s records are not affected.</small>
      </div>
      <button type="button" className="sa-danger-button" onClick={scope.signOut}><Icon name="logout" />Log out</button>
    </div>
  </div>;
}

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
    <p>You sign in with <strong>{email || "your email address"}</strong>. We send a one-time code there before changing your password.</p>
    {done && <p className="tc-password-done" role="status"><Icon name="check" />{done}</p>}
    {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
    <button type="button" className="sa-ghost" disabled={busy} onClick={request}><Icon name="mail" />{busy ? "Sending..." : "Change password"}</button>
  </div>;

  return <div className="tc-password">
    <ol className="tc-otp-steps">
      <li className={stage === "code" ? "is-current" : "is-done"}><span>1</span>Enter the code</li>
      <li className={stage === "password" ? "is-current" : ""}><span>2</span>Set a new password</li>
    </ol>

    {sent && <p className="tc-otp-sent"><Icon name="mail" /><span>A six-digit code was sent to <strong>{sent.to}</strong>. It expires in {sent.expiresInMinutes} minutes.{!sent.delivered && sent.code && <em className="tc-otp-dev"> No mail service is configured, so the code is shown here: <b>{sent.code}</b></em>}</span></p>}

    {stage === "code" ? <div className="sa-form">
      <Field label="One-time code" hint="Six digits. Ask for a new code if it expires."><input value={code} onChange={event => { setCode(event.target.value); setError(""); }} inputMode="numeric" autoComplete="one-time-code" maxLength={10} placeholder="000000" autoFocus /></Field>
      {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
      <div className="sa-action-row"><button type="button" className="sa-primary" disabled={busy || code.trim().length < 4} onClick={verify}><Icon name="check" />{busy ? "Checking..." : "Verify code"}</button><button type="button" className="sa-ghost" disabled={busy} onClick={request}>Send a new code</button><button type="button" className="sa-ghost" disabled={busy} onClick={() => { setStage("idle"); setError(""); }}>Cancel</button></div>
    </div> : <div className="sa-form">
      <p className="tc-password-ok"><Icon name="check" />Code verified. Set your new password.</p>
      <div className="sa-form-pair"><Field label="New password" hint="At least 8 characters. Stored securely."><input type="password" value={next} onChange={event => { setNext(event.target.value); setError(""); }} minLength={8} autoComplete="new-password" autoFocus /></Field><Field label="Confirm new password"><input type="password" value={confirm} onChange={event => { setConfirm(event.target.value); setError(""); }} minLength={8} autoComplete="new-password" /></Field></div>
      {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
      <div className="sa-action-row"><button type="button" className="sa-primary" disabled={busy || next.length < 8 || !confirm} onClick={save}><Icon name="check" />{busy ? "Saving..." : "Save new password"}</button><button type="button" className="sa-ghost" disabled={busy} onClick={() => { setStage("idle"); setNext(""); setConfirm(""); setError(""); }}>Cancel</button></div>
    </div>}
  </div>;
}
