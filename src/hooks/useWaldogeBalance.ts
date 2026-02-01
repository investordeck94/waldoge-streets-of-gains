import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";
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

export const useWaldogeBalance = (): WaldogeBalanceState => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [tier, setTier] = useState<UserTier>("none");
  const [isWhale, setIsWhale] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTier = useCallback((tokenBalance: number): UserTier => {
    if (tokenBalance >= TIER_THRESHOLDS.TIER_2) return "chaos";
    if (tokenBalance >= TIER_THRESHOLDS.TIER_1) return "basic";
    if (tokenBalance === 0) return "preview";
    return "preview";
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(0);
      setTier("none");
      setIsWhale(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintPubkey = new PublicKey(WALDOGE_TOKEN_MINT);
      console.log("🐕 Fetching WALDOGE balance for wallet:", publicKey.toBase58());
      console.log("🐕 Token mint:", WALDOGE_TOKEN_MINT);
      
      // Fetch mint info to get correct decimals
      let decimals = 9; // Default to 9
      try {
        const mintInfo = await getMint(connection, mintPubkey);
        decimals = mintInfo.decimals;
        console.log("🐕 Token decimals:", decimals);
      } catch (mintError) {
        console.warn("🐕 Could not fetch mint info, using default 9 decimals:", mintError);
      }
      
      const associatedTokenAddress = getAssociatedTokenAddressSync(
        mintPubkey,
        publicKey
      );
      console.log("🐕 Associated token address:", associatedTokenAddress.toBase58());

      try {
        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        // Use the correct decimals from mint info
        const divisor = Math.pow(10, decimals);
        const tokenBalance = Number(tokenAccount.amount) / divisor;
        console.log("🐕 Raw token amount:", tokenAccount.amount.toString());
        console.log("🐕 Decimals used:", decimals);
        console.log("🐕 Calculated balance:", tokenBalance);
        setBalance(tokenBalance);
        setTier(calculateTier(tokenBalance));
        setIsWhale(tokenBalance >= WHALE_THRESHOLD);
        console.log("🐕 Tier:", calculateTier(tokenBalance), "Is Whale:", tokenBalance >= WHALE_THRESHOLD);
      } catch (tokenError: any) {
        console.log("🐕 Token account error:", tokenError.name, tokenError.message);
        // If token account doesn't exist, balance is 0
        if (tokenError.name === "TokenAccountNotFoundError") {
          console.log("🐕 No token account found - user has 0 WALDOGE");
          setBalance(0);
          setTier("preview");
          setIsWhale(false);
        } else {
          throw tokenError;
        }
      }
    } catch (err: any) {
      console.error("🐕 Error fetching WALDOGE balance:", err);
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
