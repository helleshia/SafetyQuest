import assert from "node:assert/strict";
import test from "node:test";
import { attemptScore, officialAttempt, officialResults, starsFor, studentTotals, totalStars, withStudentTotals } from "../../shared/scoring.ts";

const attempt = (id: string, moduleId: number, practical: number, submitted: string, extra: Record<string, unknown> = {}) =>
  ({ id, studentId: "s1", sectionId: "a", moduleId, practical, accuracy: 80, reaction: 3, quality: "Complete", review: "Published", submitted, ...extra });

test("the newest published attempt is the official score, not the first or the best", () => {
  const rows = [
    attempt("old", 1, 90, "2026-09-01T00:00:00Z"),
    attempt("new", 1, 60, "2026-09-02T00:00:00Z"),
  ];
  assert.equal(officialAttempt(rows, "s1", 1)?.id, "new");
  assert.equal(studentTotals(rows, "s1").score, 60);
});

test("a teacher's grade overrides the device score everywhere", () => {
  const row = attempt("a", 1, 50, "2026-09-01T00:00:00Z", { grade: 85 });
  assert.equal(attemptScore(row), 85);
  assert.equal(studentTotals([row], "s1").score, 85);
});

test("interrupted and unpublished attempts never count", () => {
  const rows = [
    attempt("done", 1, 70, "2026-09-01T00:00:00Z"),
    attempt("quit", 1, 10, "2026-09-02T00:00:00Z", { quality: "Interrupted", review: "Awaiting review" }),
    attempt("draft", 2, 20, "2026-09-02T00:00:00Z", { review: "Reviewed draft" }),
  ];
  assert.equal(officialAttempt(rows, "s1", 1)?.id, "done");
  assert.equal(officialAttempt(rows, "s1", 2), undefined);
  assert.deepEqual(studentTotals(rows, "s1"), { completed: 1, score: 70 });
});

test("the overall score averages one result per module, so retries do not weigh more", () => {
  const rows = [
    attempt("m1a", 1, 40, "2026-09-01T00:00:00Z"),
    attempt("m1b", 1, 100, "2026-09-02T00:00:00Z"),
    attempt("m2", 2, 60, "2026-09-01T00:00:00Z"),
  ];
  assert.deepEqual(officialResults(rows, "s1").map(row => row.id).sort(), ["m1b", "m2"]);
  assert.deepEqual(studentTotals(rows, "s1"), { completed: 2, score: 80 });
});

test("stored student totals are replaced by the derived ones", () => {
  const users = [
    { id: "s1", role: "Student", completed: 9, score: 12 },
    { id: "t1", role: "Teacher", completed: 0, score: 0 },
  ];
  const [student, teacher] = withStudentTotals(users, [attempt("a", 1, 75, "2026-09-01T00:00:00Z")]);
  assert.deepEqual({ completed: student.completed, score: student.score }, { completed: 1, score: 75 });
  assert.equal(teacher, users[1]);
});

test("stars match the app's end-of-run stars for a six-step simulation", () => {
  const percentFor = (safe: number) => Math.round(safe / 6 * 100);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(safe => starsFor(percentFor(safe))), [0, 0, 1, 1, 2, 3, 3]);
  // A teacher's grade moves the stars too.
  assert.equal(totalStars([{ practical: 50, grade: 90 }, { practical: 70 }]), 5);
});

test("a reset clears the lesson read for the learners and lesson in scope only", async () => {
  const { progressInScope } = await import("../../shared/resetLessons.ts");
  const users = [
    { id: "s1", role: "Student", section: "a", completed: 1, score: 80 },
    { id: "s2", role: "Student", section: "b", completed: 1, score: 80 },
    { id: "t1", role: "Teacher", section: "", completed: 0, score: 0 },
  ];
  assert.deepEqual(progressInScope(users, { sectionId: "a", moduleId: 3 }), { studentId: { $in: ["s1"] }, moduleId: 3 });
  assert.deepEqual(progressInScope(users, { sectionId: "a" }), { studentId: { $in: ["s1"] } });
  assert.deepEqual(progressInScope(users, {}), { studentId: { $in: ["s1", "s2"] } });
});

test("a learner who only did Learn/Check still counts, so the class can be reset", async () => {
  const { resetCounts } = await import("../../shared/resetLessons.ts");
  const users = [{ id: "s1", role: "Student", section: "a", completed: 0, score: 0 }];
  const progress = [{ studentId: "s1", moduleId: 1 }];
  assert.deepEqual(resetCounts(users, [], { sectionId: "a" }), { attempts: 0, students: 0 });
  assert.deepEqual(resetCounts(users, [], { sectionId: "a" }, progress), { attempts: 0, students: 1 });
  assert.deepEqual(resetCounts(users, [], { sectionId: "a", moduleId: 1 }, progress), { attempts: 0, students: 1 });
  assert.deepEqual(resetCounts(users, [], { sectionId: "a", moduleId: 2 }, progress), { attempts: 0, students: 0 });
});

test("announcements reach each reader by group and by grade or section", async () => {
  const { reaches, scopesFor } = await import("../../shared/announcements.ts");
  const scopes = scopesFor([{ name: "Mahogany", grade: "5" }]);
  const who = (audience: string) => (["students", "teachers", "parents"] as const).filter(reader => reaches(audience, reader, scopes));
  assert.deepEqual(who("Mahogany"), ["students", "teachers", "parents"]);
  assert.deepEqual(who("Narra"), []);
  assert.deepEqual(who("Everyone"), ["students", "teachers", "parents"]);
  assert.deepEqual(who("All students"), ["students"]);
  assert.deepEqual(who("All teachers"), ["teachers"]);
  assert.deepEqual(who("All parents"), ["parents"]);
  assert.deepEqual(who("All adults"), ["teachers", "parents"]);
  assert.deepEqual(who("Grade 5 · students"), ["students"]);
  assert.deepEqual(who("Grade 6 · everyone"), []);
  assert.deepEqual(who("Mahogany · parents"), ["parents"]);
});

test("a reset clears the extra tries granted in its scope, and nothing else", async () => {
  const { clearGrants } = await import("../../shared/resetLessons.ts");
  const rows: { id: string; sectionId: string; moduleId: number; extraTries?: Record<string, number> }[] = [
    { id: "a1", sectionId: "a", moduleId: 1, extraTries: { s1: 3 } },
    { id: "a2", sectionId: "a", moduleId: 2, extraTries: { s1: 1 } },
    { id: "b1", sectionId: "b", moduleId: 1, extraTries: { s9: 2 } },
  ];
  const lesson = clearGrants(rows, { sectionId: "a", moduleId: 1 });
  assert.deepEqual(lesson.map(row => row.extraTries), [undefined, { s1: 1 }, { s9: 2 }]);
  const cls = clearGrants(rows, { sectionId: "a" });
  assert.deepEqual(cls.map(row => row.extraTries), [undefined, undefined, { s9: 2 }]);
});

test("recorded answers survive the admin save, which drops fields the schema does not know", async () => {
  const { stateSchema, emptyAdminState } = await import("../../shared/admin-schema.ts");
  const state = emptyAdminState();
  const detail = {
    quiz: [{ prompt: "Where do you go when there is smoke?", kind: "choice", choices: ["Stand up", "Crawl low"], answer: 1, chosen: 0, chose: "Stand up", expected: "Crawl low", correct: false, explain: "Clean air stays near the floor." }],
    steps: [{ prompt: "Tap the hazards", kind: "findHazards", choices: [], chose: "Found: Candle", expected: "Candle, Plug", correct: false, seconds: 3.2 }],
  };
  state.assessments = [{ id: "r1", studentId: "s1", sectionId: "a", moduleId: 1, practical: 50, accuracy: 0, reaction: 3, quality: "Complete", review: "Published", detail }];
  const parsed = stateSchema.parse(state);
  assert.deepEqual(parsed.assessments[0].detail, detail);
});

test("assessments compare by content: field order passes, a real edit is refused", async () => {
  const { sameContent } = await import("../../shared/admin-schema.ts");
  const stored = { id: "r1", review: "Published", grade: 100, submitted: "2026-09-27", feedback: "very good!" };
  const parsed = { id: "r1", review: "Published", grade: 100, feedback: "very good!", submitted: "2026-09-27" };
  assert.equal(sameContent([parsed], [stored]), true);
  assert.equal(sameContent([{ ...parsed, comments: null }], [stored]), true);
  assert.equal(sameContent([{ ...parsed, grade: 60 }], [stored]), false);
  assert.equal(sameContent([{ ...parsed, feedback: "changed" }], [stored]), false);
  assert.equal(sameContent([], [stored]), false);
});

test("every app lesson's questions are exported for the server, with valid answers", async () => {
  const { readFileSync } = await import("node:fs");
  const { APP_READY_KEYS } = await import("../../shared/curriculum.ts");
  const { lessons } = JSON.parse(readFileSync(new URL("../data/lesson-content.json", import.meta.url), "utf8"));
  const keys = new Set(lessons.map((lesson: { key: string }) => lesson.key));
  for (const key of APP_READY_KEYS) assert.ok(keys.has(key), `missing questions for ${key}`);
  for (const lesson of lessons) {
    assert.ok(lesson.quiz.length > 0 && lesson.steps.length > 0, `${lesson.key} has no questions`);
    for (const item of [...lesson.quiz, ...lesson.steps]) {
      assert.ok(item.prompt.trim(), `${lesson.key}: a question has no text`);
      if (item.answer !== undefined) assert.ok(item.answer < item.choices.length, `${lesson.key}: answer points past the options`);
      assert.ok(item.choices.length > 0 || item.expected.trim(), `${lesson.key}: "${item.prompt}" has no answer`);
    }
  }
});
