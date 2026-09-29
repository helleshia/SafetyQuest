import { useEffect, useRef } from "react";
import Icon from "../shared/Icon";
import { type Section, type User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Note, Panel, Pill } from "../shared/ui";
import AcademicActionMenu from "./AcademicActionMenu";
import { displayStudentName } from "./academicValidation";
import { attemptScore } from "../../shared/scoring";

export default function StudentDetails({ student, section, scopeLabel, onEdit, onDelete }: {
  student: User; section: Section; scopeLabel: string; onEdit: () => void; onDelete: () => void;
}) {
  const { modules, assessments, moduleOf, nameOf } = useData();
  const heading = useRef<HTMLHeadingElement>(null);
  const records = assessments.filter(record => record.studentId === student.id && record.sectionId === section.id);
  const total = modules.length;
  const percent = total ? Math.round(student.completed / total * 100) : 0;
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [student.id]);

  return <article className="academic-student-page" aria-labelledby="student-details-heading">
    <header className="academic-student-header">
      <span className="academic-student-avatar"><Icon name="person" /></span>
      <div className="academic-student-heading">
        <p className="academic-eyebrow">Student account</p>
        <h2 id="student-details-heading" ref={heading} tabIndex={-1}>{displayStudentName(student)}</h2>
        <div className="academic-student-context"><span className="sa-mono">Student ID: {student.name}</span><Pill>{student.status}</Pill></div>
        <p className="academic-student-scope">{section.name} · {scopeLabel}</p>
      </div>
      <AcademicActionMenu label={student.name} actions={[
        { label: "Edit student", icon: "edit", disabled: section.archived, onSelect: onEdit },
        { label: "Delete student", icon: "trash", danger: true, onSelect: onDelete },
      ]} />
    </header>

    <div className="academic-student-overview">
      <Panel title="Account details" icon="person" wide>
        <dl className="academic-student-fields">
          <div><dt>Student name</dt><dd>{displayStudentName(student)}</dd></div>
          <div><dt>Student ID</dt><dd className="sa-mono">{student.name}</dd></div>
          <div><dt>Account status</dt><dd><Pill>{student.status}</Pill></dd></div>
          <div><dt>Mobile access</dt><dd>{student.activated ? "Activated" : "Not activated"}</dd></div>
          <div><dt>Physical consent</dt><dd>{student.consent ? "Verified offline" : "Not verified"}</dd></div>
          <div><dt>Student assent</dt><dd>{student.assent ? "Recorded" : "Not recorded"}</dd></div>
          <div><dt>Section</dt><dd>{section.name}</dd></div>
          <div><dt>Teacher</dt><dd>{section.teacherId ? nameOf(section.teacherId) : "Not assigned"}</dd></div>
        </dl>
      </Panel>
      <Panel title="Learning progress" icon="curriculum" wide>
        <div className="academic-student-progress"><strong>{student.completed}<span> / {total}</span></strong><span>Modules completed</span></div>
        <progress className="academic-progress-track" value={student.completed} max={total || 1} aria-label="Modules completed" />
        <p className="academic-progress-caption">{percent}% of the module library completed</p>
        <dl className="academic-student-fields academic-progress-fields">
          <div><dt>Latest learning activity</dt><dd>{student.lastActive || "Not recorded"}</dd></div>
          <div><dt>Assessment records</dt><dd>{records.length}</dd></div>
        </dl>
      </Panel>
    </div>

    <Panel title="Assessment records" icon="assessment" note="Recorded results and review status for this student in this section." wide>
      {!records.length ? <Empty text="No assessments recorded yet." /> : <div className="academic-table-scroll academic-directory"><table className="sa-table academic-assessment-table">
        <thead><tr><th>Module</th><th>Practice</th><th>Attempt quality</th><th>Review status</th></tr></thead>
        <tbody>{records.map(record => <tr key={record.id}>
          <td><strong>{moduleOf(record.moduleId)}</strong>{record.feedback && <small className="academic-assessment-feedback">Feedback: {record.feedback}</small>}</td>
          <td>{attemptScore(record)}%</td><td><Pill>{record.quality}</Pill></td><td><Pill>{record.review}</Pill></td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>
    <Note>Scores and assessment history are read-only here. Private activation credentials are never shown.</Note>
  </article>;
}
