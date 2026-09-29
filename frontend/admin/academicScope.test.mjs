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

const { gradeLevels, sectionsForGrade, studentsForSection, termsForYear, sectionsForTerm } = await loadTs("./academicScope.ts");
const { INITIAL_ACADEMIC_YEARS: years, INITIAL_ACADEMIC_TERMS: terms, INITIAL_GRADE_LEVELS: grades, INITIAL_SECTIONS: sections, INITIAL_USERS: users } = await loadTs("../shared/demo.ts");

test("all preview terms belong to an existing academic year", () => {
  assert.ok(terms.every(term => years.some(year => year.id === term.academicYearId)));
  assert.deepEqual(termsForYear(terms, "ay2026").map(term => term.id), ["term2026-1", "term2026-2"]);
  assert.deepEqual(termsForYear(terms, "unknown"), []);
});

test("existing sections belong to the first semester only", () => {
  assert.equal(sectionsForTerm(sections, terms, "ay2026", "term2026-1").length, 6);
  assert.deepEqual(sectionsForTerm(sections, terms, "ay2026", "term2026-2"), []);
  assert.ok(sections.every(section => terms.some(term => term.id === section.termId)));
});

test("a term from another year cannot leak its sections", () => {
  const ownTerms = [...terms, { id: "other-term", academicYearId: "ay2027", name: "First Semester", status: "Active", starts: "2027-08-01", ends: "2027-12-01" }];
  const ownSections = [...sections, { ...sections[0], id: "other-section", termId: "other-term" }];
  assert.deepEqual(sectionsForTerm(ownSections, ownTerms, "ay2026", "other-term"), []);
  assert.deepEqual(sectionsForTerm(ownSections, ownTerms, "ay2027", "other-term").map(section => section.id), ["other-section"]);
  assert.deepEqual(sectionsForTerm(ownSections, ownTerms, "unknown", "term2026-1"), []);
});

test("new or updated term associations change only the relevant term's list", () => {
  const ownSections = sections.map(section => section.id === "s1" ? { ...section, termId: "term2026-2" } : section);
  assert.equal(sectionsForTerm(ownSections, terms, "ay2026", "term2026-1").length, 5);
  assert.deepEqual(sectionsForTerm(ownSections, terms, "ay2026", "term2026-2").map(section => section.id), ["s1"]);
  assert.equal(sections[0].termId, "term2026-1");
});

test("unassigned sections do not silently appear in every term", () => {
  const ownSections = [...sections, { ...sections[0], id: "unassigned", termId: undefined }];
  assert.equal(sectionsForTerm(ownSections, terms, "ay2026", "term2026-1").length, 6);
  assert.deepEqual(sectionsForTerm(ownSections, terms, "ay2026", "term2026-2"), []);
});

test("grade levels are explicitly registered per year; new years start empty", () => {
  assert.deepEqual(gradeLevels(grades, "ay2026").map(grade => grade.level), ["4", "5", "6"]);
  assert.deepEqual(gradeLevels(grades, "new-year"), []);
  assert.deepEqual(gradeLevels([], "ay2026"), []);
  const updated = [...grades, { id: "new-grade", academicYearId: "new-year", level: "4" }];
  assert.deepEqual(gradeLevels(updated, "new-year").map(grade => grade.id), ["new-grade"]);
  assert.equal(gradeLevels(updated, "ay2026").length, 3);
});

test("each grade level lists only its own sections", () => {
  const scoped = sectionsForTerm(sections, terms, "ay2026", "term2026-1");
  assert.deepEqual(sectionsForGrade(scoped, "4").map(section => section.id), ["s1", "s2"]);
  assert.deepEqual(sectionsForGrade(scoped, "5").map(section => section.id), ["s3", "s4"]);
  assert.deepEqual(sectionsForGrade(scoped, "6").map(section => section.id), ["s5", "s6"]);
  assert.deepEqual(sectionsForGrade(scoped, "unknown"), []);
});

test("opening a section shows all of its student accounts, including pending accounts", () => {
  const grade4 = sectionsForGrade(sections, "4");
  assert.deepEqual(studentsForSection(users, grade4, "s1").map(student => student.id), ["st1", "st2", "st3", "st4", "st5", "st6"]);
  const grade6 = sectionsForGrade(sections, "6");
  assert.equal(studentsForSection(users, grade6, "s6").length, 6);
  assert.ok(studentsForSection(users, grade6, "s6").some(student => student.id === "st36" && student.status === "Pending"));
});

test("student accounts cannot cross the selected grade, term, or section", () => {
  const grade4 = sectionsForGrade(sectionsForTerm(sections, terms, "ay2026", "term2026-1"), "4");
  assert.deepEqual(studentsForSection(users, grade4, "s3"), []);
  assert.deepEqual(studentsForSection(users, sectionsForTerm(sections, terms, "ay2026", "term2026-2"), "s1"), []);
  assert.deepEqual(studentsForSection(users, grade4, "unknown"), []);
  const extraAdult = { ...users[0], section: "s1" };
  assert.equal(studentsForSection([...users, extraAdult], grade4, "s1").length, 6);
});
