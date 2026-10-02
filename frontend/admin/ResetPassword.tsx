import { useState } from "react";
import Icon from "../shared/Icon";
import type { User } from "../shared/demo";
import { api } from "../shared/api";
import { Field, Modal, Note } from "../shared/ui";

// No look-alike characters (0/O, 1/l/I), so a password read out loud or written down is not misread.
const LETTERS = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
function generate() {
  const pick = (set: string, count: number) => Array.from(crypto.getRandomValues(new Uint32Array(count)), n => set[n % set.length]).join("");
  return `${pick(UPPER, 2)}${pick(LETTERS, 4)}${pick(DIGITS, 3)}`;
}

/** An administrator sets a new sign-in password for a student, teacher or parent and hands it
    over in person. Their current sessions end at once; they can change it afterwards. */
export default function ResetPassword({ user, onClose, say }: { user: User; onClose: () => void; say: (text: string) => void }) {
  const [password, setPassword] = useState(generate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const student = user.role === "Student";
  const who = user.studentName || user.name;
  const ready = password.trim().length >= 8 && !busy && !done;

  async function save() {
    setBusy(true); setError("");
    try {
      await api("/api/admin/credentials", "POST", { userId: user.id, password });
      setDone(true);
      say(`Password reset for ${who}.`);
    } catch (problem) {
      setError((problem as Error).message);
    } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(password); setCopied(true); } catch { /* The password is on screen to copy by hand. */ }
  }

  return <Modal title="Reset password" note={who} onClose={onClose}>
    <div className="sa-form">
      <Field label="New password" hint="At least 8 characters with a letter and a number. Saving signs the account out everywhere.">
        <input value={password} onChange={event => { setPassword(event.target.value); setError(""); setCopied(false); }} autoComplete="off" spellCheck={false} disabled={done || busy} />
      </Field>
      {!done && <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => { setPassword(generate()); setError(""); setCopied(false); }} disabled={busy}><Icon name="audit" />Generate another</button></div>}
      {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
      {done && <Note>Password reset. Give <strong>{password}</strong> to {student ? "the student" : who} in person{student ? ", then they sign in on the mobile app with their Student ID and this password" : ""}, and ask them to change it afterwards. It is not shown again once you close this.</Note>}
      <div className="sa-action-row">
        {done
          ? <><button type="button" className="sa-ghost" onClick={() => void copy()}>{copied ? "Copied" : "Copy password"}</button><button type="button" className="sa-primary" onClick={onClose}>Done</button></>
          : <><button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className="sa-primary" disabled={!ready} onClick={() => void save()}><Icon name="check" />{busy ? "Saving…" : "Reset password"}</button></>}
      </div>
    </div>
  </Modal>;
}
