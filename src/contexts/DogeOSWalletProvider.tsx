/**
 * Isolated DogeOS (EVM) wallet context.
 *
 * Completely separate from the Solana WalletContextProvider and from the
 * Streets of Gains game state / persistence. Nothing here ever runs inside
 * the game's requestAnimationFrame loop, and no RPC call is made per frame.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import {
  DOGEOS_ADD_CHAIN_PARAMS,
  DOGEOS_CHAIN,
  isDogeOSChainId,
} from "@/lib/chains/dogeos";
import {
  addListener,
  getAccounts,
  getChainId,
  hasEvmProvider,
  request,
  requestAccounts,
} from "@/lib/dogeos/provider";

export type DogeOSStatus =
  | "unsupported"
  | "disconnected"
  | "connecting"
  | "connected"
  | "wrong-chain";

interface DogeOSWalletContextValue {
  status: DogeOSStatus;
  address: string | null;
  chainId: string | null;
  isCorrectChain: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToDogeOS: () => Promise<void>;
}

const AUTO_CONNECT_KEY = "dogeos.autoConnect";

const DogeOSWalletContext = createContext<DogeOSWalletContextValue | null>(null);

function errMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const anyErr = e as { message?: string; code?: number };
    if (anyErr.code === 4001) return "Request rejected in wallet";
    if (anyErr.message) return anyErr.message;
  }
  return String(e);
}

export const DogeOSWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [supported] = useState<boolean>(() => hasEvmProvider());
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const isCorrectChain = isDogeOSChainId(chainId);

  const status: DogeOSStatus = !supported
    ? "unsupported"
    : connecting
      ? "connecting"
      : !address
        ? "disconnected"
        : isCorrectChain
          ? "connected"
          : "wrong-chain";

  // Silent auto-reconnect — only when the user previously opted in.
  // Never triggers a wallet popup (eth_accounts only).
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    const opted = (() => {
      try {
        return localStorage.getItem(AUTO_CONNECT_KEY) === "1";
      } catch {
        return false;
      }
    })();
    if (!opted) return;

    (async () => {
      try {
        const [accounts, cid] = await Promise.all([getAccounts(), getChainId()]);
        if (cancelled || !mounted.current) return;
        setChainId(cid ?? null);
        setAddress(accounts && accounts.length > 0 ? accounts[0] : null);
      } catch (e) {
        if (!cancelled && mounted.current) setError(errMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supported]);

  // Wallet events → React state only.
  useEffect(() => {
    if (!supported) return;
    const offAccounts = addListener("accountsChanged", (accounts: string[]) => {
      if (!mounted.current) return;
      const next = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
      setAddress(next);
      if (!next) {
        try {
          localStorage.removeItem(AUTO_CONNECT_KEY);
        } catch { /* ignore */ }
      }
    });
    const offChain = addListener("chainChanged", (cid: string) => {
      if (!mounted.current) return;
      setChainId(typeof cid === "string" ? cid : null);
    });
    return () => {
      offAccounts();
      offChain();
    };
  }, [supported]);

  const connect = useCallback(async () => {
    if (!supported) {
      setError("No EVM wallet found");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = await requestAccounts();
      const cid = await getChainId();
      if (!mounted.current) return;
      setAddress(accounts && accounts.length > 0 ? accounts[0] : null);
      setChainId(cid ?? null);
      try {
        localStorage.setItem(AUTO_CONNECT_KEY, "1");
      } catch { /* ignore */ }
    } catch (e) {
      if (mounted.current) setError(errMessage(e));
    } finally {
      if (mounted.current) setConnecting(false);
    }
  }, [supported]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
    try {
      localStorage.removeItem(AUTO_CONNECT_KEY);
    } catch { /* ignore */ }
  }, []);

  const switchToDogeOS = useCallback(async () => {
    if (!supported) return;
    setError(null);
    try {
      await request("wallet_switchEthereumChain", [
        { chainId: DOGEOS_CHAIN.chainIdHex },
      ]);
    } catch (e) {
      const code = (e as { code?: number })?.code;
      // 4902 = chain unknown to the wallet; add it, then it becomes active.
      if (code === 4902) {
        try {
          await request("wallet_addEthereumChain", [DOGEOS_ADD_CHAIN_PARAMS]);
        } catch (addErr) {
          if (mounted.current) setError(errMessage(addErr));
          return;
        }
      } else {
        if (mounted.current) setError(errMessage(e));
        return;
      }
    }
    try {
      const cid = await getChainId();
      if (mounted.current) setChainId(cid ?? null);
    } catch { /* chainChanged event will cover it */ }
  }, [supported]);

  const value = useMemo<DogeOSWalletContextValue>(
    () => ({
      status,
      address,
      chainId,
      isCorrectChain,
      error,
      connect,
      disconnect,
      switchToDogeOS,
    }),
    [status, address, chainId, isCorrectChain, error, connect, disconnect, switchToDogeOS],
  );

  return (
    <DogeOSWalletContext.Provider value={value}>{children}</DogeOSWalletContext.Provider>
  );
};

export function useDogeOSWallet(): DogeOSWalletContextValue {
  const ctx = useContext(DogeOSWalletContext);
  if (!ctx) {
    throw new Error("useDogeOSWallet must be used within a DogeOSWalletProvider");
  }
  return ctx;
}
