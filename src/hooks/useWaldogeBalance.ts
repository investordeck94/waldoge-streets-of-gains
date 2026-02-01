import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { WALDOGE_TOKEN_MINT, TIER_THRESHOLDS, WHALE_THRESHOLD } from "@/lib/constants";

export type UserTier = "none" | "preview" | "basic" | "chaos";

interface WaldogeBalanceState {
  balance: number;
  tier: UserTier;
  isWhale: boolean; // Holds >= 1% of supply, waives NFT mint fees
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const WALDOGE_MINT = new PublicKey(WALDOGE_TOKEN_MINT);

export const useWaldogeBalance = (): WaldogeBalanceState => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [tier, setTier] = useState<UserTier>("none");
  const [isWhale, setIsWhale] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTier = useCallback((tokenBalance: number): UserTier => {
    if (tokenBalance >= TIER_THRESHOLDS.TIER_2) return "chaos";   // 1M+ WALDOGE
    if (tokenBalance >= TIER_THRESHOLDS.TIER_1) return "basic";   // 100K+ WALDOGE
    if (tokenBalance > 0) return "preview";                        // Has tokens but < 100K
    return "preview";                                              // No tokens
  }, []);

  const fetchBalance = useCallback(async () => {
    console.log("🐕 fetchBalance called - publicKey:", publicKey?.toBase58(), "connected:", connected);
    
    if (!publicKey || !connected) {
      console.log("🐕 No wallet connected, resetting state");
      setBalance(0);
      setTier("none");
      setIsWhale(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      console.log("🐕 Fetching WALDOGE balance for wallet:", walletAddress);
      console.log("🐕 Token mint:", WALDOGE_TOKEN_MINT);
      console.log("🐕 RPC endpoint:", (connection as any)._rpcEndpoint || "unknown");

      // Use getParsedTokenAccountsByOwner to find ALL token accounts for this mint
      const res = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: WALDOGE_MINT,
      });

      console.log("🐕 RPC response received, accounts found:", res.value.length);

      // Sum across any accounts that match this mint
      let uiAmount = 0;
      for (const acc of res.value) {
        const amount = acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
        uiAmount += amount;
        console.log("🐕 Found token account:", acc.pubkey.toBase58(), "Amount:", amount);
      }

      console.log("🐕 Total balance across all accounts:", uiAmount);
      
      setBalance(uiAmount);
      setTier(calculateTier(uiAmount));
      setIsWhale(uiAmount >= WHALE_THRESHOLD);
      console.log("🐕 Tier:", calculateTier(uiAmount), "Is Whale:", uiAmount >= WHALE_THRESHOLD);
    } catch (err: any) {
      console.error("🐕 Error fetching WALDOGE balance:", err);
      console.error("🐕 Error details:", err?.message, err?.stack);
      setError("Failed to fetch token balance");
      setBalance(0);
      setTier("preview");
      setIsWhale(false);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connected, connection, calculateTier]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Refetch periodically when connected
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(fetchBalance, 30000); // Refetch every 30 seconds
    return () => clearInterval(interval);
  }, [connected, fetchBalance]);

  return {
    balance,
    tier,
    isWhale,
    isLoading,
    error,
    refetch: fetchBalance,
  };
};
