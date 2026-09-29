import Icon from "../shared/Icon";
import { csvDownload, practicalSummary } from "../shared/demo";
import { useData } from "../shared/store";
import { Bar, Empty, Note, Panel, Pill, Stat } from "../shared/ui";
import { ChildHeading, useParent } from "./ParentApp";
import { assignedActivities, moduleProgress, passMarkOf, publishedResults } from "./progress";
import { attemptScore } from "../../shared/scoring";

export function LearningProgress() {
  const { modules, assessments, assignments, sections, settings, moduleOf } = useData();
  const scope = useParent();
  const child = scope.child;

  const rows = moduleProgress(modules, assessments, child);
  const total = rows.length;
  const done = rows.filter(row => row.lesson === "Complete").length;
  const results = publishedResults(assessments, child.id);
  const practicesDone = results.filter(row => row.quality === "Complete").length;
  const assigned = assignedActivities(assignments, child);
  const inProgress = rows.find(row => row.lesson === "In progress");
  const completedLessons = rows.filter(row => row.lesson === "Complete").length;
  const inProgressLessons = rows.filter(row => row.lesson === "In progress").length;
  const notStartedLessons = rows.filter(row => row.lesson === "Not started").length;
  const passMark = passMarkOf(sections, child, settings.practicalPass);
  const practicalScores = results.map(row => attemptScore(row));
  const practicalAverage = practicalScores.length ? Math.round(practicalScores.reduce((sum, score) => sum + score, 0) / practicalScores.length) : null;
  const passedPracticals = practicalScores.filter(score => score >= passMark).length;
  const averageReaction = results.length ? (results.reduce((sum, row) => sum + row.reaction, 0) / results.length).toFixed(1) : "—";

  return <>
    <ChildHeading note={`${done} of ${total} modules finished`} />

    <div className="sa-stat-grid">
      <Stat label="Modules finished" value={`${done} / ${total}`} note="Lesson, quiz, and practice all done" />
      <Stat label="Working on now" value={<span className="parent-date">{inProgress ? moduleOf(inProgress.moduleId) : "All caught up"}</span>} note={inProgress ? "The next module in the curriculum order" : "Nothing is part-finished right now"} />
      <Stat label="Quizzes with a published score" value={`${results.length} / ${total}`} note="Scores appear once the teacher publishes them" />
      <Stat label="Practices completed" value={`${practicesDone} / ${total}`} note="Interrupted attempts are not counted" />
    </div>

    <div className="parent-progress-grid">
      <Panel title="Lessons" icon="curriculum" note="Every published lesson and its current state.">
        <div className="parent-status-list">
          <div><span className="parent-status-dot is-complete" />Completed<strong>{completedLessons}</strong></div>
          <div><span className="parent-status-dot is-progress" />In progress<strong>{inProgressLessons}</strong></div>
          <div><span className="parent-status-dot is-pending" />Not started<strong>{notStartedLessons}</strong></div>
        </div>
      </Panel>
      <Panel title="Practical / simulation" icon="assessment" note="Published practical performance only.">
        <div className="parent-performance-grid">
          <div><small>Completed</small><strong>{practicesDone}</strong></div>
          <div><small>Average score</small><strong>{practicalAverage === null ? "—" : `${practicalAverage}%`}</strong></div>
          <div><small>Pass / fail</small><strong>{practicalScores.length ? `${passedPracticals} / ${practicalScores.length - passedPracticals}` : "—"}</strong></div>
          <div><small>Reaction time</small><strong>{averageReaction}{averageReaction === "—" ? "" : "s"}</strong></div>
        </div>
      </Panel>
    </div>

    <Panel title="Phase progress" note="Each module has a lesson to read, a quiz to answer, and a practice scenario to work through." wide>
      <Bar label="Lessons finished" value={done} total={total} />
      <Bar label="Quizzes scored" value={results.length} total={total} tint="blue" />
      <Bar label="Practices completed" value={practicesDone} total={total} tint="mint" />
      <Note>A phase only counts here once your child's teacher has published the review. An attempt that is still being reviewed is not missing work.</Note>
    </Panel>

    <Panel title="Module by module" note="The published curriculum in order. Your child reads the lesson first, then works through the practice activity. Only the practice carries a score, and it appears once the teacher publishes it." wide>
      <table className="sa-table">
        <thead><tr><th>Module</th><th>Topic area</th><th>Lesson</th><th>Practice</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.moduleId} className={row.lesson === "Not started" ? "sa-row-muted" : ""}>
          <td><strong>{row.name}</strong></td>
          <td className="sa-dim">{row.domain}</td>
          <td><Pill>{row.lesson === "Complete" ? "Complete" : row.lesson === "In progress" ? "In review" : "Pending"}</Pill></td>
          <td>{row.practical === null ? <span className="sa-dim">Not published</span> : `${row.practical}%`}</td>
        </tr>)}</tbody>
      </table>
      <Note>You are seeing your own child's record only. Class rankings, other children's results, and quiz answer keys are never shown to parents.</Note>
    </Panel>

    <Panel title="Assigned by the school" note="Activities your child's teacher published for this section. You cannot change these." wide>
      {assigned.length === 0
        ? <Empty text="No published activities are assigned right now." />
        : <ul className="sa-list">{assigned.map(item => <li key={item.id}>
          <div><strong>{moduleOf(item.moduleId)}</strong><small>{item.phases}{item.phases === "Learn and Practice" ? " · one practice try, more only if the teacher allows" : ""}{item.simulation ? " · includes a practice simulation" : ""}</small><small>Opens {item.opens}</small></div>
          <span className="sa-due">Due {item.due}</span>
        </li>)}</ul>}
      <p className="sa-footnote">Lessons are stories to read together and are not scored. Only practice activities have a pass mark, set at {passMark}% for this class.</p>
    </Panel>
  </>;
}

export function ResultsFeedback() {
  const store = useData();
  const { assessments, modules, sections, settings, refreshed, moduleOf, say } = store;
  const scope = useParent();
  const child = scope.child;
  const results = publishedResults(assessments, child.id);
  const passMark = passMarkOf(sections, child, settings.practicalPass);
  const pending = assessments.filter(row => row.studentId === child.id && row.review !== "Published" && row.review !== "Revised").length;

  function download() {
    csvDownload(`safetyquest-${child.name.toLowerCase()}-report.csv`, [
      ["SafetyQuest learning report"],
      [`Child: ${scope.label} (name entered by the guardian)`],
      [`Student ID: ${child.name}`],
      [`Section: ${store.sectionOf(child.section)}`],
      [`Reporting period: ${settings.term}`],
      [`Requested by: ${scope.parentName} (verified guardian)`],
      [`Generated: ${refreshed}`],
      ["Contents: published results and published teacher feedback for this child only."],
      [],
      ["Module", "Practice score", "Teacher grade", "What this means", "Teacher feedback"],
      ...results.map(row => [
        moduleOf(row.moduleId),
        `${row.practical}%`,
        row.grade === undefined ? "Not entered" : `${row.grade}%`,
        practicalSummary(attemptScore(row), passMark),
        row.feedback ?? "",
      ]),
    ]);
    say(`Report downloaded for ${scope.label}. It covers your child only — parents never receive a class export.`);
  }

  return <>
    <ChildHeading action={<button type="button" className="sa-ghost" onClick={download} disabled={results.length === 0}><Icon name="download" />Download report</button>} />

    <Panel title="How to read these results" note="Plain language, on purpose." wide>
      <p className="parent-plain">These numbers describe how your child did in a <strong>learning activity</strong> — a story lesson, a quiz, and a practice scenario on a screen. A low score means a lesson is worth revisiting together. It does not mean your child would be unsafe in a real emergency, and it is not a judgement about them.</p>
      {pending > 0 && <Note>{pending} more attempt{pending === 1 ? " is" : "s are"} still with your child's teacher. Results appear here only once the teacher has finished reviewing and published them.</Note>}
    </Panel>

    {results.length === 0
      ? <Empty text="No published results yet. They appear here after your child's teacher publishes a review." />
      : <div className="parent-results">{results.map(row => <article className="parent-result" key={row.id}>
        <div className="parent-result-heading"><h3>{moduleOf(row.moduleId)}</h3><Pill>{row.review}</Pill></div>
        <p className="parent-plain">{practicalSummary(attemptScore(row), passMark)}</p>
        <dl className="parent-result-scores">
          
          <div><dt>Practice score</dt><dd>{row.practical}%</dd></div>
          <div><dt>Teacher grade</dt><dd>{row.grade === undefined ? "Not entered" : `${row.grade}%`}</dd></div>
        </dl>
        <p className="parent-feedback"><Icon name="mail" /><span>{row.feedback || "Your child's teacher published this result without a written note."}</span></p>
        {row.quality === "Interrupted" && <p className="parent-support">This attempt was interrupted, so its timing was not recorded. Ask the teacher whether another practice attempt is needed.</p>}
        {row.review === "Revised" && <p className="parent-support">This grade was revised by the teacher after the first review. The teacher keeps a record of what changed and why.</p>}
      </article>)}</div>}

    <Note>Parents see published results for their own child. Class rankings, other children's records, quiz answer keys, raw attempt timelines, and unpublished teacher notes are not part of this view.</Note>
  </>;
}
