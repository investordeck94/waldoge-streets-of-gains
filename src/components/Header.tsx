import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { Zap, Sparkles, Dog, Clock, Gamepad2, Coins, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserTier } from "@/hooks/useWaldogeBalance";
import { cn } from "@/lib/utils";
import waldogeMascot from "@/assets/waldoge-mascot.png";

interface HeaderProps {
  balance: number;
  tier: UserTier;
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isInFreeTrial?: boolean;
  freeTrialTimeRemaining?: number;
}

const tabs = [
  { id: "chat", label: "Chat", icon: Dog },
  { id: "brawler", label: "Street Brawler", icon: Swords },
  { id: "raid", label: "Raid Generator", icon: Zap },
  { id: "meme", label: "Meme Generator", icon: Sparkles },
  { id: "tokens", label: "Token Listings", icon: Coins },
  { id: "game", label: "Find Waldoge", icon: Gamepad2 },
  { id: "about", label: "About", icon: null },
];

const TierBadge: FC<{ tier: UserTier }> = ({ tier }) => {
  const tierConfig = {
    none: { label: "Not Connected", className: "tier-badge-locked" },
    preview: { label: "Preview Mode", className: "tier-badge-preview" },
    basic: { label: "Tier 1", className: "tier-badge-basic" },
    chaos: { label: "Chaos Mode", className: "tier-badge-chaos" },
  };

  const config = tierConfig[tier];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
        config.className,
        tier === "chaos" && "chaos-shimmer"
      )}
    >
      {config.label}
    </motion.span>
  );
};

const formatTimeRemaining = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const Header: FC<HeaderProps> = ({
  balance,
  tier,
  isLoading,
  activeTab,
  onTabChange,
  isInFreeTrial = false,
  freeTrialTimeRemaining = 0,
}) => {
  const { connected } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Construction Notice Banner - hidden on very small screens */}
      <div className="bg-accent/20 border-b border-accent/30 py-1 sm:py-2 px-4 hidden sm:block">
        <p className="text-center text-xs sm:text-sm font-medium text-accent">
          🚧 Website under construction — Token gates temporarily lifted 🚧
        </p>
      </div>
      <div className="container mx-auto px-4">
        {/* Top row - Logo, Balance, Wallet */}
        <div className="flex items-center justify-between h-12 sm:h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <img 
                src={waldogeMascot} 
                alt="WALDOGE" 
                className="w-10 h-10 object-contain"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gradient-gold">
                WALDOGE AI
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Terminal</p>
            </div>
          </motion.div>

          {/* Right side - Balance & Wallet */}
          <div className="flex items-center gap-4">
            {connected && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden sm:flex items-center gap-3"
              >
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-display font-semibold text-primary">
                    {isLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `${balance.toLocaleString()} WALDOGE`
                    )}
                  </p>
                </div>
                {isInFreeTrial && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 border border-accent/40 rounded-full"
                  >
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold text-accent">
                      Free Trial: {formatTimeRemaining(freeTrialTimeRemaining)}
                    </span>
                  </motion.div>
                )}
                <TierBadge tier={tier} />
              </motion.div>
            )}
            <WalletMultiButton />
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex gap-0.5 sm:gap-1 pb-1 sm:pb-2 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={tab.label}
            >
              <span className="flex items-center gap-1 sm:gap-2">
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === "about" ? "About" : ""}</span>
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Mobile balance display */}
      {connected && (
        <div className="sm:hidden px-4 pb-3 flex items-center justify-between border-t border-border/30 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Balance:</span>
            <span className="font-display font-semibold text-primary text-sm">
              {isLoading ? "..." : `${balance.toLocaleString()} WALDOGE`}
            </span>
          </div>
          <TierBadge tier={tier} />
        </div>
      )}
    </header>
  );
};
