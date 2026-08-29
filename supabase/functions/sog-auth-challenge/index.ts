/**
 * POST /sog-auth-challenge  { wallet }
 *
 * Issues a single-use, short-lived message for the player to sign with
 * `personal_sign`, proving they control the wallet. No secrets involved.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { CHALLENGE_TTL_SECONDS, DOGEOS_CHAIN_ID, normalizeAddress } from "../_shared/sog/config.ts";
import {
  buildChallengeMessage,
  CHALLENGE_STATEMENT,
  generateChallengeNonce,
} from "../_shared/sog/siwe.ts";
import { serviceClient } from "../_shared/sog/session.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const body = await readJson(req);
  const wallet = normalizeAddress(body?.wallet);
  if (!wallet) return fail("invalid wallet address", 400);

  const now = new Date();
  const expires = new Date(now.getTime() + CHALLENGE_TTL_SECONDS * 1000);
  const nonce = generateChallengeNonce();

  let domain = "waldoge";
  try {
    domain = new URL(req.headers.get("origin") ?? "https://waldogeai.lovable.app").host;
  } catch {
    /* keep fallback */
  }

  const message = buildChallengeMessage({
    wallet,
    nonce,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    domain,
    chainId: DOGEOS_CHAIN_ID,
  });

  const supabase = serviceClient();
  const { error } = await supabase.from("sog_auth_challenges").insert({
    wallet,
    nonce,
    statement: message,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });
  if (error) return fail("could not issue challenge", 500);

  return json({ ok: true, message, nonce, expiresAt: expires.toISOString(), statement: CHALLENGE_STATEMENT });
});
