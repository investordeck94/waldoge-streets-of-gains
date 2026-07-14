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

/**
 * Returns null when the caller presented the correct owner secret; otherwise
 * returns a 401/500 Response the function should return immediately.
 * Callers should merge their own CORS headers into the response if desired,
 * but the ones here are already correct.
 */
export function requireOwner(req: Request, extraCors: Record<string, string> = {}): Response | null {
  const expected = Deno.env.get("BARK_ZERO_OWNER_SECRET");
  const headers = { ...CORS, ...extraCors, "Content-Type": "application/json" };
  if (!expected) {
    return new Response(
      JSON.stringify({ error: "Server not configured: BARK_ZERO_OWNER_SECRET missing" }),
      { status: 500, headers },
    );
  }
  const presented = req.headers.get("x-owner-secret") ?? "";
  if (!presented || !timingSafeEqual(presented, expected)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: owner secret required" }),
      { status: 401, headers },
    );
  }
  return null;
}

/** CORS headers callers should include on their own responses. */
export const ownerAuthCors = CORS;
