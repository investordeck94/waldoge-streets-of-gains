// Shared owner-secret verification for Bark Zero admin edge functions.
// Every privileged Bark Zero endpoint must call `requireOwner(req)` right
// after the CORS preflight check and return the response if it isn't null.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-owner-secret",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export type OwnerAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

export function checkOwnerSecret(req: Request): OwnerAuthResult {
  const expected = Deno.env.get("BARK_ZERO_OWNER_SECRET");
  if (!expected) {
    return { ok: false, status: 500, error: "Server not configured: BARK_ZERO_OWNER_SECRET missing" };
  }
  const presented = req.headers.get("x-owner-secret") ?? "";
  if (!presented || !timingSafeEqual(presented, expected)) {
    return { ok: false, status: 401, error: "Unauthorized: owner secret required" };
  }
  return { ok: true };
}

/**
 * Returns null when the caller presented the correct owner secret; otherwise
 * returns a 401/500 Response the function should return immediately.
 * Callers should merge their own CORS headers into the response if desired,
 * but the ones here are already correct.
 */
export function requireOwner(req: Request, extraCors: Record<string, string> = {}): Response | null {
  const headers = { ...CORS, ...extraCors, "Content-Type": "application/json" };
  const result = checkOwnerSecret(req);
  if (result.ok) return null;
  return new Response(JSON.stringify({ error: result.error }), { status: result.status, headers });
}

/** CORS headers callers should include on their own responses. */
export const ownerAuthCors = CORS;
