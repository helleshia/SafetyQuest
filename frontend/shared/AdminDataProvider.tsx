import { useEffect, useRef, useState, type ReactNode } from "react";
import { DataContext, type Store } from "./store";
import { api } from "./api";
import { type AdminSnapshot, type AdminState, emptyAdminState } from "../../shared/admin-schema";
import LoadingStatus from "./LoadingStatus";

export default function AdminDataProvider({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const current = useRef<AdminSnapshot | null>(null);
  const pending = useRef<AdminState | null>(null);
  const events = useRef<{ action: string; detail: string }[]>([]);
  const scheduled = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [refreshed, setRefreshed] = useState("");
  const message = useRef("");
  const notify = (value: string) => { setToast(value); window.setTimeout(() => setToast(previous => previous === value ? "" : previous), 4200); };
  const accept = (value: AdminSnapshot) => { current.current = value; setSnapshot(value); setRefreshed(new Date().toLocaleString("en-PH")); };
  async function refresh() {
    setBusy(true); setError("");
    try { accept(await api<AdminSnapshot>("/api/admin/state")); } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!busy) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [busy]);

  function scheduleSave() {
    if (scheduled.current) return;
    scheduled.current = true; setBusy(true); setError("");
    queueMicrotask(async () => {
      const base = current.current;
      if (!base) { scheduled.current = false; setBusy(false); return; }
      const state = pending.current ?? Object.fromEntries(Object.keys(emptyAdminState()).map(key => [key, base[key as keyof AdminState]])) as AdminState;
      const activity = events.current;
      pending.current = null; events.current = [];
      try {
        accept(await api<AdminSnapshot>("/api/admin/state", "PUT", { state, revision: base.revision, events: activity }));
        notify(message.current || "Changes saved.");
      } catch (err) {
        setError(`Changes were not saved. ${(err as Error).message}`);
        // Reload authoritative state before allowing another change. This also handles
        // a lost response after a successful commit without duplicating the operation.
        try { accept(await api<AdminSnapshot>("/api/admin/state")); } catch { /* Keep the error and block editing until reload succeeds. */ }
      } finally { message.current = ""; scheduled.current = false; setBusy(false); }
    });
  }
  function update<K extends keyof AdminState>(key: K, change: (value: AdminState[K]) => AdminState[K]) {
    if (!current.current) return;
    if (!pending.current) pending.current = Object.fromEntries(Object.keys(emptyAdminState()).map(field => [field, current.current![field as keyof AdminState]])) as AdminState;
    pending.current[key] = change(pending.current[key]);
    scheduleSave();
  }
  if (!snapshot) return <LoadingStatus title="Super Admin" message="Loading…" error={error} onRetry={() => void refresh()} onSignOut={onSignOut} />;
  const value: Store = {
    ...snapshot, progress: (snapshot as { progress?: Store["progress"] }).progress ?? [], toast, refreshed,
    setAcademicYears: change => update("academicYears", change), setAcademicTerms: change => update("academicTerms", change), setGrades: change => update("grades", change),
    setUsers: change => update("users", change), setSections: change => update("sections", change), setModules: change => update("modules", change), setLinks: change => update("links", change),
    setAnnouncements: change => update("announcements", change), setSettings: change => update("settings", change), setAssessments: change => update("assessments", change), setAssignments: change => update("assignments", change),
    log: (action, detail) => { events.current.push({ action, detail }); scheduleSave(); },
    say: text => { if (scheduled.current) message.current = text; else notify(text); }, refresh: () => void refresh(),
    nameOf: id => snapshot.users.find(user => user.id === id)?.name ?? "Not recorded",
    sectionOf: id => snapshot.sections.find(section => section.id === id)?.name ?? "Unassigned",
    moduleOf: id => snapshot.modules.find(module => module.id === id)?.name ?? `Module ${id}`,
  };
  return <DataContext.Provider value={value}>
    {error && <div className="backend-banner" role="alert"><span>{error}</span><button onClick={() => void refresh()} disabled={busy}>Retry</button><button onClick={onSignOut}>Sign out</button></div>}
    {busy && <div className="backend-saving" role="status">Loading…</div>}
    <div inert={busy || !!error}>{children}</div>
  </DataContext.Provider>;
}
