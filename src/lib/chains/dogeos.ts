/**
 * DogeOS Chikyū Testnet — static chain configuration.
 *
 * Scope: Phase 1A wallet connectivity only. No balances, no transactions,
 * no contracts. Frozen at module scope so nothing can mutate it at runtime.
 *
 * NOTE on decimals: `wallet_addEthereumChain` strictly requires
 * `nativeCurrency.decimals`, so the EVM standard value of 18 is supplied for
 * that call only. It is deliberately NOT exported as a general-purpose
 * formatting constant — no balance rendering exists in this phase.
 */

export const DOGEOS_CHAIN = Object.freeze({
  name: "DogeOS Chikyū Testnet",
  shortName: "Chikyū",
  chainId: 6281971,
  chainIdHex: "0x5FD9B3",
  rpcUrl: "https://rpc.testnet.dogeos.com",
  wsRpcUrl: "wss://ws.rpc.testnet.dogeos.com",
  nativeSymbol: "DOGE",
  explorerUrl: "https://blockscout.testnet.dogeos.com",
});

/** Params object for the EIP-3085 `wallet_addEthereumChain` request. */
export const DOGEOS_ADD_CHAIN_PARAMS = Object.freeze({
  chainId: DOGEOS_CHAIN.chainIdHex,
  chainName: DOGEOS_CHAIN.name,
  nativeCurrency: Object.freeze({
    name: "Dogecoin",
    symbol: DOGEOS_CHAIN.nativeSymbol,
    // Required by the wallet API; not used for any display in Phase 1A.
    decimals: 18,
  }),
  rpcUrls: Object.freeze([DOGEOS_CHAIN.rpcUrl]),
  blockExplorerUrls: Object.freeze([DOGEOS_CHAIN.explorerUrl]),
});

/** Case-insensitive comparison of a wallet-reported chain id. */
export function isDogeOSChainId(chainIdHex: string | null): boolean {
  if (!chainIdHex) return false;
  return chainIdHex.toLowerCase() === DOGEOS_CHAIN.chainIdHex.toLowerCase();
}

/** Block-explorer URL for an account address. */
export function explorerAddressUrl(address: string): string {
  return `${DOGEOS_CHAIN.explorerUrl}/address/${address}`;
}

/** `0x1234…abcd` display form. */
export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
