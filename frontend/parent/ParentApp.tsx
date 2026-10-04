import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Icon from "../shared/Icon";
import BrandLogo from "../shared/BrandLogo";
import Notifications, { type NotificationItem } from "../shared/Notifications";
import type { User } from "../shared/demo";
import { useData } from "../shared/store";
import ParentDataProvider from "../shared/ParentDataProvider";
import CheckIn from "./CheckIn";
import Overview from "./Overview";
import ChildProgress from "./ChildProgress";
import ParentProfile from "./ParentProfile";
import { ParentAnnouncements } from "./ParentGov";
import { linkedChildren } from "./progress";
import { attemptScore, officialResults } from "../../shared/scoring";
import { PARENT_NAV } from "./nav";
import { reaches, scopesFor } from "../../shared/announcements";
import "./parent.css";

const NAV = PARENT_NAV;

/** A child the parent identified by name and student ID during this sign-in. */
export type ConfirmedChild = { studentId: string; label: string };

type ParentScope = {
  parentId: string;
  parentName: string;
  /** Children confirmed in this session, in the order they were checked in. */
  confirmed: ConfirmedChild[];
  childId: string;
  setChildId: (id: string) => void;
  child: User;
  /** The name the parent typed for the child they are viewing. */
  label: string;
  confirmChild: (studentId: string, label: string) => void;
  /** Sign out of one child's progress without signing out of the account. */
  closeChild: (studentId: string) => void;
  go: (page: string) => void;
  signOut: () => void;
};

/** Children a parent has checked in survive a page refresh (same tab only, gone when the
    tab closes or the parent signs out), so refreshing to look for new notifications does not
    mean typing the student ID again. */
const storageKey = (parentId: string) => `sq-parent-checkin:${parentId}`;

function loadCheckIns(parentId: string): { confirmed: ConfirmedChild[]; childId: string } {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(storageKey(parentId)) ?? "null");
    const confirmed = Array.isArray(raw?.confirmed)
      ? raw.confirmed.filter((item: ConfirmedChild) => typeof item?.studentId === "string" && typeof item?.label === "string")
      : [];
    return { confirmed, childId: typeof raw?.childId === "string" ? raw.childId : "" };
  } catch { return { confirmed: [], childId: "" }; }
}

function saveCheckIns(parentId: string, confirmed: ConfirmedChild[], childId: string) {
  try {
    if (!parentId) return;
    if (confirmed.length) window.sessionStorage.setItem(storageKey(parentId), JSON.stringify({ confirmed, childId }));
    else window.sessionStorage.removeItem(storageKey(parentId));
  } catch { /* Storage can be blocked; the check-in just will not survive a refresh. */ }
}

const ScopeContext = createContext<ParentScope | null>(null);
export function useParent() {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error("useParent must be used inside the parent shell");
  return scope;
}

export default function ParentApp({ onSignOut }: { onSignOut: () => void }) {
  return <ParentDataProvider onSignOut={onSignOut}><ParentShell onSignOut={onSignOut} /></ParentDataProvider>;
}

function ParentShell({ onSignOut: signOutAccount }: { onSignOut: () => void }) {
  const { users, links, sections, announcements, assessments, modules, toast, say, accountId } = useData();
  const [page, setPage] = useState("Overview");
  const [open, setOpen] = useState(false);

  const parent = users.find(user => user.id === accountId) ?? users.find(user => user.role === "Parent");
  const parentId = parent?.id ?? "";
  const parentName = parent?.name ?? "Parent";
  const children = useMemo(() => linkedChildren(users, links, parentId), [users, links, parentId]);

  const [saved] = useState(() => loadCheckIns(parentId));
  // Only children whose link is still active count, so a link revoked while the tab was
  // closed cannot be reopened from storage.
  const [confirmed, setConfirmed] = useState<ConfirmedChild[]>(() => saved.confirmed.filter(item => children.some(child => child.id === item.studentId)));
  const [childId, setChildId] = useState(saved.childId);
  useEffect(() => { saveCheckIns(parentId, confirmed, childId); }, [parentId, confirmed, childId]);

  // Signing out of the account forgets every checked-in child.
  const onSignOut = () => { saveCheckIns(parentId, [], ""); signOutAccount(); };

  const closeChild = (studentId: string) => {
    const left = confirmed.filter(item => item.studentId !== studentId);
    const name = confirmed.find(item => item.studentId === studentId)?.label ?? "this child";
    setConfirmed(left);
    if (childId === studentId) setChildId(left[0]?.studentId ?? "");
    setPage("Overview");
    say(left.length ? `Signed out of ${name}'s progress.` : `Signed out of ${name}'s progress. Enter a student ID to open a record again.`);
  };

  const confirmChild = (studentId: string, label: string) => {
    setConfirmed(current => (current.some(item => item.studentId === studentId)
      ? current.map(item => (item.studentId === studentId ? { studentId, label } : item))
      : [...current, { studentId, label }]));
    setChildId(studentId);
    setPage("Overview");
    say(`${label}'s details matched a verified guardian link. You are viewing published records only.`);
  };

  // The first thing a parent sees after signing in: their child's name and student ID.
  // No learning record renders until at least one child has been identified.
  if (confirmed.length === 0) {
    return <>
      <CheckIn parentName={parentName} linked={children} onConfirm={confirmChild} onSignOut={onSignOut} />
      {toast && <div className="sa-toast" role="status">{toast}</div>}
    </>;
  }

  const active = confirmed.find(item => item.studentId === childId) ?? confirmed[0];
  const child = children.find(item => item.id === active.studentId);
  const current = NAV.find(item => item[0] === page) ?? NAV[0];
  const go = (next: string) => { setPage(next); setOpen(false); window.scrollTo({ top: 0 }); };
  const initials = parentName.split(" ").map(part => part[0]).slice(0, 2).join("");
  const unlinked = children.length - confirmed.length;

  // A guardian link can be revoked while the parent is signed in. Access ends immediately.
  if (!child) {
    return <div className="parent-gate">
      <div className="sa-onboard">
        <h2>This record is no longer available</h2>
        <p>Access to the child you were viewing has ended during this session. Your other children are unaffected, and none of your child's progress has been deleted.</p>
        <button type="button" className="sa-primary" onClick={() => { closeChild(active.studentId); }}><Icon name="arrow" />Check in again</button>
      </div>
    </div>;
  }

  const section = sections.find(item => item.id === child.section);
  // The server already limited these to posts that reach this parent (whole school,
  // "Everyone", "All parents", "All adults", or their children's grade or section).
  const mine = announcements;

  // What a guardian is actually waiting to hear: a new published result for their
  // child, a message from the school, and any link still awaiting verification.
  const published = officialResults(assessments, child.id).slice(0, 6);
  const notifications: NotificationItem[] = [
    ...published.map(row => ({
      id: `result-${row.id}-${row.review}`,
      title: `New result for ${active.label}`,
      detail: `${modules.find(module => module.id === row.moduleId)?.name ?? "A lesson"} · ${attemptScore(row)}%`,
      icon: "assessment",
      page: "Child Progress",
    })),
    ...mine.map(item => ({
      id: `notice-${item.id}`,
      title: item.title,
      detail: `${item.audience} · ${item.date}`,
      icon: "announcements",
      page: "Profile",
    })),
    ...links.filter(link => link.parentId === parentId && link.status === "Pending").map(link => ({
      id: `link-${link.id}`,
      title: "A link is waiting to be verified",
      detail: "The class teacher confirms in person before access begins.",
      icon: "consent",
      page: "Profile",
    })),
  ];

  const scope: ParentScope = {
    parentId,
    parentName,
    confirmed,
    childId: child.id,
    setChildId,
    child,
    label: active.label,
    confirmChild,
    closeChild,
    go,
    signOut: onSignOut,
  };

  return <ScopeContext.Provider value={scope}>
    <div className={`sa-shell parent-shell ${open ? "is-open" : ""}`}>
      <aside className="sa-sidebar">
        <div className="sa-brand"><BrandLogo /><div><strong>SafetyQuest</strong><small>Parent &amp; guardian portal</small></div></div>
        <nav className="sa-nav" aria-label="Parent navigation">
          {NAV.map(([label, icon]) => <button key={label} type="button" className={page === label ? "is-active" : ""} aria-current={page === label ? "page" : undefined} onClick={() => go(label)}>
            <Icon name={icon} /><span>{label}</span>
            {label === "Overview" && unlinked > 0 && <b>{unlinked}</b>}
          </button>)}
        </nav>
        <div className="parent-sidebar-note"><Icon name="consent" /><p>A little encouragement.<br /><strong>A lot of confidence.</strong></p></div>
        <div className="sa-sidebar-foot">
          <p><strong>{parent?.email ?? "Signed in"}</strong><small>{parent?.role ?? "Parent"}</small></p>
          <button type="button" onClick={onSignOut}><Icon name="logout" />Sign out</button>
        </div>
      </aside>

      <div className="sa-main">
        <header className="sa-topbar">
          <button type="button" className="sa-burger" onClick={() => setOpen(value => !value)} aria-label="Toggle navigation" aria-expanded={open}><Icon name={open ? "close" : "menu"} /></button>
          <div className="sa-topbar-title"><h1>{current[0]}</h1><p>{current[2]}</p></div>
          <div className="sa-topbar-right">
            {confirmed.length > 1 && <label className="sa-scope">
              <span>Viewing</span>
              <select value={child.id} onChange={event => setChildId(event.target.value)}>
                {confirmed.map(item => <option key={item.studentId} value={item.studentId}>{item.label}</option>)}
              </select>
              <Icon name="down" />
            </label>}
            <button type="button" className="sa-ghost parent-close-child" onClick={() => closeChild(child.id)} title={`Sign out of ${active.label}'s progress`}>
              <Icon name="logout" />Close {active.label.split(/\s+/)[0]}
            </button>
            <Notifications items={notifications} accountId={parentId} go={go} />
            <div className="sa-account"><span>{initials}</span><div><strong>{parentName}</strong><small>Parent / Guardian</small></div></div>
          </div>
        </header>

        <main className="sa-page">
          <div className="tc-page parent-page">
            {page === "Overview" && <Overview />}
            {page === "Child Progress" && <ChildProgress />}
            {page === "Announcements" && <ParentAnnouncements />}
            {page === "Profile" && <ParentProfile />}
          </div>
        </main>
      </div>

      {toast && <div className="sa-toast" role="status">{toast}</div>}
      <button type="button" className="sa-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" tabIndex={-1} />
    </div>
  </ScopeContext.Provider>;
}

/** Who you are looking at, and on whose authority. Built on the same recipe as the
    teacher's class header: an initials badge, the name, then the facts as icon items. */
export function ChildIdentity({ note, action }: { note?: string; action?: ReactNode }) {
  const { child, label } = useParent();
  const { sections } = useData();
  const section = sections.find(item => item.id === child.section);
  const initials = label.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "S";
  return <header className="parent-child-head">
    <span className="parent-child-badge">{initials}</span>
    <div className="parent-child-heading">
      <p className="parent-eyebrow">YOU ARE VIEWING</p>
      <h2>{label}</h2>
      <p>
        <span><Icon name="person" />Student ID <strong className="sa-mono">{child.name}</strong></span>
        <span><Icon name="sections" />{section?.name ?? "Unassigned"}</span>
        {note && <span><Icon name="graduation" />{note}</span>}
      </p>
    </div>
    {action ?? <span className="sa-pill sa-pill-ok">Verified link</span>}
  </header>;
}

/** Shared page heading: who you are looking at, and on whose authority. */
export function ChildHeading({ note, action }: { note?: string; action?: ReactNode }) {
  const { child, label } = useParent();
  const { sections } = useData();
  const section = sections.find(item => item.id === child.section);
  return <div className="parent-progress-heading">
    <div>
      <span className="parent-eyebrow">YOU ARE VIEWING</span>
      <h2>{label}</h2>
      <p>Student ID <strong className="sa-mono">{child.name}</strong> · {section?.name ?? "Unassigned"}{note ? ` · ${note}` : ""}</p>
    </div>
    {action ?? <span className="sa-pill sa-pill-ok">Verified link</span>}
  </div>;
}
