import { requireUser } from "../../lib/auth";
import { endpoint, json } from "../../lib/http";
export const GET = endpoint(async () => { const { account } = await requireUser(["Super Admin", "Teacher", "Parent"]); return json({ account }); });
