/**
 * Presentational DogeOS connect UI. Pure React/UI — lives entirely outside
 * the Streets of Gains canvas and game loop.
 *
 * Providers:
 *  - MetaMask (or any injected EIP-1193 wallet) — supported today.
 *  - MyDoge / official DogeOS wallet — not yet available in the SDK, shown as
 *    a disabled "coming soon" slot so it can be wired in later without
 *    touching the reward system.
 */
import { type FC } from "react";
import { Wallet, Link2Off, Loader2, AlertTriangle, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDogeOSWallet } from "@/contexts/DogeOSWalletProvider";
import { DOGEOS_CHAIN, truncateAddress } from "@/lib/chains/dogeos";
import { getEvmProvider } from "@/lib/dogeos/provider";

interface Props {
  className?: string;
  size?: "sm" | "md";
  /** Hide the "MyDoge — coming soon" slot (e.g. in very tight HUD corners). */
  showFutureProviders?: boolean;
}

function injectedWalletName(): string {
  const p = getEvmProvider() as (ReturnType<typeof getEvmProvider> & { isMetaMask?: boolean }) | null;
  return p?.isMetaMask ? "MetaMask" : "EVM wallet";
}

export const DogeOSConnectButton: FC<Props> = ({
  className,
  size = "sm",
  showFutureProviders = true,
}) => {
  const { status, address, error, connect, disconnect, switchToDogeOS } = useDogeOSWallet();

  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-md border font-medium transition",
    size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm",
  );

  const futureSlot = showFutureProviders ? (
    <span
      className={cn(base, "border-border/60 bg-muted/30 text-muted-foreground/70 cursor-default")}
      title="Official MyDoge / DogeOS wallet support is not available yet"
    >
      <Clock className={icon} />
      MyDoge — coming soon
    </span>
  ) : null;

  let main: JSX.Element;

  if (status === "unsupported") {
    main = (
      <span
        className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground cursor-default")}
        title="Install MetaMask (or another EVM wallet) to connect to DogeOS Chikyū Testnet"
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
          title={`${address} · ${injectedWalletName()} · ${DOGEOS_CHAIN.name}`}
        >
          <Wallet className={icon} />
          {injectedWalletName()} · {truncateAddress(address)}
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
        onClick={() => void connect()}
        className={cn(base, "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20")}
        title={error ?? `Connect ${injectedWalletName()} to ${DOGEOS_CHAIN.name}`}
      >
        <Wallet className={icon} />
        Connect {injectedWalletName()}
      </button>
    );
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {main}
      {futureSlot}
    </span>
  );
};
