import { database, type Workspace } from "./db";
import type { AdminState } from "../../shared/admin-schema.ts";
import { ensureCurriculum } from "../../shared/curriculum.ts";

/** Ensures the school workspace has the SafetyQuest lesson catalog.
    Persists once when modules are missing (e.g. after empty admin setup). */
export async function loadSchoolState(): Promise<{ state: AdminState; revision: number }> {
  const { db } = await database();
  const workspace = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  if (!workspace) throw new Error("School workspace is not configured.");
  const ensured = ensureCurriculum(workspace.state);
  if (!ensured.changed) return { state: workspace.state, revision: workspace.revision };
  const saved = await db.collection<Workspace>("workspaces").findOneAndUpdate(
    { _id: "school", revision: workspace.revision },
    { $set: { state: ensured.state }, $inc: { revision: 1 } },
    { returnDocument: "after" },
  );
  if (saved) return { state: saved.state, revision: saved.revision };
  // Another writer won the race — re-read.
  const latest = await db.collection<Workspace>("workspaces").findOne({ _id: "school" });
  if (!latest) throw new Error("School workspace is not configured.");
  return { state: ensureCurriculum(latest.state).state, revision: latest.revision };
}
