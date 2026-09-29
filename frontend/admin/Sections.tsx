import { useState } from "react";
import Icon from "../shared/Icon";
import type { Section } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Field, Modal, Note, Panel, Pill, Toolbar } from "../shared/ui";

const newCode = (grade: string, name: string) => `SQ-${grade}${name.trim().slice(0, 1).toUpperCase() || "X"}-${Math.floor(100 + Math.random() * 900)}`;

export default function Sections() {
  const store = useData();
  const { users, sections, academicYears, academicTerms, setSections, setUsers, log, say, settings } = store;
  const [roster, setRoster] = useState<Section | null>(null);
  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);
  const [transfer, setTransfer] = useState<{ studentId: string; from: string } | null>(null);
  const teachers = users.filter(user => user.role === "Teacher" && user.status === "Active");
  const countOf = (id: string) => users.filter(user => user.role === "Student" && user.section === id && user.status === "Active").length;

  function save(section: Section, isNew: boolean) {
    setSections(current => (isNew ? [...current, section] : current.map(row => (row.id === section.id ? section : row))));
    log(isNew ? "Section created" : "Section updated", `${section.name} · grade ${section.grade} · ${section.teacherId ? store.nameOf(section.teacherId) : "unassigned"}`);
    say(`${section.name} saved.`);
    setEditing(null);
    setCreating(false);
  }

  return <>
    <Toolbar>
      <div><h2 className="sa-toolbar-title">Sections</h2><p className="sa-toolbar-note">Academic period · {settings.term}</p></div>
      <div className="sa-toolbar-right">
        <button type="button" className="sa-primary" onClick={() => setCreating(true)}><Icon name="plus" />Create section</button>
      </div>
    </Toolbar>

    <Panel title="All sections" note="Each section has one primary teacher. Teachers cannot assign themselves." wide>
      <div className="academic-table-scroll"><table className="sa-table">
        <thead><tr><th>Section ID</th><th>Display name</th><th>Academic year / Term</th><th>Grade</th><th>Primary teacher</th><th>Enrollment</th><th>Class code</th><th>Active students</th><th>State</th><th /></tr></thead>
        <tbody>{sections.map(section => <tr key={section.id} className={section.archived ? "sa-row-muted" : ""}>
          <td className="sa-mono">{section.id.toUpperCase()}</td>
          <td><strong>{section.name}</strong></td>
          <td>{academicTerms.find(term => term.id === section.termId)?.name ?? "Not assigned"}<small className="sa-cell-sub">{academicYears.find(year => academicTerms.some(term => term.id === section.termId && term.academicYearId === year.id))?.name ?? "No academic year"}</small></td>
          <td>{section.grade}</td>
          <td>{section.teacherId ? store.nameOf(section.teacherId) : <span className="sa-dim">Unassigned</span>}</td>
          <td><Pill>{section.archived ? "Revoked" : section.enrollment ? "Active" : "Pending"}</Pill></td>
          <td className="sa-mono">{section.code}</td>
          <td>{countOf(section.id)}</td>
          <td>{section.archived ? "Archived" : "Open"}</td>
          <td className="sa-cell-actions">
            <button type="button" className="sa-ghost" onClick={() => setRoster(section)}>Roster</button>
            <button type="button" className="sa-ghost" onClick={() => setEditing(section)}><Icon name="edit" />Edit</button>
          </td>
        </tr>)}</tbody>
      </table></div>
    </Panel>

    <Note>Archiving a section ends new learning assignments and enrollment. It does not delete research records and does not replace the defense-triggered deletion policy.</Note>

    {roster && <Modal title={`${roster.name} · token roster`} note={`Class code ${roster.code} · ${countOf(roster.id)} active learners · enrollment ${roster.enrollment ? "open" : "closed"}`} onClose={() => setRoster(null)}>
      <div className="sa-action-row">
        <button type="button" className="sa-ghost" onClick={() => { const code = newCode(roster.grade, roster.name.split("·")[1] ?? roster.name); setSections(current => current.map(row => (row.id === roster.id ? { ...row, code } : row))); setRoster({ ...roster, code }); log("Class code rotated", `${roster.name} · new enrollment locator issued`); say("Class code rotated. The previous code no longer enrolls new learners."); }}><Icon name="audit" />Rotate class code</button>
        <button type="button" className="sa-ghost" onClick={() => { setSections(current => current.map(row => (row.id === roster.id ? { ...row, enrollment: !row.enrollment } : row))); setRoster({ ...roster, enrollment: !roster.enrollment }); log(roster.enrollment ? "Enrollment closed" : "Enrollment opened", roster.name); say(`Enrollment ${roster.enrollment ? "closed" : "opened"} for ${roster.name}.`); }}>{roster.enrollment ? "Close enrollment" : "Open enrollment"}</button>
      </div>
      {countOf(roster.id) === 0 ? <Empty text="No active learners enrolled in this section yet." /> : <table className="sa-table">
        <thead><tr><th>Token</th><th>Participation</th><th>Consent</th><th>Assent</th><th>Modules</th><th /></tr></thead>
        <tbody>{users.filter(user => user.role === "Student" && user.section === roster.id).map(student => <tr key={student.id}>
          <td className="sa-mono">{student.name}</td>
          <td><Pill>{student.status}</Pill></td>
          <td>{student.consent ? "Verified" : "Not verified"}</td>
          <td>{student.assent ? "Given" : "Not given"}</td>
          <td>{student.completed}/15</td>
          <td><button type="button" className="sa-ghost" onClick={() => setTransfer({ studentId: student.id, from: roster.id })}>Transfer</button></td>
        </tr>)}</tbody>
      </table>}
      <Note>A class code is an enrollment locator, never permission to view or select every child in the class. The token-to-name list stays in the section teacher physical custody.</Note>
    </Modal>}

    {transfer && <Modal title="Coordinate a transfer" note={`${store.nameOf(transfer.studentId)} · currently in ${store.sectionOf(transfer.from)}`} onClose={() => setTransfer(null)}>
      <ul className="sa-pick-list">{sections.filter(section => section.id !== transfer.from && !section.archived).map(section => <li key={section.id}>
        <div><strong>{section.name}</strong><small>Grade {section.grade} · {section.teacherId ? store.nameOf(section.teacherId) : "Unassigned"}</small></div>
        <button type="button" className="sa-ghost" onClick={() => {
          setUsers(current => current.map(row => (row.id === transfer.studentId ? { ...row, section: section.id } : row)));
          log("Student transferred", `${store.nameOf(transfer.studentId)} · ${store.sectionOf(transfer.from)} → ${section.name}`);
          say("Transfer recorded. Assessment history is preserved and the previous teacher ordinary access ends.");
          setTransfer(null);
          setRoster(null);
        }}>Move here</button>
      </li>)}</ul>
      <Note>Transfers preserve historical records. The new authorized teacher receives the section permitted history; guardian relationships are reviewed for continued authorization.</Note>
    </Modal>}

    {(editing || creating) && <SectionForm
      section={editing}
      teachers={teachers.map(teacher => ({ id: teacher.id, name: teacher.name }))}
      onClose={() => { setEditing(null); setCreating(false); }}
      onSave={save}
      onArchive={section => { setSections(current => current.map(row => (row.id === section.id ? { ...row, archived: !row.archived, enrollment: false } : row))); log(section.archived ? "Section restored" : "Section archived", section.name); say(`${section.name} ${section.archived ? "restored" : "archived"}.`); setEditing(null); }}
    />}
  </>;
}

function SectionForm({ section, teachers, onClose, onSave, onArchive }: { section: Section | null; teachers: { id: string; name: string }[]; onClose: () => void; onSave: (section: Section, isNew: boolean) => void; onArchive: (section: Section) => void }) {
  const { academicYears, academicTerms, grades } = useData();
  const [termId, setTermId] = useState(section?.termId ?? academicTerms[0]?.id ?? "");
  const [grade, setGrade] = useState(section?.grade ?? "");
  const yearId = academicTerms.find(term => term.id === termId)?.academicYearId;
  const ownGrades = grades.filter(row => row.academicYearId === yearId);
  return <Modal title={section ? `Edit ${section.name}` : "Create a section"} note="Section records hold no student identity fields." onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const grade = String(data.get("grade"));
      const name = String(data.get("name"));
      onSave({
        id: section?.id ?? `s${Date.now()}`,
        name, grade,
        teacherId: String(data.get("teacher")),
        code: section?.code ?? newCode(grade, name),
        enrollment: data.get("enrollment") === "on",
        archived: section?.archived,
        termId: String(data.get("term")),
      }, !section);
    }}>
      <Field label="Display name"><input name="name" required defaultValue={section?.name} placeholder="Grade 4 · Mahogany" /></Field>
      <Field label="Academic year / Term" hint="This places the section in the selected year and term, under its grade level."><select name="term" required value={termId} onChange={event => { setTermId(event.target.value); setGrade(""); }}><option value="">Choose a term</option>{academicTerms.map(term => <option key={term.id} value={term.id}>SY {academicYears.find(year => year.id === term.academicYearId)?.name} · {term.name}</option>)}</select></Field>
      <div className="sa-form-pair">
        <Field label="Grade level" hint={ownGrades.length ? undefined : "Add a grade level inside this academic year first."}><select name="grade" required value={grade} onChange={event => setGrade(event.target.value)}><option value="">Choose a grade level</option>{ownGrades.map(row => <option key={row.id} value={row.level}>Grade {row.level}</option>)}</select></Field>
        <Field label="Primary teacher"><select name="teacher" defaultValue={section?.teacherId ?? ""}><option value="">Unassigned</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></Field>
      </div>
      <label className="sa-check"><input type="checkbox" name="enrollment" defaultChecked={section ? section.enrollment : true} /><span>Open for enrollment</span></label>
      <div className="sa-action-row">
        <button type="submit" className="sa-primary">{section ? "Save section" : "Create section"}<Icon name="check" /></button>
        {section && <button type="button" className="sa-ghost sa-danger" onClick={() => onArchive(section)}>{section.archived ? "Restore section" : "Archive section"}</button>}
      </div>
    </form>
  </Modal>;
}
