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
