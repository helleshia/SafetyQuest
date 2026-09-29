export class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }

/** Hide infrastructure details (MongoDB, Atlas, etc.) from people using the consoles. */
export function friendlyStatus(message: string, status = 0): string {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (!text || status === 0 || lower.includes("cannot reach") || lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("api is unavailable")) {
    return "Loading… Check your internet connection, then retry.";
  }
  if (lower.includes("mongodb") || lower.includes("atlas") || lower.includes("database request") || lower.includes("database is") || lower.includes("school data is still loading")) {
    return "Loading… Please wait a moment, then retry.";
  }
  return text;
}

export async function api<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { method, credentials: "same-origin", cache: "no-store", headers: data === undefined ? undefined : { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) }); }
  catch { throw new RequestError(friendlyStatus("Cannot reach the server.", 0), 0); }
  const result = await response.json().catch(() => ({ error: "The API is unavailable." }));
  if (!response.ok || result.error) throw new RequestError(friendlyStatus(result.error ?? "Request failed.", response.status), response.status);
  return result as T;
}
