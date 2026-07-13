import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { HomePage } from "@/components/HomePage";
import { ChatTab } from "@/components/ChatTab";
import { RaidTab } from "@/components/RaidTab";
import { MemeTab } from "@/components/MemeTab";
import { AboutTab } from "@/components/AboutTab";
import { WheresWaldoge } from "@/components/WheresWaldoge";
import { StreetBrawler } from "@/components/StreetBrawler";
import { BarkZero } from "@/components/BarkZero";
import { useWaldogeBalance } from "@/hooks/useWaldogeBalance";
import { useUsageTracking } from "@/hooks/useUsageTracking";

const Index = () => {
  const { connected, publicKey, wallet, connecting } = useWallet();
  const navigate = useNavigate();
  const { balance, tier, isLoading } = useWaldogeBalance();
  const { canUse, getRemainingUses, incrementUsage, isInFreeTrial, freeTrialTimeRemaining } = useUsageTracking(tier);

  // view = "home" shows the landing page; otherwise shows the terminal with active tab
  const [view, setView] = useState<"home" | "terminal">("home");
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    console.log("🔌 Index wallet state:", {
      connected,
      connecting,
      publicKey: publicKey?.toBase58() || "null",
      walletName: wallet?.adapter?.name || "none",
    });
  }, [connected, connecting, publicKey, wallet]);

  const handleLaunchTool = (tab: string) => {
    if (tab === "tokens") {
      navigate("/token-listings");
      return;
    }
    setActiveTab(tab);
    setView("terminal");
    // scroll to top when entering terminal
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "tokens") {
      navigate("/token-listings");
      return;
    }
    setActiveTab(tab);
  };

  if (view === "home") {
    return <HomePage onLaunchTool={handleLaunchTool} />;
  }

  const renderTabContent = () => {
    const featureKey =
      activeTab === "chat" ? "chat" : activeTab === "raid" ? "raidGenerator" : "memeGenerator";
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
        return <WheresWaldoge />;
      case "brawler":
        return <StreetBrawler />;
      case "barkzero":
        return <BarkZero />;
      case "about":
        return <AboutTab />;
      default:
        return <ChatTab {...tabProps} />;
    }
  };

  return (
    <div className="min-h-screen min-h-[100svh] flex flex-col space-bg">
      <Header
        balance={balance}
        tier={tier}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isInFreeTrial={isInFreeTrial}
        freeTrialTimeRemaining={freeTrialTimeRemaining}
      />

      {/* Back-to-home strip */}
      <div className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <button
            onClick={() => setView("home")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-waldoge-red transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
        </div>
      </div>

      <main className="flex-1 min-h-0 container mx-auto px-2 sm:px-4 py-3 sm:py-6 relative z-10">
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

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-waldoge-red/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <footer className="py-3 text-center text-xs text-muted-foreground border-t border-border/30 relative z-10">
        🐕 For fun. No financial advice. Always DYOR.
      </footer>
    </div>
  );
};

export default Index;
