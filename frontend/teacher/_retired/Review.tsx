import { useState } from "react";
import Icon from "../shared/Icon";
import { RUBRIC_CRITERIA, SIM_TIMELINE, type AssessmentRow } from "../shared/demo";
import { Empty, Field, Modal, Note, Panel, Pill, Select } from "../shared/ui";
import { useData } from "../shared/store";
import { Metric, PageHead } from "./TeacherUI";
import { useScope } from "./TeacherApp";

export function SimulationReview() {
  const store = useData();
  const { assessments, setAssessments, settings, log, say } = store;
  const scope = useScope();
  const [filter, setFilter] = useState("Awaiting review");
  const [open, setOpen] = useState<AssessmentRow | null>(null);

  const all = assessments.filter(row => row.sectionId === scope.sectionId);
  const rows = all.filter(row => filter === "All attempts" || row.review === filter);
  const waiting = all.filter(row => row.review === "Awaiting review");
  const interrupted = all.filter(row => row.quality === "Interrupted");
  const published = all.filter(row => row.review === "Published");
  const average = all.length ? Math.round(all.reduce((sum, row) => sum + row.practical, 0) / all.length) : 0;

  return <div className="tc-page">
    <PageHead icon="clock" eyebrow="Simulation review" title={store.sectionOf(scope.sectionId)}
      actions={<Select label="Queue" value={filter} options={["Awaiting review", "Reviewed draft", "Published", "Revised", "All attempts"]} onChange={setFilter} />}>
      The event log is immutable. You add the rubric grade and the feedback; you never edit a raw answer or a recorded event.
    </PageHead>

    <div className="tc-metrics tc-metrics-4">
      <Metric icon="bell" tint="coral" label="Awaiting your review" value={waiting.length} flag={waiting.length > 0}>
        Pending review is not a failing grade. Nothing reaches the learner until you publish it.
      </Metric>
      <Metric icon="clock" tint="yellow" label="Interrupted attempts" value={interrupted.length}>
        Flag these rather than scoring the timing. The interrupted interval is excluded from summaries.
      </Metric>
      <Metric icon="check" tint="mint" label="Published reviews" value={published.length}>
        Visible to the learner and to any linked parents.
      </Metric>
      <Metric icon="assessment" tint="blue" label="Average practical" value={`${average}%`}>
        Across {all.length} attempt{all.length === 1 ? "" : "s"} at the {settings.practicalPass}% pass mark.
      </Metric>
    </div>

    <Panel title="Review queue" icon="clock" note="Automatic result, reaction-time measures, and data quality for each submitted attempt." wide>
      {rows.length === 0 ? <Empty text="Nothing in this queue right now." /> : <div className="tc-table-scroll"><table className="sa-table sa-table-click tc-table-wide">
        <thead><tr><th>Token</th><th>Module / scenario</th><th>Completed</th><th>Automatic result</th><th>Decision accuracy</th><th>Reaction context</th><th>Data quality</th><th>Review</th><th /></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} onClick={() => setOpen(row)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") setOpen(row); }}>
          <td className="sa-mono">{store.nameOf(row.studentId)}</td>
          <td>{store.moduleOf(row.moduleId)} <span className="sa-dim">v{store.modules.find(module => module.id === row.moduleId)?.version}</span></td>
          <td className="sa-dim">Sep 16, 2026</td>
          <td className={row.practical < settings.practicalPass ? "sa-below" : ""}>{row.practical}%</td>
          <td>{row.accuracy}%</td>
          <td className="sa-dim">{row.quality === "Complete" ? `${row.reaction.toFixed(1)}s active` : "Unavailable"}</td>
          <td><Pill>{row.quality}</Pill></td>
          <td><Pill>{row.review}</Pill></td>
          <td className="sa-row-arrow"><Icon name="chevron" /></td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    {open && <AttemptDetail row={open} onClose={() => setOpen(null)} onSave={(patch, message, action) => {
      setAssessments(current => current.map(item => (item.id === open.id ? { ...item, ...patch } : item)));
      log(action, `${store.nameOf(open.studentId)} · ${store.moduleOf(open.moduleId)} · ${message}`);
      say(message);
      setOpen(null);
    }} />}
  </div>;
}

function AttemptDetail({ row, onClose, onSave }: { row: AssessmentRow; onClose: () => void; onSave: (patch: Partial<AssessmentRow>, message: string, action: string) => void }) {
  const store = useData();
  const { settings } = store;
  const [grade, setGrade] = useState(row.grade ?? row.practical);
  const [feedback, setFeedback] = useState(row.feedback ?? "");
  const earned = RUBRIC_CRITERIA.filter((_, index) => SIM_TIMELINE[index]?.correct !== false);

  return <Modal title={`${store.nameOf(row.studentId)} · ${store.moduleOf(row.moduleId)}`} note={`Completed Sep 16, 2026 · automatic practical ${row.practical}% · data quality ${row.quality.toLowerCase()}`} onClose={onClose}>
    <h3 className="sa-sub">Scenario timeline</h3>
    <ol className="sa-timeline">
      {SIM_TIMELINE.map(step => <li key={step.at} className={step.correct ? "" : "is-miss"}>
        <span>{step.at.toFixed(1)}s</span>
        <strong>{step.prompt}</strong>
        <small>Chose: {step.chose}</small>
        {!step.correct && <em>Expected: {step.expected}</em>}
      </li>)}
    </ol>
    {row.quality === "Interrupted" && <Note>This attempt was backgrounded mid-scenario. The interrupted interval is marked unavailable rather than scored as zero, and it is excluded from reaction-time summaries.</Note>}

    <h3 className="sa-sub">Rubric criteria</h3>
    <ul className="sa-list">
      {RUBRIC_CRITERIA.map(criterion => <li key={criterion.id}>
        <div><strong>{criterion.label}</strong><small>Weight {criterion.weight}%</small></div>
        <Pill>{earned.includes(criterion) ? "Complete" : "Pending"}</Pill>
      </li>)}
    </ul>

    <h3 className="sa-sub">Your review</h3>
    <div className="sa-form-pair">
      <Field label={`Rubric grade (%) · pass mark ${settings.practicalPass}`}><input type="number" min={0} max={100} value={grade} onChange={event => setGrade(Number(event.target.value))} /></Field>
      <Field label="Automatic score (read only)" hint="You do not edit raw answers or events."><input value={`${row.practical}%`} readOnly /></Field>
    </div>
    <Field label="Age-appropriate feedback" hint="Keep it to the learning activity. No names, family situations, medical details, or allegations.">
      <textarea rows={3} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="You waited for cover well. Next time, wait for the signal before leaving the room." />
    </Field>

    <div className="sa-action-row">
      <button type="button" className="sa-ghost" onClick={() => onSave({ grade, feedback, review: "Reviewed draft" }, "Saved as a reviewed draft. The learner cannot see it yet.", "Review drafted")}>Save draft</button>
      <button type="button" className="sa-primary" disabled={!feedback.trim()} onClick={() => onSave({ grade, feedback, review: "Published" }, "Review published to the learner and any linked parents.", "Review published")}><Icon name="check" />Publish review</button>
      <button type="button" className="sa-ghost" onClick={() => onSave({ quality: "Interrupted" }, "Attempt flagged as interrupted. Its timing is excluded from summaries.", "Attempt flagged")}>Flag interruption</button>
      <button type="button" className="sa-ghost" onClick={() => onSave({ review: "Awaiting review" }, "Retake requested. The previous attempt stays in the record.", "Retake requested")}>Request retake</button>
    </div>
    <Note>Reaction time is contextual evidence against a versioned rubric. It is not the sole grade and not a measure of real emergency readiness.</Note>
  </Modal>;
}

const STATES = ["Awaiting review", "Reviewed draft", "Published", "Revised"];

export function GradesFeedback() {
  const store = useData();
  const { assessments, setAssessments, log, say } = store;
  const scope = useScope();
  const [state, setState] = useState("All states");
  const [revising, setRevising] = useState<AssessmentRow | null>(null);

  const all = assessments.filter(row => row.sectionId === scope.sectionId);
  const rows = all.filter(row => state === "All states" || row.review === state);

  return <div className="tc-page">
    <PageHead icon="edit" eyebrow="Grades & feedback" title={store.sectionOf(scope.sectionId)}
      actions={<Select label="State" value={state} options={["All states", ...STATES]} onChange={setState} />}>
      Automatic scores, teacher grades, and published feedback stay separate records. A revised grade always keeps its previous value.
    </PageHead>

    <div className="tc-flow">
      {STATES.map((label, index) => {
        const count = all.filter(row => row.review === label).length;
        return <div key={label} className={`tc-flow-step ${count ? "is-live" : ""}`}>
          <b>{count}</b><span>{label}</span>
          {index < STATES.length - 1 && <Icon name="chevron" className="tc-flow-arrow" />}
        </div>;
      })}
      <p>Parents and learners see published results only. Everything to the left of Published is yours alone.</p>
    </div>

    <Panel title="Grade records" icon="assessment" note="The module result is the practical score, or the teacher grade once entered. The lesson is a prerequisite for attempting the practical, not a scored component." wide>
      {rows.length === 0 ? <Empty text="No grade records in this state." /> : <div className="tc-table-scroll"><table className="sa-table tc-table-mid">
        <thead><tr><th>Token</th><th>Module</th><th>Automatic practical</th><th>Teacher grade</th><th>Module result</th><th>State</th><th /></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
          <td className="sa-mono">{store.nameOf(row.studentId)}</td>
          <td>{store.moduleOf(row.moduleId)}</td>
          <td>{row.practical}%</td>
          <td>{row.grade === undefined ? <span className="sa-dim">Not entered</span> : <strong>{row.grade}%</strong>}</td>
          <td><strong>{row.grade ?? row.practical}%</strong></td>
          <td><Pill>{row.review}</Pill></td>
          <td className="sa-cell-actions">
            {(row.review === "Published" || row.review === "Revised") && <button type="button" className="sa-ghost" onClick={() => setRevising(row)}><Icon name="edit" />Revise</button>}
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="Revision history" icon="audit" note="Every revision keeps the previous value, the new value, the reason, the author, and the time." wide>
      {all.every(row => !row.revisions?.length) ? <Empty text="No grades have been revised in this section." /> : <div className="tc-table-scroll"><table className="sa-table tc-table-mid">
        <thead><tr><th>Token</th><th>Module</th><th>Previous</th><th>New</th><th>Reason</th><th>Author</th><th>Time</th></tr></thead>
        <tbody>{all.flatMap(row => (row.revisions ?? []).map((revision, index) => <tr key={`${row.id}-${index}`}>
          <td className="sa-mono">{store.nameOf(row.studentId)}</td>
          <td>{store.moduleOf(row.moduleId)}</td>
          <td>{revision.from}%</td>
          <td><strong>{revision.to}%</strong></td>
          <td>{revision.reason}</td>
          <td className="sa-dim">{revision.author}</td>
          <td className="sa-dim">{revision.at}</td>
        </tr>))}</tbody>
      </table></div>}
      <Note>Teachers do not edit raw attempt answers, award unsupported simulation results, or grant arbitrary XP. Corrections follow this workflow and retain history.</Note>
    </Panel>

    {revising && <Modal title="Revise a published grade" note={`${store.nameOf(revising.studentId)} · ${store.moduleOf(revising.moduleId)} · current grade ${revising.grade ?? revising.practical}%`} onClose={() => setRevising(null)}>
      <form className="sa-form" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const from = revising.grade ?? revising.practical;
        const to = Number(data.get("grade"));
        const reason = String(data.get("reason"));
        setAssessments(current => current.map(item => (item.id === revising.id ? {
          ...item, grade: to, review: "Revised",
          revisions: [...(item.revisions ?? []), { from, to, reason, author: scope.teacherName, at: "Sep 18, 2026 · 10:24 AM" }],
        } : item)));
        log("Grade revised", `${store.nameOf(revising.studentId)} · ${from}% to ${to}% · ${reason}`);
        say("Grade revised. The previous value is kept in the revision history.");
        setRevising(null);
      }}>
        <Field label="New grade (%)"><input name="grade" type="number" min={0} max={100} defaultValue={revising.grade ?? revising.practical} required /></Field>
        <Field label="Reason for the revision" hint="Shown in the revision history and the audit log."><input name="reason" required placeholder="Rubric criterion re-scored after checking the timeline" /></Field>
        <button type="submit" className="sa-primary">Publish revision<Icon name="arrow" /></button>
      </form>
    </Modal>}
  </div>;
}
