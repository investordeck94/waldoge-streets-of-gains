/**
 * Thin EIP-1193 wrapper for the injected browser EVM provider.
 *
 * Deliberately dependency-free (no wagmi/viem/ethers) and completely isolated
 * from the existing Solana wallet-adapter stack, which is left untouched.
 */

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isSolana?: boolean;
  providers?: Eip1193Provider[];
}

function looksLikeEvmProvider(p: any): p is Eip1193Provider {
  if (!p || typeof p !== "object") return false;
  if (typeof p.request !== "function") return false;
  // Solana-only providers (Phantom's `window.solana`, Solflare) expose
  // `isPhantom`/`isSolana` and a Solana-style API — never treat them as EVM.
  if (p.isSolana === true) return false;
  if (p.isPhantom === true && p.isMetaMask !== true && typeof p.chainId === "undefined") return false;
  return true;
}

/** Returns the injected EVM provider, or null when none is available. */
export function getEvmProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const injected = (window as any).ethereum;
  if (!injected) return null;

  // Multiple wallets injected: pick the first genuine EVM provider.
  if (Array.isArray(injected.providers) && injected.providers.length > 0) {
    const evm = injected.providers.find(looksLikeEvmProvider);
    if (evm) return evm;
  }
  return looksLikeEvmProvider(injected) ? injected : null;
}

export function hasEvmProvider(): boolean {
  return getEvmProvider() !== null;
}

/** Typed passthrough to `provider.request`. Throws if no provider exists. */
export async function request<T = unknown>(
  method: string,
  params?: unknown[] | object,
): Promise<T> {
  const provider = getEvmProvider();
  if (!provider) throw new Error("No EVM wallet found");
  return (await provider.request({ method, params })) as T;
}

export const requestAccounts = () => request<string[]>("eth_requestAccounts");
export const getAccounts = () => request<string[]>("eth_accounts");
export const getChainId = () => request<string>("eth_chainId");

type Handler = (...args: any[]) => void;

export function onAccountsChanged(handler: (accounts: string[]) => void): () => void {
  return addListener("accountsChanged", handler as Handler);
}

export function onChainChanged(handler: (chainIdHex: string) => void): () => void {
  return addListener("chainChanged", handler as Handler);
}

/** Subscribes and returns an unsubscribe function. */
export function addListener(event: string, handler: Handler): () => void {
  const provider = getEvmProvider();
  if (!provider?.on) return () => {};
  provider.on(event, handler);
  return () => removeListener(event, handler);
}

export function removeListener(event: string, handler: Handler): void {
  const provider = getEvmProvider();
  provider?.removeListener?.(event, handler);
}
