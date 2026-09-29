import type { AdminState } from "./admin-schema.ts";

/** Keys that ship with animated lesson packs in the current mobile app. */
export const APP_READY_KEYS = new Set([
  "emergency-basics",
  "earthquake",
  "fire-safety",
  "flood-safety",
  "typhoon-safety",
  "evacuation-drills",
  "go-bag",
  "emergency-comm",
  "stranger-danger",
  "cyber-safety",
  "road-safety",
  "first-aid",
  "bullying",
  "water-safety",
  "household-electricity",
]);

/** Canonical SafetyQuest curriculum — keys match Flutter `LessonContent.key`. */
export const CURRICULUM_MODULES: AdminState["modules"] = [
  { id: 1, name: "Understanding Emergencies", key: "emergency-basics", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 2, name: "Earthquake Safety", key: "earthquake", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 3, name: "Fire Safety", key: "fire-safety", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 4, name: "Flood Safety", key: "flood-safety", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 5, name: "Typhoon Safety", key: "typhoon-safety", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 6, name: "Evacuation Drills", key: "evacuation-drills", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 7, name: "Emergency Go Bag", key: "go-bag", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 8, name: "Emergency Communication", key: "emergency-comm", domain: "Disaster Preparedness", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 9, name: "Stranger Danger", key: "stranger-danger", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 10, name: "Cyberbullying & Online Safety", key: "cyber-safety", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 11, name: "Road & Traffic Safety", key: "road-safety", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 12, name: "Basic First Aid", key: "first-aid", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 13, name: "Bullying Awareness", key: "bullying", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 14, name: "Water Safety", key: "water-safety", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
  { id: 15, name: "Poison, Household & Electricity Safety", key: "household-electricity", domain: "Personal Safety", status: "Published", version: 1, lessonPages: 7, questions: 7, scenarios: 6 },
];

export const MODULE_KEYS_BY_ID: Record<number, string> = Object.fromEntries(
  CURRICULUM_MODULES.map(row => [row.id, row.key!]),
);

/** Fills missing curriculum rows and backfills `key` without wiping teacher edits. */
export function ensureCurriculum(state: AdminState): { state: AdminState; changed: boolean } {
  const byId = new Map(state.modules.map(row => [row.id, row]));
  let changed = false;
  const next = CURRICULUM_MODULES.map(seed => {
    const existing = byId.get(seed.id);
    if (!existing) {
      changed = true;
      return { ...seed };
    }
    if (!existing.key) {
      changed = true;
      return { ...existing, key: seed.key };
    }
    return existing;
  });
  for (const row of state.modules) {
    if (!CURRICULUM_MODULES.some(seed => seed.id === row.id)) next.push(row);
  }
  return changed ? { state: { ...state, modules: next }, changed: true } : { state, changed: false };
}

export function moduleHasAppPack(module: AdminState["modules"][number]) {
  return Boolean(module.key && APP_READY_KEYS.has(module.key));
}
