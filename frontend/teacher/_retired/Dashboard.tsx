import { FOLLOW_UP_REASONS, MISSED_DECISIONS } from "../shared/demo";
import { useData } from "../shared/store";
import { Bar, Empty, Note, Panel, Pill } from "../shared/ui";
import { Metric, PageHead } from "./TeacherUI";
import { useScope } from "./TeacherApp";

export default function Dashboard() {
  const store = useData();
  const { users, links, modules, assessments, assignments, settings } = store;
  const scope = useScope();

  const roster = users.filter(user => user.role === "Student" && user.section === scope.sectionId);
  const eligible = roster.filter(student => student.status === "Active" && student.consent && student.assent);
  const rows = assessments.filter(row => row.sectionId === scope.sectionId);
  const sectionAssignments = assignments.filter(item => item.sectionId === scope.sectionId && item.status === "Published");
  const pendingReviews = rows.filter(row => row.review === "Awaiting review");
  const pendingLinks = links.filter(link => link.status === "Pending" && roster.some(student => student.id === link.studentId));
  const pendingConsent = roster.filter(student => !student.consent || !student.assent);
  const drafts = rows.filter(row => row.review === "Reviewed draft");
  const passes = rows.filter(row => row.practical >= settings.practicalPass);
  const completion = sectionAssignments.length ? Math.round((rows.length / (eligible.length * sectionAssignments.length || 1)) * 100) : 0;
  const verifications = pendingConsent.length + pendingLinks.length;

  const followUp = eligible
    .filter(student => student.score < settings.practicalPass + 8)
    .slice(0, 5)
    .map((student, i) => ({ student, reason: FOLLOW_UP_REASONS[i % FOLLOW_UP_REASONS.length] }));

  return <div className="tc-page">
    <PageHead icon="sections" eyebrow="Current section" title={store.sectionOf(scope.sectionId)}>
      Everything below is scoped to this section only. Switch sections from the scope selector in the header.
    </PageHead>

    <div className="tc-metrics">
      <Metric icon="users" tint="lilac" label="Eligible learners" value={eligible.length} sub={`of ${roster.length} enrolled`}>
        Consent verified and assent given. Learning data is collected for these learners only.
      </Metric>
      <Metric icon="graduation" tint="mint" label="Assignment completion" value={`${completion}%`}>
        {rows.length} recorded attempt{rows.length === 1 ? "" : "s"} across {sectionAssignments.length} published assignment{sectionAssignments.length === 1 ? "" : "s"}.
      </Metric>
      <Metric icon="check" tint="mint" label="Simulation passes" value={passes.length} sub={`of ${rows.length} attempts`}>
        Measured against the {settings.practicalPass}% pass mark. Each attempt means its lesson was worked through first.
      </Metric>
      <Metric icon="assessment" tint="coral" label="Pending assessment reviews" value={pendingReviews.length} flag={pendingReviews.length > 0}>
        Practical attempts waiting for your rubric grade. Pending review is not a failing grade.
      </Metric>
      <Metric icon="consent" tint="coral" label="Pending verifications" value={verifications} flag={verifications > 0}>
        {pendingConsent.length} consent or assent · {pendingLinks.length} guardian link awaiting your confirmation.
      </Metric>
      <Metric icon="edit" tint="blue" label="Feedback awaiting publication" value={drafts.length}>
        Reviewed drafts that the learner and their linked parents cannot see yet.
      </Metric>
    </div>

    <div className="tc-grid-2">
      <Panel title="Module progress" icon="graduation" note={`Completed modules out of 15 across ${eligible.length} eligible learners.`}>
        <div className="tc-completion">
          <strong>{completion}%</strong>
          <span>Section completion<small>{rows.length} attempts recorded against {sectionAssignments.length} published assignment{sectionAssignments.length === 1 ? "" : "s"}</small></span>
        </div>
        {modules.slice(0, 6).map(module => {
          const done = eligible.filter(student => student.completed >= module.id).length;
          return <Bar key={module.id} label={`${module.id}. ${module.name}`} value={done} total={eligible.length || 1} tint="blue" />;
        })}
      </Panel>

      <Panel title="Frequently missed decisions" icon="assessment" note="Grouped by approved answer mappings for this section.">
        <ul className="sa-list">
          {MISSED_DECISIONS.slice(0, 4).map(item => <li key={item.decision}>
            <div><strong>{item.module}</strong><small>{item.decision}</small></div><b>{item.share}%</b>
          </li>)}
        </ul>
      </Panel>
    </div>

    <div className="tc-grid-2">
      <Panel title="Learners needing follow-up" icon="person" note="Identified by token. Open a record to see which step to revisit.">
        {followUp.length === 0 ? <Empty text="No learners are flagged for follow-up in this section right now." /> : <ul className="sa-list">
          {followUp.map(({ student, reason }) => <li key={student.id}>
            <div><strong className="sa-mono">{student.name}</strong><small>{reason}</small></div>
            <button type="button" className="sa-ghost" onClick={() => scope.openToken(student.id)}>Open</button>
          </li>)}
        </ul>}
        <Note>Follow-up indicators describe a learning need only. They never label a child unsafe, unfit, or diagnosed based on app performance.</Note>
      </Panel>

      <Panel title="Upcoming due dates" icon="clock" note="Published assignments for this section.">
        {sectionAssignments.length === 0 ? <Empty text="No published assignments for this section yet." /> : <ul className="sa-list">
          {sectionAssignments.map(item => <li key={item.id}>
            <div><strong>{store.moduleOf(item.moduleId)}</strong><small>Opens {item.opens} · {item.phases} · {item.retries} retries allowed</small></div>
            <span className="sa-due">{item.due}</span>
          </li>)}
        </ul>}
      </Panel>
    </div>

    <div className="tc-grid-2">
      <Panel title="Recent completed assessments" icon="clock" note="Newest submissions from this section.">
        {rows.length === 0 ? <Empty text="No submissions recorded yet." /> : <div className="tc-table-scroll"><table className="sa-table">
          <thead><tr><th>Token</th><th>Module</th><th>Practical</th><th>Review</th></tr></thead>
          <tbody>{rows.slice(0, 6).map(row => <tr key={row.id}>
            <td className="sa-mono">{store.nameOf(row.studentId)}</td>
            <td>{store.moduleOf(row.moduleId)}</td>
            <td>{row.practical}%</td>
            <td><Pill>{row.review}</Pill></td>
          </tr>)}</tbody>
        </table></div>}
      </Panel>

      <Panel title="Feedback awaiting publication" icon="edit" note="Reviewed drafts that the learner and linked parents cannot see yet.">
        {drafts.length === 0 ? <Empty text="No unpublished review drafts." /> : <ul className="sa-list">
          {drafts.slice(0, 5).map(row => <li key={row.id}>
            <div><strong className="sa-mono">{store.nameOf(row.studentId)}</strong><small>{store.moduleOf(row.moduleId)} · practical {row.practical}%</small></div>
            <button type="button" className="sa-ghost" onClick={() => scope.go("Grades & Feedback")}>Review</button>
          </li>)}
        </ul>}
        <Note>Draft text, answer keys, and unpublished scenarios never reach parent or student responses.</Note>
      </Panel>
    </div>
  </div>;
}
