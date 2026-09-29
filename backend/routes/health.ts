import { database } from "../lib/db";
import { endpoint, json } from "../lib/http";
export const GET = endpoint(async () => { const { db } = await database(); await db.command({ ping: 1 }); return json({ status: "ok", database: "connected" }); });
