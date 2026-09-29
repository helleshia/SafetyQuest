import { useMemo, useState } from "react";
import Icon from "../shared/Icon";
import type { Role, User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Field, Modal, Note, Pager, Panel, Pill, Search, Select, Toolbar } from "../shared/ui";
import UserDetails from "./UserDetails";
import UserEditor from "./UserEditor";
import AcademicActionMenu from "./AcademicActionMenu";
import { studentDeleteReason } from "./academicValidation";
import "./users.css";

const TABS: Role[] = ["Super Admin", "Teacher", "Parent", "Student"];
const PAGE_SIZE = 8;
const initials = (value: string) => value.split(/[\s·-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";

export default function Users() {
  const store = useData();
  const { users, sections, links, modules, setUsers, log, say } = store;
  const [tab, setTab] = useState<Role>("Teacher");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<User | null>(null);
  const [invite, setInvite] = useState(false);
  const [assigning, setAssigning] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const currentDetail = users.find(user => user.id === detail?.id);
  const deleteReason = !deleting ? "" : deleting.id === store.accountId ? "You cannot delete your own administrator account."
    : deleting.role === "Super Admin" && deleting.status === "Active" && users.filter(user => user.role === "Super Admin" && user.status === "Active").length <= 1 ? "The last active administrator cannot be deleted."
    : sections.some(section => section.teacherId === deleting.id) ? "Unassign this teacher's sections before deleting the account."
    : links.some(link => link.parentId === deleting.id || link.studentId === deleting.id) ? "This account has guardian links. Suspend it to preserve those records."
    : deleting.role === "Student" ? studentDeleteReason(deleting.id, store.assessments, links, store.assignments, deleting.name) : "";
  const dialogs = <>
    {(invite || editing) && <UserEditor role={editing?.role ?? tab} user={editing ?? undefined} onClose={() => { setInvite(false); setEditing(null); }} />}
    {deleting && <Modal title="Delete account?" note={deleting.studentName || deleting.name} onClose={() => setDeleting(null)}>
      <Note>{deleteReason || "This permanently deletes the account and its sign-in credentials. This cannot be undone. Audit history is retained."}</Note>
      <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => setDeleting(null)}>Cancel</button><button type="button" className="sa-danger-button" disabled={!!deleteReason} onClick={() => {
        if (deleteReason) return;
        setUsers(rows => rows.filter(row => row.id !== deleting.id)); log("Account deleted", `${deleting.role}: ${deleting.name}`); say("Account deleted."); setDeleting(null); setDetail(null); setPage(0);
      }}>Delete account</button></div>
    </Modal>}
  </>;

  const activeAdmins = users.filter(user => user.role === "Super Admin" && user.status === "Active");
  const rows = useMemo(() => users.filter(user =>
    user.role === tab
    && (status === "All statuses" || user.status === status)
    && (query.trim() === "" || `${user.studentName ?? ""} ${user.name} ${user.email}`.toLowerCase().includes(query.trim().toLowerCase()))
  ), [users, tab, status, query]);
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const shown = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function update(user: User, patch: Partial<User>, action: string, detailText: string) {
    setUsers(current => current.map(row => (row.id === user.id ? { ...row, ...patch } : row)));
    log(action, detailText);
    say(detailText);
    setDetail(current => (current && current.id === user.id ? { ...current, ...patch } : current));
  }

  function setStatusOf(user: User, next: User["status"]) {
    if (user.role === "Super Admin" && next !== "Active" && activeAdmins.length <= 1 && user.status === "Active") {
      say("Blocked: the last active administrator cannot be suspended or deactivated.");
      return;
    }
    const label = user.role === "Student" ? user.name : `${user.name} (${user.email})`;
    update(user, { status: next }, next === "Active" ? user.status === "Pending" ? "Account approved" : "Account reactivated" : `Account ${next.toLowerCase()}`, `${label} is now ${next}.`);
  }

  function sectionsOf(teacherId: string) {
    return sections.filter(section => section.teacherId === teacherId);
  }

  // The directory and the record are separate pages: opening a user replaces the
  // list instead of stacking a dialog over it.
  if (currentDetail) {
    return <>
      <div className="sa-action-row"><button type="button" className="sa-ghost" onClick={() => setEditing(currentDetail)}><Icon name="edit" />Edit account</button><button type="button" className="sa-ghost sa-danger" onClick={() => setDeleting(currentDetail)}><Icon name="trash" />Delete account</button></div>
      <UserDetails user={currentDetail} onBack={() => setDetail(null)} onStatus={next => setStatusOf(currentDetail, next)} onAssign={() => setAssigning(currentDetail)} />
      {dialogs}
      {assigning && <AssignSectionModal teacher={assigning} onClose={() => setAssigning(null)} />}
    </>;
  }

  return <>
    <Toolbar>
      <div className="sa-tabs" role="tablist">
        {TABS.map(role => <button key={role} type="button" role="tab" aria-selected={tab === role} className={tab === role ? "is-active" : ""} onClick={() => { setTab(role); setPage(0); }}>
          {role === "Student" ? "Students" : `${role}s`}<small>{users.filter(user => user.role === role).length}</small>
        </button>)}
      </div>
      <div className="sa-toolbar-right">
        <Search value={query} onChange={value => { setQuery(value); setPage(0); }} placeholder={tab === "Student" ? "Search student name or ID" : "Search name or email"} />
        <Select label="Status" value={status} options={["All statuses", "Active", "Pending", "Suspended"]} onChange={value => { setStatus(value); setPage(0); }} />
        <button type="button" className="sa-primary" onClick={() => setInvite(true)}><Icon name="plus" />Add {tab.toLowerCase()}</button>
      </div>
    </Toolbar>

    {tab === "Student" && <Note>Students added here also appear in their section under Academic Year.</Note>}

    <Panel title={tab === "Student" ? "Student token directory" : `${tab} directory`} note={tab === "Student" ? "Participation, consent, and learning activity by randomized token." : "Account state, verification, and role associations. Credentials are never displayed or exported."} wide>
      {shown.length === 0 ? <Empty text="No accounts match these filters." /> : <div className="users-table-scroll"><table className="sa-table sa-table-click users-directory-table">
        <thead>{tab === "Student"
          ? <tr><th>Student</th><th>Grade / section</th><th>Participation</th><th>Consent</th><th>Assent</th><th>Modules</th><th /></tr>
          : <tr><th>Account</th><th>Status</th><th>Email verified</th><th>{tab === "Teacher" ? "Assigned sections" : tab === "Parent" ? "Linked children" : "MFA"}</th><th>Last login</th><th /></tr>}
        </thead>
        <tbody>{shown.map(user => <tr key={user.id} onClick={() => setDetail(user)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") setDetail(user); }}>
          {tab === "Student" ? <>
            <td><div className="users-name-cell">
              <span className="users-avatar-sm role-student"><Icon name="person" /></span>
              <div><strong>{user.studentName || "Name not recorded"}</strong><small className="sa-mono">{user.name}</small></div>
            </div></td>
            <td>{store.sectionOf(user.section)}</td>
            <td><Pill>{user.status}</Pill></td>
            <td>{user.consent ? "Verified" : "Not verified"}</td>
            <td>{user.assent ? "Given" : "Not given"}</td>
            <td className="users-modules-cell">{user.completed}<span>/{modules.length}</span></td>
          </> : <>
            <td><div className="users-name-cell">
              <span className={`users-avatar-sm role-${tab.replace(/\s+/g, "-").toLowerCase()}`}>{initials(user.name)}</span>
              <div><strong>{user.name}</strong><small>{user.email}</small></div>
            </div></td>
            <td><Pill>{user.status}</Pill></td>
            <td>{user.emailVerified ? "Verified" : "Not verified"}</td>
            <td>{tab === "Teacher" ? `${sectionsOf(user.id).length} section${sectionsOf(user.id).length === 1 ? "" : "s"}` : tab === "Parent" ? `${links.filter(link => link.parentId === user.id && link.status === "Active").length} active` : user.mfaEnrolled ? "Enrolled" : "Not enrolled"}</td>
            <td className="sa-dim">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</td>
          </>}
          <td className="sa-row-arrow" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}><AcademicActionMenu label={user.studentName || user.name} actions={[{ label: "View account", icon: "person", onSelect: () => setDetail(user) }, { label: "Edit account", icon: "edit", onSelect: () => setEditing(user) }, { label: "Delete account", icon: "trash", danger: true, onSelect: () => setDeleting(user) }]} /></td>
        </tr>)}</tbody>
      </table></div>}
      <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
    </Panel>

    {assigning && <AssignSectionModal teacher={assigning} onClose={() => setAssigning(null)} />}

    {dialogs}
  </>;
}

function AssignSectionModal({ teacher, onClose }: { teacher: User; onClose: () => void }) {
  const { sections, setSections, log, say, nameOf } = useData();
  return <Modal title="Assign a section" note={`Teachers cannot assign themselves. Assigning ${teacher.name} grants scoped access to that section only.`} onClose={onClose}>
    <ul className="sa-pick-list">{sections.map(section => <li key={section.id}>
      <div><strong>{section.name}</strong><small>Grade {section.grade} · current teacher: {section.teacherId ? nameOf(section.teacherId) : "Unassigned"}</small></div>
      <button type="button" className="sa-ghost" disabled={section.teacherId === teacher.id} onClick={() => {
        setSections(current => current.map(row => (row.id === section.id ? { ...row, teacherId: teacher.id } : row)));
        log("Section assigned", `${section.name} assigned to ${teacher.name}`);
        say(`${section.name} assigned to ${teacher.name}.`);
        onClose();
      }}>{section.teacherId === teacher.id ? "Assigned" : "Assign"}</button>
    </li>)}</ul>
  </Modal>;
}
