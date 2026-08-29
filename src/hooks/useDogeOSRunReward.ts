/**
 * Reward-claim flow hook — Phase 2D.
 *
 * Deliberately NOT wired into the game loop. A caller passes an already
 * finished run result; nothing here runs per frame and nothing in src/game/**
 * imports it.
 */
import { useCallback, useState } from "react";
import {
  authenticateWallet,
  clearRewardSession,
  reportSubmittedTx,
  requestRewardAuthorization,
  submitRunTransaction,
  type RewardAuthorization,
  type RunResult,
} from "@/lib/dogeos/rewardsApi";

export type RewardPhase =
  | "idle"
  | "authenticating"
  | "authorizing"
  | "authorized"
  | "submitting"
  | "submitted"
  | "error";

export interface RewardState {
  phase: RewardPhase;
  authorization: RewardAuthorization | null;
  txHash: string | null;
  error: string | null;
}

const INITIAL: RewardState = { phase: "idle", authorization: null, txHash: null, error: null };

export function useDogeOSRunReward(address: string | null) {
  const [state, setState] = useState<RewardState>(INITIAL);

  const reset = useCallback(() => setState(INITIAL), []);

  const signIn = useCallback(async () => {
    if (!address) return;
    setState((s) => ({ ...s, phase: "authenticating", error: null }));
    try {
      await authenticateWallet(address);
      setState((s) => ({ ...s, phase: "idle" }));
    } catch (e) {
      clearRewardSession();
      setState((s) => ({ ...s, phase: "error", error: (e as Error).message }));
    }
  }, [address]);

  const authorizeRun = useCallback(
    async (run: RunResult) => {
      if (!address) return;
      setState({ ...INITIAL, phase: "authorizing" });
      try {
        const authorization = await requestRewardAuthorization(address, run);
        setState({ phase: "authorized", authorization, txHash: null, error: null });
      } catch (e) {
        setState({ ...INITIAL, phase: "error", error: (e as Error).message });
      }
    },
    [address],
  );

  const submit = useCallback(async () => {
    if (!address || !state.authorization) return;
    setState((s) => ({ ...s, phase: "submitting", error: null }));
    try {
      const txHash = await submitRunTransaction(address, state.authorization);
      // Best-effort status report; failure here does not affect the on-chain tx.
      void reportSubmittedTx(address, state.authorization.attestation.runId, txHash).catch(
        () => {},
      );
      setState((s) => ({ ...s, phase: "submitted", txHash }));
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: (e as Error).message }));
    }
  }, [address, state.authorization]);

  return { ...state, signIn, authorizeRun, submit, reset };
}
