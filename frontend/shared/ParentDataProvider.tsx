import { useEffect, useRef, useState, type ReactNode } from "react";
import { DataContext, type Store } from "./store";
import { api } from "./api";
import type { AdminState } from "../../shared/admin-schema";
import LoadingStatus from "./LoadingStatus";

type Snapshot = AdminState & { revision: number; audit: []; accountId: string };

/** The parent console on live records. It is read-only: a guardian can look at their
    own verified children and nothing else, so there is no save path here at all. */
export default function ParentDataProvider({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [refreshed, setRefreshed] = useState("");
  const local = useRef<AdminState | null>(null);

  const notify = (value: string) => { setToast(value); window.setTimeout(() => setToast(previous => (previous === value ? "" : previous)), 4200); };

  async function refresh() {
    setBusy(true); setError("");
    try {
      const value = await api<Snapshot>("/api/parent/state");
      local.current = value;
      setSnapshot(value);
      setRefreshed(new Date().toLocaleString("en-PH"));
    } catch (problem) { setError((problem as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);

  if (!snapshot) return <LoadingStatus title="Parent portal" message="Loading…" error={error} onRetry={() => void refresh()} onSignOut={onSignOut} />;

  // The console shares one store shape with the other roles. Nothing a parent does
  // writes back, so these setters only move what is on screen and are never saved.
  function screenOnly<K extends keyof AdminState>(key: K) {
    return (change: (value: AdminState[K]) => AdminState[K]) => {
      setSnapshot(previous => (previous ? { ...previous, [key]: change(previous[key]) } : previous));
    };
  }

  const value: Store = {
    ...snapshot, progress: [], toast, refreshed,
    setAcademicYears: screenOnly("academicYears"), setAcademicTerms: screenOnly("academicTerms"), setGrades: screenOnly("grades"),
    setUsers: screenOnly("users"), setSections: screenOnly("sections"), setModules: screenOnly("modules"), setLinks: screenOnly("links"),
    setAnnouncements: screenOnly("announcements"), setSettings: screenOnly("settings"), setAssessments: screenOnly("assessments"), setAssignments: screenOnly("assignments"),
    log: () => { /* A guardian takes no action that needs an audit entry. */ },
    say: notify,
    refresh: () => void refresh(),
    nameOf: id => { const user = snapshot.users.find(item => item.id === id); return user?.studentName?.trim() || user?.name || "Not recorded"; },
    sectionOf: id => snapshot.sections.find(section => section.id === id)?.name ?? "Unassigned",
    moduleOf: id => snapshot.modules.find(module => module.id === id)?.name ?? `Lesson ${id}`,
  };

  return <DataContext.Provider value={value}>
    {error && <div className="backend-banner" role="alert"><span>{error}</span><button onClick={() => void refresh()} disabled={busy}>Retry</button><button onClick={onSignOut}>Sign out</button></div>}
    {busy && <div className="backend-saving" role="status">Loading…</div>}
    {children}
  </DataContext.Provider>;
}
