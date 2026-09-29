import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "mongodb";
import type { LessonBank } from "../../shared/lesson-content";

type Stored = LessonBank & { _id: string; hash: string; updatedAt: string };

/** The questions exported from the app (see mobile/tool/export_lesson_content_test.dart). */
function exported(): LessonBank[] {
  const file = join(process.cwd(), "backend/data/lesson-content.json");
  return (JSON.parse(readFileSync(file, "utf8")) as { lessons: LessonBank[] }).lessons;
}

const hashOf = (lesson: LessonBank) => createHash("sha256").update(JSON.stringify(lesson)).digest("hex");

let synced: Promise<void> | null = null;

/** Brings the `lesson_content` collection in line with the exported file, once
    per server start. A lesson is written only when its questions changed. */
export function syncLessonContent(db: Db) {
  synced ??= (async () => {
    const collection = db.collection<Stored>("lesson_content");
    const lessons = exported();
    const stored = new Map((await collection.find({}, { projection: { hash: 1 } }).toArray()).map(row => [row._id, row.hash]));
    const now = new Date().toISOString();
    const writes = lessons
      .map(lesson => ({ lesson, hash: hashOf(lesson) }))
      .filter(({ lesson, hash }) => stored.get(lesson.key) !== hash)
      .map(({ lesson, hash }) => ({
        replaceOne: { filter: { _id: lesson.key }, replacement: { ...lesson, _id: lesson.key, hash, updatedAt: now }, upsert: true },
      }));
    if (writes.length) await collection.bulkWrite(writes);
  })().catch(error => {
    // Try again on the next request rather than keep a failed sync forever.
    synced = null;
    throw error;
  });
  return synced;
}

/** The questions of the given lessons, by lesson key. */
export async function lessonContent(db: Db, keys: string[]): Promise<Record<string, LessonBank>> {
  await syncLessonContent(db);
  const rows = await db.collection<Stored>("lesson_content").find({ _id: { $in: keys } }).toArray();
  return Object.fromEntries(rows.map(({ _id, hash: _hash, updatedAt: _at, ...lesson }) => [_id, lesson]));
}
