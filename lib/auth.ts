/**
 * Site-wide password gate: crypto helpers shared by the proxy and the login
 * server action. All primitives use the Web Crypto API so the same module runs
 * under Node.js and Edge runtimes.
 *
 * Auth model:
 * - User submits a password -> SHA-256 hex is compared against SITE_PASSWORD_HASH
 *   in constant time.
 * - On match, an HMAC-SHA256 cookie `<expiryMs>.<hmacHex>` is issued using
 *   SITE_AUTH_SECRET as the signing key. Rotating the secret invalidates every
 *   outstanding session.
 */

export const AUTH_COOKIE = "labelhead_auth";
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

/** SHA-256 of the UTF-8 encoded input, as lowercase hex. */
export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(password),
  );
  return toHex(digest);
}

/**
 * Length-safe string compare that scans every character before returning,
 * so comparison time does not leak how many leading characters matched.
 * Unequal-length inputs short-circuit to false (length is not a secret).
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(sig);
}

/** Returns `"<expiryMs>.<hmacHex>"` — the cookie value. */
export async function signToken(
  expiryMs: number,
  secret: string,
): Promise<string> {
  const expiry = String(expiryMs);
  const sig = await hmacHex(expiry, secret);
  return `${expiry}.${sig}`;
}

/**
 * Returns true only when the token's signature matches the secret and the
 * expiry is still in the future. Any malformed input returns false without
 * throwing.
 */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const expiryStr = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expiryMs = Number(expiryStr);
  if (!Number.isFinite(expiryMs)) return false;
  if (expiryMs <= Date.now()) return false;

  const expectedSig = await hmacHex(expiryStr, secret);
  return constantTimeEquals(providedSig, expectedSig);
}
