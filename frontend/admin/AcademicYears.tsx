import { useState } from "react";
import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Empty, Modal, Note, Pager, Panel, Pill, Select, Toolbar } from "../shared/ui";
import Curriculum from "./Curriculum";
import AcademicForms, { type AcademicForm } from "./AcademicForms";
import AcademicActionMenu from "./AcademicActionMenu";
import AcademicIdentity from "./AcademicIdentity";
import StudentDetails from "./StudentDetails";
import ExcelStudentUpload from "./ExcelStudentUpload";
import { gradeLevels, sectionsForGrade, sectionsForTerm, studentsForSection, termsForYear } from "./academicScope";
import { displayStudentName, sectionDeleteReason, studentDeleteReason } from "./academicValidation";
import "./academic.css";

type Location = { yearId: string; grade: string; sectionId: string; studentId: string; library: boolean };
type DeleteTarget = { kind: "year" | "grade" | "section" | "student"; id: string };
const ROOT: Location = { yearId: "", grade: "", sectionId: "", studentId: "", library: false };
const PAGE_SIZE = 8;

export default function AcademicYears() {
  const store = useData();
  const { academicYears: years, academicTerms: terms, grades, sections, users, modules, assignments, assessments, links, setAcademicYears, setAcademicTerms, setGrades, setSections, setUsers, nameOf, log, say } = store;
  const [location, setLocation] = useState<Location>(ROOT);
  const [termId, setTermId] = useState("");
  const [form, setForm] = useState<AcademicForm | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [excelOpen, setExcelOpen] = useState(false);
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("All statuses"); const [page, setPage] = useState(0);
  const year = years.find(item => item.id === location.yearId);
  const yearTerms = termsForYear(terms, year?.id ?? "");
  const term = yearTerms.find(item => item.id === termId) ?? yearTerms[0];
  const termSections = sectionsForTerm(sections, terms, year?.id ?? "", term?.id ?? "");
  const yearGrades = gradeLevels(grades, year?.id ?? "");
  const gradeSections = sectionsForGrade(termSections, location.grade);
  const section = gradeSections.find(item => item.id === location.sectionId);
  const students = studentsForSection(users, gradeSections, section?.id ?? "");
  const student = students.find(item => item.id === location.studentId);
  const filtered = students.filter(item => (status === "All statuses" || item.status === status) && `${item.studentName ?? ""} ${item.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  const shown = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const scopeLabel = year ? `SY ${year.name} · ${term?.name ?? "No term"}` : "Academic Year → Grade Level → Section → Students";

  function navigate(next: Location) { setLocation(next); setQuery(""); setStatus("All statuses"); setPage(0); setForm(null); setDeleting(null); }
  function openYear(yearId: string) { const ownTerms = termsForYear(terms, yearId); setTermId((ownTerms.find(item => item.status === "Active") ?? ownTerms[0])?.id ?? ""); navigate({ ...ROOT, yearId }); }
  function sectionForm(id?: string): AcademicForm { return { kind: "section", yearId: year!.id, grade: location.grade, termId: term?.id ?? "", id }; }
  function openStudent(studentId: string) {
    const selected = students.find(item => item.id === studentId); if (!selected) return;
    log("Student record viewed", `${selected.name} · ${scopeLabel}`);
    setForm(null); setDeleting(null); setLocation({ ...location, studentId }); window.scrollTo({ top: 0 });
  }
  function backToStudents() { setLocation(current => ({ ...current, studentId: "" })); window.scrollTo({ top: 0 }); }

  const deleteSection = sections.find(item => deleting?.kind === "section" && item.id === deleting.id);
  const deleteStudent = users.find(item => deleting?.kind === "student" && item.id === deleting.id && item.role === "Student");
  const deleteYear = years.find(item => deleting?.kind === "year" && item.id === deleting.id);
  const deleteGrade = grades.find(item => deleting?.kind === "grade" && item.id === deleting.id);
  const deleteLabel = deleteSection?.name ?? (deleteStudent ? `${displayStudentName(deleteStudent)} (${deleteStudent.name})` : undefined) ?? (deleteYear ? `SY ${deleteYear.name}` : undefined) ?? (deleteGrade ? `Grade ${deleteGrade.level}` : "Record");
  const gradeHasSections = deleteGrade && sections.some(item => item.grade === deleteGrade.level && terms.some(ownTerm => ownTerm.id === item.termId && ownTerm.academicYearId === deleteGrade.academicYearId));
  const yearHasSections = deleteYear && sections.some(item => terms.some(ownTerm => ownTerm.id === item.termId && ownTerm.academicYearId === deleteYear.id));
  const deleteReason = deleteSection ? sectionDeleteReason(deleteSection.id, users, assignments, assessments) : deleteStudent ? studentDeleteReason(deleteStudent.id, assessments, links, assignments, deleteStudent.name) : gradeHasSections ? "This grade level still contains sections. Remove empty sections first. Populated sections must remain with their grade level to preserve records." : yearHasSections ? "This academic year still contains sections. It cannot be deleted while those sections exist; archive the year instead." : "";

  function confirmDelete() {
    if (!deleting || deleteReason) return;
    if (deleteSection) { setSections(rows => rows.filter(row => row.id !== deleteSection.id)); if (location.sectionId === deleteSection.id) navigate({ ...ROOT, yearId: location.yearId, grade: location.grade }); }
    else if (deleteStudent) { setUsers(rows => rows.filter(row => row.id !== deleteStudent.id)); setLocation(current => ({ ...current, studentId: "" })); setPage(0); }
    else if (deleteGrade) setGrades(rows => rows.filter(row => row.id !== deleteGrade.id));
    else if (deleteYear) { setAcademicYears(rows => rows.filter(row => row.id !== deleteYear.id)); setAcademicTerms(rows => rows.filter(row => row.academicYearId !== deleteYear.id)); setGrades(rows => rows.filter(row => row.academicYearId !== deleteYear.id)); }
    else return;
    log("Record deleted", `${deleting.kind} · ${deleteLabel}`); say(`${deleteLabel} deleted.`); setDeleting(null);
  }

  function archiveSection(sectionId: string) {
    const current = sections.find(item => item.id === sectionId); if (!current) return;
    setSections(rows => rows.map(row => row.id === sectionId ? { ...row, archived: !row.archived, enrollment: false } : row));
    log(current.archived ? "Section restored" : "Section archived", current.name); say(`${current.name} ${current.archived ? "restored" : "archived"}. Student records were preserved.`);
  }

  return <div className="academic-workspace">
    {!student && <Toolbar>
      <div><h2 className="sa-toolbar-title">{!year ? "Academic years" : location.library ? "Curriculum" : section ? "Student accounts" : location.grade ? `Grade ${location.grade} · Sections` : `SY ${year.name} · Grade levels`}</h2><p className="sa-toolbar-note">{scopeLabel}</p></div>
      <div className="sa-toolbar-right academic-filters">
        {year && <label className="sa-select academic-excel">
          <span>Excel</span>
          <button type="button" onClick={() => setExcelOpen(true)} aria-label="Upload students from Excel">Upload students</button>
          <Icon name="download" />
        </label>}
        {!year && <button type="button" className="sa-primary" onClick={() => setForm({ kind: "year" })}><Icon name="plus" />Add Academic Year</button>}
        {year && !location.grade && !location.library && <button type="button" className="sa-primary" onClick={() => setForm({ kind: "grade", yearId: year.id })}><Icon name="plus" />Add Grade Level</button>}
        {year && location.grade && !section && !location.library && <button type="button" className="sa-primary" disabled={!term} onClick={() => setForm(sectionForm())}><Icon name="plus" />Add Section</button>}
        {section && <><button type="button" className="sa-ghost" disabled={section.archived} onClick={() => setForm({ kind: "teacher", sectionId: section.id })}><Icon name="users" />Add / Assign Teacher</button><button type="button" className="sa-primary" disabled={section.archived} onClick={() => setForm({ kind: "student", sectionId: section.id })}><Icon name="plus" />Add Student</button></>}
      </div>
    </Toolbar>}
    <nav className="academic-breadcrumb" aria-label="Academic hierarchy"><button type="button" onClick={() => navigate(ROOT)} aria-current={!year ? "page" : undefined}>Academic Year</button>{year && <><Icon name="chevron" /><button type="button" onClick={() => openYear(year.id)} aria-current={!location.grade && !location.library ? "page" : undefined}>SY {year.name}</button></>}{location.grade && <><Icon name="chevron" /><button type="button" onClick={() => navigate({ ...ROOT, yearId: location.yearId, grade: location.grade })} aria-current={!section ? "page" : undefined}>Grade {location.grade}</button></>}{section && <><Icon name="chevron" />{student ? <button type="button" onClick={backToStudents}>{section.name} / Students</button> : <span aria-current="page">{section.name} / Students</span>}</>}{student && <><Icon name="chevron" /><span aria-current="page">{displayStudentName(student)} ({student.name})</span></>}{location.library && <><Icon name="chevron" /><span aria-current="page">Curriculum</span></>}</nav>

    {!year && <Panel title="Academic years" icon="calendar" note="Your school years, organized in one place." wide>
      {years.length === 0 ? <Empty text="No academic years yet. Select Add Academic Year to start." /> : <div className="academic-table-scroll academic-directory"><table className="sa-table"><thead><tr><th>Academic year</th><th>Grade levels</th><th>Sections</th><th>Status</th><th>Actions</th></tr></thead><tbody>{years.map(item => {
        const ownTerms = termsForYear(terms, item.id); const count = sections.filter(row => ownTerms.some(ownTerm => ownTerm.id === row.termId)).length;
        return <tr key={item.id}><td><AcademicIdentity icon="calendar" label={`SY ${item.name}`} onClick={() => openYear(item.id)} /></td><td><span className="academic-count"><Icon name="graduation" />{grades.filter(grade => grade.academicYearId === item.id).length}</span></td><td><span className="academic-count"><Icon name="sections" />{count}</span></td><td><Pill>{item.status}</Pill></td><td><div className="academic-row-actions"><button type="button" className="academic-open-button" title={`Open SY ${item.name}`} aria-label={`Open SY ${item.name}`} onClick={() => openYear(item.id)}><Icon name="chevron" /></button><AcademicActionMenu label={`SY ${item.name}`} actions={[{ label: "Open academic year", icon: "arrow", onSelect: () => openYear(item.id) }, { label: "Edit academic year", icon: "edit", onSelect: () => setForm({ kind: "year", id: item.id }) }, { label: "Delete academic year", icon: "trash", danger: true, onSelect: () => setDeleting({ kind: "year", id: item.id }) }]} /></div></td></tr>;
      })}</tbody></table></div>}
    </Panel>}

    {year && !location.grade && !location.library && <Panel title="Grade levels" icon="graduation" note="Browse the grades in this school year. Counts reflect the selected term." action={<button type="button" className="sa-ghost" onClick={() => navigate({ ...ROOT, yearId: year.id, library: true })}><Icon name="curriculum" />Curriculum modules</button>} wide>
      {yearGrades.length === 0 ? <Empty text="No grade levels in this academic year yet. Select Add Grade Level." /> : <div className="academic-table-scroll academic-directory"><table className="sa-table"><thead><tr><th>Grade level</th><th>Sections</th><th>Student accounts</th><th>Actions</th></tr></thead><tbody>{yearGrades.map(grade => {
        const ownSections = sectionsForGrade(termSections, grade.level); const count = users.filter(user => user.role === "Student" && ownSections.some(item => item.id === user.section)).length;
        return <tr key={grade.id}><td><AcademicIdentity icon="graduation" label={`Grade ${grade.level}`} tone="blue" onClick={() => navigate({ ...ROOT, yearId: year.id, grade: grade.level })} /></td><td><span className="academic-count"><Icon name="sections" />{ownSections.length}</span></td><td><span className="academic-count"><Icon name="users" />{count}</span></td><td><div className="academic-row-actions"><button type="button" className="academic-open-button" title={`View Grade ${grade.level} sections`} aria-label={`View Grade ${grade.level} sections`} onClick={() => navigate({ ...ROOT, yearId: year.id, grade: grade.level })}><Icon name="chevron" /></button><AcademicActionMenu label={`Grade ${grade.level}`} actions={[{ label: "View sections", icon: "sections", onSelect: () => navigate({ ...ROOT, yearId: year.id, grade: grade.level }) }, { label: "Edit grade level", icon: "edit", onSelect: () => setForm({ kind: "grade", yearId: year.id, id: grade.id }) }, { label: "Delete grade level", icon: "trash", danger: true, onSelect: () => setDeleting({ kind: "grade", id: grade.id }) }]} /></div></td></tr>;
      })}</tbody></table></div>}
    </Panel>}

    {year && location.library && <><button type="button" className="sa-ghost academic-back" onClick={() => openYear(year.id)}>Back to grade levels</button><Note>The baseline library is shared; publication changes apply globally, not only to this academic year.</Note><Curriculum /></>}

    {year && location.grade && !section && !location.library && <Panel title={`Grade ${location.grade} sections`} icon="sections" note="Your classrooms and the people behind them." wide>
      {gradeSections.length === 0 ? <Empty text="No sections yet. Select Add Section to create one in this grade and term." /> : <div className="academic-table-scroll academic-directory"><table className="sa-table"><thead><tr><th>Section</th><th>Teacher</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead><tbody>{gradeSections.map(item => <tr key={item.id}><td><AcademicIdentity icon="sections" label={item.name} onClick={() => navigate({ ...ROOT, yearId: year.id, grade: location.grade, sectionId: item.id })} /></td><td><span className="academic-person-label"><Icon name="person" />{item.teacherId ? nameOf(item.teacherId) : "Not assigned"}</span></td><td><span className="academic-count"><Icon name="users" />{studentsForSection(users, gradeSections, item.id).length}</span></td><td><Pill>{item.archived ? "Archived" : "Active"}</Pill></td><td><div className="academic-row-actions"><button type="button" className="academic-view-button" onClick={() => navigate({ ...ROOT, yearId: year.id, grade: location.grade, sectionId: item.id })}><Icon name="users" />Students</button><AcademicActionMenu label={item.name} actions={[{ label: "View students", icon: "users", onSelect: () => navigate({ ...ROOT, yearId: year.id, grade: location.grade, sectionId: item.id }) }, { label: "Edit section", icon: "edit", onSelect: () => setForm(sectionForm(item.id)) }, { label: "Assign teacher", icon: "person", disabled: item.archived, onSelect: () => setForm({ kind: "teacher", sectionId: item.id }) }, { label: item.archived ? "Restore section" : "Archive section", icon: item.archived ? "restore" : "archive", onSelect: () => archiveSection(item.id) }, { label: "Delete section", icon: "trash", danger: true, onSelect: () => setDeleting({ kind: "section", id: item.id }) }]} /></div></td></tr>)}</tbody></table></div>}
    </Panel>}

    {section && !student && <>
      <div className="sa-meta-bar"><span><b>Section</b>{section.name}</span><span><b>Teacher</b>{section.teacherId ? nameOf(section.teacherId) : "Not assigned"}</span><span><b>Enrollment</b>{section.enrollment && !section.archived ? "Open" : "Closed"}</span><Pill>{section.archived ? "Archived" : "Active"}</Pill><AcademicActionMenu label={section.name} actions={[{ label: "Edit section", icon: "edit", onSelect: () => setForm(sectionForm(section.id)) }, { label: section.archived ? "Restore section" : "Archive section", icon: section.archived ? "restore" : "archive", onSelect: () => archiveSection(section.id) }, { label: "Delete section", icon: "trash", danger: true, onSelect: () => setDeleting({ kind: "section", id: section.id }) }]} /></div>
      <Panel title="Students" icon="users" note="A clear view of your learners and their progress." wide>
        <div className="academic-student-toolbar"><label className="sa-search"><Icon name="search" /><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Search student name or ID" aria-label="Search student name or ID" /></label><Select label="Status" value={status} options={["All statuses", "Active", "Pending", "Suspended"]} onChange={value => { setStatus(value); setPage(0); }} /></div>
        {shown.length === 0 ? <Empty text={students.length ? "No students match these filters." : "No students yet. Select Add Student to enter a name and student ID."} /> : <div className="academic-table-scroll academic-directory"><table className="sa-table"><thead><tr><th>Student name</th><th>Student ID</th><th>Status</th><th>Modules</th><th>Actions</th></tr></thead><tbody>{shown.map(item => <tr key={item.id}><td><AcademicIdentity icon="person" label={displayStudentName(item)} tone="lavender" onClick={() => openStudent(item.id)} /></td><td className="sa-mono">{item.name}</td><td><Pill>{item.status}</Pill></td><td><span className="academic-count"><Icon name="curriculum" />{item.completed}/{modules.length}</span></td><td><div className="academic-row-actions"><button type="button" className="academic-open-button" title={`View ${item.name}`} aria-label={`View ${item.name}`} onClick={() => openStudent(item.id)}><Icon name="chevron" /></button><AcademicActionMenu label={item.name} actions={[{ label: "View account", icon: "person", onSelect: () => openStudent(item.id) }, { label: "Edit student", icon: "edit", disabled: section.archived, onSelect: () => setForm({ kind: "student", sectionId: section.id, id: item.id }) }, { label: "Delete student", icon: "trash", danger: true, onSelect: () => setDeleting({ kind: "student", id: item.id }) }]} /></div></td></tr>)}</tbody></table></div>}
        <Pager page={page} pages={Math.ceil(filtered.length / PAGE_SIZE)} total={filtered.length} onPage={setPage} />
      </Panel>
    </>}

    {student && section && <StudentDetails student={student} section={section} scopeLabel={scopeLabel} onEdit={() => setForm({ kind: "student", sectionId: section.id, id: student.id })} onDelete={() => setDeleting({ kind: "student", id: student.id })} />}
    {year && <button type="button" className="sa-ghost academic-back" onClick={() => student ? backToStudents() : section ? navigate({ ...ROOT, yearId: year.id, grade: location.grade }) : location.grade || location.library ? openYear(year.id) : navigate(ROOT)}><Icon name="arrow" className="academic-back-icon" />Back to {student ? "students" : section ? "sections" : location.grade || location.library ? "grade levels" : "academic years"}</button>}
    <p className="sa-footnote">Changes are saved to your school database. Student consent and mobile activation are managed separately.</p>

    {form && <AcademicForms key={JSON.stringify(form)} target={form} onClose={() => setForm(null)} />}
    {excelOpen && <ExcelStudentUpload
      sectionId={section?.id ?? ""}
      sectionName={section?.name ?? ""}
      sectionOptions={(location.grade ? gradeSections : termSections).filter(item => !item.archived).map(item => ({ id: item.id, name: item.name }))}
      onClose={() => setExcelOpen(false)}
    />}
    {deleting && <Modal title={`Delete ${deleting.kind === "year" ? "Academic Year" : deleting.kind === "grade" ? "Grade Level" : deleting.kind === "section" ? "Section" : "Student"}?`} note={deleteLabel} onClose={() => setDeleting(null)}>
      {deleteReason ? <Note>{deleteReason}</Note> : <Note>This deletes this record from the current preview session. It cannot be undone in this session. {deleteYear ? "Empty grade levels and terms in this year will also be removed." : "Related teacher accounts are not deleted."}</Note>}
      <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => setDeleting(null)}>Cancel</button><button type="button" className="sa-danger-button" disabled={!!deleteReason} onClick={confirmDelete}>Delete</button></div>
    </Modal>}
  </div>;
}
