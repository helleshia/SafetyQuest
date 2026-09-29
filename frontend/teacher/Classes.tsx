import { useState } from "react";
import Icon from "../shared/Icon";
import type { AssessmentRow, Module, Section, User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Note, Panel, Pill } from "../shared/ui";
import ResetDialog from "../shared/ResetDialog";
import AttemptDetail from "./AttemptDetail";
import { moduleHasAppPack } from "../../shared/curriculum";
import { attemptScore, averageScore, officialResults } from "../../shared/scoring";
import { resetCounts, type ResetScope } from "../../shared/resetLessons";
import { api } from "../shared/api";
import { PageHead } from "./TeacherUI";
import ClassCard, { gradeTint } from "./ClassCard";
import { TOTAL_LESSONS, addDays, allLessons, fromInputDate, isOverdue, standingFor, statsFor, toInputDate, type ClassLesson } from "./classData";
import { downloadScorecardsPdf } from "./scorecardsPdf";
import TeacherAddStudent from "./TeacherAddStudent";
import ExcelStudentUpload from "../admin/ExcelStudentUpload";
import { useScope } from "./TeacherApp";

const TABS = ["Students", "Lessons", "Assessment Details"];

const nameOf = (student: User) => student.studentName?.trim() || student.name;
const initials = (student: User) => nameOf(student).split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "S";

export default function Classes() {
  const { users, assessments, assignments, modules, settings } = useData();
  const scope = useScope();
  const section = scope.mySections.find(item => item.id === scope.classId);

  // No class chosen yet: the page is the list of classes.
  if (!section) {
    const stats = scope.mySections.map(item => statsFor(item, users, assessments, assignments, modules, settings.practicalPass));
    return <div className="tc-page">
      <PageHead icon="sections" eyebrow="Handled classes" title="Your classes">
        You see only the classes assigned to you. Open one to work with its students, lessons, and assessment settings.
      </PageHead>
      {stats.length === 0
        ? <Empty text="No classes are assigned to you yet. A Super Admin assigns them." />
        : <div className="tc-classes">
          {stats.map(item => <ClassCard key={item.section.id} stats={item} onOpen={() => scope.setClassId(item.section.id)} />)}
        </div>}
    </div>;
  }

  return <ClassDetail section={section} />;
}

function ClassDetail({ section }: { section: Section }) {
  const store = useData();
  const { users, assessments, assignments, modules, settings } = store;
  const scope = useScope();
  const [tab, setTab] = useState(TABS[0]);

  const stats = statsFor(section, users, assessments, assignments, modules, settings.practicalPass);
  const [gradeLabel, sectionLabel] = section.name.split(" · ");

  return <div className="tc-page">
    <button type="button" className="sa-ghost tc-back" onClick={() => scope.setClassId("")}>
      <Icon name="arrow" className="tc-back-icon" />All classes
    </button>

    <header className="tc-class-head">
      <span className={`tc-class-badge ${gradeTint(section.grade)}`}>G{section.grade}</span>
      <div className="tc-class-heading">
        <h2>{sectionLabel ?? section.name}</h2>
        <p>
          <span><Icon name="graduation" />{gradeLabel}</span>
          <span><Icon name="users" />{stats.students.length} students</span>
          <span><Icon name="curriculum" />{stats.lessons} of {TOTAL_LESSONS} lessons available</span>
          <span><Icon name="assessment" />Pass mark {stats.passMark}%</span>
        </p>
      </div>
    </header>

    <div className="sa-tabs" role="tablist">
      {TABS.map(label => <button key={label} type="button" role="tab" aria-selected={tab === label} className={tab === label ? "is-active" : ""} onClick={() => setTab(label)}>{label}</button>)}
    </div>

    {tab === "Students" && <Students section={section} />}
    {tab === "Lessons" && <Lessons section={section} />}
    {tab === "Assessment Details" && <AssessmentDetails section={section} />}
  </div>;
}

/* Students ---------------------------------------------------------------- */

function Students({ section }: { section: Section }) {
  const store = useData();
  const { users, assessments, assignments, modules, settings, progress, say } = store;
  const scope = useScope();
  const [open, setOpen] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [excel, setExcel] = useState(false);
  const roster = users.filter(user => user.role === "Student" && user.section === section.id);
  const passMark = section.passingScore ?? settings.practicalPass;
  const lessons = allLessons(assignments, modules, section.id);

  if (open) return <StudentRecord student={open} section={section} onBack={() => setOpen(null)} />;

  return <>
    <Panel title="Student roster" icon="users" note="Open a learner to see their lesson and practical record." wide
      action={<div className="tc-roster-actions">
        <button type="button" className="sa-ghost" onClick={() => setExcel(true)}><Icon name="download" />Excel upload</button>
        <button type="button" className="sa-primary" onClick={() => setAdding(true)}><Icon name="plus" />Add student</button>
        {roster.length > 0 && <button type="button" className="sa-ghost" onClick={() => {
          try {
            downloadScorecardsPdf({
              section,
              students: roster,
              assessments,
              modules,
              lessons,
              progress,
              passMark,
              teacherName: scope.teacherName,
            });
          } catch (problem) {
            say((problem as Error).message);
          }
        }}><Icon name="download" />Download scorecards PDF</button>}
      </div>}>
      {roster.length === 0 ? <Empty text="No learners are enrolled in this class yet. Add a student or upload an Excel CSV." /> : <div className="tc-table-scroll"><table className="sa-table sa-table-click tc-table-mid">
        <thead><tr><th>Student</th><th>Student ID</th><th>Lessons</th><th>Practicals</th><th>Average score</th><th>Standing</th><th>Last active</th><th /></tr></thead>
        <tbody>{roster.map(student => {
          const rows = assessments.filter(row => row.studentId === student.id);
          const average = averageScore(officialResults(rows, student.id));
          return <tr key={student.id} onClick={() => setOpen(student)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") setOpen(student); }}>
            <td><strong>{nameOf(student)}</strong></td>
            <td className="sa-mono sa-dim">{student.name}</td>
            <td>{Math.min(student.completed, TOTAL_LESSONS)}<span className="sa-dim"> / {TOTAL_LESSONS}</span></td>
            <td>{rows.length}</td>
            <td className={average !== null && average < passMark ? "sa-below" : ""}>{average === null ? <span className="sa-dim">No attempts</span> : `${average}%`}</td>
            <td>{average === null ? <Pill>Pending</Pill> : <Pill>{average >= passMark ? "Active" : "Pending"}</Pill>}</td>
            <td className="sa-dim">{student.lastActive}</td>
            <td className="sa-row-arrow"><Icon name="chevron" /></td>
          </tr>;
        })}</tbody>
      </table></div>}
    </Panel>
    {adding && <TeacherAddStudent sectionId={section.id} sectionName={section.name} onClose={() => setAdding(false)} />}
    {excel && <ExcelStudentUpload sectionId={section.id} sectionName={section.name} viaTeacherApi onClose={() => setExcel(false)} />}
  </>;
}

function StudentRecord({ student, section, onBack }: { student: User; section: Section; onBack: () => void }) {
  const store = useData();
  const { assessments, assignments, modules, settings, progress, say } = store;
  const scope = useScope();
  const [showing, setShowing] = useState<{ row: AssessmentRow; module: Module } | null>(null);
  const passMark = section.passingScore ?? settings.practicalPass;
  const rows = assessments.filter(row => row.studentId === student.id);
  const lessons = allLessons(assignments, modules, section.id).filter(item => item.available);
  const average = averageScore(officialResults(rows, student.id));

  // Opening an attempt replaces this record rather than stacking a dialog over it.
  if (showing) return <AttemptDetail student={student} module={showing.module} section={section} row={showing.row}
    passMark={passMark} backLabel={`Back to ${student.name}`} onBack={() => setShowing(null)} />;

  return <>
    <button type="button" className="sa-ghost tc-back" onClick={onBack}>
      <Icon name="arrow" className="tc-back-icon" />Back to roster
    </button>

    <Panel title="Individual student progress" icon="person" note="Learn/Check and Practice standing for lessons open to this class." wide
      action={<button type="button" className="sa-ghost" onClick={() => {
        try {
          downloadScorecardsPdf({
            section,
            students: [student],
            assessments,
            modules,
            lessons,
            progress,
            passMark,
            teacherName: scope.teacherName,
          });
        } catch (problem) {
          say((problem as Error).message);
        }
      }}><Icon name="download" />Download scorecard PDF</button>}>
      <div className="tc-student-head">
        <span className="tc-avatar">{initials(student)}</span>
        <div><strong>{nameOf(student)}</strong><small>Student ID {student.name} · {section.name} · enrolled {student.enrolled} · last active {student.lastActive}</small></div>
        <Pill>{student.status}</Pill>
      </div>

      <dl className="tc-facts">
        <div><dt>Lesson completion</dt><dd>{Math.min(student.completed, TOTAL_LESSONS)}<small>of {TOTAL_LESSONS} lessons</small></dd></div>
        <div><dt>Practical completion</dt><dd>{rows.length}<small>attempts recorded</small></dd></div>
        <div><dt>Average practical score</dt><dd>{average === null ? "—" : `${average}%`}<small>pass mark {passMark}%</small></dd></div>
        <div><dt>Standing</dt><dd>{average === null ? "Pending" : average >= passMark ? "Pass" : "Fail"}<small>across recorded attempts</small></dd></div>
      </dl>

      <div className="tc-table-scroll"><table className="sa-table tc-table-wide">
        <thead><tr><th>Lesson</th><th>Availability</th><th>Learn / Check</th><th>Check score</th><th>Practice</th><th>Score</th><th>Pass / Fail</th><th>Reaction time</th><th>Answers</th></tr></thead>
        <tbody>{lessons.length === 0
          ? <tr><td colSpan={9} className="sa-dim">No lessons are open for this class yet.</td></tr>
          : lessons.map(({ module, opens, due }) => {
          const standing = standingFor(student, module.id, rows, passMark, progress);
          const attempt = standing.attempt;
          const open = () => { if (attempt) setShowing({ row: attempt, module }); };
          return <tr key={module.id} className={attempt ? "tc-row-openable" : ""} onClick={open}
            tabIndex={attempt ? 0 : undefined} onKeyDown={event => { if (event.key === "Enter") open(); }}>
            <td><strong>{module.name}</strong></td>
            <td><Pill>Active</Pill><small className="sa-cell-sub">{opens} — {due || "no end date"}</small></td>
            <td>{standing.lessonDone ? <Pill>Complete</Pill> : <Pill>Pending</Pill>}</td>
            <td className="sa-dim">{standing.quizBest === null ? "—" : `${standing.quizBest}%`}</td>
            <td>{standing.practicalDone ? <Pill>Complete</Pill> : <Pill>Pending</Pill>}</td>
            <td className={standing.passed === false ? "sa-below" : ""}>{standing.score === null ? <span className="sa-dim">—</span> : `${standing.score}%`}</td>
            <td>{standing.passed === null ? <span className="sa-dim">{standing.awaiting ? "Awaiting review" : "Not attempted"}</span> : <Pill>{standing.passed ? "Verified" : "Pending"}</Pill>}</td>
            <td className="sa-dim">{standing.reaction === null ? "Unavailable" : `${standing.reaction.toFixed(1)}s active`}</td>
            <td className="sa-cell-actions">{attempt
              ? <button type="button" className="sa-ghost" onClick={event => { event.stopPropagation(); open(); }}><Icon name="search" />View answers</button>
              : <span className="sa-dim">—</span>}</td>
          </tr>;
        })}</tbody>
      </table></div>

      <h3 className="sa-sub">Feedback</h3>
      {rows.filter(row => row.feedback).length === 0
        ? <Empty text="No feedback has been published to this learner yet." />
        : <ul className="sa-list">{rows.filter(row => row.feedback).map(row => <li key={row.id}>
          <div><strong>{store.moduleOf(row.moduleId)}</strong><small>{row.feedback}</small></div>
          <b>{attemptScore(row)}%</b>
        </li>)}</ul>}
      <Note>Keep feedback on the learning activity. No names, family situations, medical details, or allegations.</Note>
    </Panel>

  </>;
}

/* Lessons ----------------------------------------------------------------- */

function Lessons({ section }: { section: Section }) {
  const { users, assessments, assignments, modules, settings, progress, refresh, say } = useData();
  // Same rule as the student app: only lessons opened in Assessment details.
  const lessons = allLessons(assignments, modules, section.id).filter(item => item.available);
  const [openId, setOpenId] = useState(lessons[0]?.module.id ?? 0);
  const [resetting, setResetting] = useState<ClassLesson | null>(null);
  const [showing, setShowing] = useState<{ row: AssessmentRow; module: Module; student: User } | null>(null);
  const roster = users.filter(user => user.role === "Student" && user.section === section.id);
  const rows = assessments.filter(row => row.sectionId === section.id);
  const passMark = section.passingScore ?? settings.practicalPass;

  if (showing) return <AttemptDetail student={showing.student} module={showing.module} section={section} row={showing.row}
    passMark={passMark} backLabel={`Back to ${showing.module.name}`} onBack={() => setShowing(null)} />;

  if (lessons.length === 0) return <Panel title="Lessons" icon="curriculum" note="Lessons you open in Assessment details appear here." wide
    action={<span className="tc-count-chip">0 available</span>}>
    <Empty text="No lessons are open for this class yet. Open them under Assessment details." />
  </Panel>;

  return <Panel title="Lessons" icon="curriculum" note={`${lessons.length} lesson${lessons.length === 1 ? "" : "s"} open for this class. Open one to see how the class is doing.`} wide
    action={<span className="tc-count-chip">{lessons.length} available</span>}>
    <ul className="tc-lesson-list">
      {lessons.map(item => {
        const open = item.module.id === openId;
        const standings = roster.map(student => standingFor(student, item.module.id, rows, passMark, progress));
        const finishedLesson = standings.filter(row => row.lessonDone).length;
        const finishedPractical = standings.filter(row => row.practicalDone).length;
        const passing = standings.filter(row => row.passed).length;

        return <li key={item.module.id} className={`tc-lesson-item ${open ? "is-open" : ""}`}>
          <button type="button" className="tc-lesson-row" aria-expanded={open} onClick={() => setOpenId(open ? 0 : item.module.id)}>
            <span className="tc-lesson-no">{String(item.module.id).padStart(2, "0")}</span>
            <span className="tc-lesson-name">
              <strong>{item.module.name}</strong>
              <small>
                <i className="tc-lesson-dot is-on" aria-hidden="true" />
                {item.opens} — {item.due || "no end date"}
                {isOverdue(item.due) && <em className="tc-past-due"> · past due</em>}
              </small>
            </span>
            <span className="tc-lesson-counts">
              <b>{finishedLesson}/{roster.length}</b> Learn/Check
              <b>{finishedPractical}/{roster.length}</b> Practice
            </span>
            <Icon name="down" className="tc-lesson-caret" />
          </button>

          {open && <div className="tc-lesson-panel">
            <dl className="tc-facts">
              <div><dt>Learn / Check done</dt><dd>{finishedLesson}<small>of {roster.length} students</small></dd></div>
              <div><dt>Practice attempted</dt><dd>{finishedPractical}<small>of {roster.length} students</small></dd></div>
              <div><dt>Passing</dt><dd>{passing}<small>at {passMark}% pass mark</small></dd></div>
              <div><dt>Runs</dt><dd className="tc-fact-dates">{item.opens} — {item.due || "no end date"}<small>{item.module.domain} · v{item.module.version}</small></dd></div>
            </dl>

            {roster.length === 0 ? <Empty text="No learners are enrolled in this class yet." /> : <div className="tc-table-scroll"><table className="sa-table tc-table-mid">
              <thead><tr><th>Student</th><th>Student ID</th><th>Learn / Check</th><th>Check score</th><th>Practice</th><th>Practice score</th><th>Pass / Fail</th><th>Reaction time</th><th>Answers</th></tr></thead>
              <tbody>{standings.map(standing => {
                const attempt = standing.attempt;
                const openAnswers = () => { if (attempt) setShowing({ row: attempt, module: item.module, student: standing.student }); };
                return <tr key={standing.student.id} className={attempt ? "tc-row-openable" : ""} onClick={openAnswers}
                  tabIndex={attempt ? 0 : undefined} onKeyDown={event => { if (event.key === "Enter") openAnswers(); }}>
                <td><strong>{nameOf(standing.student)}</strong></td>
                <td className="sa-mono sa-dim">{standing.student.name}</td>
                <td>{standing.lessonDone ? <Pill>Complete</Pill> : <Pill>Pending</Pill>}</td>
                <td className="sa-dim">{standing.quizBest === null ? "—" : `${standing.quizBest}%`}</td>
                <td>{standing.practicalDone ? <Pill>Complete</Pill> : <Pill>Pending</Pill>}</td>
                <td className={standing.passed === false ? "sa-below" : ""}>{standing.score === null ? <span className="sa-dim">—</span> : `${standing.score}%`}</td>
                <td>{standing.passed === null ? <span className="sa-dim">{standing.awaiting ? "Awaiting review" : "Not attempted"}</span> : <Pill>{standing.passed ? "Verified" : "Pending"}</Pill>}</td>
                <td className="sa-dim">{standing.reaction === null ? "Unavailable" : `${standing.reaction.toFixed(1)}s active`}</td>
                <td className="sa-cell-actions">{attempt
                  ? <button type="button" className="sa-ghost" onClick={event => { event.stopPropagation(); openAnswers(); }}><Icon name="search" />View answers</button>
                  : <span className="sa-dim">—</span>}</td>
              </tr>;
              })}</tbody>
            </table></div>}

            <div className="tc-lesson-actions">
              <p>Resetting clears this lesson for the whole class so they can work through it again.</p>
              <button type="button" className="sa-ghost sa-danger" onClick={() => setResetting(item)}>
                <Icon name="restore" />Reset this lesson
              </button>
            </div>
          </div>}
        </li>;
      })}
    </ul>
    <Note>Open or close lessons, and set dates, under Assessment details. Only open lessons appear here and on the student app.</Note>

    {resetting && (() => {
      const scope: ResetScope = { sectionId: section.id, moduleId: resetting.module.id };
      const counts = resetCounts(users, assessments, scope, progress);
      return <ResetDialog
        title={`Reset ${resetting.module.name}?`}
        scopeLabel={`${section.name} · this lesson only`}
        students={counts.students}
        attempts={counts.attempts}
        onClose={() => setResetting(null)}
        onConfirm={async password => {
          await api("/api/teacher/reset", "POST", { password, sectionId: section.id, moduleId: resetting.module.id });
          refresh();
          say(`${resetting.module.name} was reset for this class.`);
          setResetting(null);
        }} />;
    })()}
  </Panel>;
}

/* Assessment details ------------------------------------------------------ */

function AssessmentDetails({ section }: { section: Section }) {
  const store = useData();
  const { users, assessments, assignments, modules, progress, setSections, setAssignments, settings, refresh, log, say } = store;
  const [resetting, setResetting] = useState(false);
  const lessons = allLessons(assignments, modules, section.id);
  const available = lessons.filter(item => item.available);
  const practicalOpen = section.practicalOpen ?? true;
  const passMark = section.passingScore ?? settings.practicalPass;

  const patchSection = (changes: Partial<Section>, action: string, message: string) => {
    setSections(current => current.map(row => (row.id === section.id ? { ...row, ...changes } : row)));
    log(action, `${section.name} · ${message}`);
    say(message);
  };

  /** Ticking a lesson publishes it to this class; unticking withdraws it.
      Completed attempts are never touched either way. */
  function toggleLesson(item: ClassLesson, next: boolean) {
    if (item.assignment) {
      setAssignments(current => current.map(row => (row.id === item.assignment!.id ? { ...row, status: next ? "Published" : "Withdrawn" } : row)));
    } else if (next) {
      setAssignments(current => [...current, {
        id: `asg${Date.now()}`, moduleId: item.module.id, version: item.module.version, sectionId: section.id, tokens: [],
        opens: addDays(0), due: addDays(14), phases: "Learn and Practice", retries: 0, simulation: true, status: "Published",
      }]);
    }
    log(next ? "Lesson opened to class" : "Lesson closed to class", `${item.module.name} · ${section.name}`);
    say(`${item.module.name} is now ${next ? "available" : "unavailable"} to this class.`);
  }

  function setDate(item: ClassLesson, field: "opens" | "due", iso: string) {
    if (!item.assignment) return;
    const value = fromInputDate(iso);
    setAssignments(current => current.map(row => (row.id === item.assignment!.id ? { ...row, [field]: value } : row)));
    log("Lesson schedule updated", `${item.module.name} · ${section.name} · ${field === "opens" ? "opens" : "ends"} ${value}`);
  }

  return <Panel title="Assessment details" icon="settings" note="These settings apply to this class only. Completed attempts keep the pass mark they were scored against." wide>
    <div className="tc-settings">
      <details className="tc-availability">
        <summary>
          <span className="tc-setting-icon"><Icon name="curriculum" /></span>
          <span>
            <strong>Lesson availability</strong>
            <small>Choose which lessons this class can open, and when each one runs.</small>
          </span>
          <b>{available.length} of {lessons.length}</b>
          <Icon name="down" />
        </summary>

        <div className="tc-availability-body">
          <div className="tc-availability-head"><span>Lesson</span><span>Opens</span><span>Ends</span></div>
          <ul className="tc-availability-list">
            {lessons.map(item => <li key={item.module.id} className={item.available ? "is-on" : ""}>
              <label className="tc-check">
                <input type="checkbox" checked={item.available} onChange={event => toggleLesson(item, event.target.checked)} />
                <span>
                  <strong>{String(item.module.id).padStart(2, "0")}. {item.module.name}</strong>
                  <small>{item.module.domain} · {moduleHasAppPack(item.module) ? "In app" : "Coming soon"}</small>
                </span>
              </label>
              <label className="tc-date">
                <span className="tc-date-label">Opens</span>
                <input type="date" value={toInputDate(item.opens)} disabled={!item.available} onChange={event => setDate(item, "opens", event.target.value)} aria-label={`${item.module.name} opens`} />
              </label>
              <label className="tc-date">
                <span className="tc-date-label">Ends</span>
                <input type="date" value={toInputDate(item.due)} disabled={!item.available} onChange={event => setDate(item, "due", event.target.value)} aria-label={`${item.module.name} ends`} />
              </label>
            </li>)}
          </ul>
        </div>
      </details>

      <div className="tc-setting">
        <span className="tc-setting-icon"><Icon name="assessment" /></span>
        <div>
          <strong>Practical availability</strong>
          <small>When off, the practice scenario is hidden even for learners who finished the lesson. Recorded attempts are unaffected.</small>
        </div>
        <button type="button" className="tc-switch" aria-pressed={practicalOpen}
          onClick={() => patchSection({ practicalOpen: !practicalOpen }, practicalOpen ? "Practicals closed" : "Practicals opened", `Practicals are now ${practicalOpen ? "off" : "on"} for this class.`)}>
          <i /><b>{practicalOpen ? "On" : "Off"}</b>
        </button>
      </div>

      <div className="tc-setting">
        <span className="tc-setting-icon"><Icon name="graduation" /></span>
        <div>
          <strong>Passing percentage</strong>
          <small>The score a practical attempt must reach to count as a pass in this class. Changing it affects future attempts only.</small>
          <div className="tc-pass">
            <input type="range" min={50} max={100} step={5} value={passMark} aria-label="Passing percentage"
              onChange={event => patchSection({ passingScore: Number(event.target.value) }, "Pass mark updated", `Pass mark set to ${event.target.value}% for this class.`)} />
            <output>{passMark}%</output>
          </div>
        </div>
      </div>
    </div>
    <Note>Unticking a lesson does not delete anything. It controls what this class can open right now, and the dates say when the lesson runs.</Note>

    <div className="tc-danger">
      <div>
        <strong>Reset all lessons for this class</strong>
        <small>Clears every recorded attempt and rolls all {section.name} learners back to the start of the course. Use it when a class begins the material again — not to correct a single grade.</small>
      </div>
      <button type="button" className="sa-danger-button" onClick={() => setResetting(true)}><Icon name="restore" />Reset all lessons</button>
    </div>

    {resetting && (() => {
      const scope: ResetScope = { sectionId: section.id };
      const counts = resetCounts(users, assessments, scope, progress);
      return <ResetDialog
        title="Reset all lessons for this class?"
        scopeLabel={`${section.name} · every lesson`}
        students={counts.students}
        attempts={counts.attempts}
        onClose={() => setResetting(false)}
        onConfirm={async password => {
          await api("/api/teacher/reset", "POST", { password, sectionId: section.id });
          refresh();
          say(`Every lesson was reset for ${section.name}.`);
          setResetting(false);
        }} />;
    })()}
  </Panel>;
}
