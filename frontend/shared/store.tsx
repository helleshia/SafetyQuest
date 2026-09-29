import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LessonBank } from "../../shared/lesson-content";
import {
  INITIAL_ACADEMIC_YEARS, INITIAL_ACADEMIC_TERMS, INITIAL_GRADE_LEVELS, INITIAL_ANNOUNCEMENTS, INITIAL_ASSESSMENTS, INITIAL_ASSIGNMENTS, INITIAL_AUDIT, INITIAL_LINKS, INITIAL_MODULES, INITIAL_SECTIONS, INITIAL_SETTINGS, INITIAL_USERS,
  type AcademicYear, type AcademicTerm, type GradeLevel, type Announcement, type AssessmentRow, type Assignment, type Audit, type GuardianLink, type Module, type Section, type Settings, type User,
} from "./demo";

export type LearningProgressRow = {
  studentId: string;
  sectionId: string;
  moduleId: number;
  learned: boolean;
  quiz: number;
  updatedAt: string;
};

export type Store = {
  accountId?: string;
  academicYears: AcademicYear[]; academicTerms: AcademicTerm[]; grades: GradeLevel[];
  setAcademicYears: (update: (rows: AcademicYear[]) => AcademicYear[]) => void;
  setAcademicTerms: (update: (rows: AcademicTerm[]) => AcademicTerm[]) => void;
  setGrades: (update: (rows: GradeLevel[]) => GradeLevel[]) => void;
  users: User[]; sections: Section[]; modules: Module[]; links: GuardianLink[];
  audit: Audit[]; announcements: Announcement[]; assessments: AssessmentRow[]; assignments: Assignment[]; settings: Settings;
  /** Phase 1 Learn/Check records from the mobile app (teacher live snapshot). */
  progress: LearningProgressRow[];
  /** Each lesson's real questions, by module id (teacher snapshot). */
  lessonQuestions?: Record<number, LessonBank>;
  setUsers: (update: (users: User[]) => User[]) => void;
  setSections: (update: (sections: Section[]) => Section[]) => void;
  setModules: (update: (modules: Module[]) => Module[]) => void;
  setLinks: (update: (links: GuardianLink[]) => GuardianLink[]) => void;
  setAnnouncements: (update: (items: Announcement[]) => Announcement[]) => void;
  setSettings: (update: (settings: Settings) => Settings) => void;
  setAssessments: (update: (rows: AssessmentRow[]) => AssessmentRow[]) => void;
  setAssignments: (update: (rows: Assignment[]) => Assignment[]) => void;
  log: (action: string, detail: string) => void;
  toast: string;
  say: (message: string) => void;
  refreshed: string;
  refresh: () => void;
  nameOf: (id: string) => string;
  sectionOf: (id: string) => string;
  moduleOf: (id: number) => string;
};

export const DataContext = createContext<Store | null>(null);
const stamp = () => new Date().toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(/,([^,]*)$/, " ·$1");

export function DataProvider({ children }: { children: ReactNode }) {
  const [academicYears, setAcademicYears] = useState(INITIAL_ACADEMIC_YEARS);
  const [academicTerms, setAcademicTerms] = useState(INITIAL_ACADEMIC_TERMS);
  const [grades, setGrades] = useState(INITIAL_GRADE_LEVELS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [modules, setModules] = useState(INITIAL_MODULES);
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [assessments, setAssessments] = useState(INITIAL_ASSESSMENTS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [toast, setToast] = useState("");
  const [refreshed, setRefreshed] = useState(stamp);

  const say = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(current => (current === message ? "" : current)), 4200);
  }, []);
  const log = useCallback((action: string, detail: string) => {
    setAudit(current => [{ id: `au${Date.now()}`, action, detail, time: stamp() }, ...current]);
  }, []);

  const value = useMemo<Store>(() => ({
    accountId: "",
    academicYears, academicTerms, grades, setAcademicYears, setAcademicTerms, setGrades,
    users, sections, modules, links, audit, announcements, assessments, assignments, settings,
    progress: [],
    setUsers, setSections, setModules, setLinks, setAnnouncements, setSettings, setAssessments, setAssignments,
    log, toast, say,
    refreshed,
    refresh: () => { setRefreshed(stamp()); say("Dashboard data refreshed."); },
    nameOf: (id: string) => users.find(user => user.id === id)?.name ?? "—",
    sectionOf: (id: string) => sections.find(section => section.id === id)?.name ?? "Unassigned",
    moduleOf: (id: number) => modules.find(module => module.id === id)?.name ?? `Module ${id}`,
  }), [academicYears, academicTerms, grades, users, sections, modules, links, audit, announcements, assessments, assignments, settings, log, toast, say, refreshed]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const store = useContext(DataContext);
  if (!store) throw new Error("useData must be used inside DataProvider");
  return store;
}
