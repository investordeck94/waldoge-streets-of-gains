/**
 * POST /twaldoge-faucet-claim   header: x-sog-session
 * body: { wallet?: "0x..." }   (must match the authenticated wallet)
 *
 * TESTNET-ONLY FAUCET. Mints tWALDOGE ("Waldoge Testnet"), a WORTHLESS token
 * that exists only on the DogeOS Chikyu testnet (chain id 6281971).
 *
 * IDENTITY: the recipient is the wallet that proved ownership by signing the
 * sign-in challenge (`sog_sessions`). A browser-declared address is never
 * trusted on its own. This reuses the wallet-proof mechanism only — the faucet
 * is NOT connected to the Streets of Gains reward authorization system, never
 * produces reward attestations and never touches the SOG signer key.
 *
 * SERVER-CONTROLLED, IGNORED IF SUPPLIED BY THE CLIENT:
 *   amount, token address, chain id, minter, cooldown.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";
import { resolveFaucetConfig } from "../_shared/faucet/config.ts";
import { processFaucetClaim } from "../_shared/faucet/claim.ts";
import { createFaucetStore } from "../_shared/faucet/store.ts";
import { loadFaucetMinter } from "../_shared/faucet/minter.ts";

const env = Deno.env.toObject();

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();

  // 1. Proven wallet ownership.
  const session = await authenticateSession(req, supabase);
  if (!session.ok) return fail(session.error, 401);
  const wallet = session.wallet;

  // 2. A body wallet, if present, must match the authenticated wallet.
  const body = await readJson(req);
  if (typeof body?.wallet === "string" && body.wallet.trim().toLowerCase() !== wallet) {
    return fail("wallet mismatch", 403);
  }

  // 3. Configuration + dedicated minter authority. Both fail closed.
  const configResult = resolveFaucetConfig(env);
  if (!configResult.ok) return fail(configResult.error, 503);

  const minterResult = loadFaucetMinter(env, configResult.config.tokenAddress);
  if (!minterResult.ok) return fail(minterResult.error, 503);

  // 4. Policy + mint.
  const result = await processFaucetClaim(env, wallet, {
    store: createFaucetStore(supabase),
    minter: minterResult.minter,
  });

  if (!result.ok) {
    return json(
      { ok: false, error: result.error, retryAfterSeconds: result.retryAfterSeconds },
      result.status,
    );
  }

  return json({
    ok: true,
    wallet: result.wallet,
    amountWei: result.amountWei,
    txHash: result.txHash,
    chainId: result.chainId,
    tokenAddress: result.tokenAddress,
    note: "tWALDOGE is a testnet-only token with no monetary value.",
  });
});
