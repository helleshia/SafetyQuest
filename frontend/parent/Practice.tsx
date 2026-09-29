import { useState } from "react";
import Icon from "../shared/Icon";
import { FAMILY_PROMPTS, HOME_ACTIVITIES } from "../shared/demo";
import { useData } from "../shared/store";
import { Note, Panel, Stat } from "../shared/ui";
import { ChildHeading, useParent } from "./ParentApp";
import { moduleProgress } from "./progress";

export default function PracticeAtHome() {
  const { modules, assessments, moduleOf, say } = useData();
  const scope = useParent();
  // Parent-reported only. This list lives on the parent's own screen and never
  // touches quiz scores, completion, grades, XP, or mastery.
  const [ticked, setTicked] = useState<string[]>([]);

  const rows = moduleProgress(modules, assessments, scope.child);
  const reached = new Set(rows.filter(row => row.lesson !== "Not started").map(row => row.moduleId));
  const recaps = rows.filter(row => row.lesson === "Complete").slice(-4).reverse();

  const toggle = (id: string, title: string) => {
    const done = ticked.includes(id);
    setTicked(current => (done ? current.filter(item => item !== id) : [...current, id]));
    say(done
      ? `"${title}" unmarked. Nothing in your child's school record changed.`
      : `"${title}" marked as done at home. This is your own note — it does not change scores, completion, or grades.`);
  };

  return <>
    <ChildHeading note="approved family material" />

    <div className="sa-stat-grid">
      <Stat label="Activities you marked done" value={`${ticked.length} / ${HOME_ACTIVITIES.length}`} note="Your own record, kept separate from school results" />
      <Stat label="Talking points ready" value={FAMILY_PROMPTS.filter(prompt => reached.has(prompt.moduleId)).length} note="Matched to lessons your child has reached" />
      <Stat label="Recaps available" value={recaps.length} note="Short summaries of finished modules" />
    </div>

    <Panel title="Talk about it together" note="Short questions to ask over dinner or on the way home. There is no score attached." wide>
      <ul className="parent-prompts">{FAMILY_PROMPTS.map(prompt => {
        const covered = reached.has(prompt.moduleId);
        return <li key={prompt.id} className={covered ? "" : "is-upcoming"}>
          <span className="parent-prompt-tag">{moduleOf(prompt.moduleId)}{covered ? "" : " · coming up"}</span>
          <strong>{prompt.question}</strong>
          <small>{prompt.guidance}</small>
        </li>;
      })}</ul>
      <Note>Keep these conversations calm and curious. Avoid framing them as a test, and avoid describing what "would happen" in a real emergency.</Note>
    </Panel>

    <Panel title="Do it together at home" note="Offline activities you can finish in a few minutes. Ticking one is your own note, not a school record." wide>
      <ul className="parent-checklist">{HOME_ACTIVITIES.map(activity => <li key={activity.id}>
        <label className="sa-check">
          <input type="checkbox" checked={ticked.includes(activity.id)} onChange={() => toggle(activity.id, activity.title)} />
          <span className="parent-checklist-body">
            <strong>{activity.title}</strong>
            <small>{activity.detail}</small>
            <small className="parent-checklist-meta">{moduleOf(activity.moduleId)} · about {activity.minutes} minutes</small>
          </span>
        </label>
      </li>)}</ul>
      <Note>A parent-reported activity is stored separately from schoolwork. It never changes your child's quiz score, module completion, teacher grade, points, or mastery.</Note>
    </Panel>

    <Panel title="What your child has covered" note="A short recap of the modules they have finished, so you know what they already know." wide>
      {recaps.length === 0
        ? <p className="sa-footnote">Recaps appear once your child finishes their first module.</p>
        : <ul className="sa-list">{recaps.map(row => <li key={row.moduleId}>
          <div><strong>{row.name}</strong><small>{row.domain} · finished</small></div>
          <Icon name="check" />
        </li>)}</ul>}
    </Panel>

    <Panel title="If something happens for real" note="Please read this once." wide>
      <p className="parent-plain">SafetyQuest is a <strong>learning tool</strong>. It is not an alarm, a reporting line, or an emergency service, and nobody is monitoring this website for emergencies. In a real emergency, contact your local emergency services and your child's school directly.</p>
      <p className="sa-footnote">If your child seems worried after a lesson, tell them it is normal, remind them that adults are there to help, and let their teacher know.</p>
    </Panel>
  </>;
}
