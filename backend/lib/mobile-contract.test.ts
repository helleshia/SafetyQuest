import assert from "node:assert/strict";
import test from "node:test";
import { emptyAdminState } from "../../shared/admin-schema.ts";
import { findMobileStudent, findSetupStudent, mobileRegistrationSchema, practiceAccess, mobileSnapshot, parentContactSchema, studentAnnouncements } from "./mobile-contract.ts";

test("mobile setup normalizes contacts and rejects missing contact, mismatch, oversized password and privileged fields", () => {
  const input = { studentId: " sq-001 ", password: "a long password1", confirmPassword: "a long password1", parentContact: { kind: "email", value: " PARENT@example.com " } };
  const result = mobileRegistrationSchema.parse(input);
  assert.equal(result.studentId, "SQ-001");
  assert.equal(result.parentContact.value, "parent@example.com");
  assert.equal(parentContactSchema.parse({ kind: "phone", value: "0917 123 4567" }).value, "+639171234567");
  for (const patch of [{ confirmPassword: "different" }, { password: "short" }, { parentContact: undefined }, { parentContact: { kind: "phone", value: "123" } }, { parentContact: { kind: "phone", value: "+639171234567" } }, { password: "é".repeat(37), confirmPassword: "é".repeat(37) }, { role: "Super Admin" }]) {
    assert.equal(mobileRegistrationSchema.safeParse({ ...input, ...patch }).success, false);
  }
});

test("mobile snapshot scopes lessons and published class standings without leaking IDs or contacts", () => {
  const state = emptyAdminState();
  const learner = { id: "s1", name: "SQ-001", studentName: "Ana Cruz", email: "", role: "Student" as const, status: "Active" as const, section: "a", completed: 0, score: 0, consent: false, assent: false };
  state.users = [learner, { ...learner, id: "s2", name: "SQ-002", studentName: "Private classmate" }, { ...learner, id: "s3", name: "SQ-003", section: "b" }, { ...learner, id: "s4", name: "SQ-004", status: "Suspended" }];
  state.sections = [{ id: "a", name: "Kindness", grade: "5", teacherId: "t1", code: "secret", enrollment: true }];
  state.modules = [1, 2, 3, 4].map(id => ({ id, name: `Lesson ${id}`, domain: "Safety", status: id === 2 ? "Draft" : "Published", version: 1, lessonPages: 3, questions: 0, scenarios: 0 }));
  state.assignments = [1, 2, 3, 4].map(id => ({ id: `a${id}`, moduleId: id, version: 1, sectionId: id === 3 ? "b" : "a", tokens: [], opens: id === 4 ? "2999-01-01" : "", due: "", phases: "Learn only", retries: 0, simulation: false, status: "Published" }));
  state.assessments = [
    { id: "r1", studentId: "s1", sectionId: "a", moduleId: 1, practical: 80, accuracy: 80, reaction: 80, quality: "Complete", review: "Published" },
    { id: "r2", studentId: "s2", sectionId: "a", moduleId: 1, practical: 90, accuracy: 90, reaction: 90, quality: "Complete", review: "Published" },
    { id: "r3", studentId: "s2", sectionId: "a", moduleId: 1, practical: 0, accuracy: 0, reaction: 0, quality: "Complete", review: "Awaiting review" },
    { id: "r4", studentId: "s3", sectionId: "b", moduleId: 1, practical: 99, accuracy: 99, reaction: 99, quality: "Complete", review: "Published" },
  ];
  assert.equal(findMobileStudent(state, "sq-001")?.id, "s1");
  assert.equal(findMobileStudent(state, "SQ-004"), undefined);
  assert.equal(findSetupStudent(state, "SQ-004"), undefined);
  state.users.push({ ...learner, id: "s5", name: "SQ-005", status: "Pending" });
  assert.equal(findMobileStudent(state, "SQ-005"), undefined);
  assert.equal(findSetupStudent(state, "sq-005")?.id, "s5");
  const snapshot = mobileSnapshot(state, "s1");
  assert.deepEqual(snapshot.lessons.map(row => row.id), [1]);
  assert.equal(snapshot.lessons[0].key, "emergency-basics");
  assert.equal(snapshot.lessons[0].ready, true);
  assert.deepEqual(snapshot.earnedKeys, ["emergency-basics"]);
  assert.equal(snapshot.student.completed, 1);
  assert.equal(snapshot.leaderboard.entries.length, 2);
  assert.equal(snapshot.leaderboard.entries[0].score, 90);
  assert.equal(snapshot.leaderboard.entries[1].label, "You");
  assert.equal(snapshot.leaderboard.entries[1].rank, 2);
  assert.equal(snapshot.leaderboard.entries[0].stars, 3);
  assert.equal(snapshot.leaderboard.entries[1].stars, 2);
  // Classmates appear on the board by name; their IDs and other classes never do.
  assert.equal(snapshot.leaderboard.entries[0].label, "Private classmate");
  for (const privateValue of ["SQ-002", "SQ-003", "secret", "Awaiting review"]) assert.equal(JSON.stringify(snapshot).includes(privateValue), false);
  state.sections[0].lessonsOpen = false;
  const closed = mobileSnapshot(state, "s1");
  assert.equal(closed.lessons.length, 0);
  // Awards survive even when no lesson is currently open.
  assert.deepEqual(closed.earnedKeys, ["emergency-basics"]);
});

test("practice opens only for Learn and Practice assignments and counts tries", () => {
  const state = emptyAdminState();
  const learner = { id: "s1", name: "SQ-001", studentName: "Ana Cruz", email: "", role: "Student" as const, status: "Active" as const, section: "a", completed: 0, score: 0, consent: false, assent: false };
  state.users = [learner];
  state.sections = [{ id: "a", name: "Kindness", grade: "5", teacherId: "t1", code: "c", enrollment: true }];
  state.modules = [1, 2].map(id => ({ id, name: `Lesson ${id}`, domain: "Safety", status: "Published", version: 1, lessonPages: 3, questions: 0, scenarios: 0 }));
  state.assignments = [
    { id: "a1", moduleId: 1, version: 1, sectionId: "a", tokens: [], opens: "", due: "", phases: "Learn and Practice", retries: 1, simulation: true, status: "Published" },
    { id: "a2", moduleId: 2, version: 1, sectionId: "a", tokens: [], opens: "", due: "", phases: "Learn only", retries: 0, simulation: false, status: "Published" },
  ];
  // One try only: a class-wide `retries` value does not add tries.
  assert.deepEqual(practiceAccess(state, learner, 1), { practice: true, attemptsLeft: 1 });
  assert.deepEqual(practiceAccess(state, learner, 2), { practice: false, attemptsLeft: 0 });
  state.assessments = [{ id: "r1", studentId: "s1", sectionId: "a", moduleId: 1, practical: 50, accuracy: 50, reaction: 3, quality: "Complete", review: "Awaiting review" }];
  assert.equal(practiceAccess(state, learner, 1).attemptsLeft, 0);
  // Leaving midway also uses the try.
  state.assessments = [{ id: "r1", studentId: "s1", sectionId: "a", moduleId: 1, practical: 10, accuracy: 50, reaction: 3, quality: "Interrupted", review: "Awaiting review" }];
  assert.equal(practiceAccess(state, learner, 1).attemptsLeft, 0);
  state.sections[0].practicalOpen = false;
  assert.deepEqual(practiceAccess(state, learner, 1), { practice: false, attemptsLeft: 0 });
});

test("teacher-granted extraTries unlock another simulation attempt", () => {
  const state = emptyAdminState();
  const learner = { id: "s1", name: "SQ-001", studentName: "Ana Cruz", email: "", role: "Student" as const, status: "Active" as const, section: "a", completed: 0, score: 0, consent: false, assent: false };
  state.users = [learner];
  state.sections = [{ id: "a", name: "Kindness", grade: "5", teacherId: "t1", code: "c", enrollment: true }];
  state.modules = [{ id: 1, name: "Lesson 1", domain: "Safety", status: "Published", version: 1, lessonPages: 3, questions: 0, scenarios: 0 }];
  state.assignments = [{ id: "a1", moduleId: 1, version: 1, sectionId: "a", tokens: [], opens: "", due: "", phases: "Learn and Practice", retries: 0, simulation: true, status: "Published" }];
  state.assessments = [{ id: "r1", studentId: "s1", sectionId: "a", moduleId: 1, practical: 80, accuracy: 80, reaction: 2, quality: "Complete", review: "Published" }];
  assert.equal(practiceAccess(state, learner, 1).attemptsLeft, 0);
  state.assignments[0].extraTries = { s1: 1 };
  assert.deepEqual(practiceAccess(state, learner, 1), { practice: true, attemptsLeft: 1 });
  // The granted try locks again once it is used.
  state.assessments.push({ id: "r2", studentId: "s1", sectionId: "a", moduleId: 1, practical: 90, accuracy: 90, reaction: 2, quality: "Complete", review: "Published" });
  assert.equal(practiceAccess(state, learner, 1).attemptsLeft, 0);
});

test("student lessons follow teacher open and due dates", () => {
  const state = emptyAdminState();
  const learner = { id: "s1", name: "SQ-001", studentName: "Ana Cruz", email: "", role: "Student" as const, status: "Active" as const, section: "a", completed: 0, score: 0, consent: false, assent: false };
  state.users = [learner];
  state.sections = [{ id: "a", name: "Mahogany", grade: "5", teacherId: "t1", code: "c", enrollment: true }];
  state.modules = [
    { id: 1, name: "Earthquake Safety", key: "earthquake", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
    { id: 2, name: "Fire Safety", key: "fire-safety", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
    { id: 3, name: "Flood Safety", key: "flood-safety", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  ];
  state.assignments = [
    { id: "open", moduleId: 1, version: 1, sectionId: "a", tokens: [], opens: "Mar 01, 2020", due: "Dec 31, 2099", phases: "Learn and Practice", retries: 1, simulation: true, status: "Published" },
    { id: "future", moduleId: 2, version: 1, sectionId: "a", tokens: [], opens: "Jan 01, 2099", due: "Dec 31, 2099", phases: "Learn and Practice", retries: 1, simulation: true, status: "Published" },
    { id: "expired", moduleId: 3, version: 1, sectionId: "a", tokens: [], opens: "Mar 01, 2020", due: "Mar 02, 2020", phases: "Learn and Practice", retries: 1, simulation: true, status: "Published" },
  ];
  assert.deepEqual(mobileSnapshot(state, "s1").lessons.map(row => row.id), [1]);
});

test("the class board ranks by simulation stars, then by average score", () => {
  const state = emptyAdminState();
  const base = { email: "", role: "Student" as const, status: "Active" as const, section: "a", completed: 0, score: 0, consent: false, assent: false };
  state.users = ["s1", "s2", "s3"].map((id, i) => ({ ...base, id, name: `SQ-00${i + 1}` }));
  state.sections = [{ id: "a", name: "Kindness", grade: "5", teacherId: "t1", code: "c", enrollment: true }];
  const run = (id: string, studentId: string, moduleId: number, practical: number) =>
    ({ id, studentId, sectionId: "a", moduleId, practical, accuracy: 80, reaction: 3, quality: "Complete" as const, review: "Published" as const });
  state.assessments = [
    // s1: one perfect run, 3 stars, 100% average.
    run("a", "s1", 1, 100),
    // s2: two runs at 2 stars each, 4 stars, lower average: still ahead on stars.
    run("b", "s2", 1, 70), run("c", "s2", 2, 70),
    // s3: 3 + 1 stars, 4 stars too, but a lower average than s2.
    run("d", "s3", 1, 90), run("e", "s3", 2, 40),
  ];
  const board = mobileSnapshot(state, "s1").leaderboard.entries;
  assert.deepEqual(board.map(row => [row.stars, row.score, row.rank]), [[4, 70, 1], [4, 65, 2], [3, 100, 3]]);
  assert.equal(board[2].label, "You");
});

test("learners see their teacher's posts and school posts meant for students only", () => {
  const state = emptyAdminState();
  const section = { id: "a", name: "Mahogany", grade: "5", teacherId: "t1", code: "c", enrollment: true };
  state.sections = [section, { id: "b", name: "Narra", grade: "6", teacherId: "t2", code: "d", enrollment: true }];
  const post = (id: string, audience: string) => ({ id, title: id, message: "m", audience, date: "Sep 27, 2026" });
  state.announcements = [
    post("mine", "Mahogany"), post("other-class", "Narra"), post("all-kids", "All students"),
    post("everyone", "Everyone"), post("grade5", "Grade 5 · students"), post("grade6", "Grade 6 · students"),
    post("teachers", "All teachers"), post("parents", "All parents"), post("adults", "All adults"),
  ];
  const seen = studentAnnouncements(state, section);
  assert.deepEqual(seen.map(row => row.id), ["mine", "all-kids", "everyone", "grade5"]);
  assert.equal(seen[0].from, "Your teacher");
  assert.equal(seen[1].from, "Your school");
});
