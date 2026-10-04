import assert from "node:assert/strict";
import test from "node:test";
import { podium, rosterEntries, sortRoster } from "../../shared/roster.ts";

const student = (id: string, studentName: string) => ({ id, name: id.toUpperCase(), studentName });
const run = (studentId: string, moduleId: number, practical: number) => ({
  studentId, moduleId, practical, grade: null, quality: "Complete", review: "Published", submitted: `2026-01-0${moduleId}`,
});

const students = [student("a", "Zed"), student("b", "Amy"), student("c", "Bea"), student("d", "Cal")];
const rows = [
  run("a", 1, 100),                  // 3 stars, 100%
  run("b", 1, 70), run("b", 2, 70),  // 4 stars, 70%
  run("c", 1, 90),                   // 3 stars, 90%
  // d has not attempted anything
];

test("learners are ranked by stars, then average; those with no result are unranked", () => {
  const ranked = rosterEntries(students, rows);
  assert.deepEqual(ranked.map(row => [row.student.id, row.rank]), [["a", 2], ["b", 1], ["c", 3], ["d", null]]);
  assert.deepEqual(podium(ranked).map(row => row.student.id), ["b", "a", "c"]);
});

test("the roster can be ordered A–Z or by grade, unscored learners last", () => {
  const ranked = rosterEntries(students, rows);
  assert.deepEqual(sortRoster(ranked, "name").map(row => row.student.studentName), ["Amy", "Bea", "Cal", "Zed"]);
  assert.deepEqual(sortRoster(ranked, "high").map(row => row.student.id), ["a", "c", "b", "d"]);
  assert.deepEqual(sortRoster(ranked, "low").map(row => row.student.id), ["b", "c", "a", "d"]);
});

test("equal learners share a place", () => {
  const ranked = rosterEntries([student("a", "A"), student("b", "B")], [run("a", 1, 90), run("b", 1, 90)]);
  assert.deepEqual(ranked.map(row => row.rank), [1, 1]);
});
