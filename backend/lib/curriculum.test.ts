import assert from "node:assert/strict";
import test from "node:test";
import { emptyAdminState } from "../../shared/admin-schema.ts";
import { CURRICULUM_MODULES, ensureCurriculum, moduleHasAppPack } from "../../shared/curriculum.ts";

test("empty admin state ships the SafetyQuest lesson catalog", () => {
  const state = emptyAdminState();
  assert.equal(state.modules.length, CURRICULUM_MODULES.length);
  assert.equal(state.modules[0]?.key, "emergency-basics");
  assert.equal(moduleHasAppPack(state.modules[0]!), true);
  assert.equal(moduleHasAppPack(state.modules.find(row => row.key === "first-aid")!), true);
  assert.equal(moduleHasAppPack(state.modules.find(row => row.key === "household-electricity")!), true);
});

test("ensureCurriculum fills an empty workspace and is idempotent", () => {
  const blank = emptyAdminState();
  blank.modules = [];
  const filled = ensureCurriculum(blank);
  assert.equal(filled.changed, true);
  assert.equal(filled.state.modules.length, 15);
  const again = ensureCurriculum(filled.state);
  assert.equal(again.changed, false);
});
