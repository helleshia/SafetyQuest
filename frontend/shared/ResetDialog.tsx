import { useState } from "react";
import Icon from "./Icon";
import { Field, Modal, Note } from "./ui";

/** Confirms a lesson reset. The caller says what is being reset and how much it
    touches; the password is what actually authorises it. `onConfirm` rejects with a
    message when the password is wrong, and nothing is reset. */
export default function ResetDialog({ title, scopeLabel, students, attempts, onClose, onConfirm }: {
  title: string;
  scopeLabel: string;
  students: number;
  attempts: number;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nothingToDo = students === 0 && attempts === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true); setError("");
    try {
      await onConfirm(password);
    } catch (problem) {
      setError((problem as Error).message || "The reset could not be completed.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return <Modal title={title} note={scopeLabel} onClose={onClose}>
    <dl className="reset-counts">
      <div><dt>Learners affected</dt><dd>{students}</dd></div>
      <div><dt>Recorded attempts removed</dt><dd>{attempts}</dd></div>
    </dl>

    <ul className="reset-effects">
      <li className="is-removed"><span><Icon name="close" /></span><div><strong>Practical attempts are deleted</strong><small>Scores, decision accuracy, reaction times, and any published feedback on them go with the attempt.</small></div></li>
      <li className="is-removed"><span><Icon name="close" /></span><div><strong>Lesson progress rolls back</strong><small>Learn and Check are cleared, with the Check scores. Affected learners read the lesson again from the beginning.</small></div></li>
      <li className="is-kept"><span><Icon name="check" /></span><div><strong>Lesson content is untouched</strong><small>Story pages, questions, rubrics, availability, and the open and end dates all stay as they are.</small></div></li>
      <li className="is-kept"><span><Icon name="check" /></span><div><strong>Accounts and consent are untouched</strong><small>Rosters, tokens, consent records, and guardian links are not affected.</small></div></li>
      <li className="is-kept"><span><Icon name="check" /></span><div><strong>The reset is written to the audit log</strong><small>Who reset what, and when, is recorded and cannot be edited afterwards.</small></div></li>
    </ul>

    {nothingToDo
      ? <Note>There is nothing to reset here yet — no learner has worked through this material.</Note>
      : <form className="sa-form reset-confirm" onSubmit={submit}>
        <Note>This cannot be undone. Deleted attempts cannot be recovered, so only reset when the class is genuinely starting this material again.</Note>
        <Field label="Confirm with your password" hint="Your own account password, to prove this is you and not an unattended screen.">
          <input type="password" value={password} onChange={event => { setPassword(event.target.value); setError(""); }}
            autoComplete="current-password" autoFocus required aria-invalid={error ? true : undefined} />
        </Field>
        {error && <p className="reset-error" role="alert"><Icon name="close" />{error}</p>}
        <div className="sa-action-row">
          <button type="submit" className="sa-danger-button" disabled={busy || !password.trim()}>
            <Icon name="restore" />{busy ? "Resetting…" : "Reset"}
          </button>
          <button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </form>}

    {nothingToDo && <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={onClose}>Close</button></div>}
  </Modal>;
}
