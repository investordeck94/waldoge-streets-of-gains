/**
 * POST /sog-record-run   header: x-sog-session
 * body: { runId, score, wave, level, durationMs, difficulty, startedAt }
 *
 * Records a completed HARD MODE run as a qualifying entry for the current
 * weekly competition. This endpoint NEVER signs an attestation and NEVER
 * authorizes a WDOGE payout — settlement stays with sog-settle-week +
 * sog-submit-run, used only for the verified weekly winner.
 *
 * SERVER-CONTROLLED AT ALL TIMES: the wallet (from the session), the run
 * identity (issued by sog-run-start), the week window, the verification
 * timestamp, the qualifying difficulty and the verified status.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { validateRun } from "../_shared/sog/validation.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";
import { deriveLogicalRunKey } from "../_shared/sog/attestation.ts";
import { isRunId, validateRunAgainstStart, type RunStartRecord } from "../_shared/sog/runStart.ts";
import { HARD_MODE_DIFFICULTY, rankRuns, weekWindow } from "../_shared/sog/weekly.ts";
import { RATE_LIMIT_RUNS_PER_HOUR } from "../_shared/sog/config.ts";
import { consumeRateLimit, RATE_BUCKETS } from "../_shared/sog/rateLimit.ts";

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

  if (!isRunId(run.runId)) return fail("run was not started on the server", 422);

  if (run.difficulty !== HARD_MODE_DIFFICULTY) {
    return fail("only hard mode runs qualify for the weekly competition", 422);
  }

  // Atomic rate limiting — no count-then-insert race (audit M-2).
  const allowed = await consumeRateLimit(
    supabase,
    RATE_BUCKETS.weekly,
    wallet,
    RATE_LIMIT_RUNS_PER_HOUR,
    3600,
  );
  if (!allowed) return fail("rate limited", 429);

  // The run must have been opened by the backend for THIS wallet (audit H-1).
  const { data: startRow } = await supabase
    .from("sog_run_starts")
    .select("run_id, wallet, difficulty, started_at, expires_at, consumed_at")
    .eq("run_id", run.runId)
    .maybeSingle();

  const check = validateRunAgainstStart(
    (startRow as RunStartRecord | null) ?? null,
    { ...run, difficulty: run.difficulty },
    wallet,
  );
  if (!check.ok) return fail(check.error, check.status);

  // Consume the start record atomically: only the first completion wins.
  const { data: consumed } = await supabase
    .from("sog_run_starts")
    .update({ consumed_at: new Date().toISOString(), status: "recorded" })
    .eq("run_id", run.runId)
    .eq("wallet", wallet)
    .is("consumed_at", null)
    .select("run_id")
    .maybeSingle();
  if (!consumed) return fail("duplicate run", 409);

  // Second, independent duplicate gate keyed on the run's intrinsic identity.
  const clientRunKey = await deriveLogicalRunKey(wallet, run);
  const window = weekWindow();
  const { error: insertError } = await supabase.from("sog_weekly_runs").insert({
    wallet,
    run_id: run.runId,
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
