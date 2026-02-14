import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { LandingPage } from "@/components/LandingPage";
import { ChatTab } from "@/components/ChatTab";
import { RaidTab } from "@/components/RaidTab";
import { MemeTab } from "@/components/MemeTab";

import { AboutTab } from "@/components/AboutTab";
import { MazeGame } from "@/components/MazeGame";
import { useWaldogeBalance } from "@/hooks/useWaldogeBalance";
import { useUsageTracking } from "@/hooks/useUsageTracking";

const Index = () => {
  const { connected, publicKey, wallet, connecting } = useWallet();
  const navigate = useNavigate();
  const { balance, tier, isWhale, isLoading } = useWaldogeBalance();
  const { canUse, getRemainingUses, incrementUsage, clearHistory, isInFreeTrial, freeTrialTimeRemaining } = useUsageTracking(tier);
  const [activeTab, setActiveTab] = useState("chat");

  const handleTabChange = (tab: string) => {
    if (tab === "tokens") {
      navigate("/token-listings");
      return;
    }
    setActiveTab(tab);
  };

  // Debug wallet state
  useEffect(() => {
    console.log("🔌 Index wallet state:", {
      connected,
      connecting,
      publicKey: publicKey?.toBase58() || "null",
      walletName: wallet?.adapter?.name || "none",
    });
  }, [connected, connecting, publicKey, wallet]);

  const handleLearnMore = () => {
    setActiveTab("about");
  };

  // Token gates temporarily disabled - show main app to everyone
  // Landing page only shown if user explicitly navigates there
  // if (!connected && !connecting) {
  //   return <LandingPage onLearnMore={handleLearnMore} />;
  // }

  const renderTabContent = () => {
    const featureKey = activeTab === "chat" ? "chat" : activeTab === "raid" ? "raidGenerator" : "memeGenerator";
    const tabProps = {
      tier,
      canUse: canUse(featureKey),
      remainingUses: getRemainingUses(featureKey),
      onUse: () => incrementUsage(featureKey),
    };

    switch (activeTab) {
      case "chat":
        return <ChatTab {...tabProps} />;
      case "raid":
        return <RaidTab {...tabProps} />;
      case "meme":
        return <MemeTab {...tabProps} />;
      case "game":
        return (
          <div className="max-w-md mx-auto">
            <MazeGame />
          </div>
        );
      case "about":
        return <AboutTab />;
      default:
        return <ChatTab {...tabProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col space-bg">
      <Header
        balance={balance}
        tier={tier}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isInFreeTrial={isInFreeTrial}
        freeTrialTimeRemaining={freeTrialTimeRemaining}
      />

      <main className="flex-1 container mx-auto px-4 py-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-waldoge-cyan/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Disclaimer footer */}
      <footer className="py-3 text-center text-xs text-muted-foreground border-t border-border/30 relative z-10">
        🐕 For fun. No financial advice. Always DYOR.
      </footer>
    </div>
  );
};

export default Index;
