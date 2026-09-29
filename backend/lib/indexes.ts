import type { Db } from "mongodb";

/** Ensure TTL / auth indexes once per process — createIndex on every login is slow. */
const done = new Set<string>();

export async function ensureIndex(db: Db, collection: string, key: Record<string, 1 | -1>, options: { expireAfterSeconds?: number; name?: string } = {}) {
  const id = `${db.databaseName}.${collection}:${JSON.stringify(key)}:${options.expireAfterSeconds ?? ""}`;
  if (done.has(id)) return;
  await db.collection(collection).createIndex(key, options);
  done.add(id);
}

export async function ensureAuthIndexes(db: Db) {
  await Promise.all([
    ensureIndex(db, "sessions", { expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ensureIndex(db, "auth_limits", { expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ensureIndex(db, "registrations", { expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ensureIndex(db, "login_failures", { updatedAt: 1 }, { expireAfterSeconds: 86_400 }),
  ]);
}
