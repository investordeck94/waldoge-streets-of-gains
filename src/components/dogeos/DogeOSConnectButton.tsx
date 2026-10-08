import { type FC } from "react";
import { Wallet, Link2Off, Loader2, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDogeOSWallet } from "@/contexts/DogeOSWalletProvider";
import { DOGEOS_CHAIN, truncateAddress } from "@/lib/chains/dogeos";

interface Props {
className?: string;
size?: "sm" | "md";
showFutureProviders?: boolean;
}

export const DogeOSConnectButton: FC<Props> = ({
className,
size = "sm",
}) => {
const {
status,
address,
error,
connect,
disconnect,
switchToDogeOS,
} = useDogeOSWallet();

const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

const base = cn(
"inline-flex items-center gap-1.5 rounded-md border font-medium transition",
size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm",
);

let main: JSX.Element;

if (status === "connecting") {
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
className={cn(
base,
"border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20",
)}
title={error ?? `Switch your wallet to ${DOGEOS_CHAIN.name}`}
>
<AlertTriangle className={icon} />
Switch to {DOGEOS_CHAIN.shortName}
</button>

<button
type="button"
onClick={disconnect}
className={cn(
base,
"border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground",
)}
>
<LogOut className={icon} />
Disconnect
</button>
</>
);
} else if (status === "connected" && address) {
main = (
<>
<span
className={cn(
base,
"border-primary/50 bg-primary/10 text-primary cursor-default",
)}
title={`${address} · ${DOGEOS_CHAIN.name}`}
>
<Wallet className={icon} />
DogeOS · {truncateAddress(address)}
</span>

<button
type="button"
onClick={disconnect}
className={cn(
base,
"border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground",
)}
title="Disconnect wallet"
>
<LogOut className={icon} />
Disconnect
</button>
</>
);
} else if (status === "unsupported") {
main = (
<span
className={cn(
base,
"border-border/60 bg-muted/40 text-muted-foreground cursor-default",
)}
title={error ?? "DogeOS wallet connection is unavailable"}
>
<Link2Off className={icon} />
Wallet Unavailable
</span>
);
} else {
main = (
<button
type="button"
onClick={() => void connect()}
className={cn(
base,
"border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
)}
title={error ?? `Connect wallet to ${DOGEOS_CHAIN.name}`}
>
<Wallet className={icon} />
Connect DogeOS
</button>
);
}

return (
<span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
{main}
</span>
);
};
