import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
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
      const associatedTokenAddress = getAssociatedTokenAddressSync(
        mintPubkey,
        publicKey
      );

      try {
        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        // Assuming 9 decimals for the token (standard Solana SPL token)
        const tokenBalance = Number(tokenAccount.amount) / 1e9;
        setBalance(tokenBalance);
        setTier(calculateTier(tokenBalance));
        setIsWhale(tokenBalance >= WHALE_THRESHOLD);
      } catch (tokenError: any) {
        // If token account doesn't exist, balance is 0
        if (tokenError.name === "TokenAccountNotFoundError") {
          setBalance(0);
          setTier("preview");
          setIsWhale(false);
        } else {
          throw tokenError;
        }
      }
    } catch (err: any) {
      console.error("Error fetching WALDOGE balance:", err);
      setError("Failed to fetch token balance");
      setBalance(0);
      setTier("preview");
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
    isLoading,
    error,
    refetch: fetchBalance,
  };
};
