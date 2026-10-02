import { useEffect, useRef, useState, type ReactNode } from "react";
import { DataContext, type Store } from "./store";
import { api } from "./api";
import { type AdminSnapshot, type AdminState, emptyAdminState } from "../../shared/admin-schema";
import LoadingStatus from "./LoadingStatus";
import { saveRebased } from "./saveRebased";

export default function AdminDataProvider({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const current = useRef<AdminSnapshot | null>(null);
  const pending = useRef<((state: AdminState) => AdminState)[]>([]);
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
  // Logins, invites and submissions move the revision while this page is open. Pick the
  // new records up quietly (every 20 seconds and when the tab returns) so the next save
  // starts from them. Never while a save or an unsaved change is in flight.
  useEffect(() => {
    let running = false;
    async function poll() {
      if (running || scheduled.current || pending.current.length || events.current.length || document.hidden) return;
      running = true;
      try {
        const latest = await api<AdminSnapshot>("/api/admin/state");
        if (!scheduled.current && !pending.current.length && !events.current.length && latest.revision !== current.current?.revision) accept(latest);
      } catch { /* A missed check is retried on the next one. */ }
      finally { running = false; }
    }
    const timer = window.setInterval(() => { void poll(); }, 20_000);
    const onVisible = () => { if (!document.hidden) void poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, []);
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
      const changes = pending.current;
      const activity = events.current;
      pending.current = []; events.current = [];
      // The same changes are applied to whichever copy of the records is the latest.
      const stateFrom = (from: AdminSnapshot) => changes.reduce(
        (state, change) => change(state),
        Object.fromEntries(Object.keys(emptyAdminState()).map(key => [key, from[key as keyof AdminState]])) as AdminState,
      );
      try {
        accept(await saveRebased(base, () => api<AdminSnapshot>("/api/admin/state"), from => api<AdminSnapshot>("/api/admin/state", "PUT", { state: stateFrom(from), revision: from.revision, events: activity })));
        notify(message.current || "Changes saved.");
      } catch (err) {
        setError(`Changes were not saved. ${(err as Error).message}`);
        // Reload authoritative state before allowing another change. This also handles
        // a lost response after a successful commit without duplicating the operation.
        try { accept(await api<AdminSnapshot>("/api/admin/state")); } catch { /* Keep the error and block editing until reload succeeds. */ }
      } finally {
        message.current = ""; scheduled.current = false; setBusy(false);
        // A change made while this save was running is saved next, not left waiting.
        if (pending.current.length || events.current.length) scheduleSave();
      }
    });
  }
  function update<K extends keyof AdminState>(key: K, change: (value: AdminState[K]) => AdminState[K]) {
    if (!current.current) return;
    pending.current.push(state => ({ ...state, [key]: change(state[key]) }));
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
