import { endSession } from "../../lib/auth";
import { body, endpoint, json } from "../../lib/http";

export const POST = endpoint(async request => {
  await body(request);
  await endSession();
  return json({ ok: true });
});
