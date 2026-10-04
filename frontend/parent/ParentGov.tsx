import { useState } from "react";
import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Empty, Field, Modal, Note, Panel, Pill, Stat, Toolbar } from "../shared/ui";
import { useParent } from "./ParentApp";
import { guardianLinks, previewNameFor } from "./progress";
import { reaches, scopesFor } from "../../shared/announcements";

export function ParentAnnouncements() {
  const { announcements, sections, users } = useData();
  const scope = useParent();
  const section = sections.find(item => item.id === scope.child.section);
  const teacher = users.find(user => user.id === section?.teacherId);

  // The server only sends posts that reach this parent. Split them into the class's own
  // posts and everything else the school sent (Everyone, All parents, All adults, a grade).
  const classScopes = scopesFor(section ? [section] : []);
  const fromSection = announcements.filter(item => section && item.audience.trim().toLowerCase() === section.name.trim().toLowerCase());
  const fromSchool = announcements.filter(item => !fromSection.includes(item) && reaches(item.audience, "parents", classScopes));

  return <>
    <Toolbar>
      <div>
        <h2 className="sa-toolbar-title">Announcements</h2>
        <p className="sa-toolbar-note">Messages published to {section?.name ?? "your child's section"} and to the whole school. Announcements never contain student IDs, names, or results.</p>
      </div>
    </Toolbar>

    <Panel title={`From ${teacher?.name ?? "your child's teacher"}`} note={`Published to ${section?.name ?? "your child's section"} and its linked guardians.`} wide>
      {fromSection.length === 0
        ? <Empty text="Your child's teacher has not published a section announcement yet." />
        : <ul className="sa-notice-list">{fromSection.map(item => <li key={item.id}>
          <div className="sa-notice-head"><strong>{item.title}</strong><span>{item.audience}</span><small>{item.date}</small></div>
          <p>{item.message}</p>
        </li>)}</ul>}
    </Panel>

    <Panel title="From the school" note="Sent to everyone, all parents, or all adults — and to your child's grade." wide>
      {fromSchool.length === 0
        ? <Empty text="No school-wide announcements right now." />
        : <ul className="sa-notice-list">{fromSchool.map(item => <li key={item.id}>
          <div className="sa-notice-head"><strong>{item.title}</strong><span>{item.audience}</span><small>{item.date}</small></div>
          <p>{item.message}</p>
        </li>)}</ul>}
      <Note>This is a one-way notice board. To reach your child's teacher, use the school's usual contact route — private messaging is not part of this release.</Note>
    </Panel>
  </>;
}

type RequestKind = "" | "correction" | "unlink" | "withdraw";
const REQUESTS: Record<Exclude<RequestKind, "">, { title: string; note: string; hint: string; confirm: string }> = {
  correction: {
    title: "Request a correction",
    note: "Ask the responsible teacher to check something that looks wrong in your child's record.",
    hint: "Describe what looks wrong and where you saw it. Do not include other children's details.",
    confirm: "Correction requests are not available in this preview. Nothing was sent.",
  },
  unlink: {
    title: "Remove my access to this child",
    note: "This ends your own access. It does not delete your child's progress or affect another guardian's separately verified link.",
    hint: "Tell the school why, so they can confirm the request is really from you.",
    confirm: "Unlink requests are not available in this preview. Nothing was sent and your access is unchanged.",
  },
  withdraw: {
    title: "Withdraw my child from the study",
    note: "This is a different request from unlinking. It stops new learning data being collected and is verified through the responsible teacher.",
    hint: "The school will contact you to confirm this in person before anything changes.",
    confirm: "Withdrawal requests are handled offline through the responsible teacher. Nothing was sent from this preview.",
  },
};

export function ConsentAccess() {
  const { links, users, sections, settings, say } = useData();
  const scope = useParent();
  const [request, setRequest] = useState<RequestKind>("");
  const child = scope.child;
  const section = sections.find(item => item.id === child.section);
  const teacher = users.find(user => user.id === section?.teacherId);
  const myLinks = guardianLinks(links, scope.parentId);

  return <>
    <Toolbar>
      <div>
        <h2 className="sa-toolbar-title">Consent &amp; access</h2>
        <p className="sa-toolbar-note">What has been agreed for your child, who verified it, and how to change your mind.</p>
      </div>
    </Toolbar>

    <div className="sa-stat-grid">
      <Stat label="Physical consent" value={child.consent ? "Verified" : "Pending"} note={`Verified in person by ${teacher?.name ?? "the section teacher"}`} tone={child.consent ? "" : "warn"} />
      <Stat label="Child assent" value={child.assent ? "Recorded" : "Pending"} note="Given by your child in the mobile app" tone={child.assent ? "" : "warn"} />
      <Stat label="Active guardian links" value={myLinks.filter(item => item.status === "Active").length} note="Children you can currently see" />
      <Stat label="Privacy notice" value={<span className="parent-date">{settings.noticeVersion}</span>} note="The version your consent was recorded against" />
    </div>

    <Panel title="Your guardian links" note="Every relationship on your account and its current state." wide>
      <table className="sa-table">
        <thead><tr><th>Child</th><th>State</th><th>Verified by</th><th>What you can see</th></tr></thead>
        <tbody>{myLinks.map(item => <tr key={item.id} className={item.status === "Active" ? "" : "sa-row-muted"}>
          <td><strong>{scope.confirmed.find(entry => entry.studentId === item.studentId)?.label ?? previewNameFor(item.studentId)}</strong></td>
          <td><Pill>{item.status}</Pill></td>
          <td>{item.verifiedBy || <span className="sa-dim">Awaiting teacher verification</span>}</td>
          <td className="sa-dim">{item.status === "Active" ? "Published learning records for this child" : item.status === "Pending" ? "Nothing yet" : "Nothing — access ended"}</td>
        </tr>)}</tbody>
      </table>
      <Note>Revoking a link ends that guardian's access immediately. It never deletes the child's progress, and it never removes another guardian's independently verified link.</Note>
    </Panel>

    <div className="sa-grid-2">
      <Panel title="What is stored" note="The record behind your child's account.">
        <ul className="sa-list">
          <li><div><strong>A SafetyQuest student ID</strong><small>Your child's records are kept against a token, not a name, address, photo, or birthdate.</small></div><Pill>Active</Pill></li>
          <li><div><strong>Learning records</strong><small>Lesson progress, quiz answers, practice decisions, teacher grades, and feedback.</small></div><Pill>Active</Pill></li>
          <li><div><strong>Consent metadata</strong><small>Who verified the physical form, when, and against which notice version — not a scan of the signed form.</small></div><Pill>Verified</Pill></li>
          <li><div><strong>Your adult account</strong><small>Your name, email, and the children verified to you.</small></div><Pill>Active</Pill></li>
        </ul>
        <Note>Because your account is identifiable and linked to your child's record, these records are treated as protected personal information, not anonymous data.</Note>
      </Panel>

      <Panel title="Change your mind" note="These are three separate requests. Each one is confirmed through the school.">
        <ul className="sa-pick-list">
          <li><div><strong>Something in the record looks wrong</strong><small>Ask the teacher to check and correct it.</small></div><button type="button" className="sa-ghost" onClick={() => setRequest("correction")}>Request</button></li>
          <li><div><strong>Remove my access to this child</strong><small>Ends your access only. Progress is kept.</small></div><button type="button" className="sa-ghost" onClick={() => setRequest("unlink")}>Request</button></li>
          <li><div><strong>Withdraw my child from the study</strong><small>Stops new learning data being collected.</small></div><button type="button" className="sa-ghost sa-danger" onClick={() => setRequest("withdraw")}>Request</button></li>
        </ul>
        <Note>Ticking a box online never replaces the mandatory physical consent form. Withdrawing participation and unlinking your own access are separate operations.</Note>
      </Panel>
    </div>

    {request && <Modal title={REQUESTS[request].title} note={REQUESTS[request].note} onClose={() => setRequest("")}>
      <form className="sa-form" onSubmit={event => { event.preventDefault(); say(REQUESTS[request].confirm); setRequest(""); }}>
        <Field label="Child"><input value={scope.label} readOnly /></Field>
        <Field label="Responsible teacher"><input value={teacher?.name ?? "Section teacher"} readOnly /></Field>
        <Field label="Your message" hint={REQUESTS[request].hint}><textarea name="message" rows={4} required placeholder="Tell the school what you need." /></Field>
        <label className="sa-check"><input type="checkbox" required /><span>I understand the school will confirm this request with me before anything changes</span></label>
        <button type="submit" className="sa-primary">Send request<Icon name="arrow" /></button>
      </form>
    </Modal>}
  </>;
}

export function MyAccount() {
  const { users, sections, say, log } = useData();
  const scope = useParent();
  const parent = users.find(user => user.id === scope.parentId);
  const section = sections.find(item => item.id === scope.child.section);
  const initials = (parent?.name ?? "Parent").split(" ").map(part => part[0]).slice(0, 2).join("");

  return <>
    <Toolbar>
      <div>
        <h2 className="sa-toolbar-title">My account</h2>
        <p className="sa-toolbar-note">Your own profile and preferences. Your children, their sections, and their grades are managed by the school.</p>
      </div>
    </Toolbar>

    <section className="parent-profile-banner">
      <div className="parent-profile-avatar" aria-hidden="true">{initials}</div>
      <div className="parent-profile-identity">
        <span className="parent-eyebrow">PARENT ACCOUNT</span>
        <h2>{parent?.name ?? "Parent"}</h2>
        <p>{parent?.email ?? "parent@safetyquest.demo"}</p>
      </div>
      <div className="parent-profile-status"><Pill>Active</Pill><small>Guardian access verified</small></div>
    </section>

    <Panel title="Parent information" icon="users" note="Your account details and security settings." wide>
        <div className="parent-profile-fields">
          <Field label="Full name"><input defaultValue={parent?.name} /></Field>
          <Field label="Email address" hint="Changing this requires re-verification, and link notifications go to the new address."><input defaultValue={parent?.email} type="email" /></Field>
          <Field label="Contact number" hint="Optional contact detail for school communication."><input defaultValue="Not provided" type="tel" /></Field>
          <Field label="New password" hint="At least 8 characters. Stored as a salted hash, never in reversible form."><input type="password" placeholder="Leave blank to keep the current password" /></Field>
        </div>
        <div className="sa-action-row"><button type="button" className="sa-primary" onClick={() => { log("Profile updated", `${parent?.name} updated their own guardian profile`); say("Profile saved."); }}><Icon name="check" />Save profile</button></div>
    </Panel>

    <Panel title="Child information" note="The child you are currently viewing." icon="users" wide>
      <div className="parent-readout-grid">
        <div className="parent-readout-group"><div className="parent-readout-label">Child name</div><div className="parent-readout-box"><span>{scope.label.toUpperCase()}</span></div></div>
        <div className="parent-readout-group"><div className="parent-readout-label">Grade level</div><div className="parent-readout-box"><span>{section?.grade ?? "5"}</span></div></div>
        <div className="parent-readout-group"><div className="parent-readout-label">Section</div><div className="parent-readout-box"><span>{section?.name ?? "Unassigned"}</span></div></div>
        <div className="parent-readout-group"><div className="parent-readout-label">Account status</div><div className="parent-readout-box"><span>{scope.child.status === "Active" ? "Active" : "Pending"}</span></div></div>
      </div>
    </Panel>

    <div className="parent-profile-panels parent-profile-secondary">
      <Panel title="Account information" icon="overview" note="Basic account status and history.">
        <dl className="parent-fact-list">
          <div><dt>Account status</dt><dd><Pill>Active</Pill></dd></div>
          <div><dt>Date joined</dt><dd>{parent?.createdAt ?? "Aug 17, 2026"}</dd></div>
          <div><dt>Account role</dt><dd>Parent / Guardian</dd></div>
        </dl>
      </Panel>
      <Panel title="Security" icon="settings" note="Keep your guardian account protected.">
        <div className="parent-security-actions">
          <div><strong>Change password</strong><small>Update the password used to sign in.</small></div>
          <button type="button" className="sa-ghost" onClick={() => document.querySelector<HTMLInputElement>('input[type="password"]')?.focus()}>Change</button>
          <div><strong>Sign out</strong><small>End this parent session on this device.</small></div>
          <button type="button" className="sa-ghost sa-danger" onClick={scope.signOut}>Log out</button>
        </div>
      </Panel>
    </div>

  </>;
}
