/**
 * POST /sog-run-start   header: x-sog-session
 * body: { difficulty }
 *
 * Opens a server-authoritative run (audit H-1/H-2).
 *
 * SERVER-CONTROLLED, NEVER FROM THE CLIENT:
 *   runId, wallet (from the authenticated session), start time, expiry.
 * The only thing the client chooses is the difficulty, and it is frozen here.
 *
 * This endpoint signs nothing and authorizes no reward.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";
import { generateRunId } from "../_shared/sog/attestation.ts";
import { RUN_START_TTL_SECONDS } from "../_shared/sog/runStart.ts";
import { consumeRateLimit, purgeExpired, RATE_BUCKETS } from "../_shared/sog/rateLimit.ts";
import { RATE_LIMIT_RUN_STARTS_PER_HOUR } from "../_shared/sog/config.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();

  const session = await authenticateSession(req, supabase);
  if (!session.ok) return fail(session.error, 401);
  const wallet = session.wallet;

  const body = await readJson(req);
  const difficulty = typeof body?.difficulty === "number" && Number.isInteger(body.difficulty)
    ? body.difficulty
    : null;
  if (difficulty === null || difficulty < 0 || difficulty > 2) {
    return fail("invalid difficulty", 400);
  }

  const allowed = await consumeRateLimit(
    supabase,
    RATE_BUCKETS.runStart,
    wallet,
    RATE_LIMIT_RUN_STARTS_PER_HOUR,
    3600,
  );
  if (!allowed) return fail("rate limited", 429);

  const runId = generateRunId();
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + RUN_START_TTL_SECONDS * 1000);

  const { error } = await supabase.from("sog_run_starts").insert({
    run_id: runId,
    wallet,
    session_id: session.sessionId,
    difficulty,
    started_at: startedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: "open",
  });
  if (error) return fail("could not start run", 500);

  void purgeExpired(supabase);

  return json({
    ok: true,
    runId,
    difficulty,
    startedAt: startedAt.toISOString(),
    startedAtMs: startedAt.getTime(),
    expiresAt: expiresAt.toISOString(),
  });
});
