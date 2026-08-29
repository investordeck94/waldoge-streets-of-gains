/**
 * Wallet session lookup. DENO RUNTIME ONLY (uses the service-role client).
 *
 * A session exists only after the wallet proved ownership by signing the
 * challenge message. Endpoints must never accept a browser-declared wallet.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { hashToken } from "./siwe.ts";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

export interface SessionOk {
  ok: true;
  wallet: string;
  sessionId: string;
}
export interface SessionFail {
  ok: false;
  error: string;
}

/**
 * Resolve the authenticated wallet from the `x-sog-session` header.
 * Returns `unauthorized` for any missing/expired/revoked/unknown token.
 */
export async function authenticateSession(
  req: Request,
  supabase: SupabaseClient,
): Promise<SessionOk | SessionFail> {
  const token = req.headers.get("x-sog-session")?.trim();
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return { ok: false, error: "unauthorized" };

  const tokenHash = await hashToken(token);
  const { data, error } = await supabase
    .from("sog_sessions")
    .select("id, wallet, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "unauthorized" };
  if (data.revoked_at) return { ok: false, error: "unauthorized" };
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "unauthorized" };
  }

  await supabase
    .from("sog_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { ok: true, wallet: String(data.wallet).toLowerCase(), sessionId: data.id };
}
