import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Copy, Check, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserTier } from "@/hooks/useWaldogeBalance";
import { RAID_TONES, PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RaidTabProps {
  tier: UserTier;
  canUse: boolean;
  remainingUses: number;
  onUse: () => void;
}

interface GeneratedContent {
  posts: string[];
  replies: string[];
  oneLiners: string[];
}

const sampleContent: GeneratedContent = {
  posts: [
    "Just found out WALDOGE has glowing wings and a backpack full of cosmic energy 🐕✨\n\nIf you're not holding, are you even exploring the galaxy? #WALDOGE #SpaceDoge",
    "POV: You're a paper hand watching WALDOGE holders float through space with their diamond paws 🚀\n\nWe're not going to the moon. We're going BEYOND 🌌",
    "The WALDOGE community doesn't spam.\n\nWe EXPLORE.\n\nBig difference 🐕💎",
  ],
  replies: [
    "WALDOGE fam reporting for duty 🐕✨",
    "Space vibes only. LFG 🚀",
    "This is the way. Cosmic doge approves 🌌",
    "Diamond paws activated 💎🐾",
    "WALDOGE holders don't panic. We float. 🐕",
    "My backpack's ready for this journey 🎒✨",
    "Glowing wings engaged 🦋🚀",
    "Community > everything. WALDOGE knows 🐕",
    "To infinity and beyond (not financial advice) 🌌",
    "The cosmos is calling 📞🐕",
  ],
  oneLiners: [
    "WALDOGE: Because regular doge doesn't have wings 🦋",
    "Space doge energy only 🐕🚀",
    "Backpack full of memes, heart full of vibes ✨",
    "We explore. We meme. We WALDOGE 🌌",
    "Not going to the moon. Going everywhere 🐕💫",
  ],
};

export const RaidTab: FC<RaidTabProps> = ({
  tier,
  canUse,
  remainingUses,
  onUse,
}) => {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"clean" | "degen" | "unhinged">("clean");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const isLocked = tier === "none" || tier === "preview";
  const isUnhingedLocked = tier !== "chaos";

  const handleGenerate = () => {
    if (!canUse || !topic.trim()) return;

    setIsGenerating(true);
    onUse();

    // Simulate generation
    setTimeout(() => {
      setContent(sampleContent);
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const CopyButton: FC<{ text: string; id: string }> = ({ text, id }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, id)}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {copiedIndex === id ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Raid Generator
        </h2>
        {!isLocked && (
          <span className="text-xs text-muted-foreground">
            {remainingUses} generations left today
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="topic">Topic / Goal</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., WALDOGE community growth, new partnership..."
              disabled={isLocked}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Tone</Label>
            <Select
              value={tone}
              onValueChange={(v) => setTone(v as any)}
              disabled={isLocked}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">
                  🌟 Clean - {RAID_TONES.clean}
                </SelectItem>
                <SelectItem value="degen">
                  🔥 Degen - {RAID_TONES.degen}
                </SelectItem>
                <SelectItem value="unhinged" disabled={isUnhingedLocked}>
                  🌌 Unhinged {isUnhingedLocked && "(Tier 2 only)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform} disabled={isLocked}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleGenerate}
              disabled={isLocked || !canUse || !topic.trim() || isGenerating}
              className="w-full"
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
                  <Zap className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Content or Sample */}
      <div className="space-y-6">
        {/* Posts */}
        <div>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            📝 Full Posts (3)
            {isLocked && (
              <span className="text-xs text-muted-foreground font-normal">
                — Sample
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {(content?.posts || sampleContent.posts).map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "glass-card p-4 group relative",
                  isLocked && "opacity-60"
                )}
              >
                <p className="text-sm whitespace-pre-wrap pr-10">{post}</p>
                {!isLocked && (
                  <div className="absolute top-2 right-2">
                    <CopyButton text={post} id={`post-${i}`} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Replies */}
        <div>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            💬 Short Replies (10)
            {isLocked && (
              <span className="text-xs text-muted-foreground font-normal">
                — Sample
              </span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(content?.replies || sampleContent.replies).map((reply, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass-card p-3 group flex justify-between items-center",
                  isLocked && "opacity-60"
                )}
              >
                <p className="text-sm">{reply}</p>
                {!isLocked && <CopyButton text={reply} id={`reply-${i}`} />}
              </motion.div>
            ))}
          </div>
        </div>

        {/* One-liners */}
        <div>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            ⚡ One-Liners (5)
            {isLocked && (
              <span className="text-xs text-muted-foreground font-normal">
                — Sample
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(content?.oneLiners || sampleContent.oneLiners).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "glass-card px-4 py-2 group flex items-center gap-2",
                  isLocked && "opacity-60"
                )}
              >
                <p className="text-sm">{line}</p>
                {!isLocked && <CopyButton text={line} id={`liner-${i}`} />}
              </motion.div>
            ))}
          </div>
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
              ? "Connect your wallet to unlock raid generation"
              : "Hold WALDOGE tokens to generate custom raids"}
          </p>
        </motion.div>
      )}
    </div>
  );
};
