/**
 * tWALDOGE faucet minter. DENO RUNTIME ONLY.
 *
 * SECURITY:
 *  - TWALDOGE_FAUCET_MINTER_PRIVATE_KEY lives ONLY in edge-function secrets.
 *    It is never logged, returned, echoed in an error, or sent to the browser.
 *  - It is a DEDICATED faucet authority: it is not SOG_SIGNER_PRIVATE_KEY, not
 *    the SOG owner, not the deployer and not a user wallet. The faucet has no
 *    access to any SOG key and this module never imports SOG code.
 *  - The derived address must equal the public TWALDOGE_MINTER_ADDRESS,
 *    otherwise loading FAILS CLOSED and nothing is minted.
 *  - The wallet client is pinned to chain id 6281971; it never switches chains.
 */
import { createPublicClient, createWalletClient, defineChain, http } from "npm:viem@2.21.55";
import { privateKeyToAccount } from "npm:viem@2.21.55/accounts";
import { FAUCET_CHAIN_ID, FAUCET_RPC_URL, normalizeRecipient } from "./config.ts";
import type { FaucetMinter } from "./claim.ts";

const PRIVATE_KEY_RE = /^0x[0-9a-fA-F]{64}$/;

export const dogeosChikyu = defineChain({
  id: FAUCET_CHAIN_ID,
  name: "DogeOS Chikyu Testnet",
  nativeCurrency: { name: "DOGE", symbol: "DOGE", decimals: 18 },
  rpcUrls: { default: { http: [FAUCET_RPC_URL] } },
});

const MINT_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export type MinterResult =
  | { ok: true; minter: FaucetMinter; address: string }
  | { ok: false; error: string };

/** Load the dedicated faucet minter from env. Fails closed on any problem. */
export function loadFaucetMinter(
  env: Record<string, string | undefined>,
  tokenAddress: string,
): MinterResult {
  const raw = env.TWALDOGE_FAUCET_MINTER_PRIVATE_KEY?.trim();
  if (!raw || !PRIVATE_KEY_RE.test(raw)) {
    return { ok: false, error: "faucet minter configuration error" };
  }
  // The faucet must never be handed the SOG reward signer key.
  if (env.SOG_SIGNER_PRIVATE_KEY && env.SOG_SIGNER_PRIVATE_KEY.trim() === raw) {
    return { ok: false, error: "faucet minter configuration error" };
  }

  let account;
  try {
    account = privateKeyToAccount(raw as `0x${string}`);
  } catch {
    return { ok: false, error: "faucet minter configuration error" };
  }

  const derived = normalizeRecipient(account.address);
  const expected = normalizeRecipient(env.TWALDOGE_MINTER_ADDRESS);
  if (!derived || !expected || derived !== expected) {
    return { ok: false, error: "faucet minter configuration error" };
  }

  const walletClient = createWalletClient({
    account,
    chain: dogeosChikyu,
    transport: http(FAUCET_RPC_URL),
  });
  const publicClient = createPublicClient({
    chain: dogeosChikyu,
    transport: http(FAUCET_RPC_URL),
  });

  return {
    ok: true,
    address: derived,
    minter: {
      async mint(to: string, amountWei: bigint): Promise<string> {
        // Verify the live chain before sending. Never switch networks.
        const liveChainId = await publicClient.getChainId();
        if (liveChainId !== FAUCET_CHAIN_ID) {
          throw new Error("rpc chain id mismatch");
        }
        return await walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: MINT_ABI,
          functionName: "mint",
          args: [to as `0x${string}`, amountWei],
          chain: dogeosChikyu,
        });
      },
    },
  };
}
