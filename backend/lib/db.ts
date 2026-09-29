import { MongoClient } from "mongodb";
import type { AdminState } from "../../shared/admin-schema";

export type Workspace = { _id: string; revision: number; state: AdminState };
const cache = globalThis as typeof globalThis & { mongoPromise?: Promise<MongoClient> };
export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!cache.mongoPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      minPoolSize: 1,
      maxIdleTimeMS: 60_000,
    });
    cache.mongoPromise = client.connect().catch(error => { cache.mongoPromise = undefined; throw error; });
  }
  const client = await cache.mongoPromise;
  return { client, db: client.db(process.env.MONGODB_DB ?? "safetyquest") };
}
