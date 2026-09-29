import assert from "node:assert/strict";
import test from "node:test";
import { emptyAdminState, stateSchema, validateState } from "../../shared/admin-schema.ts";

const adult = (id: string, role: "Super Admin" | "Parent" = "Parent") => ({ id, role, name: id, email: `${id}@example.com`, status: "Active" as const, section: "", completed: 0, score: 0, consent: false, assent: false });
function initial() { const state = emptyAdminState(); state.users = [adult("admin", "Super Admin"), adult("parent")]; return state; }

test("admin may add, edit and delete unlinked directory users", () => {
  const previous = initial();
  const added = structuredClone(previous); added.users.push(adult("new"));
  assert.doesNotThrow(() => validateState(added, previous, "admin"));
  const edited = structuredClone(previous); edited.users[1].name = "Updated name";
  assert.doesNotThrow(() => validateState(edited, previous, "admin"));
  const deleted = structuredClone(previous); deleted.users = deleted.users.filter(user => user.id !== "parent");
  assert.doesNotThrow(() => validateState(deleted, previous, "admin"));
});

test("admin cannot delete self, duplicate emails, alter role or forge verification", () => {
  const previous = initial();
  for (const change of [
    (state: typeof previous) => { state.users = state.users.filter(user => user.id !== "admin"); },
    (state: typeof previous) => { state.users[1].email = "ADMIN@example.com"; },
    (state: typeof previous) => { state.users[1].role = "Super Admin"; },
    (state: typeof previous) => { state.users[1].emailVerified = true; },
  ]) { const next = structuredClone(previous); change(next); assert.throws(() => validateState(next, previous, "admin")); }
});

test("removing links in the same request cannot bypass user deletion safeguards", () => {
  const previous = initial(); previous.links = [{ id: "link", parentId: "parent", studentId: "student", status: "Revoked", verifiedBy: "admin" }];
  const next = structuredClone(previous); next.links = []; next.users = next.users.filter(user => user.id !== "parent");
  assert.throws(() => validateState(next, previous, "admin"), /linked records/);
});

test("legacy null section switches are normalized before saving", () => {
  const previous = initial();
  previous.academicYears = [{ id: "year", name: "2026-2027", status: "Active" }];
  previous.academicTerms = [{ id: "term", academicYearId: "year", name: "First Semester", status: "Active", starts: "2026-08-17", ends: "2026-12-18" }];
  previous.grades = [{ id: "grade", academicYearId: "year", level: "5" }];
  previous.sections = [{ id: "section", name: "Grade 5 · Acacia", grade: "5", teacherId: "", code: "SQ-5A-421", enrollment: true, termId: "term", lessonsOpen: null as never, practicalOpen: null as never }];
  const parsed = stateSchema.parse(previous);
  assert.equal(parsed.sections[0].lessonsOpen, undefined);
  assert.equal(parsed.sections[0].practicalOpen, undefined);
  assert.doesNotThrow(() => validateState(parsed, previous, "admin"));
});
