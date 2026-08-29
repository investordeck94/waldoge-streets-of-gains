/**
 * POST /sog-submit-run   header: x-sog-session
 * body: { score, wave, level, durationMs, difficulty?, startedAt? }
 *
 * The ONLY producer of valid reward signatures.
 *
 * IGNORED IF SUPPLIED BY THE CLIENT (server-controlled, always):
 *   rewardAmount, nonce, deadline, signer, chainId, contractAddress, runId.
 *
 * NONCE POLICY: the attestation nonce is read fresh from
 * StreetsOfGainsRewards.nonces(player) on DogeOS Chikyu immediately before
 * signing. There is deliberately NO local nonce counter, no caching, no
 * previous+1 assumption — the contract enforces strict equality.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import {
  ATTESTATION_TTL_SECONDS,
  DOGEOS_CHAIN_ID,
  RATE_LIMIT_RUNS_PER_HOUR,
  resolveContractConfig,
  resolveRewardLimits,
} from "../_shared/sog/config.ts";
import { validateRun } from "../_shared/sog/validation.ts";
import { calculateReward } from "../_shared/sog/reward.ts";
import {
  buildAttestation,
  computeDeadline,
  deriveLogicalRunKey,
  generateRunId,
  serializeAttestation,
} from "../_shared/sog/attestation.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";
import { loadSigner, readOnChainNonce } from "../_shared/sog/signer.ts";

const env = Deno.env.toObject();

function epochKey(now = new Date()): string {
  return now.toISOString().slice(0, 10); // UTC day — mirrors the 1-day epoch
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();

  // 1. Authenticated player (wallet ownership already proven at sign-in).
  const session = await authenticateSession(req, supabase);
  if (!session.ok) return fail(session.error, 401);
  const wallet = session.wallet;

  // 2. Optional cross-check: a body wallet must match the session wallet.
  const body = await readJson(req);
  if (typeof body?.wallet === "string" && body.wallet.trim().toLowerCase() !== wallet) {
    return fail("wallet mismatch", 403);
  }

  // 3. Server configuration must be complete before anything is signed.
  const contractConfig = resolveContractConfig(env);
  if (!contractConfig.ok) return fail(contractConfig.error!, 503);
  const signerResult = loadSigner(env);
  if (!signerResult.ok) return fail(signerResult.error!, 503);
  const signer = signerResult.signer!;
  const limits = resolveRewardLimits(env);

  // 4. Validate the run (see validation.ts on what this does NOT prove).
  const validation = validateRun(body);
  if (!validation.ok) return fail(validation.error, 400);
  const run = validation.run;

  const day = epochKey();

  // 5. Rate limiting.
  const sinceHour = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentCount } = await supabase
    .from("sog_runs")
    .select("id", { count: "exact", head: true })
    .eq("wallet", wallet)
    .gte("created_at", sinceHour);
  if ((recentCount ?? 0) >= RATE_LIMIT_RUNS_PER_HOUR) {
    return fail("rate limited", 429);
  }

  // 6. Backend duplicate protection for one *logical* run.
  const startedAtBucket = Math.floor(Date.now() / 60_000);
  const logicalKey = await deriveLogicalRunKey(wallet, run, startedAtBucket);
  const { data: duplicate } = await supabase
    .from("sog_runs")
    .select("id")
    .eq("wallet", wallet)
    .eq("client_run_key", logicalKey)
    .maybeSingle();
  if (duplicate) return fail("duplicate run", 409);

  // 7. Reward calculation — server-side only, capped by epoch usage.
  const { data: epochRows } = await supabase
    .from("sog_runs")
    .select("wallet, reward_amount_wei")
    .eq("epoch_key", day)
    .neq("status", "rejected");

  let walletEpochUsedWei = 0n;
  let poolEpochUsedWei = 0n;
  for (const row of epochRows ?? []) {
    const amount = BigInt(String((row as { reward_amount_wei: string }).reward_amount_wei ?? "0"));
    poolEpochUsedWei += amount;
    if (String((row as { wallet: string }).wallet).toLowerCase() === wallet) {
      walletEpochUsedWei += amount;
    }
  }

  const reward = calculateReward(run, {
    maxRewardPerRunWei: limits.maxRewardPerRunWei,
    walletEpochUsedWei,
    maxRewardPerWalletEpochWei: limits.maxRewardPerWalletEpochWei,
    poolEpochUsedWei,
    maxRewardPoolEpochWei: limits.maxRewardPoolEpochWei,
  });
  if (reward.rewardWei <= 0n) {
    return fail("run does not reach a reward milestone", 422);
  }

  // 8. Fresh on-chain nonce — never a local counter, never a client value.
  let nonce: bigint;
  try {
    nonce = await readOnChainNonce(contractConfig.contractAddress!, wallet);
  } catch {
    return fail("nonce synchronization error", 503);
  }

  const runId = generateRunId();
  const deadline = computeDeadline();
  const attestation = buildAttestation({
    player: wallet,
    score: run.score,
    wave: run.wave,
    level: run.level,
    runId,
    nonce,
    deadline,
    rewardAmount: reward.rewardWei,
  });

  // 9. Persist BEFORE signing so the DB unique index is the gate.
  const { error: insertError } = await supabase.from("sog_runs").insert({
    wallet,
    run_id: runId,
    client_run_key: logicalKey,
    score: run.score,
    wave: run.wave,
    level: run.level,
    duration_ms: run.durationMs,
    reward_amount_wei: reward.rewardWei.toString(),
    chain_nonce: nonce.toString(),
    deadline: Number(deadline),
    contract_address: contractConfig.contractAddress,
    chain_id: DOGEOS_CHAIN_ID,
    status: "authorized",
    epoch_key: day,
  });
  if (insertError) {
    // Unique-violation => concurrent duplicate authorization attempt.
    return fail("duplicate run", 409);
  }

  let signature: string;
  try {
    signature = await signer.sign(attestation, contractConfig.contractAddress!);
  } catch {
    await supabase
      .from("sog_runs")
      .update({ status: "rejected", validation_error: "signing failed" })
      .eq("wallet", wallet)
      .eq("run_id", runId);
    return fail("signer configuration error", 500);
  }

  // 10. Client-safe response: exactly what is needed to call submitRun().
  return json({
    ok: true,
    attestation: serializeAttestation(attestation),
    signature,
    contractAddress: contractConfig.contractAddress,
    chainId: DOGEOS_CHAIN_ID,
    expiresInSeconds: ATTESTATION_TTL_SECONDS,
  });
});
