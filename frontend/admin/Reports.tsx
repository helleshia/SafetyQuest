import { useState } from "react";
import Icon from "../shared/Icon";
import { csvDownload } from "../shared/demo";
import { useData } from "../shared/store";
import { Note, Panel, Select, Toolbar } from "../shared/ui";
import "./reports.css";
import { attemptScore } from "../../shared/scoring";

type Report = {
  id: string;
  title: string;
  detail: string;
  icon: string;
  columns: string[];
  restricted?: boolean;
  /** Whether the Scope filter actually narrows this report's rows. */
  scoped: boolean;
};

const OPERATIONAL: Report[] = [
  { id: "summary", title: "Deployment summary", detail: "Headline counts for the whole deployment: accounts, sections, consent coverage, and published modules.", icon: "overview", columns: ["Metric", "Value"], scoped: false },
  { id: "adults", title: "Adult account inventory", detail: "Every teacher, parent, and administrator with account state and what each one is associated with.", icon: "users", columns: ["Name", "Email", "Role", "Account status", "Associations"], scoped: false },
  { id: "gaps", title: "Module knowledge gaps", detail: "The decisions learners get wrong most often, grouped by the approved answer mappings.", icon: "curriculum", columns: ["Module", "Missed decision", "Share of learners"], scoped: false },
  { id: "pending", title: "Pending review list", detail: "Practice attempts a learner has submitted that the assigned teacher has not reviewed yet.", icon: "assessment", columns: ["Token", "Section", "Module", "Practical score", "Data quality", "Review status"], scoped: true },
];

const RESTRICTED: Report[] = [
  { id: "progress", title: "Token-based student progress", detail: "Per-token module completion and scores. Carries no names, emails, or other identity fields.", icon: "graduation", columns: ["Token", "Section", "Participation", "Consent", "Assent", "Modules completed", "Average score"], restricted: true, scoped: true },
  { id: "research", title: "Research export", detail: "Attempt-level records within the approved study scope, including timing context. Generation is audited.", icon: "reports", columns: ["Token", "Section", "Module", "Practical", "Decision accuracy", "Reaction context", "Data quality", "Review status"], restricted: true, scoped: true },
];

export default function Reports() {
  const store = useData();
  const { users, sections, modules, assessments, settings, refreshed, log, say } = store;
  const [scope, setScope] = useState("All sections");
  const [period, setPeriod] = useState("Current term");
  const [last, setLast] = useState("");

  const inScope = (sectionId: string) => scope === "All sections" || store.sectionOf(sectionId) === scope;

  function header(title: string, columns: string[]) {
    return [
      [`SafetyQuest report: ${title}`],
      [`Reporting period: ${period} (${settings.term})`],
      [`Scope filter: ${scope}`],
      [`Generated: ${refreshed}`],
      [`Content and scoring versions: ${modules.length} recorded modules · the lesson is a prerequisite, not a score · practical pass mark ${settings.practicalPass}%`],
      [`Completeness: ${users.filter(user => user.role === "Student" && user.status !== "Active").length} token not yet enrolled; ${assessments.filter(row => row.quality === "Interrupted").length} interrupted attempts excluded from timing summaries`],
      [],
      columns,
    ];
  }

  // One builder per report so the card can show the row count before anyone downloads it.
  function body(report: Report): (string | number)[][] {
    if (report.id === "summary") {
      return [
        ["Active teachers", users.filter(user => user.role === "Teacher" && user.status === "Active").length],
        ["Active parents", users.filter(user => user.role === "Parent" && user.status === "Active").length],
        ["Student tokens", users.filter(user => user.role === "Student").length],
        ["Sections", sections.length],
        ["Consent verified", users.filter(user => user.role === "Student" && user.consent).length],
        ["Assent recorded", users.filter(user => user.role === "Student" && user.assent).length],
        ["Published modules", modules.filter(item => item.status === "Published").length],
      ];
    }
    if (report.id === "adults") {
      return users.filter(user => user.role !== "Student").map(user => [user.name, user.email, user.role, user.status,
        user.role === "Teacher" ? `${sections.filter(section => section.teacherId === user.id).length} sections`
          : user.role === "Parent" ? `${store.links.filter(link => link.parentId === user.id && link.status === "Active").length} active links`
          : "Deployment administration"]);
    }
    if (report.id === "progress") {
      return users.filter(user => user.role === "Student" && inScope(user.section))
        .map(student => [student.name, store.sectionOf(student.section), student.status, student.consent ? "Verified" : "Not verified", student.assent ? "Given" : "Not given", `${student.completed}/${modules.length}`, `${student.score}%`]);
    }
    if (report.id === "gaps") {
      return [];
    }
    if (report.id === "pending") {
      return assessments.filter(row => row.review === "Awaiting review" && inScope(row.sectionId))
        .map(row => [store.nameOf(row.studentId), store.sectionOf(row.sectionId), modules.find(item => item.id === row.moduleId)?.name ?? "", `${attemptScore(row)}%`, row.quality, row.review]);
    }
    return assessments.filter(row => inScope(row.sectionId))
      .map(row => [store.nameOf(row.studentId), store.sectionOf(row.sectionId), modules.find(item => item.id === row.moduleId)?.name ?? "", `${attemptScore(row)}%`, `${row.accuracy}%`, row.quality === "Complete" ? `${row.reaction.toFixed(1)}s` : "Unavailable", row.quality, row.review]);
  }

  function generate(report: Report) {
    const stamp = new Date().toISOString().slice(0, 10);
    csvDownload(`safetyquest-${report.id}-${stamp}.csv`, [...header(report.title, report.columns), ...body(report)]);
    log("Report generated", `${report.title} · scope ${scope} · ${period}${report.restricted ? " · restricted export" : ""}`);
    say(`${report.title} downloaded as CSV.`);
    setLast(report.title);
  }

  function card(report: Report) {
    const rows = body(report).length;
    return <article key={report.id} className={`reports-card ${report.restricted ? "is-restricted" : ""}`}>
      <header>
        <span className="reports-card-icon"><Icon name={report.icon} /></span>
        <div><h3>{report.title}</h3>{report.restricted && <span className="sa-restricted">Restricted · audited</span>}</div>
      </header>
      <p>{report.detail}</p>
      <dl className="reports-card-facts">
        <div><dt>Rows</dt><dd>{rows}</dd></div>
        <div><dt>Columns</dt><dd>{report.columns.length}</dd></div>
        <div><dt>Scope filter</dt><dd className={report.scoped ? "" : "reports-fact-muted"}>{report.scoped ? (scope === "All sections" ? "Applies · not narrowed" : `Narrowed to ${scope}`) : "Whole deployment"}</dd></div>
      </dl>
      <details className="reports-columns">
        <summary>What each row contains<Icon name="down" /></summary>
        <ul>{report.columns.map(column => <li key={column}>{column}</li>)}</ul>
      </details>
      <button type="button" className={report.restricted ? "sa-ghost" : "sa-primary"} onClick={() => generate(report)} disabled={rows === 0}>
        <Icon name="download" />{rows === 0 ? "Nothing to export" : `Generate CSV · ${rows} rows`}
      </button>
    </article>;
  }

  return <>
    <Toolbar>
      <div><h2 className="sa-toolbar-title">Reports</h2><p className="sa-toolbar-note">Download a snapshot of the deployment as a spreadsheet. Every file carries its filters, period, timestamp, content versions, and completeness notes in the first rows.</p></div>
      <div className="sa-toolbar-right">
        <Select label="Period" value={period} options={["Current term"]} onChange={setPeriod} />
        <Select label="Scope" value={scope} options={["All sections", ...sections.map(section => section.name)]} onChange={setScope} />
      </div>
    </Toolbar>

    <div className="reports-filter-bar">
      <p><span>Scope</span>{scope === "All sections" ? "Every section in the deployment." : `Only ${scope}. Reports marked “Whole deployment” ignore this.`}</p>
      <p><span>Period</span>All recorded workspace data. Date filtering is not available until attempt timestamps are collected.</p>
    </div>

    <section className="reports-group" aria-labelledby="reports-operational">
      <h3 id="reports-operational" className="reports-group-title">Operational reports<small>Day-to-day running of the deployment</small></h3>
      <div className="reports-grid">{OPERATIONAL.map(card)}</div>
    </section>

    <section className="reports-group" aria-labelledby="reports-restricted">
      <h3 id="reports-restricted" className="reports-group-title">Restricted exports<small>Learner-level data · generation is written to the audit log</small></h3>
      <div className="reports-grid">{RESTRICTED.map(card)}</div>
    </section>

    {last && <Note>Last generated in this session: {last}. Detailed student exports are recorded in the audit log with the acting administrator and the applied filters.</Note>}

    <Panel title="Export safeguards" icon="consent" note="Applied to every generated file, whether or not it is marked restricted." wide>
      <ul className="reports-safeguards">
        <li><span><Icon name="check" /></span><div><strong>Formula-safe encoding</strong><small>Cells beginning with =, +, - or @ are prefixed so user text cannot execute in a spreadsheet.</small></div></li>
        <li><span><Icon name="check" /></span><div><strong>Scope enforcement</strong><small>Exports use the same record permissions as normal reads. Hiding a filter never widens the scope.</small></div></li>
        <li><span><Icon name="check" /></span><div><strong>No identity fields</strong><small>Student rows carry randomized tokens only. Student names are excluded from these exports.</small></div></li>
        <li><span><Icon name="check" /></span><div><strong>Managed copies</strong><small>Export activity is logged. Files downloaded to another device must be managed by their holder.</small></div></li>
      </ul>
    </Panel>
  </>;
}
