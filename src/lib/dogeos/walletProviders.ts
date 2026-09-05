/**
 * DogeOS Chikyū wallet provider registry.
 *
 * MetaMask (any injected EIP-1193 wallet) and the future official
 * MyDoge / DogeOS wallet are treated as *providers for the same network*
 * (chain ID 6281971). They resolve to the same wallet identity (a lowercase
 * EVM address), which is what the existing weekly Hard Mode competition and
 * reward settlement flow already consume — so adding MyDoge later means
 * flipping one entry here plus a `resolve()` implementation, with no change
 * to the reward architecture, rewardsApi.ts, or the deployed contract.
 *
 * Nothing here mocks or simulates a MyDoge connection: unavailable providers
 * are non-connectable by construction.
 */
import { getEvmProvider, hasEvmProvider, type Eip1193Provider } from "@/lib/dogeos/provider";

export type DogeOSWalletProviderId = "injected" | "mydoge";

export interface DogeOSWalletProviderDescriptor {
  id: DogeOSWalletProviderId;
  /** Human label shown in the UI (may depend on what is injected). */
  label: string;
  /** True when this provider can actually be connected right now. */
  available: boolean;
  /**
   * `false` when no official/supported integration exists yet.
   * Such providers render as a disabled "Coming Soon" slot.
   */
  supported: boolean;
  /** Short reason shown as a tooltip when not connectable. */
  unavailableReason?: string;
  /** Returns the underlying EIP-1193 provider, or null when unavailable. */
  resolve: () => Eip1193Provider | null;
}

export function injectedWalletLabel(): string {
  const p = getEvmProvider() as (Eip1193Provider & { isMetaMask?: boolean }) | null;
  return p?.isMetaMask ? "MetaMask" : "EVM wallet";
}

export function listWalletProviders(): DogeOSWalletProviderDescriptor[] {
  const injectedAvailable = hasEvmProvider();

  return [
    {
      id: "injected",
      label: injectedWalletLabel(),
      available: injectedAvailable,
      supported: true,
      unavailableReason: injectedAvailable
        ? undefined
        : "Install MetaMask (or another EVM wallet) to connect to DogeOS Chikyū",
      resolve: getEvmProvider,
    },
    {
      id: "mydoge",
      label: "MyDoge",
      // No official MyDoge / DogeOS wallet SDK or injected provider exists yet.
      available: false,
      supported: false,
      unavailableReason:
        "Official MyDoge / DogeOS wallet support is not available yet — coming soon",
      resolve: () => null,
    },
  ];
}

export function getWalletProvider(
  id: DogeOSWalletProviderId,
): DogeOSWalletProviderDescriptor | undefined {
  return listWalletProviders().find((p) => p.id === id);
}

/** The provider used for connections today. */
export const DEFAULT_WALLET_PROVIDER_ID: DogeOSWalletProviderId = "injected";
