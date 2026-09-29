import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Load these TS modules without adding a test-runner dependency. Relative imports
// (such as the shared scoring rule) are transpiled the same way, recursively.
async function tsDataUrl(url) {
  const source = readFileSync(url, "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  for (const [whole, spec] of outputText.matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)) {
    const target = new URL(spec.endsWith(".ts") ? spec : `${spec}.ts`, url);
    outputText = outputText.replace(whole, `from "${await tsDataUrl(target)}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
async function loadTs(path) {
  return import(await tsDataUrl(new URL(path, import.meta.url)));
}
const { childName, earnedBadges, guardianLinks, linkedChildren, moduleProgress, normalizeToken, publishedResults, searchChildren, verifyChildDetails } = await loadTs("./progress.ts");
const { INITIAL_USERS, INITIAL_LINKS, INITIAL_ASSESSMENTS, INITIAL_MODULES, BADGE_LADDER, DEMO_PARENT_ID, DEMO_PARENT_EMAIL, DEMO_ACCOUNTS, getDemoSession, setDemoSession, practicalSummary } = await loadTs("../shared/demo.ts");
const children = linkedChildren(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID);

test("parent preview account maps to the intended guardian and child", () => {
  assert.equal(INITIAL_USERS.find(user => user.id === DEMO_PARENT_ID).email, DEMO_PARENT_EMAIL);
  assert.equal(DEMO_ACCOUNTS.find(account => account.role === "parent").email, DEMO_PARENT_EMAIL);
  assert.deepEqual(children.map(child => child.id), ["st13", "st20"]);
  assert.equal(childName(children[0]), "Maya Mendoza");
  assert.equal(children[0].name, "SQ-G5-013");
  assert.equal(children[1].name, "SQ-G5-020");
});

test("student name and ID search are case-insensitive and trim whitespace", () => {
  for (const query of [" MENDOZA ", ""]) {
    assert.deepEqual(searchChildren(children, query), children);
  }
  for (const query of ["maya", "sq-g5-013", " G5-013 "]) {
    assert.deepEqual(searchChildren(children, query).map(child => child.id), ["st13"]);
  }
});

test("unlinked students cannot be discovered by searching their IDs", () => {
  assert.deepEqual(searchChildren(children, "SQ-G4-001"), []);
  assert.deepEqual(searchChildren(children, "does not exist"), []);
});

test("pending, revoked and other guardians' links do not grant access", () => {
  for (const status of ["Pending", "Revoked"]) {
    const links = INITIAL_LINKS.map(link => link.parentId === DEMO_PARENT_ID ? { ...link, status } : link);
    assert.deepEqual(linkedChildren(INITIAL_USERS, links, DEMO_PARENT_ID), []);
  }
  assert.deepEqual(linkedChildren(INITIAL_USERS, INITIAL_LINKS, "unknown"), []);
});

test("suspended and pending student accounts are excluded", () => {
  for (const status of ["Suspended", "Pending"]) {
    const users = INITIAL_USERS.map(user => user.id === "st13" ? { ...user, status } : user);
    assert.deepEqual(linkedChildren(users, INITIAL_LINKS, DEMO_PARENT_ID).map(child => child.id), ["st20"]);
  }
});

test("multiple children can be selected without broadening guardian scope", () => {
  const links = [...INITIAL_LINKS, { id: "test-link", parentId: DEMO_PARENT_ID, studentId: "st14", status: "Active", verifiedBy: "Demo teacher" }];
  const own = linkedChildren(INITIAL_USERS, links, DEMO_PARENT_ID);
  assert.deepEqual(own.map(child => child.id), ["st13", "st14", "st20"]);
  assert.deepEqual(searchChildren(own, "SQ-G5-014").map(child => child.id), ["st14"]);
});

test("draft reviews and other students' results stay hidden", () => {
  const rows = ["Published", "Revised", "Reviewed draft", "Awaiting review"].map((review, index) => ({ id: String(index), studentId: "st13", moduleId: index + 1, practical: 80, quality: "Complete", review }));
  rows.push({ id: "other", studentId: "st1", moduleId: 1, practical: 80, quality: "Complete", review: "Published" });
  assert.deepEqual(publishedResults(rows, "st13").map(row => row.id).sort(), ["0", "1"]);
  assert.deepEqual(publishedResults(INITIAL_ASSESSMENTS, "st13").map(row => row.id), ["as12-0"]);
  assert.deepEqual(publishedResults(rows, "unknown"), []);
});

test("parent preview session survives reload and is cleared on sign out", () => {
  const stored = new Map();
  globalThis.sessionStorage = {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: key => stored.delete(key),
  };
  try {
    setDemoSession("parent");
    assert.equal(getDemoSession(), "parent");
    setDemoSession(null);
    assert.equal(getDemoSession(), null);
    stored.set("safetyquest.demo-session", "invalid-role");
    assert.equal(getDemoSession(), null);
  } finally { delete globalThis.sessionStorage; }
});

test("student IDs match regardless of spacing, dashes and case", () => {
  for (const typed of ["SQ-G5-013", "sq-g5-013", " sq g5 013 ", "sqg5013"]) {
    assert.equal(normalizeToken(typed), "SQG5013");
    const result = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, "Maya", typed);
    assert.deepEqual(result, { ok: true, studentId: "st13" });
  }
});

test("check-in needs both a name and a student ID", () => {
  const blankName = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, " ", "SQ-G5-013");
  assert.equal(blankName.ok, false);
  assert.match(blankName.message, /name/i);
  const blankId = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, "Maya", " -- ");
  assert.equal(blankId.ok, false);
  assert.match(blankId.message, /student ID/i);
});

test("a wrong ID cannot be used to probe the roster", () => {
  // An unlinked child and an ID that exists for nobody must be indistinguishable.
  const unlinked = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, "Maya", "SQ-G4-001");
  const missing = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, "Maya", "SQ-G9-999");
  assert.equal(unlinked.ok, false);
  assert.deepEqual(unlinked, missing);
});

test("pending and revoked links are told apart from a wrong ID, but open nothing", () => {
  const pending = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, "Noah", "SQ-G6-026");
  const revoked = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, DEMO_PARENT_ID, "Liana", "SQ-G6-032");
  assert.equal(pending.ok, false);
  assert.match(pending.message, /awaiting verification/i);
  assert.equal(revoked.ok, false);
  assert.match(revoked.message, /ended/i);
});

test("another guardian's child never checks in", () => {
  const other = verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, "p2", "Maya", "SQ-G5-013");
  assert.equal(other.ok, false);
  assert.equal(verifyChildDetails(INITIAL_USERS, INITIAL_LINKS, "unknown", "Maya", "SQ-G5-013").ok, false);
});

test("an inactive student record cannot be opened", () => {
  const users = INITIAL_USERS.map(user => user.id === "st13" ? { ...user, status: "Suspended" } : user);
  const result = verifyChildDetails(users, INITIAL_LINKS, DEMO_PARENT_ID, "Maya", "SQ-G5-013");
  assert.equal(result.ok, false);
  assert.match(result.message, /not active/i);
});

test("the access list covers every link state on the account", () => {
  const states = guardianLinks(INITIAL_LINKS, DEMO_PARENT_ID).map(link => link.status).sort();
  assert.deepEqual(states, ["Active", "Active", "Pending", "Revoked"]);
  assert.deepEqual(guardianLinks(INITIAL_LINKS, "unknown"), []);
});

test("module progress covers published modules only and hides unpublished scores", () => {
  const child = children[0];
  const rows = moduleProgress(INITIAL_MODULES, INITIAL_ASSESSMENTS, child);
  assert.equal(rows.length, INITIAL_MODULES.filter(module => module.status === "Published").length);
  assert.ok(rows.every(row => INITIAL_MODULES.find(module => module.id === row.moduleId).status === "Published"));
  assert.equal(rows.filter(row => row.lesson === "Complete").length, Math.min(rows.length, child.completed));
  assert.equal(rows.filter(row => row.lesson === "In progress").length, 1);
  // Only the practical is scored, and only a published review reveals it.
  const scored = new Set(publishedResults(INITIAL_ASSESSMENTS, child.id).map(row => row.moduleId));
  assert.ok(rows.every(row => (row.practical === null) === !scored.has(row.moduleId)));
  assert.ok(rows.every(row => !("quiz" in row)), "a lesson carries no score of its own");
});

test("module progress stays in range for an untouched record", () => {
  const rows = moduleProgress(INITIAL_MODULES, [], { ...children[0], completed: 99 });
  assert.ok(rows.every(row => row.lesson === "Complete" && row.practical === null));
  assert.deepEqual(moduleProgress(INITIAL_MODULES, [], { ...children[0], completed: -4 })[0].lesson, "In progress");
});

test("badges are earned in order and never exceed the ladder", () => {
  assert.deepEqual(earnedBadges(BADGE_LADDER, { completed: 0 }), []);
  assert.deepEqual(earnedBadges(BADGE_LADDER, { completed: 5 }), BADGE_LADDER.slice(0, 2));
  assert.deepEqual(earnedBadges(BADGE_LADDER, { completed: 999 }), BADGE_LADDER);
  assert.deepEqual(earnedBadges(BADGE_LADDER, { completed: -3 }), []);
});

test("practice summaries stay supportive and never claim real-world readiness", () => {
  const messages = [100, 85, 70, 60, 10].map(score => practicalSummary(score, 70));
  assert.equal(new Set(messages).size, 4);
  for (const message of messages) {
    assert.doesNotMatch(message, /danger|unsafe|fail|risk|emergency/i);
  }
  assert.match(practicalSummary(10, 70), /review this lesson and try the practice again/i);
});
