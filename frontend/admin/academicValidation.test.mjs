import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function loadTs(path) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { displayStudentName, normalizeStudentId, normalizeYear, yearError, studentError, sectionDeleteReason, studentDeleteReason } = await loadTs("./academicValidation.ts");
const { INITIAL_ACADEMIC_YEARS: years, INITIAL_USERS: users, INITIAL_ASSESSMENTS: assessments, INITIAL_ASSIGNMENTS: assignments, INITIAL_LINKS: links } = await loadTs("../shared/demo.ts");

test("academic years require consecutive years and reject duplicates", () => {
  assert.equal(normalizeYear(" 2027 – 2028 "), "2027-2028");
  assert.equal(yearError("2027-2028", years), "");
  for (const name of ["2027", "2027-2029", "2028-2027", "1899-1900", "2201-2202", "2026-2027", "2026–2027"]) assert.notEqual(yearError(name, years), "");
  assert.equal(yearError("2026-2027", years, "ay2026"), "");
});

test("student name is separate from the existing ID", () => {
  const named = { ...users.find(user => user.id === "st1"), studentName: " Demo Student " };
  assert.equal(displayStudentName(named), "Demo Student");
  assert.equal(named.name, "SQ-G4-001");
  assert.equal(displayStudentName(users.find(user => user.id === "st1")), "Name not recorded");
});

test("student creation and edits validate full name and globally unique ID", () => {
  assert.equal(normalizeStudentId(" sq-g4-037 "), "SQ-G4-037");
  assert.equal(studentError("Demo Student", "sq-g4-037", users), "");
  assert.notEqual(studentError("  ", "SQ-G4-037", users), "");
  assert.notEqual(studentError("Demo Student", "SQ-G4-001", users), "");
  assert.equal(studentError("Updated Demo Name", "sq-g4-001", users, "st1"), "");
  assert.notEqual(studentError("Demo Student", "SQ-G4-002", users, "st1"), "");
  for (const token of ["", "A", "<script>", "A".repeat(41)]) assert.notEqual(studentError("Demo Student", token, users), "");
});

test("empty sections can be deleted but dependent records block deletion", () => {
  assert.equal(sectionDeleteReason("new-empty-section", users, assignments, assessments), "");
  assert.notEqual(sectionDeleteReason("s1", users, assignments, assessments), "");
  assert.notEqual(sectionDeleteReason("s3", [], assignments, []), "");
  assert.notEqual(sectionDeleteReason("s1", [], [], assessments), "");
});

test("student deletion preserves assessment and guardian history", () => {
  assert.equal(studentDeleteReason("new-student", assessments, links, assignments, "NEW-001"), "");
  assert.notEqual(studentDeleteReason("st13", assessments, [], [], "SQ-G5-013"), "");
  assert.notEqual(studentDeleteReason("st13", [], links, [], "SQ-G5-013"), "");
  assert.notEqual(studentDeleteReason("new-student", [], [], [{ tokens: ["NEW-001"] }], "NEW-001"), "");
});
