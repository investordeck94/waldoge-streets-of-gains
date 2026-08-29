/**
 * Shared HTTP helpers for the Streets of Gains reward endpoints.
 *
 * Error responses are deliberately terse and client-safe: no stack traces, no
 * environment values, no database internals, never anything key-derived.
 */
export const sogCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sog-session",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...sogCorsHeaders, "Content-Type": "application/json" },
  });
}

export function fail(error: string, status = 400): Response {
  return json({ ok: false, error }, status);
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: sogCorsHeaders });
  if (req.method !== "POST") return fail("method not allowed", 405);
  return null;
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
