import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Render TSX using the existing TypeScript and React dependencies, without a browser or new runner.
const cache = new Map();
async function moduleUri(url) {
  if (cache.has(url.href)) return cache.get(url.href);
  let { outputText } = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  const parsed = ts.createSourceFile("module.js", outputText, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JS);
  const edits = [];
  for (const node of parsed.statements) {
    if (!ts.isImportDeclaration(node)) continue;
    const specifier = node.moduleSpecifier.text;
    if (specifier.endsWith(".css")) { edits.push({ start: node.getStart(parsed), end: node.end, value: "" }); continue; }
    let uri;
    if (specifier.startsWith(".")) {
      const path = [".ts", ".tsx"].map(ext => new URL(specifier + ext, url)).find(candidate => existsSync(candidate));
      assert.ok(path, `Cannot resolve ${specifier} from ${url.href}`);
      uri = await moduleUri(path);
    } else uri = import.meta.resolve(specifier);
    edits.push({ start: node.moduleSpecifier.getStart(parsed), end: node.moduleSpecifier.end, value: JSON.stringify(uri) });
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) outputText = outputText.slice(0, edit.start) + edit.value + outputText.slice(edit.end);
  const uri = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  cache.set(url.href, uri); return uri;
}

const { DataProvider } = await import(await moduleUri(new URL("../shared/store.tsx", import.meta.url)));
const { default: AcademicYears } = await import(await moduleUri(new URL("./AcademicYears.tsx", import.meta.url)));
const { default: AdminApp } = await import(await moduleUri(new URL("./AdminApp.tsx", import.meta.url)));
const { default: Overview } = await import(await moduleUri(new URL("./Overview.tsx", import.meta.url)));
const { default: AcademicForms } = await import(await moduleUri(new URL("./AcademicForms.tsx", import.meta.url)));
const { default: AcademicActionMenu } = await import(await moduleUri(new URL("./AcademicActionMenu.tsx", import.meta.url)));
const { default: StudentDetails } = await import(await moduleUri(new URL("./StudentDetails.tsx", import.meta.url)));
const { default: UserDetails } = await import(await moduleUri(new URL("./UserDetails.tsx", import.meta.url)));
const { default: Reports } = await import(await moduleUri(new URL("./Reports.tsx", import.meta.url)));
const { default: Assessment } = await import(await moduleUri(new URL("./Assessment.tsx", import.meta.url)));
const { default: Announcements } = await import(await moduleUri(new URL("./Announcements.tsx", import.meta.url)));
const { default: Consent } = await import(await moduleUri(new URL("./Consent.tsx", import.meta.url)));
const { default: Audit } = await import(await moduleUri(new URL("./Audit.tsx", import.meta.url)));
const { INITIAL_USERS: initialUsers, INITIAL_SECTIONS: initialSections, INITIAL_SETTINGS: initialSettings, INITIAL_ASSESSMENTS } = await import(await moduleUri(new URL("../shared/demo.ts", import.meta.url)));
const render = child => renderToStaticMarkup(React.createElement(DataProvider, null, child));

test("admin navigation uses Academic Year instead of a standalone Sections interface", () => {
  const html = renderToStaticMarkup(React.createElement(AdminApp, { onSignOut() {} }));
  const navigation = html.match(/<nav class="sa-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(navigation);
  assert.match(navigation, /<span>Academic Year<\/span>/);
  assert.doesNotMatch(navigation, /<span>Sections<\/span>/);
});

test("Overview starts with one summary strip and only two main panels", () => {
  const html = render(React.createElement(Overview, { go() {} }));
  assert.match(html, /aria-label="School summary"/);
  assert.equal((html.match(/class="sa-panel /g) ?? []).length, 2);
  assert.match(html, /Learning progress/);
  assert.match(html, /Needs attention/);
  assert.doesNotMatch(html, /sa-stat-grid|Completion by section|Quiz performance|Simulation performance/);
  assert.doesNotMatch(html, /Recent administrative activity|Operational status|Common incorrect decisions/);
});

test("Overview has explicit view navigation, grouping controls and collapsed reporting notes", () => {
  const html = render(React.createElement(Overview, { go() {} }));
  const navigation = html.match(/<nav class="overview-views"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(navigation);
  assert.match(navigation, /aria-current="page"[\s\S]*?Summary/);
  assert.match(navigation, /Learning/);
  assert.match(navigation, /Activity/);
  assert.match(html, /aria-label="Group learning progress"/);
  assert.match(html, /aria-pressed="true">Grade/);
  assert.match(html, /aria-label="Quick navigation"/);
  assert.match(html, /<details class="overview-disclosure overview-reporting">/);
  assert.match(html, /Consent verified/);
  assert.match(html, /Child assent/);
});

test("Overview task queue shows actual pending counts rather than an unconditional review alert", () => {
  const html = render(React.createElement(Overview, { go() {} }));
  const tasks = html.match(/<ul class="overview-tasks">([\s\S]*?)<\/ul>/)?.[1];
  assert.ok(tasks);
  assert.match(tasks, /Teacher approvals[\s\S]*?<b class="has-items">1<\/b>/);
  assert.match(tasks, /Parent links[\s\S]*?<b class="has-items">3<\/b>/);
  assert.match(tasks, /Curriculum reviews[\s\S]*?<b class="has-items">2<\/b>/);
  assert.match(tasks, /Assessment reviews/);
});

test("learning progress rows sit in a capped scroll area so a long list cannot stretch the panel", () => {
  const html = render(React.createElement(Overview, { go() {} }));
  const list = html.match(/<div class="overview-progress-list overview-scroll">([\s\S]*?)<\/div><button/)?.[1];
  assert.ok(list, "grouped progress bars should render inside the scroll container");
  assert.ok((list.match(/class="sa-bar"/g) ?? []).length >= 3);
  assert.match(html, /<div class="overview-progress-list overview-scroll">[\s\S]*?View learning reports/);
});

test("Academic Year lands on a compact year table with Add Academic Year", () => {
  const html = render(React.createElement(AcademicYears));
  assert.match(html, /Add Academic Year/);
  assert.match(html, /SY 2026/);
  assert.match(html, /<table/);
  assert.match(html, /<th>Academic year<\/th>/);
  assert.doesNotMatch(html, /<th>Student name<\/th>/);
  assert.doesNotMatch(html, /Choose a grade level/);
});

test("each creation step renders its scoped add form", () => {
  for (const [target, label] of [
    [{ kind: "year" }, "Add Academic Year"],
    [{ kind: "grade", yearId: "ay2026" }, "Add Grade Level"],
    [{ kind: "section", yearId: "ay2026", grade: "4", termId: "term2026-1" }, "Add Section"],
    [{ kind: "student", sectionId: "s1" }, "Add Student"],
    [{ kind: "teacher", sectionId: "s1" }, "Add / Assign Teacher"],
  ]) {
    const html = render(React.createElement(AcademicForms, { target, onClose() {} }));
    assert.ok(html.includes(label), label);
    assert.match(html, /role="dialog"/);
    assert.match(html, /<form/);
  }
});

test("student form keeps student name and student ID as separate fields", () => {
  const html = render(React.createElement(AcademicForms, { target: { kind: "student", sectionId: "s1" }, onClose() {} }));
  assert.match(html, /Student full name/);
  assert.match(html, /name="name"/);
  assert.match(html, /name="student-id"/);
  assert.match(html, /fictional names/);
});

test("year rows use an icon identity and collapsed three-dot actions instead of button strips", () => {
  const html = render(React.createElement(AcademicYears));
  assert.match(html, /academic-identity-icon/);
  assert.match(html, /academic-more-button/);
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, />Edit<\/button>|>Delete<\/button>/);
});

test("three-dot action controls are labeled for their own record and start closed", () => {
  const html = render(React.createElement(AcademicActionMenu, { label: "Mahogany", actions: [{ label: "Edit section", icon: "edit", onSelect() {} }] }));
  assert.match(html, /aria-label="More actions for Mahogany"/);
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /<circle/);
  assert.doesNotMatch(html, /role="menuitem"/);
});

test("student details render as a full-page submodule, with identity, progress and assessments", () => {
  const student = initialUsers.find(user => user.id === "st1");
  const section = initialSections.find(section => section.id === student.section);
  const html = render(React.createElement(StudentDetails, { student, section, scopeLabel: "SY 2026–2027 · First Semester", onEdit() {}, onDelete() {} }));
  assert.match(html, /<article class="academic-student-page"/);
  assert.match(html, /Student ID: SQ-G4-001/);
  assert.match(html, /Account details/);
  assert.match(html, /Physical consent/);
  assert.match(html, /Learning progress/);
  assert.match(html, /<progress/);
  assert.match(html, /Latest learning activity/);
  // A recorded attempt already proves its lesson was worked through, so the record
  // carries the practical score only.
  assert.match(html, /<th>Practice<\/th>/);
  assert.doesNotMatch(html, /<th>Quiz<\/th>|<th>Lesson read<\/th>|Theoretical|pages/);
  assert.match(html, /aria-label="More actions for SQ-G4-001"/);
  assert.doesNotMatch(html, /role="dialog"|sa-modal|aria-modal|aria-label="Close"/);
});

test("new student details show the supplied name and an honest empty assessment state", () => {
  const student = { ...initialUsers.find(user => user.id === "st1"), id: "new-student", name: "SQ-NEW-001", studentName: "Demo Student", completed: 0, lastActive: undefined };
  const section = initialSections.find(section => section.id === student.section);
  const html = render(React.createElement(StudentDetails, { student, section, scopeLabel: "Preview year", onEdit() {}, onDelete() {} }));
  assert.match(html, />Demo Student<\/h2>/);
  assert.match(html, /Student ID: SQ-NEW-001/);
  assert.match(html, /No assessments recorded yet/);
  assert.match(html, /Not recorded/);
  assert.doesNotMatch(html, /Understanding Emergencies|Emergency Communication|SQ-G4-001/);
});

test("assessment details remain scoped to both the selected student and section", () => {
  const student = initialUsers.find(user => user.id === "st1");
  const section = initialSections.find(section => section.id !== student.section);
  const html = render(React.createElement(StudentDetails, { student, section, scopeLabel: "Preview", onEdit() {}, onDelete() {} }));
  assert.match(html, /No assessments recorded yet/);
  assert.doesNotMatch(html, /Understanding Emergencies|Emergency Communication/);
});

test("a user record opens as its own page with a way back, not as a pop-up dialog", () => {
  const teacher = initialUsers.find(user => user.role === "Teacher" && user.status === "Active");
  const html = render(React.createElement(UserDetails, { user: teacher, onBack() {}, onStatus() {}, onAssign() {} }));
  assert.match(html, /<article class="users-detail-page"/);
  assert.match(html, /Back to teacher directory/);
  assert.match(html, /Account details/);
  assert.match(html, /Access summary/);
  assert.match(html, /Administrative actions/);
  assert.doesNotMatch(html, /role="dialog"|sa-modal|aria-modal|aria-label="Close"/);
});

test("a pending teacher record offers approval, and a student record swaps in learning progress", () => {
  const pending = initialUsers.find(user => user.role === "Teacher" && user.status === "Pending");
  const pendingHtml = render(React.createElement(UserDetails, { user: pending, onBack() {}, onStatus() {}, onAssign() {} }));
  assert.match(pendingHtml, /Approve account/);
  assert.doesNotMatch(pendingHtml, /Assign section/);

  const student = initialUsers.find(user => user.id === "st1");
  const studentHtml = render(React.createElement(UserDetails, { user: student, onBack() {}, onStatus() {}, onAssign() {} }));
  assert.match(studentHtml, /Back to student directory/);
  assert.match(studentHtml, /Learning progress/);
  assert.match(studentHtml, /Module results/);
  assert.doesNotMatch(studentHtml, /Approve account|Assign section/);
});

test("Reports groups exports by sensitivity and states each one's row count before download", () => {
  const html = render(React.createElement(Reports));
  assert.match(html, /Operational reports/);
  assert.match(html, /Restricted exports/);
  // The restricted group carries only the two learner-level exports.
  const restricted = html.split("Restricted exports")[1];
  assert.match(restricted, /Token-based student progress/);
  assert.match(restricted, /Research export/);
  assert.doesNotMatch(restricted, /Deployment summary|Adult account inventory/);
  assert.match(html, /Generate CSV · \d+ rows/);
  assert.match(html, /What each row contains/);
});

test("Reports says plainly which filter narrows rows and which is only recorded in the file", () => {
  const html = render(React.createElement(Reports));
  const bar = html.match(/<div class="reports-filter-bar">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(bar);
  assert.match(bar, /does not remove rows yet/);
  assert.match(html, /Whole deployment/);
  assert.match(html, /Applies · not narrowed/);
});

test("the lesson is a prerequisite for the practical, never a scored component", () => {
  const html = render(React.createElement(Assessment));
  assert.match(html, /work through a lesson, then attempt its practical/);
  assert.match(html, /reached the 70% pass mark/);
  // No surface may give the lesson a score, a pass mark, or a column of its own.
  assert.doesNotMatch(html, /Theoretical|Quiz average|Lesson read|Lesson coverage|lessonPagesRead/i);
  assert.equal(initialSettings.theoryPass, undefined);
  assert.equal(initialSettings.theoryWeight, undefined);
  assert.equal(initialSettings.practicalPass, 70);
  assert.ok(INITIAL_ASSESSMENTS.every(row => !("lessonPagesRead" in row)), "an attempt row carries no lesson field");
});

test("Assessment overview leads with the review queue and explains what the page is for", () => {
  const html = render(React.createElement(Assessment));
  assert.match(html, /oversight, not grading/);
  const pipeline = html.match(/Where every attempt stands([\s\S]*?)Practical scores by module/)?.[1];
  assert.ok(pipeline, "the queue panel comes before the score panel");
  assert.match(pipeline, /Waiting for a teacher/);
  assert.match(pipeline, /Teacher is drafting/);
  assert.match(pipeline, /Published to the family/);
  assert.match(pipeline, /attempts are waiting for a teacher to review them/);
});

test("the module table reports how many took each practical and how many passed", () => {
  const html = render(React.createElement(Assessment));
  const panel = html.match(/Practical scores by module([\s\S]*?)Every recorded attempt/)?.[1];
  assert.ok(panel);
  assert.match(panel, /<th>Took the practical<\/th>/);
  assert.match(panel, /<th>Passed<\/th>/);
  // Pass rate per grade level, plus a grades 4-6 total.
  for (const level of ["Grade 4", "Grade 5", "Grade 6"]) assert.ok(panel.includes(`<span>${level}</span>`), level);
  assert.match(panel, /Grades 4–6 overall/);
  assert.match(panel, /\d+ of \d+ attempts passed/);
  // A module without attempts says so rather than rendering a 0% average.
  assert.match(panel, /No attempts recorded in this filter/);
  assert.doesNotMatch(panel, /No attempts recorded in this filter[\s\S]{0,200}?>0%</);
  assert.doesNotMatch(html, /Can this data be trusted|median reaction context/);
});

test("announcements can be addressed to teachers, parents and students, with a real reach count", () => {
  const html = render(React.createElement(Announcements));
  const filters = html.match(/<nav class="ann-filters"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(filters);
  for (const group of ["Everyone", "Teachers", "Parents", "Students", "Adults"]) assert.ok(filters.includes(group), group);
  // A student-facing message is flagged, since it lands on a child's device.
  assert.match(html, /All students/);
  assert.match(html, /Kids can read this/);
  assert.match(html, /Sent to \d+ accounts/);
});

test("a grade-scoped announcement reaches fewer accounts than the school-wide one", () => {
  const html = render(React.createElement(Announcements));
  const reaches = [...html.matchAll(/Sent to (\d+) accounts?</g)].map(match => Number(match[1]));
  assert.ok(reaches.length >= 4, "every published announcement states its reach");
  assert.ok(reaches.every(count => count > 0), "no published audience is empty");
  const scoped = html.match(/Grade 5 · everyone<\/span>[\s\S]*?Sent to (\d+) accounts?</)?.[1];
  assert.ok(scoped, "the grade-scoped announcement states its reach");
  assert.ok(Number(scoped) < Math.max(...reaches), "a grade scope narrows the audience");
});

test("the permission page separates a signed form from a connected parent, in plain words", () => {
  const html = render(React.createElement(Consent));
  assert.match(html, /Signed permission forms/);
  assert.match(html, /Children who said yes themselves/);
  assert.match(html, /Parents waiting to be connected/);
  // The four things people wrongly treat as proof of parenthood are named.
  assert.match(html, /Knowing the child&#x27;s ID|Knowing the child’s ID/);
  assert.match(html, /Having the same surname/);
  assert.match(html, /Holding the child&#x27;s phone|Holding the child’s phone/);
  assert.doesNotMatch(html, /guardian link|assent|token record/i);
});

test("the history page names the copies a deletion usually misses", () => {
  const html = render(React.createElement(Audit));
  assert.match(html, /What administrators have done/);
  assert.match(html, /Spreadsheets already downloaded/);
  assert.match(html, /Nightly backups/);
  assert.match(html, /encryption key is destroyed/);
  // Jargon that made the old page unreadable must not come back.
  assert.doesNotMatch(html, /cryptographic erasure|record family|derived metrics|lifecycle event/i);
  // The inventory and the procedure that consumes it are read together, side by side.
  const paired = html.match(/<div class="gov-columns">([\s\S]*?)<\/div><\/div>/)?.[1];
  assert.ok(paired, "both panels sit inside the two-column wrapper");
  assert.match(paired, /Everything we are storing about children/);
  assert.match(paired, /Deleting it all after the defence/);
});
