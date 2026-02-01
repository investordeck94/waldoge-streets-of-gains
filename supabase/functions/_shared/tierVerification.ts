// Shared tier verification utilities for edge functions
// Verifies WALDOGE token balance server-side and enforces usage limits

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

// WALDOGE Token Configuration - must match client-side constants
const WALDOGE_TOKEN_MINT = "D77tASqthikebejDx15MtphmZAbpU4Jxmr1JXgD2doge";

// Tier Thresholds
const TIER_THRESHOLDS = {
  TIER_0: 0,        // No tokens - Preview mode
  TIER_1: 500000,   // 500K WALDOGE - Basic features unlocked
  TIER_2: 1000000,  // 1M WALDOGE - Chaos Mode unlocked
};

// Usage Limits per tier per feature per day
const USAGE_LIMITS: Record<string, Record<string, number>> = {
  TIER_0: {
    chat: 0,
    raidGenerator: 20,
    memeGenerator: 0,
    nftCreator: 0,
  },
  TIER_1: {
    chat: 100,
    raidGenerator: 30,
    memeGenerator: 30,
    nftCreator: 1,
  },
  TIER_2: {
    chat: 200,
    raidGenerator: 50,
    memeGenerator: 50,
    nftCreator: 10,
  },
};

export type TierLevel = "TIER_0" | "TIER_1" | "TIER_2";

export interface TierInfo {
  tier: TierLevel;
  balance: number;
  limit: number;
  allowed: boolean;
  currentUsage: number;
}

/**
 * Fetch WALDOGE token balance for a wallet address using Solana RPC
 */
async function getWaldogeBalance(walletAddress: string): Promise<number> {
  try {
    // Use Solana mainnet RPC
    const rpcUrl = "https://api.mainnet-beta.solana.com";
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { mint: WALDOGE_TOKEN_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[tierVerification] Solana RPC error:", response.status);
      return 0;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("[tierVerification] RPC error:", data.error);
      return 0;
    }

    // Sum up all token accounts for this mint
    let totalBalance = 0;
    const accounts = data.result?.value || [];
    
    for (const account of accounts) {
      const amount = account.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      totalBalance += amount;
    }

    console.log(`[tierVerification] Wallet ${walletAddress.slice(0, 8)}... balance: ${totalBalance}`);
    return totalBalance;
  } catch (error) {
    console.error("[tierVerification] Failed to fetch balance:", error);
    return 0;
  }
}

/**
 * Calculate tier level based on token balance
 */
function calculateTier(balance: number): TierLevel {
  if (balance >= TIER_THRESHOLDS.TIER_2) return "TIER_2";
  if (balance >= TIER_THRESHOLDS.TIER_1) return "TIER_1";
  return "TIER_0";
}

/**
 * Get usage limit for a feature based on tier
 */
function getTierLimit(tier: TierLevel, feature: string): number {
  return USAGE_LIMITS[tier]?.[feature] ?? 0;
}

/**
 * Verify wallet tier and check/increment usage
 * Returns tier info with whether the request is allowed
 */
export async function verifyTierAndUsage(
  walletAddress: string,
  feature: string
): Promise<TierInfo> {
  // Validate wallet address format
  if (!walletAddress || walletAddress.length < 32 || walletAddress.length > 50) {
    return {
      tier: "TIER_0",
      balance: 0,
      limit: 0,
      allowed: false,
      currentUsage: 0,
    };
  }

  // Fetch real token balance from Solana
  const balance = await getWaldogeBalance(walletAddress);
  const tier = calculateTier(balance);
  const limit = getTierLimit(tier, feature);

  // If limit is 0, access is denied for this tier
  if (limit === 0) {
    return {
      tier,
      balance,
      limit,
      allowed: false,
      currentUsage: 0,
    };
  }

  // Check and increment usage in Supabase
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[tierVerification] Missing Supabase configuration");
    return {
      tier,
      balance,
      limit,
      allowed: false,
      currentUsage: 0,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Use atomic check_and_increment_usage function
  const { data: allowed, error } = await supabase.rpc("check_and_increment_usage", {
    p_wallet: walletAddress,
    p_feature: feature,
    p_tier_limit: limit,
  });

  if (error) {
    console.error("[tierVerification] Usage check error:", error);
    return {
      tier,
      balance,
      limit,
      allowed: false,
      currentUsage: 0,
    };
  }

  // Get current usage count
  const { data: usageCount } = await supabase.rpc("get_usage_count", {
    p_wallet: walletAddress,
    p_feature: feature,
  });

  return {
    tier,
    balance,
    limit,
    allowed: allowed ?? false,
    currentUsage: usageCount ?? 0,
  };
}

/**
 * Quick check if a tier has access to chaos mode
 */
export function hasChaosAccess(tier: TierLevel): boolean {
  return tier === "TIER_2";
}
