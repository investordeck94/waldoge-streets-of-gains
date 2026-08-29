/**
 * Presentational DogeOS connect button. Pure React/UI — lives entirely outside
 * the Streets of Gains canvas and game loop.
 */
import { type FC } from "react";
import { Wallet, Link2Off, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDogeOSWallet } from "@/contexts/DogeOSWalletProvider";
import { DOGEOS_CHAIN, truncateAddress } from "@/lib/chains/dogeos";

interface Props {
  className?: string;
  size?: "sm" | "md";
}

export const DogeOSConnectButton: FC<Props> = ({ className, size = "sm" }) => {
  const { status, address, error, connect, switchToDogeOS } = useDogeOSWallet();

  const base = cn(
    "inline-flex items-center gap-1.5 rounded-md border font-medium transition",
    size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm",
    className,
  );

  if (status === "unsupported") {
    return (
      <span
        className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground cursor-default")}
        title="Install an EVM wallet to connect to DogeOS Chikyū Testnet"
      >
        <Link2Off className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        No EVM wallet found
      </span>
    );
  }

  if (status === "connecting") {
    return (
      <span className={cn(base, "border-border/60 bg-muted/40 text-muted-foreground")}>
        <Loader2 className={cn("animate-spin", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        Connecting…
      </span>
    );
  }

  if (status === "wrong-chain") {
    return (
      <button
        type="button"
        onClick={() => void switchToDogeOS()}
        className={cn(base, "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20")}
        title={error ?? `Switch your wallet to ${DOGEOS_CHAIN.name}`}
      >
        <AlertTriangle className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        Switch to {DOGEOS_CHAIN.shortName}
      </button>
    );
  }

  if (status === "connected" && address) {
    return (
      <span
        className={cn(base, "border-primary/50 bg-primary/10 text-primary cursor-default")}
        title={`${address} · ${DOGEOS_CHAIN.name}`}
      >
        <Wallet className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        {truncateAddress(address)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void connect()}
      className={cn(base, "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20")}
      title={error ?? `Connect to ${DOGEOS_CHAIN.name}`}
    >
      <Wallet className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      Connect DogeOS
    </button>
  );
};
