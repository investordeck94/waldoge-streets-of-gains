/**
 * POST /sog-record-run   header: x-sog-session
 * body: { score, wave, level, durationMs, difficulty }
 *
 * Records a completed HARD MODE run as a qualifying entry for the current
 * weekly competition. This endpoint NEVER signs an attestation and NEVER
 * authorizes a WDOGE payout — settlement stays with sog-submit-run, which is
 * only used for the verified weekly winner.
 *
 * Server-controlled at all times: the wallet (from the session), the week
 * window, the verification timestamp and the qualifying difficulty.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { validateRun } from "../_shared/sog/validation.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";
import { deriveLogicalRunKey, generateRunId } from "../_shared/sog/attestation.ts";
import { HARD_MODE_DIFFICULTY, rankRuns, weekWindow } from "../_shared/sog/weekly.ts";
import { RATE_LIMIT_RUNS_PER_HOUR } from "../_shared/sog/config.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();

  const session = await authenticateSession(req, supabase);
  if (!session.ok) return fail(session.error, 401);
  const wallet = session.wallet;

  const body = await readJson(req);
  if (typeof body?.wallet === "string" && body.wallet.trim().toLowerCase() !== wallet) {
    return fail("wallet mismatch", 403);
  }

  const validation = validateRun(body);
  if (!validation.ok) return fail(validation.error, 400);
  const run = validation.run;

  if (run.difficulty !== HARD_MODE_DIFFICULTY) {
    return fail("only hard mode runs qualify for the weekly competition", 422);
  }

  // Rate limiting mirrors the reward endpoint.
  const sinceHour = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentCount } = await supabase
    .from("sog_weekly_runs")
    .select("id", { count: "exact", head: true })
    .eq("wallet", wallet)
    .gte("created_at", sinceHour);
  if ((recentCount ?? 0) >= RATE_LIMIT_RUNS_PER_HOUR) return fail("rate limited", 429);

  // Duplicate protection for one logical completed run (re-renders, retries).
  const startedAtBucket = Math.floor(Date.now() / 60_000);
  const clientRunKey = await deriveLogicalRunKey(wallet, run, startedAtBucket);
  const { data: duplicate } = await supabase
    .from("sog_weekly_runs")
    .select("id")
    .eq("wallet", wallet)
    .eq("client_run_key", clientRunKey)
    .maybeSingle();
  if (duplicate) return fail("duplicate run", 409);

  const window = weekWindow();
  const { error: insertError } = await supabase.from("sog_weekly_runs").insert({
    wallet,
    run_id: generateRunId(),
    client_run_key: clientRunKey,
    score: run.score,
    wave: run.wave,
    level: run.level,
    duration_ms: run.durationMs,
    difficulty: run.difficulty,
    week_start: window.weekStart,
    status: "verified",
  });
  if (insertError) return fail("duplicate run", 409);

  // Report the player's standing after recording (read-only, server-ranked).
  const { data: rows } = await supabase
    .from("sog_weekly_runs")
    .select("wallet, score, verified_at")
    .eq("week_start", window.weekStart)
    .eq("status", "verified");

  const ranked = rankRuns((rows ?? []) as { wallet: string; score: number; verified_at: string }[]);
  const bestPerWallet: { wallet: string; score: number; verified_at: string }[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    if (seen.has(row.wallet)) continue;
    seen.add(row.wallet);
    bestPerWallet.push(row);
  }
  const rank = bestPerWallet.findIndex((r) => r.wallet === wallet);

  return json({
    ok: true,
    recorded: true,
    qualified: true,
    week: window,
    score: run.score,
    rank: rank >= 0 ? rank + 1 : null,
    topScore: bestPerWallet[0]?.score ?? null,
  });
});
