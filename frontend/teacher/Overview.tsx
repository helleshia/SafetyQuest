import { useEffect, useMemo, useState } from "react";
import Icon from "../shared/Icon";
import type { User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Modal, Panel } from "../shared/ui";
import { Metric, PageHead } from "./TeacherUI";
import ClassCard from "./ClassCard";
import { TOTAL_LESSONS, lowProgress, statsFor, unfinishedPracticals, untakenLessons } from "./classData";
import { useScope } from "./TeacherApp";
import { averageScore as average, officialResultsFor } from "../../shared/scoring";

const nameOf = (student: User) => student.studentName?.trim() || student.name;

export default function Overview() {
  const { users, assessments, assignments, modules, settings, progress } = useData();
  const scope = useScope();

  const stats = scope.mySections.map(section => statsFor(section, users, assessments, assignments, modules, settings.practicalPass));
  const students = stats.flatMap(item => item.students);
  const attempts = stats.flatMap(item => item.attempts);

  const overallProgress = students.length
    ? Math.round(students.reduce((sum, student) => sum + Math.min(student.completed, TOTAL_LESSONS), 0) / (students.length * TOTAL_LESSONS) * 100)
    : 0;
  const averageScore = average(officialResultsFor(attempts)) ?? 0;

  const behind = lowProgress(stats);
  const pending = unfinishedPracticals(stats, assignments, modules);
  const notStarted = useMemo(
    () => untakenLessons(stats, assignments, modules, progress ?? []),
    [stats, assignments, modules, progress],
  );

  const [remindOpen, setRemindOpen] = useState(false);
  useEffect(() => {
    if (notStarted.length === 0) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `safetyquest.teacher.lesson-remind.${scope.teacherId}.${day}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* still show once this mount if storage is blocked */ }
    setRemindOpen(true);
  }, [notStarted.length, scope.teacherId]);

  return <div className="tc-page">
    <PageHead icon="overview" eyebrow="Overview" title={`Good day, ${scope.teacherName.split(" ")[0]}`}>
      Everything you handle, in one view. Open a class to see its students, lesson progress, and assessment settings.
    </PageHead>

    <div className="tc-metrics tc-metrics-4">
      <Metric icon="sections" tint="lilac" label="Handled classes" value={stats.length}>
        {stats.map(item => item.section.name.split(" · ")[0]).filter((value, index, all) => all.indexOf(value) === index).join(", ") || "None assigned yet"}.
      </Metric>
      <Metric icon="users" tint="blue" label="Total students" value={students.length}>
        Across every class you handle, counted from your live roster.
      </Metric>
      <Metric icon="graduation" tint="mint" label="Overall class progress" value={`${overallProgress}%`}>
        Lessons completed out of {TOTAL_LESSONS} per learner, averaged across all your classes.
      </Metric>
      <Metric icon="assessment" tint="coral" label="Average assessment score" value={`${averageScore}%`}>
        {attempts.length} recorded practical attempt{attempts.length === 1 ? "" : "s"} at a {settings.practicalPass}% default pass mark.
      </Metric>
    </div>

    <section aria-labelledby="my-classes">
      <h3 id="my-classes" className="tc-section-title">My classes<small>Select a class to open its records</small></h3>
      {stats.length === 0
        ? <Empty text="No classes are assigned to you yet. A Super Admin assigns them." />
        : <div className="tc-classes">
          {stats.map(item => <ClassCard key={item.section.id} stats={item} onOpen={() => scope.openClass(item.section.id)} />)}
        </div>}
    </section>

    <div className="tc-grid-2">
      <Panel title="Students with low progress" icon="person" note={`Fewer than ${TOTAL_LESSONS / 2} of ${TOTAL_LESSONS} lessons finished so far.`}>
        {behind.length === 0 ? <Empty text="Every learner is at least halfway through the course." /> : <ul className="tc-attention">
          {behind.map(row => <li key={row.student.id}>
            <span className="tc-attention-mark"><Icon name="graduation" /></span>
            <div><strong>{nameOf(row.student)}</strong><small>{row.section.name} · {row.student.name}</small></div>
            <b>{row.done}/{TOTAL_LESSONS}</b>
          </li>)}
        </ul>}
      </Panel>

      <Panel title="Students with unfinished practicals" icon="clock" note="A practice lesson is open to them but no attempt has been recorded.">
        {pending.length === 0 ? <Empty text="Every open practical has an attempt recorded." /> : <ul className="tc-attention">
          {pending.map(row => <li key={`${row.student.id}-${row.lesson.id}`}>
            <span className="tc-attention-mark"><Icon name="assessment" /></span>
            <div><strong>{nameOf(row.student)}</strong><small>{row.lesson.name} · {row.section.name}</small></div>
            <b className="tc-due-date">{row.due}</b>
          </li>)}
        </ul>}
      </Panel>
    </div>

    {remindOpen && notStarted.length > 0 && <Modal
      title="Learners still need to start a lesson"
      note="These students have an open lesson they have not opened or taken yet."
      onClose={() => setRemindOpen(false)}>
      <ul className="tc-attention">
        {notStarted.map(row => <li key={`${row.student.id}-${row.lesson.id}`}>
          <span className="tc-attention-mark"><Icon name="curriculum" /></span>
          <div><strong>{nameOf(row.student)}</strong><small>{row.lesson.name} · {row.section.name}</small></div>
          <b className="tc-due-date">{row.due || "Open"}</b>
        </li>)}
      </ul>
      <div className="sa-modal-actions" style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="sa-ghost" onClick={() => setRemindOpen(false)}>Dismiss</button>
        <button type="button" className="sa-primary" onClick={() => { setRemindOpen(false); scope.go("Handled Classes"); }}>Open classes</button>
      </div>
    </Modal>}
  </div>;
}
