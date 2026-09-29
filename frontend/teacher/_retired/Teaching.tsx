import { useState } from "react";
import Icon from "../shared/Icon";
import { QUESTION_BANK, RUBRIC_CRITERIA, type Assignment, type Module } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Field, Modal, Note, Panel, Pill } from "../shared/ui";
import { Metric, PageHead } from "./TeacherUI";
import { useScope } from "./TeacherApp";

export function Assignments() {
  const store = useData();
  const { modules, assignments, setAssignments, log, say } = store;
  const scope = useScope();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const rows = assignments.filter(item => item.sectionId === scope.sectionId);
  const publishable = modules.filter(module => module.status === "Published");
  const published = rows.filter(item => item.status === "Published");
  const drafts = rows.filter(item => item.status === "Draft");

  function move(item: Assignment, status: Assignment["status"], message: string) {
    setAssignments(current => current.map(row => (row.id === item.id ? { ...row, status } : row)));
    log("Assignment updated", `${store.moduleOf(item.moduleId)} · ${store.sectionOf(item.sectionId)} · ${message}`);
    say(message);
    setEditing(null);
  }

  return <div className="tc-page">
    <PageHead icon="curriculum" eyebrow="Assignments" title={store.sectionOf(scope.sectionId)}
      actions={<button type="button" className="sa-primary" onClick={() => setComposing(true)}><Icon name="plus" />New assignment</button>}>
      Availability is section-scoped. Assigning a module never republishes it for the whole deployment, and changing an assignment does not alter a completed assessment scoring policy.
    </PageHead>

    <div className="tc-metrics">
      <Metric icon="check" tint="mint" label="Published to this section" value={published.length}>
        Learners can open these now, within the opens and due dates you set.
      </Metric>
      <Metric icon="edit" tint="blue" label="Drafts" value={drafts.length}>
        Saved but not visible to anyone. Publish when the section is ready for the topic.
      </Metric>
      <Metric icon="curriculum" tint="lilac" label="Approved versions available" value={publishable.length} sub={`of ${modules.length} modules`}>
        Only approved published versions can be assigned. No second approval is needed per assignment.
      </Metric>
    </div>

    <Panel title="Section assignments" icon="curriculum" note="Open a row to publish, withdraw, or reschedule it." wide>
      {rows.length === 0 ? <Empty text="No assignments for this section yet." /> : <div className="tc-table-scroll"><table className="sa-table sa-table-click tc-table-wide">
        <thead><tr><th>Module</th><th>Version</th><th>Target</th><th>Opens</th><th>Due</th><th>Phases</th><th>Retries</th><th>Simulation</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map(item => <tr key={item.id} onClick={() => setEditing(item)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") setEditing(item); }}>
          <td><strong>{store.moduleOf(item.moduleId)}</strong></td>
          <td className="sa-mono">v{item.version}</td>
          <td>{item.tokens.length === 0 ? "Whole section" : `${item.tokens.length} tokens`}</td>
          <td className="sa-dim">{item.opens}</td>
          <td className="sa-dim">{item.due}</td>
          <td>{item.phases}</td>
          <td>{item.retries}</td>
          <td>{item.simulation ? "Enabled" : "Off"}</td>
          <td><Pill>{item.status === "Withdrawn" ? "Revoked" : item.status === "Published" ? "Published" : "Draft"}</Pill></td>
          <td className="sa-row-arrow"><Icon name="chevron" /></td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="Topic availability" icon="assessment" note="Unlock or hide approved topics for this section. Hidden content stays unavailable even if a learner guesses a module address." wide>
      <ul className="sa-list">
        {modules.slice(0, 6).map(module => {
          const assigned = rows.some(row => row.moduleId === module.id && row.status === "Published");
          return <li key={module.id}>
            <div><strong>{module.id}. {module.name}</strong><small>{module.domain} · v{module.version} · {module.status}</small></div>
            <Pill>{assigned ? "Active" : "Pending"}</Pill>
          </li>;
        })}
      </ul>
    </Panel>

    {editing && <Modal title={store.moduleOf(editing.moduleId)} note={`${store.sectionOf(editing.sectionId)} · v${editing.version} · ${editing.status}`} onClose={() => setEditing(null)}>
      <div className="sa-detail-grid">
        <div><small>Opens</small><strong>{editing.opens}</strong></div>
        <div><small>Due</small><strong>{editing.due}</strong></div>
        <div><small>Phase requirement</small><strong>{editing.phases}</strong></div>
        <div><small>Retry policy</small><strong>{editing.retries} retries</strong></div>
        <div><small>Simulation practice</small><strong>{editing.simulation ? "Enabled" : "Disabled"}</strong></div>
        <div><small>Target</small><strong>{editing.tokens.length === 0 ? "Whole section" : `${editing.tokens.length} selected tokens`}</strong></div>
      </div>
      <div className="sa-action-row">
        {editing.status !== "Published" && <button type="button" className="sa-primary" onClick={() => move(editing, "Published", "Assignment published to the section.")}><Icon name="check" />Publish</button>}
        {editing.status === "Published" && <button type="button" className="sa-ghost sa-danger" onClick={() => move(editing, "Withdrawn", "Assignment withdrawn. Completed attempts keep their results.")}>Withdraw</button>}
        <button type="button" className="sa-ghost" onClick={() => { setAssignments(current => current.map(row => (row.id === editing.id ? { ...row, due: "Oct 12, 2026" } : row))); log("Assignment rescheduled", `${store.moduleOf(editing.moduleId)} · due date moved`); say("Due date moved to Oct 12, 2026."); setEditing(null); }}><Icon name="clock" />Reschedule</button>
      </div>
      <Note>Practical assessments unlock once the required lesson has been worked through. Ungraded practice can repeat; graded assignments use the published retry policy.</Note>
    </Modal>}

    {composing && <Modal title="New assignment" note="Only approved published versions can be assigned. No second approval is needed per assignment." onClose={() => setComposing(false)}>
      <form className="sa-form" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const moduleId = Number(data.get("module"));
        const chosen = modules.find(module => module.id === moduleId);
        setAssignments(current => [...current, {
          id: `asg${Date.now()}`, moduleId, version: chosen?.version ?? 1, sectionId: scope.sectionId, tokens: [],
          opens: String(data.get("opens")), due: String(data.get("due")),
          phases: data.get("phases") as Assignment["phases"],
          retries: Number(data.get("retries")),
          simulation: data.get("simulation") === "on",
          status: data.get("publish") === "on" ? "Published" : "Draft",
        }]);
        log("Assignment created", `${chosen?.name} · ${store.sectionOf(scope.sectionId)}`);
        say("Assignment saved for this section.");
        setComposing(false);
      }}>
        <Field label="Approved module version"><select name="module" required>{publishable.map(module => <option key={module.id} value={module.id}>{module.id}. {module.name} (v{module.version})</option>)}</select></Field>
        <div className="sa-form-pair">
          <Field label="Opens"><input name="opens" type="date" required defaultValue="2026-09-21" /></Field>
          <Field label="Due (optional)"><input name="due" type="date" defaultValue="2026-10-05" /></Field>
        </div>
        <div className="sa-form-pair">
          <Field label="Phase requirement"><select name="phases" defaultValue="Learn and Practice"><option>Learn only</option><option>Learn and Practice</option></select></Field>
          <Field label="Retries allowed"><input name="retries" type="number" min={0} max={5} defaultValue={2} /></Field>
        </div>
        <label className="sa-check"><input type="checkbox" name="simulation" defaultChecked /><span>Enable supervised simulation practice within the approved frequency limit</span></label>
        <label className="sa-check"><input type="checkbox" name="publish" /><span>Publish immediately instead of saving as a draft</span></label>
        <button type="submit" className="sa-primary">Save assignment<Icon name="arrow" /></button>
      </form>
    </Modal>}
  </div>;
}

export function LessonsModules() {
  const store = useData();
  const { modules, setModules, log, say } = store;
  const scope = useScope();
  const [open, setOpen] = useState<Module | null>(null);
  const [preview, setPreview] = useState(false);

  return <div className="tc-page">
    <PageHead icon="curriculum" eyebrow="Lessons & modules" title="Module library">
      Author section supplements within your scope. A change to a baseline safety procedure goes to global review before anyone sees it.
    </PageHead>

    <Panel title="Module library" icon="curriculum" note="Published versions can be assigned. Drafts and unpublished scenarios never reach parents or learners." wide>
      <div className="tc-table-scroll"><table className="sa-table sa-table-click tc-table-mid">
        <thead><tr><th>#</th><th>Module</th><th>Domain</th><th>Version</th><th>Lesson pages</th><th>Narration</th><th>Status</th><th /></tr></thead>
        <tbody>{modules.map(module => <tr key={module.id} onClick={() => setOpen(module)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") setOpen(module); }}>
          <td className="sa-dim">{String(module.id).padStart(2, "0")}</td>
          <td><strong>{module.name}</strong></td>
          <td>{module.domain}</td>
          <td className="sa-mono">v{module.version}</td>
          <td>{module.lessonPages}</td>
          <td>English, Filipino</td>
          <td><Pill>{module.status}</Pill></td>
          <td className="sa-row-arrow"><Icon name="chevron" /></td>
        </tr>)}</tbody>
      </table></div>
    </Panel>

    {open && <Modal title={`${open.name} · v${open.version}`} note={`${open.domain} · ${open.lessonPages} story pages · ${open.scenarios} scenario branches`} onClose={() => { setOpen(null); setPreview(false); }}>
      {preview ? <>
        <div className="sa-child-preview">
          <span className="sa-child-chip">LEARN · PAGE 1 OF {open.lessonPages}</span>
          <h3>{open.name}</h3>
          <div className="sa-child-art" aria-hidden="true"><i /><i /><i /></div>
          <p>A short scene appears here with one idea, a cartoon illustration, and optional narration with captions.</p>
          <div className="sa-child-actions"><button type="button">Back</button><button type="button" className="is-next">Next</button></div>
        </div>
        <Note>Always preview the child-facing interface before you submit or publish. Large tap targets, minimal text, non-punitive feedback.</Note>
        <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => setPreview(false)}>Back to editor</button></div>
      </> : <>
        <h3 className="sa-sub">Editable assets</h3>
        <ul className="sa-list">
          <li><div><strong>Story pages</strong><small>{open.lessonPages} scenes · one idea per page with Previous and Next</small></div><button type="button" className="sa-ghost"><Icon name="edit" />Edit</button></li>
          <li><div><strong>Narration and captions</strong><small>Audio per scene with a matching caption track</small></div><button type="button" className="sa-ghost"><Icon name="edit" />Edit</button></li>
          <li><div><strong>Illustrations</strong><small>Cartoon artwork sized for child-facing contrast</small></div><button type="button" className="sa-ghost"><Icon name="edit" />Edit</button></li>
          <li><div><strong>Scenario branches</strong><small>{open.scenarios} branches with decision criteria</small></div><button type="button" className="sa-ghost"><Icon name="edit" />Edit</button></li>
        </ul>
        <h3 className="sa-sub">Instructional context for {store.sectionOf(scope.sectionId)}</h3>
        <Field label="Section note shown with the assignment" hint="Added within the approved section-authoring rules. It cannot replace an approved emergency-response procedure.">
          <textarea rows={3} defaultValue="We practised the line order in class on Monday. Try the scenario once before Friday." />
        </Field>
        <div className="sa-action-row">
          <button type="button" className="sa-ghost" onClick={() => setPreview(true)}>Preview learner screens</button>
          <button type="button" className="sa-primary" onClick={() => { log("Section material published", `${open.name} · ${store.sectionOf(scope.sectionId)}`); say("Approved section material published to your section."); }}><Icon name="check" />Publish section material</button>
          <button type="button" className="sa-ghost" onClick={() => { setModules(current => current.map(row => (row.id === open.id ? { ...row, status: "In review" } : row))); log("Content submitted for review", `${open.name} · protocol change submitted by ${scope.teacherName}`); say("Submitted for authorized review. A Super Admin approves global protocol changes."); setOpen(null); }}>Submit protocol change</button>
        </div>
        <Note>You can publish approved section material and assign approved versions. Changes to a baseline safety procedure must go through global review first.</Note>
      </>}
    </Modal>}
  </div>;
}

export function QuizzesRubrics() {
  const store = useData();
  const { modules, settings, log, say } = store;
  const scope = useScope();
  const [tab, setTab] = useState<"quiz" | "rubric">("quiz");
  const [weights, setWeights] = useState(RUBRIC_CRITERIA.map(item => item.weight));
  const total = weights.reduce((sum, value) => sum + value, 0);

  return <div className="tc-page">
    <PageHead icon="assessment" eyebrow="Quizzes & rubrics" title={`${modules[1]?.name} · v${modules[1]?.version}`}
      actions={<div className="sa-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "quiz"} className={tab === "quiz" ? "is-active" : ""} onClick={() => setTab("quiz")}>Questions<small>{QUESTION_BANK.length}</small></button>
        <button type="button" role="tab" aria-selected={tab === "rubric"} className={tab === "rubric" ? "is-active" : ""} onClick={() => setTab("rubric")}>Decision rubric<small>{RUBRIC_CRITERIA.length}</small></button>
      </div>}>
      Editing for <strong>{store.sectionOf(scope.sectionId)}</strong>. Comprehension checks sit inside the lesson; only the practical carries a score.
    </PageHead>

    {tab === "quiz" ? <Panel title="Questions, answers, and explanations" icon="assessment" note="They are not pass or fail. Answer keys are stored server-side and never shipped in a public catalog response." wide>
      <ul className="sa-question-list">
        {QUESTION_BANK.map((question, index) => <li key={question.id}>
          <div className="sa-question-head"><span>Q{index + 1}</span><strong>{question.text}</strong><small>{question.points} point{question.points === 1 ? "" : "s"}</small></div>
          <ol className="sa-choices">{question.choices.map((choice, i) => <li key={choice} className={i === question.answer ? "is-answer" : ""}>{choice}{i === question.answer && <Icon name="check" />}</li>)}</ol>
          <p className="sa-explanation"><strong>Explanation shown after answering:</strong> {question.explanation}</p>
        </li>)}
      </ul>
      <Note>Missing a question invites another attempt. Corrective feedback explains the safe choice; it never shames the learner.</Note>
    </Panel> : <Panel title="Decision rubric weights" icon="edit" note="Rubric changes affect future attempts only. Historical attempts keep the rubric they were scored against." wide>
      {RUBRIC_CRITERIA.map((criterion, index) => <div key={criterion.id} className="sa-weight">
        <span>{criterion.label}</span>
        <input type="range" min={0} max={50} step={5} value={weights[index]} onChange={event => setWeights(current => current.map((value, i) => (i === index ? Number(event.target.value) : value)))} />
        <b>{weights[index]}%</b>
      </div>)}
      <p className={`sa-weight-total ${total === 100 ? "" : "is-off"}`}>Total weight: {total}% {total === 100 ? "· balanced" : "· must equal 100% before publishing"}</p>
      <div className="sa-action-row">
        <button type="button" className="sa-primary" disabled={total !== 100} onClick={() => { log("Rubric version saved", `${modules[1]?.name} · new rubric version for future attempts`); say("Saved as a new rubric version. Existing results are untouched."); }}><Icon name="check" />Save as new version</button>
        <button type="button" className="sa-ghost" onClick={() => setWeights(RUBRIC_CRITERIA.map(item => item.weight))}>Reset</button>
      </div>
      <Note>Correctness is the default scoring basis. Reaction-time weighting stays {settings.reactionWeighting ? "enabled by a reviewed rubric" : "disabled"} unless a reviewed rubric defines it and accounts for accessibility and device differences.</Note>
    </Panel>}
  </div>;
}
