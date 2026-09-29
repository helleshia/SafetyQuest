import { requireStudent } from "../../lib/mobile-auth";
import { mobileSnapshot, type LearningProgress } from "../../lib/mobile-contract";
import { database } from "../../lib/db";
import { endpoint, json } from "../../lib/http";

export const GET = endpoint(async request => {
  const { workspace, student, account } = await requireStudent(request);
  const { db } = await database();
  const progress = await db.collection<LearningProgress>("learning_progress")
    .find({ studentId: student.id })
    .toArray();
  return json({
    ...mobileSnapshot(workspace.state, student.id, progress),
    parentContact: account.parentContact,
    notification: account.notification,
  });
});
