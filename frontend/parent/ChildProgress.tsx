import { useState } from "react";
import Icon from "../shared/Icon";
import { practicalSummary, type AssessmentRow } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Note, Panel, Pill } from "../shared/ui";
import { ChildIdentity, useParent } from "./ParentApp";
import { moduleProgress, passMarkOf, publishedResults } from "./progress";
import { attemptScore, averageScore } from "../../shared/scoring";

const TABS = ["Lessons", "Practical / Simulation", "Assessment Results"] as const;
type Tab = typeof TABS[number];

export default function ChildProgress() {
  const [tab, setTab] = useState<Tab>(TABS[0]);
  const [selectedResult, setSelectedResult] = useState<AssessmentRow | null>(null);
  const { modules, assessments, sections, settings, moduleOf } = useData();
  const scope = useParent();
  const passMark = passMarkOf(sections, scope.child, settings.practicalPass);
  const rows = moduleProgress(modules, assessments, scope.child);
  const results = publishedResults(assessments, scope.child.id);
  const completed = rows.filter(row => row.lesson === "Complete").length;
  const inProgress = rows.filter(row => row.lesson === "In progress").length;
  const notStarted = rows.filter(row => row.lesson === "Not started").length;
  const passed = results.filter(row => attemptScore(row) >= passMark).length;
  const average = averageScore(results);
  const reaction = results.length ? (results.reduce((sum, row) => sum + row.reaction, 0) / results.length).toFixed(1) : "—";

  if (selectedResult) return <ResultDetail row={selectedResult} passMark={passMark} title={moduleOf(selectedResult.moduleId)} onBack={() => setSelectedResult(null)} />;

  return <>
    <ChildIdentity note={`${completed} of ${rows.length} lessons completed`} />
    <div className="sa-tabs parent-progress-tabs" role="tablist" aria-label="Child progress sections">
      {TABS.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item}</button>)}
    </div>

    {tab === "Lessons" && <section className="parent-progress-view">
      <div className="parent-metrics">
        <article className="parent-metric">
          <header><span className="parent-metric-icon tint-sage"><Icon name="check" /></span>Completed</header>
          <b>{completed}</b>
          <span className="parent-metric-track"><i className="fill-sage" style={{ width: `${Math.round(completed / Math.max(rows.length, 1) * 100)}%` }} /></span>
          <small>of {rows.length} published lesson{rows.length === 1 ? "" : "s"}</small>
        </article>
        <article className="parent-metric">
          <header><span className="parent-metric-icon tint-sky"><Icon name="curriculum" /></span>In progress</header>
          <b>{inProgress}</b>
          <span className="parent-metric-track"><i className="fill-sky" style={{ width: `${Math.round(inProgress / Math.max(rows.length, 1) * 100)}%` }} /></span>
          <small>Started but not finished yet</small>
        </article>
        <article className="parent-metric">
          <header><span className="parent-metric-icon tint-peach"><Icon name="clock" /></span>Not started</header>
          <b>{notStarted}</b>
          <span className="parent-metric-track"><i className="fill-peach" style={{ width: `${Math.round(notStarted / Math.max(rows.length, 1) * 100)}%` }} /></span>
          <small>Still ahead of {scope.label.split(" ")[0]}</small>
        </article>
      </div>
      <Panel title="Lessons" note="Published curriculum in order." wide>
        <table className="sa-table">
          <thead><tr><th>Lesson</th><th>Topic</th><th>Status</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.moduleId} className={row.lesson === "Not started" ? "sa-row-muted" : ""}>
            <td><strong>{row.name}</strong></td>
            <td className="sa-dim">{row.domain}</td>
            <td><Pill>{row.lesson === "Complete" ? "Complete" : row.lesson === "In progress" ? "In progress" : "Not started"}</Pill></td>
          </tr>)}</tbody>
        </table>
      </Panel>
    </section>}

    {tab === "Practical / Simulation" && <section className="parent-progress-view">
      <div className="parent-metrics parent-metrics-4">
        <article className="parent-metric">
          <header><span className="parent-metric-icon tint-sage"><Icon name="assessment" /></span>Completed practicals</header>
          <b>{results.length}</b>
          <small>Published by the teacher</small>
        </article>
        <article className="parent-metric">
          <header><span className="parent-metric-icon tint-sky"><Icon name="graduation" /></span>Average score</header>
          <b>{average === null ? "—" : `${average}%`}</b>
          {average !== null && <span className="parent-metric-track"><i className="fill-sky" style={{ width: `${Math.min(100, Math.max(0, average))}%` }} /></span>}
          <small>Passing score is {passMark}%</small>
        </article>
        <article className="parent-metric">
          <header><span className="parent-metric-icon tint-sage"><Icon name="check" /></span>Passed</header>
          <b>{results.length ? passed : "—"}<i className="parent-metric-sub">{results.length ? ` of ${results.length}` : ""}</i></b>
          {results.length > 0 && <span className="parent-metric-track"><i className="fill-sage" style={{ width: `${Math.round(passed / results.length * 100)}%` }} /></span>}
          <small>{results.length ? `${results.length - passed} still to try again` : "No results yet"}</small>
        </article>
        <article className="parent-metric is-date">
          <header><span className="parent-metric-icon tint-peach"><Icon name="clock" /></span>Reaction time</header>
          <b>{reaction}{reaction === "—" ? "" : "s"}</b>
          <small>Average time to decide, not a grade</small>
        </article>
      </div>
      <Panel title="Practical results" note={`Passing score is ${passMark}%.`} wide>
        {results.length === 0 ? <Empty text="No published practical results yet." /> : <table className="sa-table">
          <thead><tr><th>Practical</th><th>Score</th><th>Result</th><th>Reaction</th></tr></thead>
          <tbody>{results.map(row => <tr key={row.id} className="sa-table-click" tabIndex={0} onClick={() => setSelectedResult(row)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedResult(row); } }}>
            <td><strong>{moduleOf(row.moduleId)}</strong></td>
            <td>{attemptScore(row)}%</td>
            <td><Pill>{attemptScore(row) >= passMark ? "Passed" : "Failed"}</Pill></td>
            <td>{row.reaction.toFixed(1)}s</td>
          </tr>)}</tbody>
        </table>}
      </Panel>
    </section>}

    {tab === "Assessment Results" && <section className="parent-progress-view">
      <Panel title="Assessment results" note="Only results published by the teacher are shown." wide>
        {results.length === 0 ? <Empty text="No published assessment results yet." /> : <div className="parent-results">{results.map(row => <article className="parent-result" key={row.id}>
          <div className="parent-result-heading"><h3>{moduleOf(row.moduleId)}</h3><Pill>{row.review}</Pill></div>
          <p className="parent-plain">{practicalSummary(attemptScore(row), passMark)}</p>
          <dl className="parent-result-scores"><div><dt>Quiz result</dt><dd>{row.accuracy}%</dd></div><div><dt>Practical result</dt><dd>{attemptScore(row)}%</dd></div><div><dt>Passing score</dt><dd>{passMark}%</dd></div></dl>
          <p className="parent-feedback"><Icon name="mail" /><span>{row.feedback || "No written feedback was published."}</span></p>
        </article>)}</div>}
      </Panel>
    </section>}

  </>;
}

/** One published practical, opened in place. Parents see the outcome the teacher
    published — never the answer key or the raw attempt timeline. */
function ResultDetail({ row, passMark, title, onBack }: { row: AssessmentRow; passMark: number; title: string; onBack: () => void }) {
  const passed = attemptScore(row) >= passMark;
  return <>
    <button type="button" className="sa-ghost tc-back" onClick={onBack}>
      <Icon name="arrow" className="tc-back-icon" />Back to practical results
    </button>

    <div className={`parent-result-banner ${passed ? "is-pass" : "is-fail"}`}>
      <span className="parent-result-score"><b>{attemptScore(row)}%</b><small>practical score</small></span>
      <div>
        <strong>{title}</strong>
        <small>{practicalSummary(attemptScore(row), passMark)}</small>
      </div>
      <Pill>{passed ? "Passed" : "Keep practising"}</Pill>
    </div>

    <Panel title="What this result means" icon="assessment" note={`The passing score for this lesson is ${passMark}%.`} wide>
      <dl className="parent-detail-grid">
        <div><dt>Quiz result</dt><dd>{row.accuracy}%</dd></div>
        <div><dt>Practical result</dt><dd>{attemptScore(row)}%</dd></div>
        <div><dt>Passing score</dt><dd>{passMark}%</dd></div>
        <div><dt>Reaction time</dt><dd>{row.reaction.toFixed(1)}s</dd></div>
        <div><dt>Attempt status</dt><dd>{row.quality}</dd></div>
        <div><dt>Published as</dt><dd>{row.review}</dd></div>
      </dl>
      <p className="parent-feedback"><Icon name="mail" /><span>{row.feedback || "No written feedback was published for this result."}</span></p>
      <Note>Reaction time shows how long your child took to decide. It is context for the teacher, not a measure of how ready they are in a real emergency.</Note>
      <p className="sa-footnote">Parents see the published outcome only. Quiz answer keys and the raw attempt timeline are not shown here.</p>
    </Panel>
  </>;
}
