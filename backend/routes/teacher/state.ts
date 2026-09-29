import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, requireTeacher } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import type { AdminState } from "../../../shared/admin-schema";
import { nullableArray, nullableFlag, nullableNumber, nullableString } from "../../../shared/admin-schema";
import { moduleKey, type LearningProgress } from "../../lib/mobile-contract";
import { lessonContent } from "../../lib/lesson-content";
import { withStudentTotals } from "../../../shared/scoring";
import { reaches, scopesFor } from "../../../shared/announcements";

type State = AdminState;
type Section = State["sections"][number];
type Assignment = State["assignments"][number];
type Attempt = State["assessments"][number];
type Account = State["users"][number];

/** Everything the signed-in teacher may see: their own classes, the learners in
    them, and the records attached to those learners. Nothing else leaves the server. */
function scopedSnapshot(state: State, teacherId: string) {
  const sections = state.sections
    .filter(section => section.teacherId === teacherId && !section.archived)
    .map(section => ({
      ...section,
      lessonsOpen: section.lessonsOpen ?? undefined,
      practicalOpen: section.practicalOpen ?? undefined,
    }));
  const ids = new Set(sections.map(section => section.id));
  const students = withStudentTotals(state.users.filter(user => user.role === "Student" && ids.has(user.section)), state.assessments);
  const studentIds = new Set(students.map(student => student.id));
  return {
    sections,
    users: [...students, ...state.users.filter(user => user.id === teacherId)],
    assignments: state.assignments.filter(item => ids.has(item.sectionId)),
    assessments: state.assessments
      .filter(row => ids.has(row.sectionId) && studentIds.has(row.studentId))
      .map(row => ({
        ...row,
        grade: row.grade ?? undefined,
        feedback: row.feedback ?? undefined,
        comments: row.comments ?? undefined,
        revisions: row.revisions ?? undefined,
        submitted: row.submitted ?? undefined,
      })),
    modules: state.modules,
    settings: state.settings,
    links: state.links.filter(link => studentIds.has(link.studentId)),
    // Their own class posts, and school posts for teachers (whole school, or one
    // of their grades or sections).
    announcements: state.announcements.filter(item => reaches(item.audience, "teachers", scopesFor(sections))),
    academicYears: state.academicYears,
    academicTerms: state.academicTerms,
    grades: state.grades,
    studentIds: [...studentIds],
  };
}

export const GET = endpoint(async () => {
  const { workspace, account } = await requireTeacher();
  const scoped = scopedSnapshot(workspace.state, account.id);
  const { db } = await database();
  const progress = scoped.studentIds.length
    ? await db.collection<LearningProgress>("learning_progress")
        .find({ studentId: { $in: scoped.studentIds } })
        .toArray()
    : [];
  const { studentIds: _ids, ...state } = scoped;
  // Each lesson's real questions, by module id, so an attempt can be read
  // against them even when it predates the app saving every answer.
  const keys = new Map(state.modules.map(module => [module.id, moduleKey(module)]));
  const banks = await lessonContent(db, [...new Set(keys.values())]);
  const lessonQuestions = Object.fromEntries([...keys].flatMap(([id, key]) => banks[key] ? [[id, banks[key]]] : []));
  return json({
    ...state,
    lessonQuestions,
    progress: progress.map(({ studentId, sectionId, moduleId, learned, quiz, updatedAt }) => ({
      studentId, sectionId, moduleId, learned, quiz, updatedAt,
    })),
    revision: workspace.revision,
    audit: [],
    accountId: account.id,
  });
});

/* What a teacher is allowed to change, field by field. Anything not listed here is
   ignored, so a crafted request cannot widen a teacher's reach by sending more. */
const incoming = z.object({
  revision: z.number().int().nonnegative(),
  state: z.object({
    sections: z.array(z.object({ id: z.string(), lessonsOpen: nullableFlag, practicalOpen: nullableFlag, passingScore: z.number().min(0).max(100).optional() })).max(200),
    announcements: z.array(z.object({ id: z.string(), title: z.string().trim().min(1).max(200), message: z.string().min(1).max(10000), audience: z.string().max(200), date: z.string().max(60) })).max(1000),
    assignments: z.array(z.object({
      id: z.string(), moduleId: z.number().int().positive(), sectionId: z.string(), version: z.number().int().nonnegative(),
      tokens: z.array(z.string()).max(0), opens: z.string().max(60), due: z.string().max(60),
      phases: z.enum(["Learn only", "Learn and Practice"]), retries: z.number().int().min(0).max(5),
      simulation: z.boolean(), status: z.enum(["Draft", "Published", "Withdrawn"]),
      extraTries: z.record(z.string(), z.number().int().min(0).max(20)).optional(),
    })).max(2000),
    assessments: z.array(z.object({
      id: z.string(),
      grade: nullableNumber(z.number().min(0).max(100)),
      feedback: nullableString(z.string().max(4000)),
      review: z.enum(["Published", "Reviewed draft", "Awaiting review", "Revised"]),
      comments: nullableArray(z.object({ id: z.string(), author: z.string().max(200), at: z.string().max(60), text: z.string().max(4000) })),
    })).max(20000),
    users: z.array(z.object({ id: z.string(), completed: z.number().int().min(0).max(1000), score: z.number().min(0).max(100) })).max(20000),
  }),
  events: z.array(z.object({ action: z.string().min(1).max(120), detail: z.string().max(2000) })).max(50),
});

export const PUT = endpoint(async request => {
  const data = incoming.parse(await body(request));
  const { db, workspace, account } = await requireTeacher();
  if (data.revision !== workspace.revision) throw new ApiError(409, "Another session changed these records. Reload the latest data and apply your change again.");

  const mine = new Set(workspace.state.sections.filter(section => section.teacherId === account.id && !section.archived).map(section => section.id));
  const mySectionNames = new Set(workspace.state.sections.filter(section => mine.has(section.id)).map(section => section.name));
  const myStudents = new Set(workspace.state.users.filter(user => user.role === "Student" && mine.has(user.section)).map(user => user.id));
  const sent = <T extends { id: string }>(rows: T[]) => new Map(rows.map(row => [row.id, row]));

  const sections = sent(data.state.sections);
  const nextSections: Section[] = workspace.state.sections.map(section => {
    const change = mine.has(section.id) ? sections.get(section.id) : undefined;
    if (!change) {
      // Drop legacy null switches so they stop round-tripping as invalid data.
      return {
        ...section,
        lessonsOpen: section.lessonsOpen ?? undefined,
        practicalOpen: section.practicalOpen ?? undefined,
      };
    }
    return {
      ...section,
      lessonsOpen: change.lessonsOpen ?? section.lessonsOpen ?? undefined,
      practicalOpen: change.practicalOpen ?? section.practicalOpen ?? undefined,
      passingScore: change.passingScore ?? section.passingScore,
    };
  });

  // Assignments are the class's lesson availability, so a teacher may add and remove
  // them — but only inside their own classes.
  const keptAssignments = workspace.state.assignments.filter(item => !mine.has(item.sectionId));
  const ownAssignments = data.state.assignments.filter(item => mine.has(item.sectionId)) as Assignment[];
  const nextAssignments: Assignment[] = [...keptAssignments, ...ownAssignments];

  const ownAnnouncements = data.state.announcements.filter(item => mySectionNames.has(item.audience));
  const nextAnnouncements = [...workspace.state.announcements.filter(item => !mySectionNames.has(item.audience)), ...ownAnnouncements];

  const attempts = sent(data.state.assessments);
  const nextAssessments: Attempt[] = workspace.state.assessments.map(row => {
    const change = mine.has(row.sectionId) && myStudents.has(row.studentId) ? attempts.get(row.id) : undefined;
    if (!change) {
      return {
        ...row,
        grade: row.grade ?? undefined,
        feedback: row.feedback ?? undefined,
        comments: row.comments ?? undefined,
      };
    }
    return {
      ...row,
      grade: change.grade ?? undefined,
      feedback: change.feedback ?? undefined,
      review: change.review,
      comments: change.comments ?? undefined,
    };
  }).filter(row => !(mine.has(row.sectionId) && myStudents.has(row.studentId) && !attempts.has(row.id)));

  // A learner's modules finished and overall score follow their published attempts,
  // so a grade or review change here reaches the app and every console alike. The
  // values the console sends are ignored rather than trusted.
  const nextUsers: Account[] = withStudentTotals(workspace.state.users, nextAssessments);

  const { client } = await database();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await db.collection<Workspace>("workspaces").updateOne(
        { _id: "school", revision: data.revision },
        { $set: { "state.sections": nextSections, "state.announcements": nextAnnouncements, "state.assignments": nextAssignments, "state.assessments": nextAssessments, "state.users": nextUsers }, $inc: { revision: 1 } },
        { session },
      );
      if (!result.matchedCount) throw new ApiError(409, "Data changed in another session. Reload before saving again.");
      const events = data.events.length ? data.events : [{ action: "Class records updated", detail: "Teacher activity recorded" }];
      await db.collection("audit").insertMany(events.map(event => ({ ...event, id: randomUUID(), actor: account.email, time: new Date().toISOString() })), { session });
    });
  } finally {
    await session.endSession();
  }

  const state: State = { ...workspace.state, sections: nextSections, announcements: nextAnnouncements, assignments: nextAssignments, assessments: nextAssessments, users: nextUsers };
  return json({ ...scopedSnapshot(state, account.id), revision: data.revision + 1, audit: [], accountId: account.id });
});
