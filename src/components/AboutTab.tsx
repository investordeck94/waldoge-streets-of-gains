import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Wallet, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WALDOGE_TOKEN_MINT, TIER_THRESHOLDS, USAGE_LIMITS } from "@/lib/constants";

export const AboutTab: FC = () => {
  const [copied, setCopied] = useState(false);

  const copyMintAddress = async () => {
    await navigator.clipboard.writeText(WALDOGE_TOKEN_MINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toLocaleString()}M`;
    if (num >= 1000) return `${(num / 1000).toLocaleString()}K`;
    return num.toLocaleString();
  };

  const tiers = [
    {
      name: "Preview Mode",
      requirement: "0 WALDOGE",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      features: [
        "View sample outputs",
        "Connect wallet",
        "Browse all features",
        "Raid Generator access",
        "Chat & Meme locked",
      ],
    },
    {
      name: "Tier 1 - Basic",
      requirement: `≥ ${formatNumber(TIER_THRESHOLDS.TIER_1)} WALDOGE`,
      color: "text-primary",
      bgColor: "bg-primary/20",
      features: [
        "Unlock AI Chat",
        "Unlock Meme Generator",
        `${USAGE_LIMITS.TIER_1.chat} chat messages/day`,
        `${USAGE_LIMITS.TIER_1.raidGenerator} raid generations/day`,
        `${USAGE_LIMITS.TIER_1.memeGenerator} meme generations/day`,
        `${USAGE_LIMITS.TIER_1.nftCreator} NFT mint/day`,
        "Clean & Degen tones",
      ],
    },
    {
      name: "Tier 2 - Chaos Mode",
      requirement: `≥ ${formatNumber(TIER_THRESHOLDS.TIER_2)} WALDOGE`,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      isChaos: true,
      features: [
        `${USAGE_LIMITS.TIER_2.chat} chat messages/day`,
        `${USAGE_LIMITS.TIER_2.raidGenerator} raid generations/day`,
        `${USAGE_LIMITS.TIER_2.memeGenerator} meme generations/day`,
        `${USAGE_LIMITS.TIER_2.nftCreator} NFT mints/day`,
        "Unlock Chaos Mode toggle",
        "Unhinged tone option",
        "Verified collection NFTs",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-7xl mb-4"
        >
          🐕
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-gradient-gold mb-3">
          About WALDOGE AI Terminal
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your cosmic companion for meme creation, community engagement, and NFT
          minting. Powered by the WALDOGE token.
        </p>
      </motion.div>

      {/* Tier Comparison */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4 text-center">
          Unlock Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 relative overflow-hidden ${
                tier.isChaos ? "border-purple-500/50" : ""
              }`}
            >
              {tier.isChaos && (
                <div className="absolute top-0 left-0 right-0 h-1 chaos-shimmer" />
              )}
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${tier.bgColor} ${tier.color}`}
              >
                {tier.name}
              </div>
              <p className="font-display font-semibold text-lg mb-4">
                {tier.requirement}
              </p>
              <ul className="space-y-2">
                {tier.features.map((feature, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How to Buy Modal */}
      <div className="glass-card p-6 text-center">
        <h2 className="font-display text-xl font-semibold mb-2">
          Don't have WALDOGE yet?
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Get WALDOGE tokens to unlock all features
        </p>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="glow-gold">
              <Coins className="w-4 h-4 mr-2" />
              How to Buy WALDOGE
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                How to Buy WALDOGE 🐕
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Get a Solana Wallet
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Download Phantom or Solflare wallet from their official websites.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Fund with SOL
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Buy SOL from an exchange and send it to your wallet address.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Swap for WALDOGE
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use a Solana DEX to swap SOL for WALDOGE using the mint address
                    below.
                  </p>
                </div>
              </div>

              {/* Mint Address */}
              <div className="glass-card p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  WALDOGE Mint Address (Solana)
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm break-all flex-1 bg-muted/50 p-2 rounded">
                    {WALDOGE_TOKEN_MINT}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyMintAddress}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Always verify the mint address before swapping
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* WALDOGE Lore */}
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          📖 The WALDOGE Story
        </h2>
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-muted-foreground">
            In the far reaches of the crypto galaxy, there exists a legendary
            explorer — a cheerful yellow doge with glowing wings and an endless
            thirst for adventure. Known across the cosmos as WALDOGE, this cosmic
            canine travels with nothing but a well-worn backpack and an unshakeable
            optimism.
          </p>
          <p className="text-muted-foreground mt-3">
            WALDOGE doesn't chase moons — they explore entire galaxies. Every holder
            becomes a crew member on this interstellar journey, contributing memes,
            vibes, and positive energy to the mission.
          </p>
          <p className="text-muted-foreground mt-3">
            The WALDOGE AI Terminal is your direct line to this cosmic companion.
            Generate content, mint NFTs, and join the adventure. The backpack is
            always packed with memes.
          </p>
        </div>
      </div>

      {/* Links & Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-3">🔗 Official Links</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                X / Twitter
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Telegram
              </a>
            </Button>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-semibold mb-3">⚠️ Safety Notice</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• This app is for fun. No financial advice.</li>
            <li>• Never share your seed phrase with anyone.</li>
            <li>• WALDOGE AI will never ask for private keys.</li>
            <li>• Always DYOR before making any decisions.</li>
            <li>• Hateful content is not tolerated.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-muted-foreground">
        <p>Built with 🐕 for the WALDOGE community</p>
        <p className="mt-1">For fun. No financial advice. Always DYOR.</p>
      </div>
    </div>
  );
};
