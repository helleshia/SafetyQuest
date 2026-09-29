import { useState } from "react";
import type { AcademicTerm, AcademicYear, GradeLevel, Section, User } from "../shared/demo";
import { useData } from "../shared/store";
import { Field, Modal, Note } from "../shared/ui";
import { normalizeStudentId, normalizeYear, studentError, yearError } from "./academicValidation";

export type AcademicForm =
  | { kind: "year"; id?: string }
  | { kind: "grade"; yearId: string; id?: string }
  | { kind: "section"; yearId: string; grade: string; termId: string; id?: string }
  | { kind: "student"; sectionId: string; id?: string }
  | { kind: "teacher"; sectionId: string };
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export default function AcademicForms({ target, onClose }: { target: AcademicForm; onClose: () => void }) {
  if (target.kind === "year") return <YearForm target={target} onClose={onClose} />;
  if (target.kind === "grade") return <GradeForm target={target} onClose={onClose} />;
  if (target.kind === "section") return <SectionForm target={target} onClose={onClose} />;
  if (target.kind === "student") return <StudentForm target={target} onClose={onClose} />;
  return <TeacherForm target={target} onClose={onClose} />;
}

function YearForm({ target, onClose }: { target: Extract<AcademicForm, { kind: "year" }>; onClose: () => void }) {
  const { academicYears, setAcademicYears, setAcademicTerms, log, say } = useData();
  const existing = academicYears.find(year => year.id === target.id);
  const [error, setError] = useState("");
  return <Modal title={existing ? "Edit Academic Year" : "Add Academic Year"} onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      const name = normalizeYear(text(data, "name"));
      const invalid = yearError(name, academicYears, existing?.id);
      if (invalid) { setError(invalid); return; }
      const next: AcademicYear = { id: existing?.id ?? id("ay"), name, status: text(data, "status") as AcademicYear["status"] };
      setAcademicYears(rows => existing ? rows.map(row => row.id === next.id ? next : row) : [...rows, next]);
      const termName = text(data, "term");
      if (!existing && termName) {
        const term: AcademicTerm = { id: id("term"), academicYearId: next.id, name: termName, status: "Active", starts: "", ends: "" };
        setAcademicTerms(rows => [...rows, term]);
      }
      log(existing ? "Academic year updated" : "Academic year created", `SY ${name}`); say(`Academic year ${name} saved.`); onClose();
    }}>
      <Field label="Academic year" hint="Use consecutive years, for example 2027-2028."><input name="name" required maxLength={15} defaultValue={existing?.name} placeholder="2027-2028" autoFocus /></Field>
      <Field label="Status"><select name="status" defaultValue={existing?.status ?? "Active"}><option>Active</option><option>Archived</option></select></Field>
      {!existing && <Field label="Quarter or term (optional)" hint="Add a custom label such as Quarter 1, Term 1, or First Semester."><input name="term" maxLength={80} placeholder="Quarter 1" /></Field>}
      {!existing && <Note>A new year does not force a semester. Add a quarter or term label only if your school uses one.</Note>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="sa-primary">{existing ? "Save Changes" : "Add Academic Year"}</button>
    </form>
  </Modal>;
}

function GradeForm({ target, onClose }: { target: Extract<AcademicForm, { kind: "grade" }>; onClose: () => void }) {
  const { academicYears, grades, setGrades, academicTerms, sections, log, say } = useData();
  const existing = grades.find(grade => grade.id === target.id);
  const year = academicYears.find(row => row.id === target.yearId);
  const [error, setError] = useState("");
  const hasSections = !!existing && sections.some(section => section.grade === existing.level && academicTerms.some(term => term.id === section.termId && term.academicYearId === target.yearId));
  return <Modal title={existing ? "Edit Grade Level" : "Add Grade Level"} note={`SY ${year?.name}`} onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const level = String(Number(text(data, "level")));
      if (!year || !Number.isInteger(Number(level)) || Number(level) < 1 || Number(level) > 12) { setError("Choose a grade level from 1 to 12."); return; }
      if (grades.some(row => row.academicYearId === year.id && row.level === level && row.id !== existing?.id)) { setError("This grade level already exists in the selected academic year."); return; }
      if (hasSections && existing?.level !== level) { setError("A grade level with sections cannot be renumbered."); return; }
      const next: GradeLevel = { id: existing?.id ?? id("grade"), academicYearId: year.id, level };
      setGrades(rows => existing ? rows.map(row => row.id === next.id ? next : row) : [...rows, next]);
      log(existing ? "Grade level updated" : "Grade level created", `Grade ${level} · SY ${year.name}`); say(`Grade ${level} saved.`); onClose();
    }}>
      <Field label="Grade level"><input name="level" type="number" min={1} max={12} step={1} required defaultValue={existing?.level} readOnly={hasSections} autoFocus /></Field>
      {hasSections && <Note>This grade already contains sections, so its number is locked.</Note>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="sa-primary">{existing ? "Save Changes" : "Add Grade Level"}</button>
    </form>
  </Modal>;
}

function SectionForm({ target, onClose }: { target: Extract<AcademicForm, { kind: "section" }>; onClose: () => void }) {
  const { academicYears, academicTerms, grades, sections, users, setSections, log, say } = useData();
  const existing = sections.find(section => section.id === target.id);
  const [error, setError] = useState("");
  const ownTerms = academicTerms.filter(term => term.academicYearId === target.yearId);
  const teachers = users.filter(user => user.role === "Teacher" && user.status === "Active");
  const year = academicYears.find(row => row.id === target.yearId);
  return <Modal title={existing ? "Edit Section" : "Add Section"} note={`SY ${year?.name} · Grade ${target.grade}`} onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const name = text(data, "name"); const termId = text(data, "term"); const teacherId = text(data, "teacher");
      if (!year || !grades.some(grade => grade.academicYearId === year.id && grade.level === target.grade) || !ownTerms.some(term => term.id === termId)) { setError("Choose a valid academic year, grade, and term."); return; }
      if (!name) { setError("Enter a section name."); return; }
      if (sections.some(row => row.id !== existing?.id && row.grade === target.grade && row.termId === termId && row.name.toLowerCase() === name.toLowerCase())) { setError("A section with this name already exists in this grade and term."); return; }
      if (teacherId && !teachers.some(teacher => teacher.id === teacherId)) { setError("Choose an active teacher."); return; }
      const next: Section = { ...existing, id: existing?.id ?? id("section"), name, grade: target.grade, termId, teacherId, code: existing?.code ?? `SQ-${target.grade}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, enrollment: !existing?.archived && data.get("enrollment") === "on" };
      setSections(rows => existing ? rows.map(row => row.id === next.id ? next : row) : [...rows, next]);
      log(existing ? "Section updated" : "Section created", `${name} · Grade ${target.grade} · SY ${year.name}`); say(`Section ${name} saved.`); onClose();
    }}>
      <Field label="Section name"><input name="name" required maxLength={80} defaultValue={existing?.name} placeholder="Mahogany" autoFocus /></Field>
      <Field label="Term"><select name="term" required defaultValue={existing?.termId ?? target.termId}>{ownTerms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}</select></Field>
      <Field label="Teacher (optional)"><select name="teacher" defaultValue={existing?.teacherId ?? ""}><option value="">Assign later</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></Field>
      <label className="sa-check"><input name="enrollment" type="checkbox" disabled={existing?.archived} defaultChecked={existing ? existing.enrollment : true} />Open enrollment</label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="sa-primary">{existing ? "Save Changes" : "Add Section"}</button>
    </form>
  </Modal>;
}

function StudentForm({ target, onClose }: { target: Extract<AcademicForm, { kind: "student" }>; onClose: () => void }) {
  const { users, sections, setUsers, setAssignments, log, say } = useData();
  const existing = users.find(user => user.id === target.id && user.role === "Student" && user.section === target.sectionId);
  const section = sections.find(row => row.id === target.sectionId);
  const [error, setError] = useState("");
  return <Modal title={existing ? "Edit Student" : "Add Student"} note={section?.name} onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const studentName = text(data, "name"); const token = normalizeStudentId(text(data, "student-id"));
      const invalid = studentError(studentName, token, users, existing?.id);
      if (invalid) { setError(invalid); return; }
      if (!section || section.archived) { setError("This section is archived or no longer exists."); return; }
      const next: User = { ...(existing ?? { id: id("student"), email: "", role: "Student", section: section.id, completed: 0, score: 0, consent: false, assent: false, activated: false, enrolled: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) }), name: token, studentName, status: text(data, "status") as User["status"] };
      setUsers(rows => existing ? rows.map(row => row.id === next.id ? next : row) : [...rows, next]);
      if (existing && existing.name !== token) setAssignments(rows => rows.map(row => ({ ...row, tokens: row.tokens.map(value => value === existing.name ? token : value) })));
      log(existing ? "Student updated" : "Student created", `${token} · ${section.name}`); say(`Student ${studentName} saved.`); onClose();
    }}>
      <Field label="Student full name"><input name="name" required maxLength={100} defaultValue={existing?.studentName} placeholder="Student's full name" autoFocus /></Field>
      <Field label="Student ID" hint="Must be unique across all student accounts."><input name="student-id" required maxLength={40} defaultValue={existing?.name} placeholder="SQ-G4-037" /></Field>
      <Field label="Account status" hint="A Pending student becomes Active on their own once they finish setup in the mobile app."><select name="status" defaultValue={existing?.status ?? "Pending"}><option>Pending</option><option>Active</option><option>Suspended</option></select></Field>
      <Note>Adding a student does not verify consent or record assent. The student creates their own password in the mobile app, confirms a parent contact, and that activates the account.</Note>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="sa-primary">{existing ? "Save Changes" : "Add Student"}</button>
    </form>
  </Modal>;
}

function TeacherForm({ target, onClose }: { target: Extract<AcademicForm, { kind: "teacher" }>; onClose: () => void }) {
  const { users, sections, setUsers, setSections, log, say } = useData();
  const section = sections.find(row => row.id === target.sectionId);
  const [mode, setMode] = useState("existing"); const [error, setError] = useState("");
  const teachers = users.filter(user => user.role === "Teacher" && user.status === "Active");
  return <Modal title="Add / Assign Teacher" note={`${section?.name} · One primary teacher per section`} onClose={onClose}>
    <form className="sa-form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      if (!section || section.archived) { setError("This section is archived or no longer exists."); return; }
      let teacherId = text(data, "teacher");
      if (mode === "new") {
        const name = text(data, "name"); const email = text(data, "email").toLowerCase();
        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter the teacher's name and a valid email."); return; }
        if (users.some(user => user.email.toLowerCase() === email)) { setError("This email already belongs to an account. Select the existing teacher instead."); return; }
        teacherId = id("teacher");
        setUsers(rows => [...rows, { id: teacherId, name, email, role: "Teacher", status: "Active", section: "", completed: 0, score: 0, consent: false, assent: false }]);
      } else if (teacherId && !teachers.some(teacher => teacher.id === teacherId)) { setError("Choose an active teacher."); return; }
      setSections(rows => rows.map(row => row.id === section.id ? { ...row, teacherId } : row));
      log("Section teacher updated", `${section.name} · ${teacherId ? "Primary teacher assigned" : "Teacher assignment removed"}`); say("Section teacher saved."); onClose();
    }}>
      <Field label="Teacher option"><select value={mode} onChange={event => { setMode(event.target.value); setError(""); }}><option value="existing">Assign an existing teacher</option><option value="new">Add a new teacher record</option></select></Field>
      {mode === "existing" ? <Field label="Teacher"><select name="teacher" defaultValue={section?.teacherId ?? ""}><option value="">No teacher / Remove assignment</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></Field> : <><Field label="Teacher full name"><input name="name" required maxLength={100} /></Field><Field label="Teacher email"><input name="email" type="email" required /></Field><Note>A teacher directory record is saved and assigned here. No invitation, sign-in account, or credentials are sent.</Note></>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="sa-primary">Save Teacher</button>
    </form>
  </Modal>;
}
