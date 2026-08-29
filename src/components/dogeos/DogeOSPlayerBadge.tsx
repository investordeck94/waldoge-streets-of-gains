/**
 * Minimal, non-intrusive indicator that the current Streets of Gains session
 * is linked to a DogeOS player identity. Presentational only — mounted in the
 * HUD JSX, never touched by the canvas/game loop.
 */
import { type FC } from "react";
import { IdCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDogeOSPlayerIdentity } from "@/hooks/useDogeOSPlayerIdentity";
import { truncateAddress } from "@/lib/chains/dogeos";

interface Props {
  className?: string;
  size?: "sm" | "md";
}

export const DogeOSPlayerBadge: FC<Props> = ({ className, size = "sm" }) => {
  const { identity } = useDogeOSPlayerIdentity();

  if (!identity) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 text-muted-foreground font-medium",
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        className,
      )}
      title={`Streets of Gains player: ${identity.playerId}`}
    >
      <IdCard className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      Player {truncateAddress(identity.playerId)}
    </span>
  );
};
