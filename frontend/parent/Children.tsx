import { useState } from "react";
import Icon from "../shared/Icon";
import { BADGE_LADDER, practicalSummary, type User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Modal, Note, Panel, Pill, Stat } from "../shared/ui";
import { CheckInForm } from "./CheckIn";
import { ChildHeading, useParent } from "./ParentApp";
import { assignedActivities, earnedBadges, guardianLinks, previewNameFor, publishedResults } from "./progress";
import { attemptScore, averageScore, passMarkFor } from "../../shared/scoring";

export default function MyChildren({ allChildren }: { allChildren: User[] }) {
  const { sections, users, links, assessments, assignments, modules, settings, moduleOf, say } = useData();
  const scope = useParent();
  const [adding, setAdding] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const child = scope.child;
  const section = sections.find(item => item.id === child.section);
  const teacher = users.find(user => user.id === section?.teacherId);
  const link = links.find(item => item.parentId === scope.parentId && item.studentId === child.id);
  const results = publishedResults(assessments, child.id);
  const assigned = assignedActivities(assignments, child);
  const badges = earnedBadges(BADGE_LADDER, child);
  const total = modules.filter(module => module.status === "Published").length;
  const completed = Math.min(total, Math.max(0, child.completed));
  const percentage = total ? Math.round(completed / total * 100) : 0;
  const average = averageScore(results);
  const practiceAverage = average === null ? "—" : `${average}%`;
  const latest = results[0];
  const completedLessons = completed;
  const inProgressLessons = completed < total ? 1 : 0;
  const notStartedLessons = Math.max(0, total - completed - inProgressLessons);
  const latestModule = latest ? moduleOf(latest.moduleId) : "No practical yet";
  const assessmentResult = latest ? `${attemptScore(latest)}% · ${latest.review}` : "No result yet";

  const myLinks = guardianLinks(links, scope.parentId);
  const otherActive = myLinks.filter(item => item.status === "Active" && !scope.confirmed.some(entry => entry.studentId === item.studentId));
  const waiting = myLinks.filter(item => item.status !== "Active");

  return <>
    <section className="parent-welcome">
      <div>
        <span className="parent-eyebrow">GROWING READY, TOGETHER</span>
        <h2>{scope.label}'s progress,<br /><em>at a glance.</em></h2>
        <p>See what they are learning, celebrate how far they have come, and notice where a little encouragement would help.</p>
      </div>
      <div className="parent-welcome-mark" aria-hidden="true"><Icon name="curriculum" /><span>Small steps.<br />Big confidence.</span></div>
    </section>

    <ChildHeading action={<div className="sa-toolbar-right">
      <button type="button" className="sa-ghost" onClick={() => setAdding(true)}><Icon name="plus" />Check in another child</button>
      <button type="button" className="sa-ghost" onClick={() => setRequesting(true)}><Icon name="mail" />Link a child</button>
    </div>} />

    <div className="sa-stat-grid">
      <Stat label="Modules completed" value={`${completed} / ${total}`} note="Published curriculum modules" />
      <Stat label="Practice average" value={practiceAverage} note="Published simulation scores" />
      <Stat label="Last learning activity" value={<span className="parent-date">{child.lastActive ?? "Not recorded"}</span>} note="Latest recorded activity, not live presence" />
    </div>

    <div className="parent-overview-grid">
      <Panel title="Child summary" icon="users" note="The child record currently selected.">
        <dl className="parent-fact-list">
          <div><dt>Child name</dt><dd>{scope.label}</dd></div>
          <div><dt>Grade &amp; section</dt><dd>{section?.name ?? "Unassigned"}</dd></div>
          <div><dt>Overall progress</dt><dd>{percentage}% complete</dd></div>
          <div><dt>Assessment performance</dt><dd>{child.score}% overall</dd></div>
        </dl>
      </Panel>

      <Panel title="Learning progress" icon="curriculum" note="Lessons across the published curriculum.">
        <div className="parent-status-list">
          <div><span className="parent-status-dot is-complete" />Lessons completed<strong>{completedLessons}</strong></div>
          <div><span className="parent-status-dot is-progress" />Lessons in progress<strong>{inProgressLessons}</strong></div>
          <div><span className="parent-status-dot is-pending" />Lessons not started<strong>{notStartedLessons}</strong></div>
        </div>
      </Panel>

      <Panel title="Recent activity" icon="clock" note="The latest published activity for this child.">
        <dl className="parent-fact-list">
          <div><dt>Completed lesson</dt><dd>{completed ? `${moduleOf(Math.min(completed, total))}` : "None yet"}</dd></div>
          <div><dt>Recent practical</dt><dd>{latestModule}{latest ? ` · ${attemptScore(latest)}%` : ""}</dd></div>
          <div><dt>Assessment result</dt><dd>{assessmentResult}</dd></div>
        </dl>
      </Panel>
    </div>

    <div className="sa-grid-2">
      <Panel title="Learning journey" note="Every completed module is another small step forward.">
        <div className="parent-completion"><strong>{percentage}%</strong><span>of the published curriculum completed</span></div>
        <progress className="parent-progress-bar" value={completed} max={total || 1} aria-label="Curriculum completion" />
        <div className="parent-completion-labels"><span>{completed} completed</span><span>{total - completed} remaining</span></div>
        <p className="parent-support">Keep encouraging regular practice. These are learning results, not a measure of how your child would act in a real emergency.</p>
        <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => scope.go("Child Progress")}>See module detail<Icon name="arrow" /></button></div>
      </Panel>

      <Panel title="School &amp; access" note="Your child's classroom and your verified guardian connection.">
        <dl className="parent-details">
          <div><dt>Section</dt><dd>{section?.name ?? "Unassigned"}</dd></div>
          <div><dt>Teacher</dt><dd>{teacher?.name ?? "Not assigned"}</dd></div>
          <div><dt>Guardian link</dt><dd>Active · verified by {link?.verifiedBy || "the school"}</dd></div>
          <div><dt>Physical consent</dt><dd>{child.consent ? "Verified" : "Awaiting verification"}</dd></div>
          <div><dt>Child assent</dt><dd>{child.assent ? "Recorded in the app" : "Not yet recorded"}</dd></div>
          <div><dt>Privacy notice</dt><dd>{settings.noticeVersion}</dd></div>
        </dl>
      </Panel>
    </div>

    <Panel title="Current and upcoming activities" note="Published activities assigned to this student. Dates are sample schedule dates." wide>
      {assigned.length === 0
        ? <Empty text="No published activities are assigned right now. Your child's teacher will share the next one." />
        : <ul className="sa-list">{assigned.map(item => <li key={item.id}>
          <div><strong>{moduleOf(item.moduleId)}</strong><small>{item.phases} · {item.simulation ? "Includes a practice simulation" : "No simulation"}</small><small>Opens {item.opens}</small></div>
          <span className="sa-due">Due {item.due}</span>
        </li>)}</ul>}
    </Panel>

    <div className="sa-grid-2">
      <Panel title="Badges earned" note="Small wins your child collected along the way.">
        {badges.length === 0
          ? <Empty text="No badges yet. They arrive as your child finishes more modules." />
          : <ul className="parent-badges">{badges.map(badge => <li key={badge.id}>
            <span aria-hidden="true"><Icon name="check" /></span>
            <div><strong>{badge.label}</strong><small>{badge.detail}</small></div>
          </li>)}</ul>}
      </Panel>

      <Panel title="Latest published feedback" note="Written by your child's teacher. Draft notes are never shown here.">
        {!latest
          ? <Empty text="No feedback has been published yet. It appears once the teacher finishes reviewing an attempt." />
          : <>
            <h3 className="sa-sub">{moduleOf(latest.moduleId)}</h3>
            <p className="parent-plain">{practicalSummary(attemptScore(latest), passMarkFor(section, settings.practicalPass))}</p>
            <p className="parent-feedback"><Icon name="mail" /><span>{latest.feedback || "Your child's teacher published this result without a written note."}</span></p>
            <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => scope.go("Child Progress")}>See all results<Icon name="arrow" /></button></div>
          </>}
      </Panel>
    </div>

    <Panel title="Your children" note="Every child on your account, and whether you have checked them in during this visit." wide>
      <table className="sa-table">
        <thead><tr><th>Child</th><th>Student ID</th><th>Section</th><th>Link state</th><th>This visit</th><th /></tr></thead>
        <tbody>
          {scope.confirmed.map(entry => {
            const record = allChildren.find(item => item.id === entry.studentId);
            return <tr key={entry.studentId}>
              <td><strong>{entry.label}</strong><small className="sa-cell-sub">Name you entered</small></td>
              <td className="sa-mono">{record?.name ?? "—"}</td>
              <td>{sections.find(item => item.id === record?.section)?.name ?? "—"}</td>
              <td><Pill>Active</Pill></td>
              <td><Pill>Verified</Pill></td>
              <td className="sa-cell-actions">
                {entry.studentId !== child.id && <button type="button" className="sa-ghost" onClick={() => scope.setChildId(entry.studentId)}>View</button>}
                <button type="button" className="sa-ghost sa-danger" onClick={() => scope.closeChild(entry.studentId)}>Sign out</button>
              </td>
            </tr>;
          })}
          {otherActive.map(item => {
            const record = allChildren.find(row => row.id === item.studentId);
            return <tr key={item.id} className="sa-row-muted">
              <td><strong>Not checked in yet</strong><small className="sa-cell-sub">Enter their details to open the records</small></td>
              <td className="sa-mono">{record?.name ?? "—"}</td>
              <td>{sections.find(row => row.id === record?.section)?.name ?? "—"}</td>
              <td><Pill>Active</Pill></td>
              <td><Pill>Pending</Pill></td>
              <td className="sa-cell-actions"><button type="button" className="sa-ghost" onClick={() => setAdding(true)}><Icon name="check" />Check in</button></td>
            </tr>;
          })}
        </tbody>
      </table>
      <Note>Checking a child in confirms you are opening the right record. It does not create, change, or extend a guardian link — only the responsible teacher can do that.</Note>
    </Panel>

    {waiting.length > 0 && <Panel title="Link requests" note="Status only. No records are shown until the responsible teacher confirms the relationship." wide>
      <ul className="sa-list">{waiting.map(item => <li key={item.id}>
        <div>
          <strong>{previewNameFor(item.studentId)}</strong>
          <small>{item.status === "Pending" ? "Waiting for the section teacher to verify your consent form and relationship." : `Access ended${item.verifiedBy ? ` · handled by ${item.verifiedBy}` : ""}. Your child's progress was not deleted.`}</small>
        </div>
        <Pill>{item.status}</Pill>
      </li>)}</ul>
      <Note>A revoked link ends only your access to that child. It does not remove another guardian's separately verified link.</Note>
    </Panel>}

    {adding && <Modal title="Check in another child" note="Enter the child's name and student ID, the same way you did when you signed in." onClose={() => setAdding(false)}>
      <CheckInForm submitLabel="Open their progress" onConfirm={(studentId, label) => { scope.confirmChild(studentId, label); setAdding(false); }} />
    </Modal>}

    {requesting && <Modal title="Link a child to your account" note="Guardianship is verified in person. This screen explains the route; it cannot grant access by itself." onClose={() => setRequesting(false)}>
      <ol className="sa-steps">
        <li><strong>Bring the signed consent form to the section teacher</strong><small>They check the physical form and confirm your relationship to the child offline.</small></li>
        <li><strong>The teacher issues a one-time invitation</strong><small>It expires, can be used once, and covers one student record only.</small></li>
        <li><strong>Redeem it here while signed in</strong><small>Paste the invitation code below. The request then waits for the teacher to confirm the intended account.</small></li>
      </ol>
      <form className="sa-form" onSubmit={event => { event.preventDefault(); say("Invitation redemption is not available in this preview. Nothing was sent and no link was created."); setRequesting(false); }}>
        <label className="sa-field" htmlFor="invitation"><span>Invitation code</span><input id="invitation" name="invitation" required placeholder="Paste the code from your child's teacher" className="sa-mono" /></label>
        <button type="submit" className="sa-primary">Redeem invitation<Icon name="arrow" /></button>
      </form>
      <Note>A student ID, a surname, a class code, or holding your child's device is not proof of guardianship on its own.</Note>
    </Modal>}
  </>;
}
