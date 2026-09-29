import { database, type Workspace } from "../../lib/db";
import { endpoint, json } from "../../lib/http";
export const GET = endpoint(async () => { const { db } = await database(); const existing = await db.collection<Workspace>("workspaces").findOne({ _id: "school" }, { projection: { _id: 1 } }); return json({ setupRequired: !existing }); });
