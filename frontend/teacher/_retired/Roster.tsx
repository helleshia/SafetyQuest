import { useState } from "react";
import Icon from "../shared/Icon";
import { QUESTION_BANK, SIM_TIMELINE, type User } from "../shared/demo";
import { useData } from "../shared/store";
import { Bar, Empty, Field, Modal, Note, Panel, Pill, Search } from "../shared/ui";
import { Metric, PageHead } from "./TeacherUI";
import { useScope } from "./TeacherApp";

export function MySections() {
  const store = useData();
  const { users, sections, links, setUsers, setSections, log, say } = store;
  const scope = useScope();
  const section = sections.find(item => item.id === scope.sectionId);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [slip, setSlip] = useState<User | null>(null);

  const roster = users.filter(user => user.role === "Student" && user.section === scope.sectionId);
  const shown = roster.filter(student => student.name.toLowerCase().includes(query.trim().toLowerCase()));
  const linkStateOf = (studentId: string) => links.find(link => link.studentId === studentId)?.status ?? "None";

  function patch(student: User, changes: Partial<User>, action: string, message: string) {
    setUsers(current => current.map(row => (row.id === student.id ? { ...row, ...changes } : row)));
    log(action, `${student.name} · ${message}`);
    say(message);
  }

  if (!section) return <Empty text="No section selected." />;

  const eligible = roster.filter(student => student.consent && student.assent);

  return <div className="tc-page">
    <PageHead icon="sections" eyebrow="My sections" title={section.name}
      actions={<>
        <Search value={query} onChange={setQuery} placeholder="Search by token" />
        <button type="button" className="sa-primary" onClick={() => setCreating(true)}><Icon name="plus" />Generate tokens</button>
      </>}>
      Token rosters, eligibility, credential state, and private activation slips for the learners you are responsible for.
    </PageHead>

    <div className="tc-metrics">
      <article className="tc-metric">
        <header><span className="tc-metric-icon tint-blue"><Icon name="sections" /></span><h3>Class code</h3></header>
        <span className="tc-metric-code">{section.code}</span>
        <p>Locates the section during enrolment. It is not permission to view or select any child in the class.</p>
        <button type="button" className="sa-ghost" onClick={() => { const code = `SQ-${section.grade}${section.name.slice(-1).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`; setSections(current => current.map(row => (row.id === section.id ? { ...row, code } : row))); log("Enrollment code rotated", `${section.name} · new locator issued`); say("Enrollment code rotated. The old code no longer enrolls new learners."); }}><Icon name="audit" />Rotate code</button>
      </article>

      <article className="tc-metric">
        <header><span className={`tc-metric-icon ${section.enrollment ? "tint-mint" : "tint-yellow"}`}><Icon name={section.enrollment ? "check" : "close"} /></span><h3>Enrollment</h3></header>
        <b className="is-word">{section.enrollment ? "Open" : "Closed"}</b>
        <p>{section.enrollment ? "New learners can redeem the class code and join this section." : "The class code no longer enrolls anyone. Existing learners are unaffected."}</p>
        <button type="button" className="sa-ghost" onClick={() => { setSections(current => current.map(row => (row.id === section.id ? { ...row, enrollment: !row.enrollment } : row))); log(section.enrollment ? "Enrollment closed" : "Enrollment opened", section.name); say(`Enrollment ${section.enrollment ? "closed" : "opened"}.`); }}>{section.enrollment ? "Close enrollment" : "Open enrollment"}</button>
      </article>

      <Metric icon="users" tint="lilac" label="Learners" value={roster.length} sub={`· ${eligible.length} eligible`}>
        Every learner is identified by a randomized token. The token-to-name list stays on paper, offline, with you.
      </Metric>
    </div>

    <Panel title="Token roster" icon="users" note="Eligibility, credential state, and guardian-link state for every learner you are responsible for." wide>
      {shown.length === 0 ? <Empty text="No learners match this search." /> : <div className="tc-table-scroll"><table className="sa-table sa-table-click tc-table-wide">
        <thead><tr><th>Token</th><th>Participation</th><th>Consent</th><th>Assent</th><th>Enrolled</th><th>Credential</th><th>Parent link</th><th>Last activity</th><th /></tr></thead>
        <tbody>{shown.map(student => <tr key={student.id} onClick={() => scope.openToken(student.id)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") scope.openToken(student.id); }}>
          <td className="sa-mono">{student.name}</td>
          <td><Pill>{student.status}</Pill></td>
          <td>{student.consent ? "Verified" : <span className="sa-below">Not verified</span>}</td>
          <td>{student.assent ? "Given" : <span className="sa-dim">Not given</span>}</td>
          <td className="sa-dim">{student.enrolled}</td>
          <td>{student.activated ? "Activated" : <span className="sa-dim">Slip not redeemed</span>}</td>
          <td><Pill>{linkStateOf(student.id) === "None" ? "Pending" : linkStateOf(student.id)}</Pill></td>
          <td className="sa-dim">{student.lastActive}</td>
          <td className="sa-cell-actions" onClick={event => event.stopPropagation()}>
            <button type="button" className="sa-ghost" onClick={() => setSlip(student)}>Slip</button>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <div className="tc-grid-2">
      <Panel title="Eligibility actions" icon="consent" note="Every action below assumes you completed the offline verification first.">
        <ul className="sa-list">
          {roster.filter(student => !student.consent).map(student => <li key={student.id}>
            <div><strong className="sa-mono">{student.name}</strong><small>Physical consent form not yet verified</small></div>
            <button type="button" className="sa-ghost" onClick={() => patch(student, { consent: true }, "Consent verified", "physical consent form verified in person")}><Icon name="check" />Record verification</button>
          </li>)}
          {roster.filter(student => !student.activated).map(student => <li key={student.id}>
            <div><strong className="sa-mono">{student.name}</strong><small>Activation slip issued but not yet redeemed</small></div>
            <button type="button" className="sa-ghost" onClick={() => patch(student, { activated: false }, "Credential reset", "new private activation credential issued, old one revoked")}>Reset credential</button>
          </li>)}
          {roster.every(student => student.consent && student.activated) && <li><div><strong>Nothing outstanding</strong><small>Every learner in this section is verified and activated.</small></div><Pill>Active</Pill></li>}
        </ul>
      </Panel>

      <Panel title="Section eligibility" icon="graduation" note="Learning collection begins only after physical consent and child assent.">
        <Bar label="Consent verified" value={roster.filter(student => student.consent).length} total={roster.length || 1} tint="mint" />
        <Bar label="Assent given" value={roster.filter(student => student.assent).length} total={roster.length || 1} tint="blue" />
        <Bar label="Credential activated" value={roster.filter(student => student.activated).length} total={roster.length || 1} tint="yellow" />
        <Bar label="Guardian link active" value={roster.filter(student => linkStateOf(student.id) === "Active").length} total={roster.length || 1} tint="lilac" />
        <Note>Keep the physical token-to-name list offline and secure. It is the only mapping between a token and a real learner.</Note>
      </Panel>
    </div>

    {slip && <Modal title="Private activation slip" note={`${slip.name} · ${section.name}`} onClose={() => setSlip(null)}>
      <div className="sa-slip">
        <span>SAFETYQUEST · PRIVATE ACTIVATION SLIP</span>
        <div><small>Classroom code</small><strong className="sa-mono">{section.code}</strong></div>
        <div><small>Student token</small><strong className="sa-mono">{slip.name}</strong></div>
        <div><small>One-time activation credential</small><strong className="sa-mono">{`${slip.id.toUpperCase()}-${section.grade}${Math.abs(slip.name.length * 7919 % 9000) + 1000}`}</strong></div>
        <p>Hand this slip to one learner only. The classroom code locates the section; it is not permission to view or select any child in the class.</p>
      </div>
      <div className="sa-action-row">
        <button type="button" className="sa-ghost" onClick={() => { window.print(); }}><Icon name="download" />Print slip</button>
        <button type="button" className="sa-ghost sa-danger" onClick={() => { patch(slip, { activated: false }, "Credential reset", "new private credential issued after offline verification"); setSlip(null); }}>Reissue credential</button>
      </div>
      <Note>Tokens are identifiers, not authentication secrets. The private credential is what grants mobile access, and it is revocable.</Note>
    </Modal>}

    {creating && <Modal title="Generate student token records" note="Bulk creation uses a participant count. Never upload names, student IDs, birthdates, or addresses." onClose={() => setCreating(false)}>
      <form className="sa-form" onSubmit={event => {
        event.preventDefault();
        const count = Number(new FormData(event.currentTarget).get("count"));
        const base = users.filter(user => user.role === "Student").length;
        const created: User[] = Array.from({ length: count }, (_, i) => ({
          id: `st${base + i + 1}`,
          name: `SQ-G${section.grade}-${String(base + i + 1).padStart(3, "0")}`,
          email: "", role: "Student", status: "Pending", section: section.id,
          completed: 0, score: 0, consent: false, assent: false,
          activated: false, enrolled: "Sep 18, 2026", lastActive: "—",
        }));
        setUsers(current => [...current, ...created]);
        log("Student records created", `${count} token records generated for ${section.name}`);
        say(`${count} token records created. Verify eligibility, then print the private activation slips.`);
        setCreating(false);
      }}>
        <Field label="Number of participants" hint="One randomized token is generated per participant. You keep the name mapping on paper."><input name="count" type="number" min={1} max={40} defaultValue={5} required /></Field>
        <Note>New records start as Pending with consent unverified. They cannot begin learning until you record the physical consent and the child gives assent in the app.</Note>
        <button type="submit" className="sa-primary">Generate tokens<Icon name="arrow" /></button>
      </form>
    </Modal>}
  </div>;
}

export function StudentProgress() {
  const store = useData();
  const { users, links, assessments, assignments, settings, setUsers, log, say } = store;
  const scope = useScope();
  const roster = users.filter(user => user.role === "Student" && user.section === scope.sectionId);
  const [selected, setSelected] = useState(scope.focusToken || roster[0]?.id || "");
  const student = roster.find(item => item.id === selected) ?? roster[0];
  const [transfer, setTransfer] = useState(false);

  if (!student) return <Empty text="This section has no learners yet." />;

  const rows = assessments.filter(row => row.studentId === student.id);
  const assigned = assignments.filter(item => item.sectionId === scope.sectionId && item.status === "Published");
  const guardian = links.filter(link => link.studentId === student.id);

  return <div className="tc-page">
    <PageHead icon="users" eyebrow="Student progress" title={student.name} mono
      actions={<label className="sa-select"><span>Token</span>
        <select value={student.id} onChange={event => setSelected(event.target.value)}>{roster.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <Icon name="down" />
      </label>}>
      <strong>{store.sectionOf(student.section)}</strong> · identify the learner from your physical master list. This screen never adds an unofficial name field or an identifying alias.
    </PageHead>

    <div className="tc-metrics tc-metrics-4">
      <Metric icon="person" tint="lilac" label="Participation" value={student.status} word flag={!student.consent}>
        {student.consent ? "Physical consent verified offline." : "Consent not verified yet."}
      </Metric>
      <Metric icon="consent" tint="mint" label="Clearance" value={student.assent ? "Cleared" : "Blocked"} word flag={!student.assent}>
        {student.assent ? "The child gave assent in the app." : "The child has not given assent yet."}
      </Metric>
      <Metric icon="graduation" tint="blue" label="Modules completed" value={student.completed} sub="of 15">
        {assigned.length} assigned · {15 - student.completed} remaining.
      </Metric>
      <Metric icon="assessment" tint="coral" label="Average score" value={`${student.score}%`}>
        Best and latest scores are listed separately in the attempt tables below.
      </Metric>
    </div>

    <div className="tc-grid-2">
      <Panel title="Practical attempts" icon="assessment" note="A recorded attempt means the lesson was worked through first. Question explanations are teacher-facing and answer keys stay server-side.">
        {rows.length === 0 ? <Empty text="No attempts recorded for this token." /> : <div className="tc-table-scroll"><table className="sa-table">
          <thead><tr><th>Module</th><th>Practical</th><th>Result</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}>
            <td>{store.moduleOf(row.moduleId)}</td>
            <td>{row.practical}%</td>
            <td>{row.practical >= settings.practicalPass ? <Pill>Published</Pill> : <Pill>Pending</Pill>}</td>
          </tr>)}</tbody>
        </table></div>}
        <h3 className="sa-sub">Question explanations</h3>
        <ul className="sa-refs">{QUESTION_BANK.slice(0, 2).map(question => <li key={question.id}>{question.text} — {question.explanation}</li>)}</ul>
      </Panel>

      <Panel title="Decision sequences" icon="clock" note="Elapsed active time only. Interrupted intervals are marked unavailable, never scored as zero.">
        {rows.length === 0 ? <Empty text="No practical attempts recorded." /> : <div className="tc-table-scroll"><table className="sa-table tc-table-mid">
          <thead><tr><th>Module</th><th>Practical</th><th>Decision accuracy</th><th>Timing</th><th>Review</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}>
            <td>{store.moduleOf(row.moduleId)}</td>
            <td className={row.practical < settings.practicalPass ? "sa-below" : ""}>{row.practical}%</td>
            <td>{row.accuracy}%</td>
            <td className="sa-dim">{row.quality === "Complete" ? `${row.reaction.toFixed(1)}s active` : "Unavailable"}</td>
            <td><Pill>{row.review}</Pill></td>
          </tr>)}</tbody>
        </table></div>}
        <h3 className="sa-sub">Latest decision sequence</h3>
        <ol className="sa-timeline">{SIM_TIMELINE.slice(0, 3).map(step => <li key={step.at} className={step.correct ? "" : "is-miss"}>
          <span>{step.at.toFixed(1)}s</span><strong>{step.prompt}</strong><small>Chose: {step.chose}</small>
        </li>)}</ol>
      </Panel>
    </div>

    <div className="tc-grid-2">
      <Panel title="Published feedback" icon="edit" note="Parents and this learner see published results only.">
        {rows.filter(row => row.review === "Published" || row.review === "Revised").length === 0
          ? <Empty text="Nothing has been published to this learner yet." />
          : <ul className="sa-list">{rows.filter(row => row.review === "Published" || row.review === "Revised").map(row => <li key={row.id}>
            <div><strong>{store.moduleOf(row.moduleId)}</strong><small>{row.feedback ?? "Keep practising the steps you reviewed in class."}</small></div>
            <b>{row.grade ?? row.practical}%</b>
          </li>)}</ul>}
        <Note>Do not enter names, family situations, medical details, or disciplinary allegations in feedback. Keep comments on the learning activity.</Note>
      </Panel>

      <Panel title="Rewards, guardians, and record actions" icon="person" note="Guardian links shown are the ones relevant to this section.">
        <ul className="sa-list">
          <li><div><strong>Earned rewards</strong><small>{student.completed * 60} XP · level {Math.floor((student.completed * 60) / 100) + 1} · {Math.max(0, student.completed - 1)} mastery badges</small></div></li>
          {guardian.length === 0 ? <li><div><strong>Guardian links</strong><small>No verified guardian relationship for this token.</small></div></li>
            : guardian.map(link => <li key={link.id}><div><strong>{store.nameOf(link.parentId)}</strong><small>Guardian link · verified by {link.verifiedBy || "pending"}</small></div><Pill>{link.status}</Pill></li>)}
        </ul>
        <div className="sa-action-row">
          <button type="button" className="sa-ghost" onClick={() => { setUsers(current => current.map(row => (row.id === student.id ? { ...row, status: row.status === "Active" ? "Pending" : "Active" } : row))); log("Participation updated", `${student.name} marked ${student.status === "Active" ? "inactive" : "active"}`); say("Participation state updated. Assessment history is preserved."); }}>Mark {student.status === "Active" ? "inactive" : "active"}</button>
          <button type="button" className="sa-ghost" onClick={() => setTransfer(true)}>Request transfer</button>
        </div>
      </Panel>
    </div>

    {transfer && <Modal title="Request a transfer" note={`${student.name} · currently in ${store.sectionOf(student.section)}`} onClose={() => setTransfer(false)}>
      <p className="sa-note">A transfer is coordinated by a Super Admin. You request it; the administrator verifies the target section and teacher, ends the old membership, and begins the new one. Assessment history stays versioned and guardian relationships are re-reviewed.</p>
      <Field label="Reason for the request"><textarea rows={3} placeholder="Keep this to the administrative reason. No family or medical detail." /></Field>
      <button type="button" className="sa-primary" onClick={() => { log("Transfer requested", `${student.name} · transfer requested by ${scope.teacherName}`); say("Transfer request sent to the administrator. Nothing changes until it is verified."); setTransfer(false); }}>Send request<Icon name="arrow" /></button>
    </Modal>}
  </div>;
}
