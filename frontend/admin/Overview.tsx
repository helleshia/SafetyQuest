import { useState } from "react";
import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Bar, Empty, Panel, Pill } from "../shared/ui";
import { averageScore, officialResultsFor } from "../../shared/scoring";
import "./overview.css";

const SHORTCUTS = [
  { label: "Academic Year", icon: "calendar", note: "Grade levels, sections, and student accounts" },
  { label: "Users", icon: "users", note: "Accounts, roles, and pending approvals" },
  { label: "Reports", icon: "reports", note: "Scope-bound exports with completeness notes" },
];

// Audit entries are free text, so the timeline picks its icon from the action wording.
function auditIcon(action: string) {
  if (/content|curriculum|module|version/i.test(action)) return "curriculum";
  if (/guardian|parent link|consent/i.test(action)) return "consent";
  if (/section|assign/i.test(action)) return "sections";
  if (/report|export/i.test(action)) return "reports";
  if (/teacher|account|approval|invitation|recovery|session/i.test(action)) return "person";
  return "audit";
}

function Meter({ value, tint, below }: { value: number | null; tint: string; below?: boolean }) {
  if (value === null) return <span className="overview-meter is-empty">Not recorded</span>;
  return <span className="overview-meter">
    <b className={below ? "sa-below" : ""}>{value}%</b>
    <span className="overview-meter-track"><i className={`tint-${tint}`} style={{ width: `${value}%` }} /></span>
  </span>;
}

export default function Overview({ go }: { go: (page: string) => void }) {
  const { users, sections, modules, links, audit, assessments, settings, refreshed, refresh, nameOf } = useData();
  const [view, setView] = useState("Summary");
  const [group, setGroup] = useState("Grade");
  const by = (role: string, status?: string) => users.filter(user => user.role === role && (!status || user.status === status));
  const students = by("Student");
  const active = students.filter(student => student.status === "Active");
  const pendingTeachers = by("Teacher", "Pending");
  const pendingLinks = links.filter(link => link.status === "Pending");
  const awaiting = assessments.filter(row => row.review === "Awaiting review");
  const interrupted = assessments.filter(row => row.quality === "Interrupted");
  const submitted = modules.filter(module => module.status === "In review");
  const completed = active.reduce((sum, student) => sum + student.completed, 0);
  const capacity = active.length * modules.length;
  const gradeRows = [...new Set(sections.map(section => section.grade))].sort((a, b) => Number(a) - Number(b)).map(grade => {
    const cohort = active.filter(student => sections.some(section => section.grade === grade && section.id === student.section));
    return { id: grade, label: `Grade ${grade}`, done: cohort.reduce((sum, student) => sum + student.completed, 0), total: cohort.length * modules.length };
  });
  const sectionRows = sections.map(section => {
    const cohort = active.filter(student => student.section === section.id);
    return {
      id: section.id,
      label: section.name,
      teacher: section.teacherId ? nameOf(section.teacherId) : "No teacher assigned",
      students: cohort.length,
      done: cohort.reduce((sum, student) => sum + student.completed, 0),
      total: cohort.length * modules.length,
    };
  });
  const tasks = [
    { label: "Teacher approvals", note: "Review pending accounts", count: pendingTeachers.length, icon: "person", page: "Users" },
    { label: "Parent links", note: "Assigned teachers verify offline", count: pendingLinks.length, icon: "consent", page: "Consent & Parent Links" },
    { label: "Curriculum reviews", note: "Open the module library inside Academic Year", count: submitted.length, icon: "curriculum", page: "Academic Year" },
    { label: "Assessment reviews", note: "Teacher queue · read-only oversight", count: awaiting.length, icon: "assessment", page: "Assessment Overview" },
  ];

  return <div className="overview-workspace">
    <div className="overview-context"><button type="button" className="sa-ghost" onClick={refresh}><Icon name="restore" />Refresh</button></div>
    <section className="overview-summary" aria-label="School summary">
      <button type="button" onClick={() => go("Academic Year")}><span className="overview-clay-icon lavender"><Icon name="users" /></span><span><small>Students</small><strong>{students.length}</strong><em>{active.length} active accounts</em></span><Icon name="chevron" /></button>
      <button type="button" onClick={() => go("Users")}><span className="overview-clay-icon sage"><Icon name="person" /></span><span><small>Teachers & parents</small><strong>{by("Teacher", "Active").length}<i> / {by("Parent", "Active").length}</i></strong><em>Active teachers / active parents</em></span><Icon name="chevron" /></button>
      <button type="button" onClick={() => go("Academic Year")}><span className="overview-clay-icon peach"><Icon name="sections" /></span><span><small>Sections</small><strong>{sections.length}</strong><em>{sections.filter(section => section.enrollment && !section.archived).length} open for enrollment</em></span><Icon name="chevron" /></button>
    </section>
    <nav className="overview-views" aria-label="Overview views">{["Summary", "Learning", "Activity"].map(label => <button type="button" key={label} aria-current={view === label ? "page" : undefined} onClick={() => setView(label)}><Icon name={label === "Summary" ? "overview" : label === "Learning" ? "graduation" : "audit"} />{label}</button>)}</nav>
    <div className="overview-view" key={view}>
      {view === "Summary" && <>
        <div className="overview-main-grid">
          <Panel title="Learning progress" icon="graduation" note={`Completed modules across ${active.length} active students.`} action={<div className="overview-segment" role="group" aria-label="Group learning progress">{["Grade", "Section"].map(label => <button type="button" key={label} aria-pressed={group === label} onClick={() => setGroup(label)}>{label}</button>)}</div>}>
            <div className="overview-completion"><strong>{capacity ? Math.round(completed / capacity * 100) : 0}%</strong><span>Overall completion<small>{completed} of {capacity} modules completed</small></span></div>
            {!(group === "Grade" ? gradeRows : sectionRows).length ? <Empty text="No learning groups yet. Add grade levels and sections inside Academic Year." /> : <div className="overview-progress-list overview-scroll">{(group === "Grade" ? gradeRows : sectionRows).map(row => <Bar key={row.id} label={row.label} value={row.done} total={row.total} tint="mint" />)}</div>}
            <button type="button" className="overview-text-link" onClick={() => go("Reports")}>View learning reports<Icon name="arrow" /></button>
          </Panel>
          <Panel title="Needs attention" icon="bell" note="Choose an item to open its workspace."><ul className="overview-tasks">{tasks.map(task => <li key={task.label}><button type="button" onClick={() => go(task.page)}><Icon name={task.icon} /><span><strong>{task.label}</strong><small>{task.note}</small></span><b className={task.count ? "has-items" : ""}>{task.count}</b><Icon name="chevron" /></button></li>)}</ul></Panel>
        </div>
        <nav className="overview-shortcuts" aria-label="Quick navigation">
          <p><span>Quick access</span>Jump straight into the modules you open most often.</p>
          <div>{SHORTCUTS.map(item => <button type="button" key={item.label} onClick={() => go(item.label)}>
            <span className="overview-shortcut-icon"><Icon name={item.icon} /></span>
            <span><strong>{item.label}</strong><small>{item.note}</small></span>
            <Icon name="arrow" />
          </button>)}</div>
        </nav>
      </>}
      {view === "Learning" && <>
        <Panel title="Section performance" icon="assessment" note={`Learners work through the lesson before the practical, so only the practical carries a score. Pass mark ${settings.practicalPass}%.`} action={<button type="button" className="sa-ghost" onClick={() => go("Assessment Overview")}>Open assessments<Icon name="arrow" /></button>}>
          {!sectionRows.length ? <Empty text="No sections yet." /> : <div className="overview-table-scroll overview-scroll"><table className="sa-table overview-performance-table"><thead><tr><th>Section</th><th>Students</th><th>Completion</th><th>Practice average</th></tr></thead><tbody>{sectionRows.map(row => {
            const records = officialResultsFor(assessments.filter(record => record.sectionId === row.id));
            const practice = averageScore(records);
            return <tr key={row.id}>
              <td><strong>{row.label}</strong><small className="sa-cell-sub">{row.teacher}</small></td>
              <td className="overview-count-cell">{row.students}</td>
              <td><Meter value={row.total ? Math.round(row.done / row.total * 100) : null} tint="mint" /></td>
              <td><Meter value={practice} tint="lilac" below={practice !== null && practice < settings.practicalPass} /></td>
            </tr>;
          })}</tbody></table></div>}
          <p className="sa-footnote">A coral practice average sits below the pass mark.</p>
        </Panel>
        <details className="overview-disclosure"><summary>Common incorrect decisions<Icon name="down" /></summary><Empty text="Decision-level analytics are not available yet." /></details>
      </>}
      {view === "Activity" && <>
        <Panel title="Recent administrative activity" icon="audit" note="Latest account, classroom, and curriculum changes." action={<button type="button" className="sa-ghost" onClick={() => go("Audit & Data Lifecycle")}>Full audit<Icon name="arrow" /></button>}>
          {!audit.length ? <Empty text="No administrative activity recorded yet." /> : <ul className="overview-activity-list">{audit.slice(0, 6).map(entry => {
            const [day, clock] = entry.time.split(" · ");
            return <li key={entry.id}>
              <span className="overview-activity-mark"><Icon name={auditIcon(entry.action)} /></span>
              <div><strong>{entry.action}</strong><p>{entry.detail}</p></div>
              <span className="overview-activity-time"><b>{clock ?? entry.time}</b>{clock ? day : ""}</span>
            </li>;
          })}</ul>}
        </Panel>
        <details className="overview-disclosure"><summary>Operational status<Icon name="down" /></summary><p className="sa-footnote">School workspace is connected. Email and mobile delivery services are not configured.</p></details>
      </>}
    </div>
    <details className="overview-disclosure overview-reporting"><summary>Reporting details <span>Consent, participation & data notes</span><Icon name="down" /></summary><dl className="overview-reporting-fields">
      <div><dt>Consent verified</dt><dd>{students.filter(student => student.consent).length}/{students.length} · Physical forms confirmed offline</dd></div>
      <div><dt>Child assent</dt><dd>{students.filter(student => student.assent).length}/{students.length} · Recorded in the mobile app</dd></div>
      <div><dt>Participants</dt><dd>{active.length} of {students.length} active student accounts · {students.length - active.length} inactive accounts excluded</dd></div>
      <div><dt>Data quality</dt><dd>{interrupted.length} interrupted assessment attempts · Averages include recorded attempts; no results display as —</dd></div>
      <div><dt>Last refreshed</dt><dd>{refreshed}</dd></div>
    </dl><p className="sa-footnote">Activity describes learning in the reporting period, not whether a student is currently online or physically safe.</p></details>
  </div>;
}
