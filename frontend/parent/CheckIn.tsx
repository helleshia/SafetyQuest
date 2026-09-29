import { useState, type FormEvent } from "react";
import Icon from "../shared/Icon";
import BrandLogo from "../shared/BrandLogo";
import type { User } from "../shared/demo";
import { useData } from "../shared/store";
import { verifyChildDetails } from "./progress";

/**
 * The child check-in form. It runs as the full-screen gate right after sign-in,
 * and again inside a modal when a parent adds a second child to the session.
 */
export function CheckInForm({ onConfirm, submitLabel = "Continue" }: { onConfirm: (studentId: string, label: string) => void; submitLabel?: string }) {
  const { users, links, accountId } = useData();
  const parentId = accountId ?? "";
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const label = String(data.get("child-name") ?? "").trim();
    const studentId = String(data.get("student-id") ?? "").trim();
    const result = verifyChildDetails(users, links, parentId, label, studentId);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    onConfirm(result.studentId, label);
  }

  return <form className="parent-gate-form" onSubmit={submit} onChange={() => setError("")}>
    <label className="sa-field" htmlFor="child-name">
      <span>Your child's name</span>
      <input id="child-name" name="child-name" required minLength={2} autoComplete="off" placeholder="e.g. Maya Mendoza" />
      <small>Whatever you call them at home. It is only a label on your screens.</small>
    </label>
    <label className="sa-field" htmlFor="student-id">
      <span>Student ID</span>
      <input id="student-id" name="student-id" required autoComplete="off" spellCheck={false} placeholder="SQ-G5-013" className="sa-mono" />
      <small>From the slip your child's teacher gave you. Spacing and dashes don't matter.</small>
    </label>
    {error && <p className="parent-gate-error" role="alert"><Icon name="consent" /><span>{error}</span></p>}
    <button className="sa-primary parent-gate-submit" type="submit">{submitLabel}<Icon name="arrow" /></button>
  </form>;
}

export default function CheckIn({ parentName, linked, onConfirm, onSignOut }: { parentName: string; linked: User[]; onConfirm: (studentId: string, label: string) => void; onSignOut: () => void }) {
  const first = parentName.split(" ")[0];
  return <div className="parent-gate">
    <header className="parent-gate-top">
          <span className="sa-brand"><BrandLogo /><div><strong>SafetyQuest</strong><small>Parent &amp; guardian portal</small></div></span>
      <button type="button" className="sa-ghost" onClick={onSignOut}><Icon name="logout" />Sign out</button>
    </header>

    <main className="parent-gate-body">
      <section className="parent-gate-panel" aria-labelledby="parent-gate-title">
        <span className="parent-eyebrow">WELCOME BACK, {first.toUpperCase()}</span>
        <h1 id="parent-gate-title">Who are we<br /><em>checking on today?</em></h1>
        {linked.length === 0
          ? <>
            <p>Your account is verified, but no child is linked to it yet, so there is nothing to show you.</p>
            <div className="parent-gate-empty">
              <h2>How to get access</h2>
              <ol className="sa-steps">
                <li><strong>Talk to your child's section teacher</strong><small>They verify the physical consent form and your relationship to the child in person.</small></li>
                <li><strong>They issue a one-time invitation</strong><small>It expires, is single-use, and is tied to one student record.</small></li>
                <li><strong>You redeem it while signed in here</strong><small>The teacher confirms it is the intended account, and access begins.</small></li>
              </ol>
              <p className="sa-footnote">A student ID, a surname, a class code, or holding your child's device is not proof of guardianship on its own.</p>
            </div>
          </>
          : <>
            <p>Enter your child's name and student ID to open their records. We check the student ID against the guardian links already verified for your account.</p>
            <CheckInForm onConfirm={onConfirm} submitLabel="Open my child's progress" />
            <p className="parent-gate-help">Can't find it? Ask your child's teacher — please don't guess.</p>
          </>}
      </section>

      <aside className="parent-gate-aside" aria-label="What you can see here">
        <div className="parent-gate-art" aria-hidden="true"><i /><i /><i /></div>
        <h2>Small steps.<br /><em>Big confidence.</em></h2>
        <ul className="parent-gate-points">
          <li><Icon name="check" /><span>What your child is learning and how far they have come</span></li>
          <li><Icon name="check" /><span>Results and feedback once their teacher publishes them</span></li>
          <li><Icon name="check" /><span>Approved activities you can practice together at home</span></li>
        </ul>
        <p className="parent-gate-aside-note">You can follow your child's progress here, but you cannot change grades, unlock modules, or edit school-assigned activities. Those stay with the teacher.</p>
      </aside>
    </main>

    <p className="parent-gate-foot">Interface preview. Every access check shown here must be repeated on the server before real participant data is used.</p>
  </div>;
}
