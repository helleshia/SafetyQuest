import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, requireTeacher } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import type { AdminState } from "../../../shared/admin-schema";

type Account = AdminState["users"][number];

const normalizeId = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");
const idOk = (value: string) => /^[A-Z0-9][A-Z0-9-]{1,39}$/.test(value);

const incoming = z.object({
  sectionId: z.string().min(1).max(80),
  students: z.array(z.object({
    studentName: z.string().trim().min(1).max(100),
    studentId: z.string().trim().min(2).max(40),
  })).min(1).max(200),
});

/** Teachers may enroll learners in their own classes when admin is unavailable. */
export const POST = endpoint(async request => {
  const data = incoming.parse(await body(request));
  const { db, workspace, account } = await requireTeacher();
  const section = workspace.state.sections.find(
    row => row.id === data.sectionId && row.teacherId === account.id && !row.archived,
  );
  if (!section) throw new ApiError(403, "That class is not assigned to you, or it is archived.");

  const taken = new Set(
    workspace.state.users
      .filter(user => user.role === "Student")
      .map(user => normalizeId(user.name)),
  );
  const enrolled = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const created: Account[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const row of data.students) {
    const token = normalizeId(row.studentId);
    const name = row.studentName.trim();
    if (!name) { skipped.push(`${row.studentId || "?"}: name required`); continue; }
    if (!idOk(token)) { skipped.push(`${row.studentId}: invalid student ID`); continue; }
    if (seen.has(token) || taken.has(token)) { skipped.push(`${token}: already used`); continue; }
    seen.add(token);
    taken.add(token);
    created.push({
      id: randomUUID(),
      name: token,
      studentName: name,
      email: "",
      role: "Student",
      status: "Pending",
      section: section.id,
      completed: 0,
      score: 0,
      consent: false,
      assent: false,
      activated: false,
      enrolled,
    });
  }

  if (!created.length) {
    throw new ApiError(400, skipped[0] ?? "No valid students to add.");
  }

  const { client } = await database();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await db.collection<Workspace>("workspaces").updateOne(
        { _id: "school", revision: workspace.revision },
        {
          $push: { "state.users": { $each: created } },
          $inc: { revision: 1 },
        },
        { session },
      );
      if (!result.matchedCount) throw new ApiError(409, "Class records changed. Reload and try again.");
      await db.collection("audit").insertOne({
        id: randomUUID(),
        action: created.length === 1 ? "Student created by teacher" : "Students imported by teacher",
        detail: `${created.length} learner${created.length === 1 ? "" : "s"} · ${section.name}`,
        actor: account.email,
        time: new Date().toISOString(),
      }, { session });
    });
  } finally {
    await session.endSession();
  }

  return json({
    ok: true,
    added: created.length,
    skipped: skipped.length,
    message: skipped.length
      ? `Added ${created.length} student${created.length === 1 ? "" : "s"}. ${skipped.length} skipped.`
      : `Added ${created.length} student${created.length === 1 ? "" : "s"} to ${section.name}.`,
  }, 201);
});

/** A learner in one of this teacher's own, unarchived classes — or a refusal. */
async function ownStudent(id: string) {
  const { db, workspace, account } = await requireTeacher();
  const student = workspace.state.users.find(user => user.id === id && user.role === "Student");
  const section = student && workspace.state.sections.find(row => row.id === student.section && row.teacherId === account.id && !row.archived);
  if (!student || !section) throw new ApiError(403, "That student is not in one of your classes.");
  return { db, workspace, account, student, section };
}

async function commit(db: Awaited<ReturnType<typeof requireTeacher>>["db"], workspace: Workspace, update: Record<string, unknown>, audit: { action: string; detail: string; actor: string }, extra?: (session: never) => Promise<void>) {
  const { client } = await database();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await db.collection<Workspace>("workspaces").updateOne(
        { _id: "school", revision: workspace.revision },
        { ...update, $inc: { revision: 1 } },
        { session },
      );
      if (!result.matchedCount) throw new ApiError(409, "Class records changed. Reload and try again.");
      if (extra) await extra(session as never);
      await db.collection("audit").insertOne({ id: randomUUID(), ...audit, time: new Date().toISOString() }, { session });
    });
  } finally {
    await session.endSession();
  }
}

const edit = z.object({
  id: z.string().min(1).max(120),
  studentName: z.string().trim().min(1).max(100).optional(),
  studentId: z.string().trim().min(2).max(40).optional(),
  /** A learner with history cannot be deleted, so a teacher can suspend them instead. */
  status: z.enum(["Active", "Suspended"]).optional(),
});

/** Edit a learner in the teacher's own class: their name, student ID, or suspend/restore them. */
export const PATCH = endpoint(async request => {
  const data = edit.parse(await body(request));
  const { db, workspace, account, student, section } = await ownStudent(data.id);

  const set: Record<string, unknown> = {};
  const changes: string[] = [];
  if (data.studentName !== undefined && data.studentName !== student.studentName) {
    set["state.users.$[student].studentName"] = data.studentName;
    changes.push("name");
  }
  let renamed: { from: string; to: string } | null = null;
  if (data.studentId !== undefined) {
    const token = normalizeId(data.studentId);
    if (token !== normalizeId(student.name)) {
      if (!idOk(token)) throw new ApiError(400, "Student ID must be 2–40 letters, numbers, or hyphens.");
      const used = workspace.state.users.some(user => user.role === "Student" && user.id !== student.id && normalizeId(user.name) === token);
      if (used) throw new ApiError(409, "This student ID is already used by another account.");
      set["state.users.$[student].name"] = token;
      renamed = { from: student.name, to: token };
      changes.push("student ID");
    }
  }
  if (data.status !== undefined && data.status !== student.status) {
    if (student.status === "Pending") throw new ApiError(409, "This learner has not activated their account yet, so there is nothing to suspend.");
    set["state.users.$[student].status"] = data.status;
    changes.push(data.status === "Suspended" ? "suspended" : "restored");
  }
  if (!changes.length) return json({ ok: true, message: "Nothing changed." });

  // Individual assignments name the learner by student ID; keep them attached.
  const assignments = renamed
    ? workspace.state.assignments.map(item => item.tokens.includes(renamed.from) ? { ...item, tokens: item.tokens.map(t => t === renamed.from ? renamed.to : t) } : item)
    : null;
  const { client } = await database();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await db.collection<Workspace>("workspaces").updateOne(
        { _id: "school", revision: workspace.revision },
        { $set: { ...set, ...(assignments ? { "state.assignments": assignments } : {}) }, $inc: { revision: 1 } },
        { session, arrayFilters: [{ "student.id": student.id }] },
      );
      if (!result.matchedCount) throw new ApiError(409, "Class records changed. Reload and try again.");
      await db.collection("audit").insertOne({
        id: randomUUID(),
        action: "Student edited by teacher",
        detail: `${student.studentName || student.name} · ${section.name} · ${changes.join(", ")}`,
        actor: account.email,
        time: new Date().toISOString(),
      }, { session });
    });
  } finally {
    await session.endSession();
  }
  return json({ ok: true, message: `Updated ${data.studentName ?? student.studentName ?? student.name}.` });
});

/** Remove a learner from the teacher's own class. Learners with attempts, guardian links or
    individual assignments keep their records, so they can only be suspended, never deleted. */
export const DELETE = endpoint(async request => {
  const data = z.object({ id: z.string().min(1).max(120) }).parse(await body(request));
  const { db, workspace, account, student, section } = await ownStudent(data.id);

  const history = workspace.state.assessments.some(row => row.studentId === student.id)
    || workspace.state.links.some(link => link.studentId === student.id)
    || workspace.state.assignments.some(item => item.tokens.includes(student.name));
  if (history) {
    throw new ApiError(409, "This student has learning history or a guardian link, so their record is kept. Suspend them instead, or ask a Super Admin.");
  }

  await commit(db, workspace, { $pull: { "state.users": { id: student.id } } }, {
    action: "Student removed by teacher",
    detail: `${student.studentName || student.name} · ${section.name}`,
    actor: account.email,
  }, async session => {
    // Nothing else may keep pointing at a learner who no longer exists.
    await db.collection("mobile_accounts").deleteOne({ _id: student.id } as never, { session });
    await db.collection("mobile_sessions").deleteMany({ userId: student.id }, { session });
    await db.collection("credentials").deleteMany({ userId: student.id }, { session });
    await db.collection("learning_progress").deleteMany({ studentId: student.id }, { session });
  });
  return json({ ok: true, message: `${student.studentName || student.name} was removed from ${section.name}.` });
});
