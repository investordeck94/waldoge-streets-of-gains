import { FC } from "react";
import { motion } from "framer-motion";
import { Wallet, Rocket, Sparkles, Shield, ArrowRight } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import waldogeMascot from "@/assets/waldoge-mascot.png";

interface LandingPageProps {
  onLearnMore: () => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onLearnMore }) => {
  const { connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnectWallet = () => {
    setVisible(true);
  };

  const features = [
    {
      icon: Rocket,
      title: "AI Chat Companion",
      description: "Chat with WALDOGE, your cosmic doge guide through the crypto galaxy",
    },
    {
      icon: Sparkles,
      title: "Content Generation",
      description: "Generate raid posts, meme captions, and viral content instantly",
    },
    {
      icon: Shield,
      title: "NFT Creator",
      description: "Mint unique WALDOGE Space Badges directly to your wallet",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 space-bg">
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Floating mascot */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="mb-6 flex justify-center"
          >
            <img 
              src={waldogeMascot} 
              alt="WALDOGE Mascot" 
              className="w-48 h-48 object-contain drop-shadow-[0_0_30px_hsl(45,95%,55%,0.4)]"
            />
          </motion.div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold mb-4">
            <span className="text-gradient-gold">WALDOGE AI</span>
            <br />
            <span className="text-foreground">Terminal</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your cosmic companion for meme creation, raid generation, and NFT minting.
            Connect your wallet to unlock the full WALDOGE experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                onClick={handleConnectWallet}
                disabled={connecting}
                className="h-14 px-8 text-lg font-semibold bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-[0_0_30px_hsl(45,95%,55%,0.4)] hover:shadow-[0_0_40px_hsl(45,95%,55%,0.6)] transition-all"
              >
                {connecting ? (
                  <>
                    <span className="animate-pulse">Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>

            <p className="text-sm text-muted-foreground">
              Works with Phantom, Solflare, and other Solana wallets
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={onLearnMore}
              className="text-muted-foreground hover:text-foreground"
            >
              How does token gating work?
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="glass-card p-6 text-center group hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-xs text-muted-foreground"
        >
          🐕 For fun. No financial advice. Always DYOR.
        </motion.p>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};
