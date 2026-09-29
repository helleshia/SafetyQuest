import { SignJWT, jwtVerify } from "jose";

/* Session tokens.

   The cookie is a signed JWT, but the database session it names is still the
   authority: the token proves the cookie was not tampered with, and the stored
   session decides whether it is still valid. That pairing matters because this
   app revokes access mid-session — a suspended account, a changed password, a
   revoked guardian link — and a stateless token could not be taken back. */

export type SessionClaims = { sid: string; uid: string; role: string };

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET_NOT_CONFIGURED");
  return new TextEncoder().encode(value);
};

/** Minutes of inactivity after which a session is closed. */
export const IDLE_MINUTES = 5;
/** A session cannot outlive this, however active it is. */
export const ABSOLUTE_HOURS = 8;

export async function signSession(claims: SessionClaims, absoluteExpiry: Date) {
  // Expire on whichever comes first: the idle window, or the absolute lifetime.
  const idle = new Date(Date.now() + IDLE_MINUTES * 60_000);
  const expires = idle < absoluteExpiry ? idle : absoluteExpiry;
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("safetyquest")
    .setAudience("safetyquest-console")
    .setExpirationTime(Math.floor(expires.getTime() / 1000))
    .sign(secret());
}

export async function readSession(token: string): Promise<SessionClaims | null> {
  try {
    // The algorithm is pinned here, so a token that asks for a different one — or
    // for none at all — is rejected before its signature is even considered.
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "safetyquest",
      audience: "safetyquest-console",
    });
    const { sid, uid, role } = payload as Record<string, unknown>;
    if (typeof sid !== "string" || typeof uid !== "string" || typeof role !== "string") return null;
    return { sid, uid, role };
  } catch {
    // Expired, tampered with, or signed by a key we no longer use.
    return null;
  }
}
