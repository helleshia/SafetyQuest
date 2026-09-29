import { useState } from "react";
import Icon from "../shared/Icon";
import BrandLogo from "../shared/BrandLogo";
import Notifications, { type NotificationItem } from "../shared/Notifications";
import AdminDataProvider from "../shared/AdminDataProvider";
import Assessment from "./Assessment";
import AcademicYears from "./AcademicYears";
import Announcements from "./Announcements";
import Audit from "./Audit";
import Consent from "./Consent";
import Overview from "./Overview";
import Reports from "./Reports";
import Users from "./Users";
import { useData } from "../shared/store";

const NAV = [
  ["Overview", "overview", "Deployment-wide activity, approvals, and operational status"],
  ["Users", "users", "Administrators, teachers, parents, and student token records"],
  ["Academic Year", "curriculum", "Grade levels, sections, and student accounts by school year and term"],
  ["Assessment Overview", "assessment", "Which practice attempts are waiting for a teacher, and how learners scored"],
  ["Reports", "reports", "Scope-bound exports with filters, versions, and completeness notes"],
  ["Announcements", "announcements", "Messages to teachers, parents, or children"],
  ["Consent & Parent Links", "consent", "Signed permission forms and which parent may see which child"],
  ["Audit & Data Lifecycle", "audit", "What administrators have done, and deleting the study data afterwards"],
];

export default function AdminApp({ onSignOut }: { onSignOut: () => void }) {
  return <AdminDataProvider onSignOut={onSignOut}><AdminShell onSignOut={onSignOut} /></AdminDataProvider>;
}

function AdminShell({ onSignOut }: { onSignOut: () => void }) {
  const { users, links, modules, toast, accountId } = useData();
  const account = users.find(user => user.id === accountId);
  const notifications: NotificationItem[] = [
    ...users.filter(user => (user.role === "Teacher" || user.role === "Parent") && user.status === "Pending").map(user => ({ id: `approval-${user.id}`, title: `${user.role} approval requested`, detail: `${user.name} is waiting for account approval.`, icon: "person", page: "Users" })),
    ...links.filter(link => link.status === "Pending").map(link => ({ id: `link-${link.id}`, title: "Parent link awaiting verification", detail: `${users.find(user => user.id === link.parentId)?.name ?? "A parent"} requested a guardian link.`, icon: "consent", page: "Consent & Parent Links" })),
    ...modules.filter(module => module.status === "In review").map(module => ({ id: `module-${module.id}-v${module.version}`, title: "Curriculum ready for review", detail: `${module.name} / Version ${module.version}`, icon: "curriculum", page: "Academic Year" })),
  ];
  const [page, setPage] = useState("Overview");
  const [academicVisit, setAcademicVisit] = useState(0);
  const [open, setOpen] = useState(false);
  const current = NAV.find(([label]) => label === page) ?? NAV[0];
  const tasks = users.filter(user => (user.role === "Teacher" || user.role === "Parent") && user.status === "Pending").length + links.filter(link => link.status === "Pending").length;
  const go = (next: string) => { if (next === "Academic Year") setAcademicVisit(value => value + 1); setPage(next); setOpen(false); window.scrollTo({ top: 0 }); };

  return <div className={`sa-shell ${open ? "is-open" : ""}`}>
    <aside className="sa-sidebar">
      <div className="sa-brand"><BrandLogo /><div><strong>SafetyQuest</strong><small>Super Admin console</small></div></div>
      <nav className="sa-nav" aria-label="Super Admin sections">
        {NAV.map(([label, icon]) => <button key={label} type="button" className={page === label ? "is-active" : ""} onClick={() => go(label)}>
          <Icon name={icon} /><span>{label}</span>
          {label === "Users" && tasks > 0 && <b>{tasks}</b>}
        </button>)}
      </nav>
      <div className="sa-sidebar-foot">
        <p><strong>{account?.email}</strong><small>{account?.role}</small></p>
        <button type="button" onClick={onSignOut}><Icon name="logout" />Sign out</button>
      </div>
    </aside>

    <div className="sa-main">
      <header className="sa-topbar">
        <button type="button" className="sa-burger" onClick={() => setOpen(value => !value)} aria-label="Toggle navigation"><Icon name={open ? "close" : "menu"} /></button>
        <div className="sa-topbar-title"><h1>{current[0]}</h1><p>{current[2]}</p></div>
        <div className="sa-topbar-right">
          <Notifications items={notifications} accountId={accountId!} go={go} />
          <div className="sa-account"><span>{(account?.name ?? "Administrator").split(" ").map(part => part[0]).slice(0, 2).join("")}</span><div><strong>{account?.name}</strong><small>{account?.role}</small></div></div>
        </div>
      </header>

      <main className="sa-page">
        {page === "Overview" && <Overview go={go} />}
        {page === "Users" && <Users />}
        {page === "Academic Year" && <AcademicYears key={academicVisit} />}
        {page === "Assessment Overview" && <Assessment />}
        {page === "Reports" && <Reports />}
        {page === "Announcements" && <Announcements />}
        {page === "Consent & Parent Links" && <Consent />}
        {page === "Audit & Data Lifecycle" && <Audit />}
        <p className="sa-disclaimer">Connected to your school workspace. Changes are saved automatically.</p>
      </main>
    </div>

    {toast && <div className="sa-toast" role="status">{toast}</div>}
    <button type="button" className="sa-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" tabIndex={-1} />
  </div>;
}

