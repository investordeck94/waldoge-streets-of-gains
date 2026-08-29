/**
 * Streets of Gains — DogeOS player identity hook (Phase 1B).
 *
 * Reacts to the Phase 1A wallet context: connect / account change / disconnect.
 * No RPC calls, no blockchain requests, no game-state writes.
 */
import { useEffect, useState } from "react";
import { useDogeOSWallet } from "@/contexts/DogeOSWalletProvider";
import {
  clearStoredIdentity,
  deriveIdentity,
  normalizeAddress,
  readStoredIdentity,
  storeIdentity,
  type DogeOSPlayerIdentity,
} from "@/lib/dogeos/playerIdentity";

export interface DogeOSPlayerIdentityState {
  /** Active identity for this session, or null when no wallet is connected. */
  identity: DogeOSPlayerIdentity | null;
  /** Normalized lowercase address, or null. */
  playerId: string | null;
  isIdentified: boolean;
}

export function useDogeOSPlayerIdentity(): DogeOSPlayerIdentityState {
  const { address } = useDogeOSWallet();
  const [identity, setIdentity] = useState<DogeOSPlayerIdentity | null>(null);

  useEffect(() => {
    const normalized = normalizeAddress(address);

    // Disconnected (or invalid address) → clear the active identity.
    if (!normalized) {
      setIdentity(null);
      clearStoredIdentity();
      return;
    }

    const previous = readStoredIdentity();
    const next = deriveIdentity(address, previous);
    if (!next) {
      setIdentity(null);
      return;
    }
    // A different wallet fully replaces the stored identity.
    setIdentity(storeIdentity(next));
  }, [address]);

  return {
    identity,
    playerId: identity?.playerId ?? null,
    isIdentified: identity !== null,
  };
}
