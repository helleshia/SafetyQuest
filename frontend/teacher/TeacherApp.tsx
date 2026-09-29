import { createContext, useContext, useMemo, useState } from "react";
import Icon from "../shared/Icon";
import BrandLogo from "../shared/BrandLogo";
import Notifications, { type NotificationItem } from "../shared/Notifications";
import type { Section } from "../shared/demo";
import { useData } from "../shared/store";
import TeacherDataProvider from "../shared/TeacherDataProvider";
import Overview from "./Overview";
import Classes from "./Classes";
import Profile from "./Profile";
import Announcements from "./Announcements";
import { statsFor, untakenLessons } from "./classData";
import "./teacher.css";

const NAV = [
  ["Overview", "overview", "Your classes, students, and progress at a glance"],
  ["Handled Classes", "sections", "Students, class progress, and assessment settings"],
  ["Announcements", "announcements", "Messages for families and learners in your sections"],
  ["Profile", "person", "Your information, teaching assignment, and security"],
];

/** The signed-in teacher, the classes they handle, and which class is open. */
type Scope = {
  teacherId: string;
  teacherName: string;
  mySections: Section[];
  classId: string;
  setClassId: (id: string) => void;
  openClass: (id: string) => void;
  go: (page: string) => void;
  onSignOut: () => void;
};
const ScopeContext = createContext<Scope | null>(null);
export function useScope() {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error("useScope must be used inside the teacher shell");
  return scope;
}

export default function TeacherApp({ onSignOut }: { onSignOut: () => void }) {
  return <TeacherDataProvider onSignOut={onSignOut}><TeacherShell onSignOut={onSignOut} /></TeacherDataProvider>;
}

function TeacherShell({ onSignOut }: { onSignOut: () => void }) {
  const { users, sections, assessments, announcements, modules, assignments, progress, settings, toast, accountId } = useData();
  const [page, setPage] = useState("Overview");
  const [classId, setClassId] = useState("");
  const [open, setOpen] = useState(false);

  const teacher = users.find(user => user.id === accountId) ?? users.find(user => user.role === "Teacher");
  // The endpoint already returns only this teacher's classes; filtering again keeps
  // the UI honest if that ever changes.
  const teacherId = teacher?.id ?? "";
  const mySections = useMemo(
    () => sections.filter(section => !teacherId || section.teacherId === teacherId).filter(section => !section.archived),
    [sections, teacherId],
  );

  const go = (next: string) => {
    setPage(next);
    if (next !== "Handled Classes") setClassId("");
    setOpen(false);
    window.scrollTo({ top: 0 });
  };
  const openClass = (id: string) => {
    setClassId(id);
    setPage("Handled Classes");
    setOpen(false);
    window.scrollTo({ top: 0 });
  };


  // What needs the teacher's eye, newest first. Read state is kept per account
  // in this browser by the notifications panel.
  const studentName = (id: string) => {
    const student = users.find(user => user.id === id);
    return student?.studentName?.trim() || student?.name || "A learner";
  };
  const lessonName = (id: number) => modules.find(module => module.id === id)?.name ?? "a lesson";
  const mySectionIds = new Set(mySections.map(section => section.id));
  const mySectionNames = new Set(mySections.map(section => section.name));
  const newest = [...assessments]
    .filter(row => mySectionIds.has(row.sectionId))
    .sort((a, b) => Date.parse(b.submitted ?? "") - Date.parse(a.submitted ?? ""));
  const classStats = mySections.map(section => statsFor(section, users, assessments, assignments, modules, settings.practicalPass));
  const notStarted = untakenLessons(classStats, assignments, modules, progress ?? [], 12);
  const notifications: NotificationItem[] = [
    ...notStarted.map(row => ({
      id: `untaken-${row.student.id}-${row.lesson.id}`,
      title: "Lesson not started yet",
      detail: `${studentName(row.student.id)} · ${row.lesson.name} · ${row.section.name}`,
      icon: "curriculum",
      page: "Handled Classes",
    })),
    ...newest.filter(row => row.review === "Awaiting review").map(row => ({
      id: `review-${row.id}`,
      title: "Attempt waiting for your review",
      detail: `${studentName(row.studentId)} · ${lessonName(row.moduleId)} · ${row.quality === "Interrupted" ? "left before finishing" : "needs a check"}`,
      icon: "restore",
      page: "Handled Classes",
    })),
    ...newest.filter(row => row.quality === "Complete" && row.review !== "Awaiting review").slice(0, 15).map(row => ({
      id: `done-${row.id}`,
      title: "Practical finished",
      detail: `${studentName(row.studentId)} · ${lessonName(row.moduleId)} · ${row.grade ?? row.practical}%`,
      icon: "assessment",
      page: "Handled Classes",
    })),
    // School posts only: a teacher's own class posts are theirs already.
    ...announcements.filter(item => !mySectionNames.has(item.audience)).slice(0, 10).map(item => ({
      id: `announcement-${item.id}`,
      title: `New announcement: ${item.title}`,
      detail: `${item.audience} · ${item.date}`,
      icon: "announcements",
      page: "Announcements",
    })),
  ];

  const scope: Scope = {
    teacherId,
    teacherName: teacher?.name ?? "Teacher",
    mySections,
    classId,
    setClassId,
    openClass,
    go,
    onSignOut,
  };
  const current = NAV.find(([label]) => label === page) ?? NAV[0];
  const initials = (teacher?.name ?? "T").split(" ").map(part => part[0]).slice(0, 2).join("");

  return <ScopeContext.Provider value={scope}>
    <div className={`sa-shell ${open ? "is-open" : ""}`}>
      <aside className="sa-sidebar">
        <div className="sa-brand"><BrandLogo /><div><strong>SafetyQuest</strong><small>Teacher console</small></div></div>
        <nav className="sa-nav" aria-label="Teacher sections">
          {NAV.map(([label, icon]) => <button key={label} type="button" className={page === label ? "is-active" : ""} onClick={() => go(label)}>
            <Icon name={icon} /><span>{label}</span>
            {label === "Handled Classes" && mySections.length > 0 && <b>{mySections.length}</b>}
          </button>)}
        </nav>
        <div className="sa-sidebar-foot">
          <p><strong>{teacher?.email ?? "Signed in"}</strong><small>{teacher?.role ?? "Teacher"}</small></p>
          <button type="button" onClick={onSignOut}><Icon name="logout" />Sign out</button>
        </div>
      </aside>

      <div className="sa-main">
        <header className="sa-topbar">
          <button type="button" className="sa-burger" onClick={() => setOpen(value => !value)} aria-label="Toggle navigation"><Icon name={open ? "close" : "menu"} /></button>
          <div className="sa-topbar-title"><h1>{current[0]}</h1><p>{current[2]}</p></div>
          <div className="sa-topbar-right">
            {accountId ? <Notifications items={notifications} accountId={accountId} go={go} /> : null}
            <div className="sa-account"><span>{initials}</span><div><strong>{teacher?.name}</strong><small>Teacher · {mySections.length} class{mySections.length === 1 ? "" : "es"}</small></div></div>
          </div>
        </header>

        <main className="sa-page">
          {mySections.length === 0 && page !== "Profile"
            ? <NoClasses name={teacher?.name ?? "Teacher"} />
            : <>
              {page === "Overview" && <Overview />}
              {page === "Handled Classes" && <Classes />}
              {page === "Announcements" && <Announcements />}
              {page === "Profile" && <Profile />}
            </>}
          <p className="sa-disclaimer">You see only the classes assigned to you. The server applies that scope to every read and every save, not just this screen.</p>
        </main>
      </div>

      {toast && <div className="sa-toast" role="status">{toast}</div>}
      <button type="button" className="sa-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" tabIndex={-1} />
    </div>
  </ScopeContext.Provider>;
}

function NoClasses({ name }: { name: string }) {
  return <div className="tc-onboard">
    <span className="tc-onboard-icon"><Icon name="sections" /></span>
    <h2>No classes assigned yet</h2>
    <p>Your account is active, {name}, but class access is granted separately from account approval. A Super Admin assigns your classes — teachers cannot assign themselves.</p>
    <ul>
      <li><Icon name="check" />Once a class is assigned, its students, lessons, and assessment settings appear here.</li>
      <li><Icon name="check" />Until then you can still update your own details under Profile.</li>
    </ul>
  </div>;
}
