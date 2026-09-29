export type DemoRole = "super-admin" | "teacher" | "parent";
export const DEMO_PASSWORD = "SafetyQuest@2026";
export const DEMO_EMAIL = "admin@safetyquest.demo";
export const DEMO_TEACHER_EMAIL = "teacher@safetyquest.demo";
/** The teacher account this preview signs in as. Sofia Ramos handles one class per grade. */
export const DEMO_TEACHER_ID = "t3";
export const DEMO_PARENT_EMAIL = "parent@safetyquest.demo";
export const DEMO_PARENT_ID = "p3";
export const DEMO_ACCOUNTS: { role: DemoRole; label: string; email: string }[] = [
  { role: "super-admin", label: "Super Admin", email: DEMO_EMAIL },
  { role: "teacher", label: "Teacher", email: DEMO_TEACHER_EMAIL },
  { role: "parent", label: "Parent", email: DEMO_PARENT_EMAIL },
];
const SESSION_KEY = "safetyquest.demo-session";

// UI preview access only. Replace this gate with server authentication for live accounts.
// Selecting a role here only changes which local screens render; it grants no real permission.
export function getDemoSession(): DemoRole | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored === "super-admin" || stored === "teacher" || stored === "parent" ? stored : null;
  } catch { return null; }
}
export function setDemoSession(role: DemoRole | null) {
  try { if (role) sessionStorage.setItem(SESSION_KEY, role); else sessionStorage.removeItem(SESSION_KEY); } catch { /* Preview also works without browser storage. */ }
}

export type Role = "Super Admin" | "Teacher" | "Parent" | "Student";
export type User = { createdAt?: string; lastLogin?: string; emailVerified?: boolean; mfaEnrolled?: boolean; id: string; name: string; studentName?: string; email: string; role: Role; status: "Active" | "Pending" | "Suspended"; section: string; completed: number; score: number; consent: boolean; assent: boolean; activated?: boolean; enrolled?: string; lastActive?: string };
export type Section = { id: string; name: string; grade: string; teacherId: string; code: string; enrollment: boolean; archived?: boolean; termId?: string;
  /** Assessment availability, set by the class teacher. */
  lessonsOpen?: boolean; practicalOpen?: boolean; passingScore?: number };
export type AcademicYear = { id: string; name: string; status: "Active" | "Archived" };
export type AcademicTerm = { id: string; academicYearId: string; name: string; status: "Active" | "Planned"; starts: string; ends: string };
export type GradeLevel = { id: string; academicYearId: string; level: string };
export const INITIAL_GRADE_LEVELS: GradeLevel[] = ["4", "5", "6"].map(level => ({ id: `grade2026-${level}`, academicYearId: "ay2026", level }));
export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [{ id: "ay2026", name: "2026–2027", status: "Active" }];
export const INITIAL_ACADEMIC_TERMS: AcademicTerm[] = [
  { id: "term2026-1", academicYearId: "ay2026", name: "First Semester", status: "Active", starts: "2026-08-17", ends: "2026-12-18" },
  { id: "term2026-2", academicYearId: "ay2026", name: "Second Semester", status: "Planned", starts: "2027-01-04", ends: "2027-06-04" },
];
export type ModuleStatus = "Draft" | "In review" | "Changes requested" | "Approved" | "Published" | "Archived";
export type Module = { id: number; name: string; domain: string; status: ModuleStatus; version: number; lessonPages: number; questions: number; scenarios: number; key?: string };
export type GuardianLink = { id: string; parentId: string; studentId: string; status: "Active" | "Pending" | "Revoked"; verifiedBy: string };
export type Audit = { actor?: string; id: string; action: string; detail: string; time: string };
export type Announcement = { id: string; title: string; message: string; audience: string; date: string };

export const INITIAL_SECTIONS: Section[] = [
  { id: "s1", name: "Grade 4 · Mahogany", grade: "4", teacherId: "t3", code: "SQ-4M-208", enrollment: true },
  { id: "s2", name: "Grade 4 · Narra", grade: "4", teacherId: "t2", code: "SQ-4N-315", enrollment: true },
  { id: "s3", name: "Grade 5 · Acacia", grade: "5", teacherId: "t3", code: "SQ-5A-421", enrollment: true },
  { id: "s4", name: "Grade 5 · Molave", grade: "5", teacherId: "t1", code: "SQ-5M-532", enrollment: false },
  { id: "s5", name: "Grade 6 · Bamboo", grade: "6", teacherId: "t3", code: "SQ-6B-643", enrollment: true },
  { id: "s6", name: "Grade 6 · Yakal", grade: "6", teacherId: "t5", code: "SQ-6Y-754", enrollment: false },
].map(section => ({ ...section, termId: "term2026-1", lessonsOpen: true, practicalOpen: section.id !== "s5", passingScore: 70 }));
const adult = (id: string, name: string, email: string, role: Role, status: User["status"] = "Active"): User => ({ id, name, email, role, status, section: "", completed: 0, score: 0, consent: false, assent: false });
export const INITIAL_USERS: User[] = [
  adult("a1", "Demo Administrator", DEMO_EMAIL, "Super Admin"),
  adult("a2", "Elena Santos", "elena@example.test", "Super Admin"),
  adult("t1", "Maria Reyes", "maria@example.test", "Teacher"),
  adult("t2", "Daniel Cruz", "daniel@example.test", "Teacher"),
  adult("t3", "Sofia Ramos", DEMO_TEACHER_EMAIL, "Teacher"),
  adult("t4", "Miguel Torres", "miguel@example.test", "Teacher"),
  adult("t5", "Isabel Garcia", "isabel@example.test", "Teacher"),
  adult("t6", "Andrea Flores", "andrea@example.test", "Teacher", "Pending"),
  ...["Patricia Lim", "Roberto Diaz", "Camille Mendoza", "Luis Navarro", "Angela Tan", "Marco Rivera"].map((name, i) => adult(`p${i + 1}`, name, i === 2 ? DEMO_PARENT_EMAIL : `parent${i + 1}@example.test`, "Parent")),
  ...Array.from({ length: 36 }, (_, i): User => ({ id: `st${i + 1}`, name: `SQ-G${Math.floor(i / 12) + 4}-${String(i + 1).padStart(3, "0")}`, email: "", role: "Student", status: i === 35 ? "Pending" : "Active", section: `s${Math.floor(i / 6) + 1}`, completed: 2 + (i * 7 % 14), score: 62 + (i * 11 % 37), consent: i !== 35, assent: i < 34, activated: i % 9 !== 0, enrolled: `Aug ${17 + (i % 9)}, 2026`, lastActive: `Sep ${11 + (i % 7)}, 2026` })),
];
const MODULE_DEFS: { name: string; key: string }[] = [
  { name: "Understanding Emergencies", key: "emergency-basics" },
  { name: "Earthquake Safety", key: "earthquake" },
  { name: "Fire Safety", key: "fire-safety" },
  { name: "Flood Safety", key: "flood-safety" },
  { name: "Typhoon Safety", key: "typhoon-safety" },
  { name: "Evacuation Drills", key: "evacuation-drills" },
  { name: "Emergency Go Bag", key: "go-bag" },
  { name: "Emergency Communication", key: "emergency-comm" },
  { name: "Stranger Danger", key: "stranger-danger" },
  { name: "Cyberbullying & Online Safety", key: "cyber-safety" },
  { name: "Road & Traffic Safety", key: "road-safety" },
  { name: "Basic First Aid", key: "first-aid" },
  { name: "Bullying Awareness", key: "bullying" },
  { name: "Water Safety", key: "water-safety" },
  { name: "Poison, Household & Electricity Safety", key: "household-electricity" },
];
export const INITIAL_MODULES: Module[] = MODULE_DEFS.map((row, i) => ({
  id: i + 1,
  name: row.name,
  key: row.key,
  domain: i < 8 ? "Disaster Preparedness" : "Personal Safety",
  status: i === 11 || i === 14 ? "In review" : i === 13 ? "Draft" : "Published",
  version: i < 5 ? 2 : 1,
  lessonPages: 5 + i % 4,
  questions: 7,
  scenarios: 6,
}));
export const INITIAL_LINKS: GuardianLink[] = [
  ...Array.from({ length: 6 }, (_, i): GuardianLink => ({ id: `l${i + 1}`, parentId: `p${i + 1}`, studentId: `st${i * 6 + 1}`, status: i < 4 ? "Active" : "Pending", verifiedBy: i < 4 ? INITIAL_USERS.find(u => u.id === INITIAL_SECTIONS[i].teacherId)?.name ?? "" : "" })),
  // The preview guardian also has a second verified child, one request still awaiting
  // verification, and one relationship that was ended. Each state renders differently.
  { id: "l7", parentId: DEMO_PARENT_ID, studentId: "st20", status: "Active", verifiedBy: "Sofia Ramos" },
  { id: "l8", parentId: DEMO_PARENT_ID, studentId: "st26", status: "Pending", verifiedBy: "" },
  { id: "l9", parentId: DEMO_PARENT_ID, studentId: "st32", status: "Revoked", verifiedBy: "Isabel Garcia" },
];
export const INITIAL_AUDIT: Audit[] = [
  { id: "au1", action: "Content submitted", detail: "Basic First Aid · version 1 submitted for review", time: "Sep 18, 2026 · 9:12 AM" },
  { id: "au2", action: "Teacher approval requested", detail: "Andrea Flores · awaiting account approval", time: "Sep 18, 2026 · 8:45 AM" },
  { id: "au3", action: "Guardian link verified", detail: "SQ-G5-013 · verified by Sofia Ramos", time: "Sep 17, 2026 · 3:30 PM" },
  { id: "au4", action: "Section assigned", detail: "Grade 6 · Bamboo assigned to Miguel Torres", time: "Sep 17, 2026 · 10:10 AM" },
];

export function csvDownload(name: string, rows: (string | number)[][]) {
  const escape = (cell: string | number) => {
    const raw = String(cell);
    const safe = /^\s*[=+@-]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.split('"').join('""')}"`;
  };
  const blob = new Blob(["\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type Settings = {
  term: string;
  termStart: string;
  termEnd: string;
  practicalPass: number;
  languages: string;
  simulationsPerWeek: number;
  noticeVersion: string;
  provisioning: "Invitation only" | "Open registration with approval";
  reactionWeighting: boolean;
};
export const INITIAL_SETTINGS: Settings = {
  term: "SY 2026-2027 · First Semester",
  termStart: "2026-08-17",
  termEnd: "2026-12-18",
  practicalPass: 70,
  languages: "English, Filipino",
  simulationsPerWeek: 2,
  noticeVersion: "Privacy notice v1.3",
  provisioning: "Invitation only",
  reactionWeighting: false,
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: "an1", title: "Term 1 curriculum is live", message: "All published modules are now assignable. Review the updated flood-safety references before assigning module 4.", audience: "All teachers", date: "Sep 16, 2026" },
  { id: "an2", title: "Consent verification cut-off", message: "Please complete physical consent verification for remaining learners before the end of the week.", audience: "All teachers", date: "Sep 12, 2026" },
  { id: "an3", title: "Scheduled maintenance", message: "The website will be briefly unavailable on Saturday, 8:00-9:00 PM. The mobile app is unaffected.", audience: "All adults", date: "Sep 9, 2026" },
  { id: "an4", title: "New safety quest unlocked", message: "Typhoon Safety is ready for you. Read the story first, then try the practice scenario.", audience: "All students", date: "Sep 15, 2026" },
  { id: "an5", title: "Bring your go bag list home", message: "Please go through the emergency go bag checklist with your child this week.", audience: "All parents", date: "Sep 14, 2026" },
  { id: "an6", title: "Fire drill next Tuesday", message: "Grade 5 joins the school-wide drill at 10:00 AM. This is a real scheduled drill, not an app simulation.", audience: "Grade 5 · everyone", date: "Sep 13, 2026" },
];

export type Revision = { from: number; to: number; reason: string; author: string; at: string };
/** A teacher-facing note on one attempt. Never shown to the learner or their parents. */
export type AttemptComment = { id: string; author: string; at: string; text: string };
export type AssessmentRow = { id: string; studentId: string; sectionId: string; moduleId: number; practical: number; accuracy: number; reaction: number; quality: "Complete" | "Interrupted"; review: "Published" | "Reviewed draft" | "Awaiting review" | "Revised"; grade?: number; feedback?: string; revisions?: Revision[]; comments?: AttemptComment[]; submitted?: string; detail?: AttemptDetail };
/** What the learner actually answered; see shared/admin-schema.ts answerSchema. */
export type AnswerRecord = { prompt: string; kind: string; choices: string[]; answer?: number; chosen?: number; chose: string; expected: string; correct: boolean; seconds?: number; explain?: string };
export type AttemptDetail = { quiz: AnswerRecord[]; steps: AnswerRecord[] };
const REVIEW_STATES: AssessmentRow["review"][] = ["Published", "Awaiting review", "Reviewed draft"];
export const INITIAL_ASSESSMENTS: AssessmentRow[] = INITIAL_USERS
  .filter(user => user.role === "Student" && user.status === "Active")
  .flatMap((student, i) => [0, 1].map((offset): AssessmentRow => {
    const moduleId = ((i * 3 + offset * 7) % 15) + 1;
    return {
      id: `as${i}-${offset}`,
      studentId: student.id,
      sectionId: student.section,
      moduleId,
      practical: 55 + ((i * 17 + offset * 9) % 45),
      accuracy: 60 + ((i * 7 + offset * 11) % 40),
      reaction: 2.1 + ((i * 3 + offset) % 28) / 10,
      quality: (i * 5 + offset) % 11 === 0 ? "Interrupted" : "Complete",
      review: REVIEW_STATES[(i + offset) % 3],
      submitted: `Sep ${10 + ((i + offset) % 8)}, 2026`,
      comments: (i + offset) % 9 === 0
        ? [{ id: `cm${i}-${offset}`, author: "Sofia Ramos", at: `Sep ${12 + ((i + offset) % 6)}, 2026 · 2:14 PM`, text: "Worked through the lesson twice before attempting. Revisit the evacuation signal step with the whole group." }]
        : undefined,
    };
  }));

/** Illustrative decision-error mappings for the dashboard, not validated safety findings. */
export const MISSED_DECISIONS = [
  { module: "Flood Safety", decision: "Chose the low underpass route instead of higher ground", share: 38 },
  { module: "Earthquake Safety", decision: "Ran to the doorway before the shaking stopped", share: 31 },
  { module: "Fire Safety", decision: "Went back inside for a belonging", share: 27 },
  { module: "Stranger Danger", decision: "Accepted a ride without checking with a trusted adult", share: 24 },
  { module: "Road & Traffic Safety", decision: "Crossed without a second look for turning vehicles", share: 19 },
];

export const OPERATIONS = [
  { id: "op1", label: "Narration asset unavailable", detail: "Module 12 · Basic First Aid · Filipino narration failed to upload", tone: "warn" as const },
  { id: "op2", label: "Notification delivery failed", detail: "2 guardian-link emails bounced and need a corrected address", tone: "warn" as const },
  { id: "op3", label: "Sync backlog cleared", detail: "All mobile attempt submissions accepted as of the last refresh", tone: "ok" as const },
];

/* ---------------------------------------------------------------------------
   Teacher-scoped records: assignments, scenario timelines, and question banks.
   Illustrative content-design directions, not validated safety protocols.
--------------------------------------------------------------------------- */

export type Assignment = {
  id: string;
  moduleId: number;
  version: number;
  sectionId: string;
  tokens: string[];
  opens: string;
  due: string;
  phases: "Learn only" | "Learn and Practice";
  retries: number;
  simulation: boolean;
  status: "Draft" | "Published" | "Withdrawn";
  /** Extra simulation tries granted by the teacher, keyed by student id. */
  extraTries?: Record<string, number>;
};
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  { id: "asg1", moduleId: 2, version: 2, sectionId: "s3", tokens: [], opens: "Sep 07, 2026", due: "Sep 21, 2026", phases: "Learn and Practice", retries: 2, simulation: true, status: "Published" },
  { id: "asg2", moduleId: 3, version: 1, sectionId: "s3", tokens: [], opens: "Sep 14, 2026", due: "Sep 28, 2026", phases: "Learn and Practice", retries: 2, simulation: true, status: "Published" },
  { id: "asg3", moduleId: 9, version: 1, sectionId: "s3", tokens: [], opens: "Sep 21, 2026", due: "Oct 05, 2026", phases: "Learn only", retries: 3, simulation: false, status: "Draft" },
  { id: "asg4", moduleId: 4, version: 2, sectionId: "s4", tokens: [], opens: "Sep 07, 2026", due: "Sep 20, 2026", phases: "Learn and Practice", retries: 1, simulation: true, status: "Published" },
  { id: "asg5", moduleId: 11, version: 1, sectionId: "s4", tokens: [], opens: "Aug 31, 2026", due: "Sep 14, 2026", phases: "Learn and Practice", retries: 2, simulation: true, status: "Withdrawn" },
  { id: "asg6", moduleId: 2, version: 2, sectionId: "s1", tokens: [], opens: "Sep 07, 2026", due: "Sep 21, 2026", phases: "Learn and Practice", retries: 2, simulation: true, status: "Published" },
  { id: "asg7", moduleId: 1, version: 2, sectionId: "s1", tokens: [], opens: "Aug 31, 2026", due: "Sep 14, 2026", phases: "Learn only", retries: 3, simulation: false, status: "Published" },
  { id: "asg8", moduleId: 6, version: 1, sectionId: "s1", tokens: [], opens: "Sep 21, 2026", due: "Oct 05, 2026", phases: "Learn and Practice", retries: 2, simulation: true, status: "Draft" },
  { id: "asg9", moduleId: 3, version: 1, sectionId: "s5", tokens: [], opens: "Sep 07, 2026", due: "Sep 21, 2026", phases: "Learn and Practice", retries: 1, simulation: true, status: "Published" },
  { id: "asg10", moduleId: 5, version: 2, sectionId: "s5", tokens: [], opens: "Sep 14, 2026", due: "Sep 28, 2026", phases: "Learn and Practice", retries: 2, simulation: true, status: "Published" },
  { id: "asg11", moduleId: 12, version: 1, sectionId: "s5", tokens: [], opens: "Sep 21, 2026", due: "Oct 12, 2026", phases: "Learn only", retries: 3, simulation: false, status: "Draft" },
];

export type SimStep = { at: number; prompt: string; chose: string; expected: string; correct: boolean;
  /** The plausible wrong action for this step, shown when an attempt missed it. */
  wrong: string };
export const SIM_TIMELINE: SimStep[] = [
  { at: 0.0, prompt: "The ground starts shaking while you are seated", chose: "Drop, cover, and hold on under the desk", expected: "Drop, cover, and hold on under the desk", correct: true , wrong: "Run for the classroom door straight away"},
  { at: 4.2, prompt: "A bookshelf is swaying beside the desk", chose: "Stay under cover and shield your head", expected: "Stay under cover and shield your head", correct: true , wrong: "Leave cover to move away from the shelf"},
  { at: 9.6, prompt: "The shaking stops", chose: "Run straight out through the crowded doorway", expected: "Wait for the teacher signal, then walk in line", correct: false , wrong: "Run straight out through the crowded doorway"},
  { at: 14.1, prompt: "You reach the corridor", chose: "Walk calmly to the evacuation area", expected: "Walk calmly to the evacuation area", correct: true , wrong: "Push ahead of the line to get outside faster"},
  { at: 21.8, prompt: "A classmate left a bag behind", chose: "Keep going and tell an adult", expected: "Keep going and tell an adult", correct: true , wrong: "Turn back into the room to fetch the bag"},
];

export type Question = { id: string; text: string; choices: string[]; answer: number; explanation: string; points: number };
export const QUESTION_BANK: Question[] = [
  { id: "q1", text: "What should you do first when the ground starts shaking?", choices: ["Run outside right away", "Drop, cover, and hold on", "Stand near a window", "Wait and see what happens"], answer: 1, explanation: "Dropping and covering protects your head and neck while the shaking continues.", points: 2 },
  { id: "q2", text: "When is it safest to leave the room after an earthquake?", choices: ["While it is still shaking", "After the shaking stops and an adult gives the signal", "Only when you feel like it", "Never leave the room"], answer: 1, explanation: "Moving during shaking risks falls. Wait for the shaking to stop and follow the adult signal.", points: 2 },
  { id: "q3", text: "Which item belongs in an emergency go bag?", choices: ["A glass jar", "Drinking water and a flashlight", "A heavy toy", "Nothing at all"], answer: 1, explanation: "Water and light are basic supplies you can carry and use right away.", points: 1 },
  { id: "q4", text: "What is the safest way to move down a stairway during an evacuation?", choices: ["Push to the front", "Walk in line and hold the rail", "Jump the last steps", "Stop to take a photo"], answer: 1, explanation: "Walking in line keeps the group moving and prevents falls.", points: 2 },
];

export const RUBRIC_CRITERIA = [
  { id: "r1", label: "Chose the approved protective action first", weight: 30 },
  { id: "r2", label: "Stayed under cover for the full shaking interval", weight: 20 },
  { id: "r3", label: "Waited for the adult signal before evacuating", weight: 25 },
  { id: "r4", label: "Followed the approved evacuation route calmly", weight: 15 },
  { id: "r5", label: "Reported a concern to a trusted adult", weight: 10 },
];

/** Learning-need phrasing only. Never labels a child unsafe, unfit, or diagnosed. */
export const FOLLOW_UP_REASONS = [
  "Revisit flood-route selection",
  "Review when it is safe to leave cover",
  "Practice the evacuation line order again",
  "Revisit trusted-adult reporting steps",
];

/* ---------------------------------------------------------------------------
   Parent/Guardian support content. Approved family material only: recaps,
   discussion prompts, and offline activities. None of it is an emergency
   service, and a parent-reported checklist never changes an academic record.
--------------------------------------------------------------------------- */

export type Badge = { id: string; label: string; detail: string };
/** Badges are revealed in order as the child completes more modules. */
export const BADGE_LADDER: Badge[] = [
  { id: "b1", label: "First Responder", detail: "Finished a first safety module from start to end." },
  { id: "b2", label: "Steady Hands", detail: "Chose the approved protective action while the shaking continued." },
  { id: "b3", label: "Calm Walker", detail: "Completed an evacuation practice without rushing the line." },
  { id: "b4", label: "Go-Bag Ready", detail: "Packed a complete emergency go bag in the practice activity." },
  { id: "b5", label: "High-Ground Thinker", detail: "Picked the safer, higher route in the flood scenario." },
  { id: "b6", label: "Trusted-Adult Caller", detail: "Reported a concern to a trusted adult in the scenario." },
  { id: "b7", label: "Careful Crosser", detail: "Checked twice for turning vehicles before crossing." },
  { id: "b8", label: "Steady Streak", detail: "Practiced on five different days this term." },
];

export type FamilyPrompt = { id: string; moduleId: number; question: string; guidance: string };
export const FAMILY_PROMPTS: FamilyPrompt[] = [
  { id: "fp1", moduleId: 2, question: "Where would you drop, cover, and hold on in each room of our house?", guidance: "Walk through two rooms together and agree on one safe spot in each. Keep it curious, not scary." },
  { id: "fp2", moduleId: 3, question: "What are our two ways out if one room is blocked?", guidance: "Point out both exits, then agree on one meeting place outside that everyone can name." },
  { id: "fp3", moduleId: 4, question: "Which road near us fills with water first in heavy rain?", guidance: "Name it out loud together and agree on the higher route you would take instead." },
  { id: "fp4", moduleId: 9, question: "Who are three trusted adults you can reach if I am not around?", guidance: "Write the three names down together and check your child can say all three from memory." },
  { id: "fp5", moduleId: 10, question: "What would you do if someone online asked which school you go to?", guidance: "Praise any answer that involves telling an adult. Avoid making it feel like a test." },
];

export type HomeActivity = { id: string; moduleId: number; title: string; detail: string; minutes: number };
export const HOME_ACTIVITIES: HomeActivity[] = [
  { id: "ha1", moduleId: 2, title: "Two-room safe-spot walk", detail: "Find one drop-cover-hold spot in two rooms, then practice getting there once.", minutes: 10 },
  { id: "ha2", moduleId: 3, title: "Name our meeting place", detail: "Agree on one outdoor meeting place and have everyone repeat it back.", minutes: 5 },
  { id: "ha3", moduleId: 7, title: "Pack the go bag together", detail: "Gather water, a flashlight, and a whistle, then let your child check the list.", minutes: 20 },
  { id: "ha4", moduleId: 9, title: "Three trusted adults", detail: "Write down three trusted adults and where to find their numbers.", minutes: 10 },
  { id: "ha5", moduleId: 11, title: "Practice one safe crossing", detail: "Cross one familiar street together and let your child call out each check.", minutes: 15 },
];

/** Plain language for parents. Never equates a practice score with real-world danger or ability. */
export function practicalSummary(score: number, pass: number) {
  if (score >= pass + 15) return "Your child worked through this practice confidently.";
  if (score >= pass) return "Your child completed this practice and met the class expectation.";
  if (score >= pass - 15) return "Your child is close. Reviewing the lesson and trying the practice again will help.";
  return "Your child can review this lesson and try the practice again.";
}
