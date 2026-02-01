import { useState, useEffect, useCallback, useRef } from "react";
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
  const { publicKey, connected, wallet } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [tier, setTier] = useState<UserTier>("none");
  const [isWhale, setIsWhale] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchAttemptRef = useRef<number>(0);

  const calculateTier = useCallback((tokenBalance: number): UserTier => {
    if (tokenBalance >= TIER_THRESHOLDS.TIER_2) return "chaos";   // 1M+ WALDOGE
    if (tokenBalance >= TIER_THRESHOLDS.TIER_1) return "basic";   // 500K+ WALDOGE
    if (tokenBalance > 0) return "preview";                        // Has tokens but < 500K
    return "preview";                                              // No tokens
  }, []);

  const fetchBalance = useCallback(async () => {
    const currentAttempt = ++fetchAttemptRef.current;
    
    console.log("🐕 fetchBalance called", {
      attempt: currentAttempt,
      publicKey: publicKey?.toBase58() || "null",
      connected,
      walletName: wallet?.adapter?.name || "none",
    });
    
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
      const rpcEndpoint = (connection as any)._rpcEndpoint || "unknown";
      
      console.log("🐕 Fetching WALDOGE balance", {
        wallet: walletAddress,
        tokenMint: WALDOGE_TOKEN_MINT,
        rpc: rpcEndpoint,
      });

      // Use getParsedTokenAccountsByOwner to find ALL token accounts for this mint
      const res = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: WALDOGE_MINT,
      });

      // Check if this is still the latest request
      if (currentAttempt !== fetchAttemptRef.current) {
        console.log("🐕 Stale request, ignoring result");
        return;
      }

      console.log("🐕 RPC response received", {
        accountsFound: res.value.length,
      });

      // Sum across any accounts that match this mint
      let uiAmount = 0;
      for (const acc of res.value) {
        const amount = acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
        uiAmount += amount;
        console.log("🐕 Token account:", acc.pubkey.toBase58(), "Amount:", amount.toLocaleString());
      }

      console.log("🐕 Total WALDOGE balance:", uiAmount.toLocaleString());
      
      const calculatedTier = calculateTier(uiAmount);
      const isWhaleStatus = uiAmount >= WHALE_THRESHOLD;
      
      setBalance(uiAmount);
      setTier(calculatedTier);
      setIsWhale(isWhaleStatus);
      
      console.log("🐕 Status updated:", {
        balance: uiAmount.toLocaleString(),
        tier: calculatedTier,
        isWhale: isWhaleStatus,
      });
    } catch (err: any) {
      // Check if this is still the latest request
      if (currentAttempt !== fetchAttemptRef.current) {
        return;
      }
      
      console.error("🐕 Error fetching WALDOGE balance:", err?.message || err);
      setError("Failed to fetch token balance");
      setBalance(0);
      setTier("preview");
      setIsWhale(false);
    } finally {
      if (currentAttempt === fetchAttemptRef.current) {
        setIsLoading(false);
      }
    }
  }, [publicKey, connected, connection, calculateTier, wallet]);

  // Fetch balance when wallet connection state changes
  useEffect(() => {
    console.log("🐕 Wallet state changed:", {
      connected,
      publicKey: publicKey?.toBase58() || "null",
      walletName: wallet?.adapter?.name || "none",
    });
    
    // Immediate fetch
    fetchBalance();
    
    // Also fetch after a short delay to handle late wallet adapter updates
    if (connected && publicKey) {
      const delayedFetch = setTimeout(() => {
        console.log("🐕 Delayed fetch triggered");
        fetchBalance();
      }, 500);
      
      return () => clearTimeout(delayedFetch);
    }
  }, [fetchBalance, connected, publicKey, wallet]);

  // Refetch periodically when connected
  useEffect(() => {
    if (!connected || !publicKey) return;

    console.log("🐕 Starting periodic refetch interval (30s)");
    const interval = setInterval(fetchBalance, 30000);
    return () => {
      console.log("🐕 Clearing periodic refetch interval");
      clearInterval(interval);
    };
  }, [connected, publicKey, fetchBalance]);

  return {
    balance,
    tier,
    isWhale,
    isLoading,
    error,
    refetch: fetchBalance,
  };
};
