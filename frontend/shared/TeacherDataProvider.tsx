import { useEffect, useRef, useState, type ReactNode } from "react";
import { DataContext, type LearningProgressRow, type Store } from "./store";
import { api } from "./api";
import type { AdminState } from "../../shared/admin-schema";
import type { LessonBank } from "../../shared/lesson-content";
import LoadingStatus from "./LoadingStatus";

type Snapshot = AdminState & {
  revision: number;
  audit: [];
  accountId: string;
  progress?: LearningProgressRow[];
  lessonQuestions?: Record<number, LessonBank>;
};

/** The teacher console on live records. It holds the classes this teacher is assigned
    and saves changes back through the scoped endpoint, which re-checks on the server
    that every record being written belongs to them. */
export default function TeacherDataProvider({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const current = useRef<Snapshot | null>(null);
  const pending = useRef<AdminState | null>(null);
  const events = useRef<{ action: string; detail: string }[]>([]);
  const scheduled = useRef(false);
  const message = useRef("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [refreshed, setRefreshed] = useState("");

  const notify = (value: string) => { setToast(value); window.setTimeout(() => setToast(previous => (previous === value ? "" : previous)), 4200); };
  // A save answers with the class records only; Learn/Check progress and the
  // lesson questions come with a full load, so keep the last ones across saves.
  const accept = (value: Snapshot) => {
    const next = {
      ...value,
      progress: value.progress ?? current.current?.progress,
      lessonQuestions: value.lessonQuestions ?? current.current?.lessonQuestions,
    };
    current.current = next;
    setSnapshot(next);
    setRefreshed(new Date().toLocaleString("en-PH"));
  };

  async function refresh() {
    setBusy(true); setError("");
    try { accept(await api<Snapshot>("/api/teacher/state")); }
    catch (problem) { setError((problem as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);

  // New submissions and school posts arrive without a reload: check quietly
  // every 30 seconds and whenever the tab comes back, and take the new records
  // only when something changed. Never while a save is in flight, so an edit
  // being written is not replaced by the older copy.
  useEffect(() => {
    let running = false;
    async function poll() {
      if (running || scheduled.current || pending.current || document.hidden) return;
      running = true;
      try {
        const latest = await api<Snapshot>("/api/teacher/state");
        // Learn/Check progress lives outside the workspace, so it can change
        // without the revision moving.
        const changed = latest.revision !== current.current?.revision
          || JSON.stringify(latest.progress ?? []) !== JSON.stringify(current.current?.progress ?? []);
        if (!scheduled.current && !pending.current && changed) accept(latest);
      } catch { /* A missed check is retried on the next one. */ }
      finally { running = false; }
    }
    const timer = window.setInterval(() => { void poll(); }, 30_000);
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
      const state = pending.current ?? base;
      const activity = events.current;
      pending.current = null; events.current = [];
      try {
        // Only the fields a teacher may change are sent; the server ignores the rest.
        accept(await api<Snapshot>("/api/teacher/state", "PUT", {
          revision: base.revision,
          events: activity,
          state: {
            sections: state.sections.map(({ id, lessonsOpen, practicalOpen, passingScore }) => ({
              id,
              lessonsOpen: lessonsOpen ?? undefined,
              practicalOpen: practicalOpen ?? undefined,
              passingScore: passingScore ?? undefined,
            })),
            announcements: state.announcements,
            assignments: state.assignments,
            assessments: state.assessments.map(({ id, grade, feedback, review, comments }) => ({
              id,
              grade: grade ?? undefined,
              feedback: feedback ?? undefined,
              review,
              comments: comments ?? undefined,
            })),
            users: state.users.filter(user => user.role === "Student").map(({ id, completed, score }) => ({ id, completed, score })),
          },
        }));
        notify(message.current || "Changes saved.");
      } catch (problem) {
        setError(`Changes were not saved. ${(problem as Error).message}`);
        try { accept(await api<Snapshot>("/api/teacher/state")); } catch { /* Keep the error and block editing until a reload succeeds. */ }
      } finally { message.current = ""; scheduled.current = false; setBusy(false); }
    });
  }

  function update<K extends keyof AdminState>(key: K, change: (value: AdminState[K]) => AdminState[K]) {
    if (!current.current) return;
    if (!pending.current) pending.current = { ...(current.current as AdminState) };
    pending.current[key] = change(pending.current[key]);
    // Show the change straight away; the save reconciles with the server.
    setSnapshot(previous => (previous ? { ...previous, [key]: pending.current![key] } : previous));
    scheduleSave();
  }

  if (!snapshot) return <LoadingStatus title="Teacher console" message="Loading…" error={error} onRetry={() => void refresh()} onSignOut={onSignOut} />;

  const value: Store = {
    ...snapshot,
    progress: snapshot.progress ?? [],
    toast, refreshed,
    setAcademicYears: change => update("academicYears", change), setAcademicTerms: change => update("academicTerms", change), setGrades: change => update("grades", change),
    setUsers: change => update("users", change), setSections: change => update("sections", change), setModules: change => update("modules", change), setLinks: change => update("links", change),
    setAnnouncements: change => update("announcements", change), setSettings: change => update("settings", change), setAssessments: change => update("assessments", change), setAssignments: change => update("assignments", change),
    log: (action, detail) => { events.current.push({ action, detail }); scheduleSave(); },
    say: text => { if (scheduled.current) message.current = text; else notify(text); },
    refresh: () => void refresh(),
    nameOf: id => { const user = snapshot.users.find(item => item.id === id); return user?.studentName?.trim() || user?.name || "Not recorded"; },
    sectionOf: id => snapshot.sections.find(section => section.id === id)?.name ?? "Unassigned",
    moduleOf: id => snapshot.modules.find(module => module.id === id)?.name ?? `Lesson ${id}`,
  };

  return <DataContext.Provider value={value}>
    {error && <div className="backend-banner" role="alert"><span>{error}</span><button onClick={() => void refresh()} disabled={busy}>Retry</button><button onClick={onSignOut}>Sign out</button></div>}
    {busy && <div className="backend-saving" role="status">Loading…</div>}
    <div inert={busy || !!error}>{children}</div>
  </DataContext.Provider>;
}
