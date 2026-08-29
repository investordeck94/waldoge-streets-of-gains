/**
 * POST /sog-auth-verify  { wallet, nonce, signature }
 *
 * Verifies the personal_sign signature over the stored challenge, consumes the
 * challenge (single use) and issues an opaque session token. Only the token's
 * SHA-256 hash is persisted.
 *
 * This is the ONLY place a wallet address becomes trusted. Every reward
 * endpoint derives the wallet from the session, never from the request body.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { normalizeAddress, SESSION_TTL_SECONDS } from "../_shared/sog/config.ts";
import { generateSessionToken, hashToken } from "../_shared/sog/siwe.ts";
import { serviceClient } from "../_shared/sog/session.ts";
import { verifyWalletSignature } from "../_shared/sog/signer.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const body = await readJson(req);
  const wallet = normalizeAddress(body?.wallet);
  const nonce = typeof body?.nonce === "string" ? body.nonce.trim() : "";
  const signature = typeof body?.signature === "string" ? body.signature.trim() : "";

  if (!wallet) return fail("invalid wallet address", 400);
  if (!/^[0-9a-f]{32}$/.test(nonce)) return fail("invalid challenge", 400);
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return fail("invalid signature", 400);

  const supabase = serviceClient();
  const { data: challenge, error } = await supabase
    .from("sog_auth_challenges")
    .select("id, wallet, statement, expires_at, consumed_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error || !challenge) return fail("invalid challenge", 401);
  if (challenge.consumed_at) return fail("invalid challenge", 401);
  if (String(challenge.wallet).toLowerCase() !== wallet) return fail("wallet mismatch", 401);
  if (new Date(challenge.expires_at).getTime() <= Date.now()) {
    return fail("challenge expired", 401);
  }

  const valid = await verifyWalletSignature(wallet, challenge.statement, signature);
  if (!valid) return fail("unauthorized", 401);

  // Single use: consume atomically-ish (guarded by the null check below).
  const { data: consumed } = await supabase
    .from("sog_auth_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challenge.id)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();
  if (!consumed) return fail("invalid challenge", 401);

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const { error: sessionError } = await supabase.from("sog_sessions").insert({
    token_hash: await hashToken(token),
    wallet,
    expires_at: expiresAt.toISOString(),
  });
  if (sessionError) return fail("could not create session", 500);

  return json({ ok: true, session: token, wallet, expiresAt: expiresAt.toISOString() });
});
