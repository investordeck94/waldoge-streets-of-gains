/**
 * POST /sog-auth-challenge  { wallet }
 *
 * Issues a single-use, short-lived message for the player to sign with
 * `personal_sign`, proving they control the wallet. No secrets involved.
 *
 * HARDENING (audit M-4 / M-5):
 *  - the domain inside the signed message comes from a server allow-list, not
 *    from the caller's Origin header;
 *  - issuance is rate limited per wallet AND per client IP, atomically, so an
 *    anonymous caller can no longer grow the challenge table without bound;
 *  - expired challenges/sessions are purged opportunistically.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import {
  CHALLENGE_TTL_SECONDS,
  DOGEOS_CHAIN_ID,
  normalizeAddress,
  RATE_LIMIT_CHALLENGES_PER_HOUR,
  RATE_LIMIT_CHALLENGES_PER_IP_HOUR,
} from "../_shared/sog/config.ts";
import {
  buildChallengeMessage,
  CHALLENGE_STATEMENT,
  generateChallengeNonce,
} from "../_shared/sog/siwe.ts";
import { serviceClient } from "../_shared/sog/session.ts";
import { resolveChallengeDomain, resolveOriginPolicy } from "../_shared/sog/origins.ts";
import { consumeRateLimit, purgeExpired, RATE_BUCKETS } from "../_shared/sog/rateLimit.ts";

const env = Deno.env.toObject();
const originPolicy = resolveOriginPolicy(env);

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const body = await readJson(req);
  const wallet = normalizeAddress(body?.wallet);
  if (!wallet) return fail("invalid wallet address", 400);

  // The signed domain is operator-controlled; unknown origins are refused.
  const domainCheck = resolveChallengeDomain(req.headers.get("origin"), originPolicy);
  if (!domainCheck.ok) return fail(domainCheck.error, 403);

  const supabase = serviceClient();

  const ipAllowed = await consumeRateLimit(
    supabase,
    `${RATE_BUCKETS.challenge}:ip`,
    clientIp(req),
    RATE_LIMIT_CHALLENGES_PER_IP_HOUR,
    3600,
  );
  if (!ipAllowed) return fail("rate limited", 429);

  const walletAllowed = await consumeRateLimit(
    supabase,
    RATE_BUCKETS.challenge,
    wallet,
    RATE_LIMIT_CHALLENGES_PER_HOUR,
    3600,
  );
  if (!walletAllowed) return fail("rate limited", 429);

  const now = new Date();
  const expires = new Date(now.getTime() + CHALLENGE_TTL_SECONDS * 1000);
  const nonce = generateChallengeNonce();

  const message = buildChallengeMessage({
    wallet,
    nonce,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    domain: domainCheck.domain,
    chainId: DOGEOS_CHAIN_ID,
  });

  const { error } = await supabase.from("sog_auth_challenges").insert({
    wallet,
    nonce,
    statement: message,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });
  if (error) return fail("could not issue challenge", 500);

  void purgeExpired(supabase);

  return json({
    ok: true,
    message,
    nonce,
    expiresAt: expires.toISOString(),
    statement: CHALLENGE_STATEMENT,
  });
});
