/**
 * Presentational DogeOS connect UI. Pure React/UI — lives entirely outside
 * the Streets of Gains canvas and game loop, and never touches the reward,
 * weekly competition, or attestation logic.
 *
 * Providers come from the shared registry in `@/lib/dogeos/walletProviders`:
 *  - MetaMask (or any injected EIP-1193 wallet) — supported today.
 *  - MyDoge / official DogeOS wallet — no official integration yet, rendered
 *    as a disabled "Coming Soon" slot. It is never presented as connected.
 *
 * Both are providers for the *same* DogeOS Chikyū network and resolve to the
 * same wallet address consumed by the existing reward architecture.
 */
import { type FC } from "react";
import { Wallet, Link2Off, Loader2, AlertTriangle, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDogeOSWallet } from "@/contexts/DogeOSWalletProvider";
import { DOGEOS_CHAIN, truncateAddress } from "@/lib/chains/dogeos";
import { injectedWalletLabel } from "@/lib/dogeos/walletProviders";

interface Props {
  className?: string;
  size?: "sm" | "md";
  /** Hide the future-provider slots (e.g. in very tight HUD corners). */
  showFutureProviders?: boolean;
}

export const DogeOSConnectButton: FC<Props> = ({
  className,
  size = "sm",
  showFutureProviders = true,
}) => {
  const { status, address, error, providers, connect, disconnect, switchToDogeOS } =
    useDogeOSWallet();

  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-md border font-medium transition",
    size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm",
  );

  const walletName = injectedWalletLabel();

  // Providers with no official integration yet → disabled "Coming Soon" slots.
  const futureSlots = showFutureProviders
    ? providers
        .filter((p) => !p.supported)
        .map((p) => (
          <button
            key={p.id}
            type="button"
            disabled
            aria-disabled="true"
            className={cn(
              base,
              "border-border/60 bg-muted/30 text-muted-foreground/70 cursor-not-allowed opacity-80",
            )}
            title={p.unavailableReason}
          >
            <Clock className={icon} />
            {p.label} — Coming Soon
          </button>
        ))
    : null;

  let main: JSX.Element;

  if (status === "unsupported") {
    main = (
      <span
        className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground cursor-default")}
        title={`Install MetaMask (or another EVM wallet) to connect to ${DOGEOS_CHAIN.name}`}
      >
        <Link2Off className={icon} />
        Install MetaMask
      </span>
    );
  } else if (status === "connecting") {
    main = (
      <span className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground")}>
        <Loader2 className={cn("animate-spin", icon)} />
        Connecting…
      </span>
    );
  } else if (status === "wrong-chain") {
    main = (
      <>
        <button
          type="button"
          onClick={() => void switchToDogeOS()}
          className={cn(base, "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20")}
          title={error ?? `Switch your wallet to ${DOGEOS_CHAIN.name}`}
        >
          <AlertTriangle className={icon} />
          Switch to {DOGEOS_CHAIN.shortName}
        </button>
        <button
          type="button"
          onClick={disconnect}
          className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground")}
          title="Disconnect wallet"
        >
          <LogOut className={icon} />
          Disconnect Wallet
        </button>
      </>
    );
  } else if (status === "connected" && address) {
    main = (
      <>
        <span
          className={cn(base, "border-primary/50 bg-primary/10 text-primary cursor-default")}
          title={`${address} · ${walletName} · ${DOGEOS_CHAIN.name}`}
        >
          <Wallet className={icon} />
          {walletName} · {truncateAddress(address)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground")}
          title="Disconnect wallet"
        >
          <LogOut className={icon} />
          Disconnect Wallet
        </button>
      </>
    );
  } else {
    main = (
      <button
        type="button"
        onClick={() => void connect("injected")}
        className={cn(base, "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20")}
        title={error ?? `Connect ${walletName} to ${DOGEOS_CHAIN.name}`}
      >
        <Wallet className={icon} />
        Connect {walletName}
      </button>
    );
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {main}
      {futureSlots}
    </span>
  );
};
