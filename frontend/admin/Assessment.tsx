import { useState } from "react";
import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Empty, Note, Pager, Panel, Pill, Select } from "../shared/ui";
import ResetDialog from "../shared/ResetDialog";
import { api } from "../shared/api";
import { resetCounts } from "../../shared/resetLessons";
import { attemptScore, averageScore, officialResultsFor, passMarkFor } from "../../shared/scoring";
import "./assessment.css";

const PAGE_SIZE = 10;

/** The three states an attempt moves through, in order, after a learner submits it. */
const PIPELINE = [
  { state: "Awaiting review", label: "Waiting for a teacher", tone: "wait", detail: "Submitted, nobody has opened it yet" },
  { state: "Reviewed draft", label: "Teacher is drafting", tone: "draft", detail: "Being graded, not visible to the family" },
  { state: "Published", label: "Published to the family", tone: "done", detail: "Finished — the parent can see the result" },
] as const;

export default function Assessment() {
  const store = useData();
  const { sections, modules, assessments, settings, users, refresh, say } = store;
  const [section, setSection] = useState("All sections");
  const [module, setModule] = useState("All modules");
  const [review, setReview] = useState("All review states");
  const [page, setPage] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);

  const rows = assessments.filter(row =>
    (section === "All sections" || store.sectionOf(row.sectionId) === section)
    && (module === "All modules" || `${row.moduleId}. ${modules.find(item => item.id === row.moduleId)?.name}` === module)
    && (review === "All review states" || row.review === review));
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const shown = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const countOf = (state: string) => rows.filter(row => row.review === state).length;
  const waiting = countOf("Awaiting review");
  const complete = rows.filter(row => row.quality === "Complete");
  const interrupted = rows.length - complete.length;
  // Scores follow the same rule as the app and the teacher console: one official
  // result per learner and module, the teacher's grade over the device score, and
  // each section's own pass mark.
  const passOf = (row: { sectionId: string }) => passMarkFor(sections.find(item => item.id === row.sectionId), settings.practicalPass);
  const passes = (row: typeof rows[number]) => attemptScore(row) >= passOf(row);
  const official = officialResultsFor(rows);
  const passed = official.filter(passes).length;
  const practicalAverage = averageScore(official);
  const share = (count: number) => (rows.length ? Math.round(count / rows.length * 100) : 0);
  // Learners who could take a practical, and the pass rate for each grade level.
  const learners = store.users.filter(user => user.role === "Student" && user.status === "Active"
    && (section === "All sections" || store.sectionOf(user.section) === section)).length;
  const grades = [...new Set(sections.map(item => item.grade))].sort((a, b) => Number(a) - Number(b)).map(level => {
    const ids = new Set(sections.filter(item => item.grade === level).map(item => item.id));
    const scoped = official.filter(row => ids.has(row.sectionId));
    return { level, taken: scoped.length, passed: scoped.filter(passes).length };
  });

  const reset = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(0); };

  return <div className="assess-page">
    <header className="assess-intro">
      <span className="assess-intro-icon"><Icon name="assessment" /></span>
      <div>
        <h2>Assessment overview</h2>
        <p>Learners work through a lesson, then attempt its practical. This page watches what happens to those attempts afterwards — it is <strong>oversight, not grading</strong>. Use it to find attempts stuck waiting for a teacher, and to check whether the recorded data can be trusted. Grades are entered by the assigned teacher and cannot be changed here.</p>
      </div>
    </header>

    <div className="assess-filters">
      <span>Showing</span>
      <Select label="Section" value={section} options={["All sections", ...sections.map(item => item.name)]} onChange={reset(setSection)} />
      <Select label="Module" value={module} options={["All modules", ...modules.map(item => `${item.id}. ${item.name}`)]} onChange={reset(setModule)} />
      <Select label="Review" value={review} options={["All review states", "Awaiting review", "Reviewed draft", "Published"]} onChange={reset(setReview)} />
      <strong>{rows.length} attempt{rows.length === 1 ? "" : "s"}</strong>
    </div>

    {/* The queue is the reason this page exists, so it leads. */}
    <Panel title="Where every attempt stands" icon="clock" note="An attempt is finished only once the teacher publishes it. Anything sitting in the first column is waiting on a person." wide>
      {!rows.length ? <Empty text="No attempts match these filters." /> : <>
        <p className={`assess-headline ${waiting ? "needs-action" : ""}`}>
          {waiting
            ? <><strong>{waiting}</strong> attempt{waiting === 1 ? " is" : "s are"} waiting for a teacher to review {waiting === 1 ? "it" : "them"}.</>
            : <><strong>Nothing is stuck.</strong> Every attempt in this filter has reached a teacher.</>}
        </p>
        <div className="assess-pipeline">{PIPELINE.map((stage, index) => <div key={stage.state} className={`assess-stage tone-${stage.tone}`}>
          <span className="assess-stage-step">Step {index + 1}</span>
          <b>{countOf(stage.state)}</b>
          <strong>{stage.label}</strong>
          <small>{stage.detail}</small>
        </div>)}</div>
        <div className="assess-stacked" role="img" aria-label={PIPELINE.map(stage => `${stage.label}: ${countOf(stage.state)}`).join(", ")}>
          {PIPELINE.map(stage => <i key={stage.state} className={`tone-${stage.tone}`} style={{ width: `${share(countOf(stage.state))}%` }} />)}
        </div>
      </>}
    </Panel>

    <Panel title="Practical scores by module" icon="curriculum" note={`How many learners have taken each module's practical, and how many reached the ${settings.practicalPass}% pass mark.`} wide>
      <div className="assess-grades">
        {grades.map(grade => <div key={grade.level} className="assess-grade">
          <span>Grade {grade.level}</span>
          <b>{grade.taken ? `${Math.round(grade.passed / grade.taken * 100)}%` : "—"}</b>
          <span className="assess-track"><i style={{ width: `${grade.taken ? grade.passed / grade.taken * 100 : 0}%` }} /></span>
          <small>{grade.taken ? `${grade.passed} of ${grade.taken} results passed` : "No attempts recorded"}</small>
        </div>)}
        <div className="assess-grade is-total">
          <span>Grades 4–6 overall</span>
          <b>{official.length ? `${Math.round(passed / official.length * 100)}%` : "—"}</b>
          <span className="assess-track"><i style={{ width: `${official.length ? passed / official.length * 100 : 0}%` }} /></span>
          <small>{official.length ? `${passed} of ${official.length} results passed · ${practicalAverage}% average score` : "No published results"}</small>
        </div>
      </div>

      <div className="assess-table-scroll"><table className="sa-table assess-module-table">
        <thead><tr><th>Module</th><th>Took the practical</th><th>Passed</th><th>Average score</th></tr></thead>
        <tbody>{modules.map(item => {
          const scoped = official.filter(row => row.moduleId === item.id);
          const clear = scoped.filter(passes).length;
          const score = averageScore(scoped);
          if (!scoped.length) {
            return <tr key={item.id} className="sa-row-muted"><td><strong>{item.id}. {item.name}</strong></td><td colSpan={3}><em>No published results in this filter</em></td></tr>;
          }
          return <tr key={item.id}>
            <td><strong>{item.id}. {item.name}</strong></td>
            <td className="assess-count">{scoped.length}<small> of {learners} learners</small></td>
            <td className="assess-count">{clear}<small> ({Math.round(clear / scoped.length * 100)}%)</small></td>
            <td><div className="assess-module-score">
              <span className="assess-track"><i style={{ width: `${score}%` }} /></span>
              <b className={score !== null && score < settings.practicalPass ? "sa-below" : ""}>{score}%</b>
            </div></td>
          </tr>;
        })}</tbody>
      </table></div>
      <p className="sa-footnote">{interrupted} of these attempts were interrupted. An interrupted attempt is not a failing score, and a module nobody has reached is never counted as a zero.</p>
    </Panel>

    <Panel title="Every recorded attempt" icon="audit" note="Read-only. Administrators cannot overwrite quiz answers, simulation events, or teacher grades." wide>
      {!shown.length ? <Empty text="No attempts match these filters." /> : <div className="assess-table-scroll"><table className="sa-table">
        <thead><tr><th>Token</th><th>Section</th><th>Module</th><th>Practical</th><th>Decision accuracy</th><th>Reaction context</th><th>Attempt quality</th><th>Review status</th></tr></thead>
        <tbody>{shown.map(row => <tr key={row.id}>
          <td className="sa-mono">{store.nameOf(row.studentId)}</td>
          <td>{store.sectionOf(row.sectionId)}</td>
          <td>{store.moduleOf(row.moduleId)}</td>
          <td className={!passes(row) ? "sa-below" : ""}>{attemptScore(row)}%</td>
          <td>{row.accuracy}%</td>
          <td className="sa-dim">{row.quality === "Complete" ? `${row.reaction.toFixed(1)}s active` : "Unavailable"}</td>
          <td><Pill>{row.quality}</Pill></td>
          <td><Pill>{row.review}</Pill></td>
        </tr>)}</tbody>
      </table></div>}
      <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
    </Panel>

    <Panel title="Start the course again" icon="restore" note="The only destructive action on this page. It clears learner progress across the whole deployment." wide>
      <Note>This ignores the filters above. It always covers <strong>every section and every lesson</strong>, so a filtered view cannot narrow it by accident. To reset one class or one lesson, the assigned teacher does that from their own class.</Note>
      <div className="sa-danger-zone">
        <div>
          <strong>Reset all lessons</strong>
          <small>Deletes every recorded practical attempt and returns every learner to the start of the course. Lesson content, accounts, consent records, and guardian links are untouched, and the reset is written to the audit log.</small>
        </div>
        <button type="button" className="sa-danger-button" onClick={() => setResetOpen(true)}><Icon name="restore" />Reset all lessons</button>
      </div>
    </Panel>

    {resetOpen && (() => {
      const counts = resetCounts(users, assessments, {}, store.progress);
      return <ResetDialog
        title="Reset all lessons across the deployment?"
        scopeLabel="Every section · every lesson"
        students={counts.students}
        attempts={counts.attempts}
        onClose={() => setResetOpen(false)}
        onConfirm={async password => {
          // The server re-checks this password and performs the reset itself.
          await api("/api/admin/reset", "POST", { password });
          refresh();
          say("Every lesson was reset across the deployment.");
          setResetOpen(false);
        }} />;
    })()}
  </div>;
}
