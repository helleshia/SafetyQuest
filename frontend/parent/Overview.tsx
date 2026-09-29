import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Panel, Pill, Stat } from "../shared/ui";
import { ChildIdentity, useParent } from "./ParentApp";
import { moduleProgress, publishedResults } from "./progress";
import { attemptScore, averageScore } from "../../shared/scoring";

export default function Overview() {
  const { modules, assessments, sections, moduleOf } = useData();
  const scope = useParent();
  const child = scope.child;
  const section = sections.find(item => item.id === child.section);
  const rows = moduleProgress(modules, assessments, child);
  const results = publishedResults(assessments, child.id);
  const completed = rows.filter(row => row.lesson === "Complete").length;
  const inProgress = rows.filter(row => row.lesson === "In progress").length;
  const notStarted = rows.filter(row => row.lesson === "Not started").length;
  const latest = results[0];
  const overallScore = averageScore(results) ?? child.score;

  return <>
    <section className="parent-welcome">
      <div>
        <span className="parent-eyebrow">GROWING READY, TOGETHER</span>
        <h2>{scope.label}'s progress,<br /><em>at a glance.</em></h2>
        <p>See what they are learning, celebrate how far they have come, and notice where a little encouragement would help.</p>
      </div>
      <div className="parent-welcome-mark" aria-hidden="true"><Icon name="curriculum" /><span>Small steps.<br />Big confidence.</span></div>
    </section>

    <ChildIdentity note={`${completed} of ${rows.length} lessons completed`} />

    <div className="sa-stat-grid parent-overview-stats">
      <Stat label="Overall progress" value={`${Math.round(completed / Math.max(rows.length, 1) * 100)}%`} note={`${completed} of ${rows.length} lessons completed`} />
      <Stat label="Assessment performance" value={`${overallScore}%`} note="Published results only" />
      <Stat label="Latest activity" value={<span className="parent-date">{child.lastActive ?? "Not recorded"}</span>} note="Last recorded activity" />
    </div>

    <div className="parent-overview-grid">
      <Panel title="Child summary" icon="users" note="The child currently selected.">
        <dl className="parent-fact-list">
          <div><dt>Child name</dt><dd>{scope.label}</dd></div>
          <div><dt>Grade &amp; section</dt><dd>{section?.name ?? "Unassigned"}</dd></div>
          <div><dt>Overall progress</dt><dd>{completed} / {rows.length} lessons</dd></div>
          <div><dt>Assessment performance</dt><dd>{overallScore}%</dd></div>
        </dl>
      </Panel>

      <Panel title="Learning progress" icon="curriculum" note="Published lessons by current state.">
        <div className="parent-status-list">
          <div><span className="parent-status-dot is-complete" />Lessons completed<strong>{completed}</strong></div>
          <div><span className="parent-status-dot is-progress" />Lessons in progress<strong>{inProgress}</strong></div>
          <div><span className="parent-status-dot is-pending" />Lessons not started<strong>{notStarted}</strong></div>
        </div>
      </Panel>

      <Panel title="Recent activity" icon="clock" note="Most recent published learning record.">
        <dl className="parent-fact-list">
          <div><dt>Completed lesson</dt><dd>{completed ? moduleOf(rows[completed - 1].moduleId) : "None yet"}</dd></div>
          <div><dt>Recent practical</dt><dd>{latest ? `${moduleOf(latest.moduleId)} · ${attemptScore(latest)}%` : "None yet"}</dd></div>
          <div><dt>Assessment result</dt><dd>{latest ? `${attemptScore(latest)}%` : "No result yet"}</dd></div>
        </dl>
        {latest && <div className="parent-activity-status"><Pill>{latest.review}</Pill><span>{latest.submitted ?? "Published by the teacher"}</span></div>}
      </Panel>
    </div>
  </>;
}
