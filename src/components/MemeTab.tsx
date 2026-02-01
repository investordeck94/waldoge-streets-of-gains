import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, Check, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserTier } from "@/hooks/useWaldogeBalance";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";

interface MemeTabProps {
  tier: UserTier;
  canUse: boolean;
  remainingUses: number;
  onUse: () => void;
}

type MemeMode = "caption" | "prompt";

const sampleCaptions = [
  "When someone says WALDOGE is just another meme coin 🐕💅",
  "POV: You finally understand why the doge has wings",
  "Me explaining WALDOGE lore to my normie friends",
  "The backpack: empty. The vibes: immaculate. The destination: unknown. 🌌",
  "Paper hands watching us float through the cosmos 👀✨",
  "My portfolio: ⬇️ My WALDOGE bag: still comfy 🐕",
  "When the charts dip but the memes are still fire 🔥",
  "WALDOGE holders at 3am explaining tokenomics to their cat",
  "The council of space doges has convened 🐕🐕🐕",
  "You thought we were going to the moon? That's just the first stop 🚀",
];

const samplePrompts = [
  "A yellow cartoon doge wearing a red beanie and striped shirt, floating through a purple nebula with glowing butterfly wings, digital art, cosmic aesthetic, trending on artstation",
  "Space explorer doge with a backpack full of cryptocurrency coins, standing on an asteroid overlooking Earth, cinematic lighting, 4k, ethereal glow",
  "Adorable yellow shiba inu in astronaut suit, typing on a holographic keyboard, surrounded by floating memes, vaporwave colors, detailed illustration",
  "WALDOGE mascot surfing on a golden wave through the galaxy, surrounded by stars and crypto symbols, epic composition, dramatic lighting",
  "Cute doge character with luminescent wings sitting on the moon, looking at Earth, lo-fi aesthetic, soft pastel colors, peaceful vibes",
];

export const MemeTab: FC<MemeTabProps> = ({
  tier,
  canUse,
  remainingUses,
  onUse,
}) => {
  const { publicKey } = useWallet();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<MemeMode>("caption");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Token gates temporarily disabled - features unlocked for all connected wallets
  const isLocked = false;

  const handleGenerate = async () => {
    if (!canUse || !prompt.trim() || !publicKey) return;

    setIsGenerating(true);
    onUse();

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-memes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ theme: prompt, mode, walletAddress: publicKey.toBase58() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
      setResults(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Meme Generator
        </h2>
        {!isLocked && (
          <span className="text-xs text-muted-foreground">
            {remainingUses} generations left today
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card p-6 space-y-4">
        {/* Mode selector */}
        <div>
          <Label className="mb-3 block">Generation Mode</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as MemeMode)}
            className="flex gap-4"
            disabled={isLocked}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="caption" id="caption" />
              <Label htmlFor="caption" className="cursor-pointer">
                📝 Caption Mode
                <span className="text-xs text-muted-foreground ml-1">
                  (10 captions)
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="prompt" id="prompt" />
              <Label htmlFor="prompt" className="cursor-pointer">
                🎨 Prompt Mode
                <span className="text-xs text-muted-foreground ml-1">
                  (5 image prompts)
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Prompt input */}
        <div>
          <Label htmlFor="meme-prompt">
            {mode === "caption" ? "Meme Theme / Scenario" : "Image Concept"}
          </Label>
          <Input
            id="meme-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === "caption"
                ? "e.g., When WALDOGE pumps, holding through dips..."
                : "e.g., WALDOGE in space, cosmic adventure..."
            }
            disabled={isLocked}
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLocked || !canUse || !prompt.trim() || isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : isLocked ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Locked
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {mode === "caption" ? "Captions" : "Prompts"}
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      <div>
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          {mode === "caption" ? "📝 Captions" : "🎨 Image Prompts"}
          {isLocked && (
            <span className="text-xs text-muted-foreground font-normal">
              — Sample
            </span>
          )}
        </h3>

        <div className="space-y-3">
          {(results || (mode === "caption" ? sampleCaptions : samplePrompts)).map(
            (item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass-card p-4 group flex justify-between items-start gap-4",
                  isLocked && "opacity-60"
                )}
              >
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground mb-1 block">
                    #{i + 1}
                  </span>
                  <p className={cn("text-sm", mode === "prompt" && "font-mono")}>
                    {item}
                  </p>
                </div>
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(item, i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-4 h-4 text-waldoge-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </motion.div>
            )
          )}
        </div>
      </div>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            {tier === "none"
              ? "Connect your wallet to unlock meme generation"
              : "Hold WALDOGE tokens to generate custom memes"}
          </p>
        </motion.div>
      )}

      {/* Tips */}
      <div className="glass-card p-4 border-primary/20">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          💡 Tips
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {mode === "caption" ? (
            <>
              <li>• Be specific about the scenario for better captions</li>
              <li>• Mention emotions or reactions you want to capture</li>
              <li>• WALDOGE personality: fun, cosmic, explorer vibes</li>
            </>
          ) : (
            <>
              <li>• Paste these prompts into Midjourney, DALL-E, or any AI image tool</li>
              <li>• Add "WALDOGE mascot" to keep the character consistent</li>
              <li>• Cosmic, space, and explorer themes work best</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};
