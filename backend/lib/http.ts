import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "./auth";

/** The origin the browser actually addressed. `request.url` is the socket the server
    listens on (0.0.0.0, localhost), which is not what the browser sends as Origin once a
    preview panel or proxy sits in front, so trust the host it was asked for instead.
    Set APP_ORIGIN to pin this explicitly; a comma-separated list is accepted. */
function allowedOrigins(request: Request) {
  const configured = process.env.APP_ORIGIN?.split(",").map(value => value.trim()).filter(Boolean);
  if (configured?.length) return configured;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return [];
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return [`${protocol}://${host}`];
}

/** The public site for links in emails: APP_PUBLIC_URL, else the Vercel production
    domain Vercel sets on every deployment. Empty when neither is known. */
export function publicSite() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return (process.env.APP_PUBLIC_URL?.trim() || (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");
}

/** Where links in emails should point. The public site wins over the address the
    sender has open, so an invite sent from a LAN dev server still opens anywhere. */
export function siteOrigin(request: Request) {
  return publicSite() || (allowedOrigins(request)[0] ?? "http://localhost:8443").replace(/\/$/, "");
}

export async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "JSON request required.");
  const origin = request.headers.get("origin");
  const allowed = allowedOrigins(request);
  if (origin && allowed.length && !allowed.includes(origin)) {
    // Naming both sides turns a dead end into something the developer can act on.
    throw new ApiError(403, process.env.NODE_ENV === "production"
      ? "Request origin is not allowed."
      : `Request origin is not allowed: the browser sent "${origin}" but this server expects ${allowed.map(value => `"${value}"`).join(" or ")}. Set APP_ORIGIN in backend/.env to the address you open the app on, then restart.`);
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "Cross-site request blocked.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Request body is missing.");
  let total = 0; const chunks: Uint8Array[] = [];
  while (true) { const { value, done } = await reader.read(); if (done) break; total += value.length; if (total > 2_000_000) { await reader.cancel(); throw new ApiError(413, "Request is too large."); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(400, "Invalid JSON."); }
}
export function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
export function endpoint(handler: (request: Request) => Promise<NextResponse>) {
  return async (request: Request) => {
    try { return await handler(request); } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      if (error instanceof z.ZodError) return json({ error: "Invalid data: " + error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).slice(0, 3).join("; ") }, 400);
      if (error instanceof Error && error.message === "DATABASE_NOT_CONFIGURED") return json({ error: "School data is still loading. Please try again in a moment." }, 503);
      console.error("API request failed:", error instanceof Error ? error.name : "Unknown error");
      return json({ error: "School data is still loading. Please try again in a moment." }, 503);
    }
  };
}
