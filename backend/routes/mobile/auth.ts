import { z } from "zod";
import { ApiError, limitAttempts, passwordHash, verifyPassword } from "../../lib/auth";
import { database, type Workspace } from "../../lib/db";
import { body, endpoint, json } from "../../lib/http";
import { findMobileStudent, findSetupStudent, mobileRegistrationSchema, studentIdSchema, type ParentContact } from "../../lib/mobile-contract";
import { mobileToken, requireStudent, type MobileAccount, type MobileSession } from "../../lib/mobile-auth";
import { notifyParent } from "../../lib/mobile-notify";

async function lookupStudent(studentId: string) {
  const { db } = await database();
  const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  const student = workspace && findSetupStudent(workspace.state, studentId);
  if (!student) throw new ApiError(404, "We could not find a student with that ID. Check it with your teacher.");
  return { db, student };
}

export const lookup = endpoint(async request => {
  const { studentId } = z.object({ studentId: studentIdSchema }).strict().parse(await body(request));
  await limitAttempts(`mobile-lookup:${studentId}`);
  const { db, student } = await lookupStudent(studentId);
  const registered = Boolean(await db.collection("credentials").findOne({ userId: student.id }));
  return json({ registered });
});

// Setup needs no code: the student chooses a password and names a parent email,
// which activates the account at once. The parent is told about it by email and
// sees the student's progress by signing in on the website with that address.
export const register = endpoint(async request => {
  const data = mobileRegistrationSchema.parse(await body(request));
  await limitAttempts(`mobile-register:${data.studentId}`);
  await limitAttempts(`mobile-contact:${data.parentContact.value}`);
  const { db, client } = await database();
  const password = await passwordHash(data.password);
  // A transaction keeps the school record, credentials and contact from being
  // partially created, and makes two simultaneous setups for one ID safe.
  const transaction = client.startSession();
  let student: Workspace["state"]["users"][number] | undefined;
  try {
    await transaction.withTransaction(async () => {
      const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" }, { session: transaction });
      student = workspace ? findSetupStudent(workspace.state, data.studentId) : undefined;
      if (!student) throw new ApiError(404, "We could not find a student with that ID. Check it with your teacher.");
      if (await db.collection("credentials").findOne({ userId: student.id }, { session: transaction })) throw new ApiError(409, "This student already has a password. Please sign in.");
      await db.collection("credentials").insertOne({ userId: student.id, password }, { session: transaction });
      await db.collection<MobileAccount>("mobile_accounts").insertOne({ _id: student.id, parentContact: data.parentContact, contactVerifiedAt: new Date(), notification: "pending" }, { session: transaction });
      // Finishing setup is what activates a Pending student. The array filter
      // re-checks the status so a suspension saved meanwhile is never undone.
      const activated = await db.collection<Workspace>("workspaces").updateOne({ _id: "school" }, { $set: { "state.users.$[student].status": "Active", "state.users.$[student].activated": true }, $inc: { revision: 1 } }, { arrayFilters: [{ "student.id": student.id, "student.status": { $in: ["Active", "Pending"] } }], session: transaction });
      if (!activated.modifiedCount) throw new ApiError(403, "This student account is suspended. Contact your teacher.");
    });
  } finally { await transaction.endSession(); }
  const token = await mobileToken(student!.id);
  const notification = await accountNotification(student!.id, student!.studentName || "Student", student!.name, data.parentContact);
  return json({ token, notification });
});

async function accountNotification(userId: string, name: string, studentId: string, contact: ParentContact) {
  const { db } = await database();
  const site = process.env.APP_ORIGIN?.split(",")[0]?.trim();
  try {
    await notifyParent(contact, "Your child created a SafetyQuest account", `Your child has created a SafetyQuest student account and named you as their parent or guardian.\n\nStudent name: ${name}\nStudent ID: ${studentId}\n\nTo follow their lesson progress, sign in to the SafetyQuest website${site ? ` (${site})` : ""} with this email address. If you do not have an account yet, register as a Parent using this same email. Your child will appear there once your account is approved.\n\nNo password is included in this message. Contact the school if you do not recognize this account.`);
    await db.collection<MobileAccount>("mobile_accounts").updateOne({ _id: userId }, { $set: { notification: "accepted" } });
    return "accepted";
  } catch { return "pending"; }
}

export const login = endpoint(async request => {
  const { studentId, password } = z.object({ studentId: studentIdSchema, password: z.string().min(1).max(128) }).strict().parse(await body(request));
  await limitAttempts(`mobile-login:${studentId}`);
  const { db } = await database();
  const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  const student = workspace && findMobileStudent(workspace.state, studentId);
  const credentials = student && await db.collection("credentials").findOne({ userId: student.id });
  const valid = await verifyPassword(password, credentials?.password ?? `${"0".repeat(32)}:${"0".repeat(128)}`);
  if (!student || !valid) throw new ApiError(401, "Student ID or password is incorrect.");
  if (!await db.collection<MobileAccount>("mobile_accounts").findOne({ _id: student.id })) throw new ApiError(403, "Contact your teacher to complete your mobile account setup.");
  return json({ token: await mobileToken(student.id) });
});

export const logout = endpoint(async request => {
  const { db, sessionId } = await requireStudent(request);
  await db.collection<MobileSession>("mobile_sessions").deleteOne({ _id: sessionId });
  return json({ ok: true });
});

export const retryNotification = endpoint(async request => {
  const { account, student } = await requireStudent(request);
  await limitAttempts(`mobile-notification:${student.id}`);
  const notification = account.notification === "accepted" ? "accepted" : await accountNotification(student.id, student.studentName || "Student", student.name, account.parentContact);
  return json({ notification });
});
