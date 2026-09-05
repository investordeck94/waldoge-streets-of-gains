/**
 * POST /sog-submit-run   header: x-sog-session
 * body: {}  (nothing in the body is trusted)
 *
 * The ONLY producer of valid reward signatures.
 *
 * After the audit remediation this endpoint no longer authorizes ad-hoc runs.
 * It authorizes exactly one thing: the WEEKLY PRIZE for the wallet the server
 * itself selected as the winner of a CLOSED week, recorded in
 * `sog_weekly_settlements` by `sog-settle-week`.
 *
 * IGNORED IF SUPPLIED BY THE CLIENT (server-controlled, always):
 *   wallet, score, rewardAmount, nonce, deadline, signer, chainId,
 *   contractAddress, runId, week, winner status.
 *
 * NONCE POLICY: read fresh from StreetsOfGainsRewards.nonces(player) on DogeOS
 * Chikyu immediately before signing. No local counter, no caching.
 *
 * EPOCH POLICY: reward capacity is accounted against the CONTRACT's
 * epochGenesis/epochLength (audit M-3), never a UTC calendar day.
 */
import { fail, json, preflight } from "../_shared/sog/http.ts";
import {
  ATTESTATION_TTL_SECONDS,
  DOGEOS_CHAIN_ID,
  RATE_LIMIT_RUNS_PER_HOUR,
  resolveContractConfig,
  resolveRewardLimits,
} from "../_shared/sog/config.ts";
import { WEEKLY_PRIZE_WEI } from "../_shared/sog/weekly.ts";
import { SETTLEMENT_STATUS } from "../_shared/sog/settlement.ts";
import {
  buildAttestation,
  computeDeadline,
  deriveLogicalRunKey,
  generateRunId,
  serializeAttestation,
} from "../_shared/sog/attestation.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";
import { loadSigner, readEpochConfig, readOnChainNonce } from "../_shared/sog/signer.ts";
import { epochKey } from "../_shared/sog/epoch.ts";
import { consumeRateLimit, RATE_BUCKETS } from "../_shared/sog/rateLimit.ts";

const env = Deno.env.toObject();

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();

  // 1. Authenticated player (wallet ownership proven at sign-in).
  const session = await authenticateSession(req, supabase);
  if (!session.ok) return fail(session.error, 401);
  const wallet = session.wallet;

  // 2. Server configuration must be complete before anything is signed.
  const contractConfig = resolveContractConfig(env);
  if (!contractConfig.ok) return fail(contractConfig.error!, 503);
  const signerResult = loadSigner(env);
  if (!signerResult.ok) return fail(signerResult.error!, 503);
  const signer = signerResult.signer!;
  const limits = resolveRewardLimits(env);

  // 3. Atomic rate limiting (audit M-2).
  const allowed = await consumeRateLimit(
    supabase,
    RATE_BUCKETS.reward,
    wallet,
    RATE_LIMIT_RUNS_PER_HOUR,
    3600,
  );
  if (!allowed) return fail("rate limited", 429);

  // 4. The ONLY reward source: a server-created settlement for a closed week
  //    naming this wallet. The client cannot name itself the winner.
  const { data: settlement } = await supabase
    .from("sog_weekly_settlements")
    .select("week_start, winner_wallet, winner_score, winner_run_id, prize_wei, status")
    .eq("winner_wallet", wallet)
    .eq("status", SETTLEMENT_STATUS.pending)
    .order("week_start", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!settlement) return fail("no weekly prize is pending for this wallet", 422);

  // 5. Contract-aligned epoch accounting.
  let epochConfig;
  try {
    epochConfig = await readEpochConfig(contractConfig.contractAddress!);
  } catch {
    return fail("epoch synchronization error", 503);
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const currentEpochKey = epochKey(epochConfig, nowSeconds);

  const { data: epochRows } = await supabase
    .from("sog_runs")
    .select("wallet, reward_amount_wei")
    .eq("epoch_key", currentEpochKey)
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

  // 6. Prize amount: server constant, then clamped by the configured caps so
  //    the backend never signs something that would revert on-chain.
  let rewardWei = WEEKLY_PRIZE_WEI;
  if (rewardWei > limits.maxRewardPerRunWei) rewardWei = limits.maxRewardPerRunWei;
  const walletHeadroom = limits.maxRewardPerWalletEpochWei > walletEpochUsedWei
    ? limits.maxRewardPerWalletEpochWei - walletEpochUsedWei
    : 0n;
  if (rewardWei > walletHeadroom) rewardWei = walletHeadroom;
  const poolHeadroom = limits.maxRewardPoolEpochWei > poolEpochUsedWei
    ? limits.maxRewardPoolEpochWei - poolEpochUsedWei
    : 0n;
  if (rewardWei > poolHeadroom) rewardWei = poolHeadroom;
  if (rewardWei <= 0n) return fail("reward capacity exhausted for this epoch", 429);

  // 7. Fresh on-chain nonce — never a local counter, never a client value.
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
    score: Number(settlement.winner_score ?? 0),
    wave: 0,
    level: 0,
    runId,
    nonce,
    deadline,
    rewardAmount: rewardWei,
  });

  // 8. Persist BEFORE signing so the DB unique index is the gate. The logical
  //    key is intrinsic to the settled week: a week can never be authorized
  //    twice for the same wallet.
  const logicalKey = await deriveLogicalRunKey(wallet, {
    runId: `week:${settlement.week_start}`,
    score: Number(settlement.winner_score ?? 0),
    wave: 0,
    level: 0,
    durationMs: 0,
    difficulty: 2,
    startedAt: 0,
  });

  const { error: insertError } = await supabase.from("sog_runs").insert({
    wallet,
    run_id: runId,
    client_run_key: logicalKey,
    score: Number(settlement.winner_score ?? 0),
    wave: 0,
    level: 0,
    duration_ms: 0,
    reward_amount_wei: rewardWei.toString(),
    chain_nonce: nonce.toString(),
    deadline: Number(deadline),
    contract_address: contractConfig.contractAddress,
    chain_id: DOGEOS_CHAIN_ID,
    status: "authorized",
    epoch_key: currentEpochKey,
  });
  if (insertError) {
    // Unique-violation => this week was already authorized for this wallet.
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

  await supabase
    .from("sog_weekly_settlements")
    .update({ status: "authorized", settled_at: new Date().toISOString() })
    .eq("week_start", settlement.week_start)
    .eq("status", SETTLEMENT_STATUS.pending);

  // 9. Client-safe response: exactly what is needed to call submitRun().
  return json({
    ok: true,
    weekStart: settlement.week_start,
    attestation: serializeAttestation(attestation),
    signature,
    contractAddress: contractConfig.contractAddress,
    chainId: DOGEOS_CHAIN_ID,
    expiresInSeconds: ATTESTATION_TTL_SECONDS,
  });
});
