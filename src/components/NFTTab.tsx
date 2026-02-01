import { FC, useState, useRef, useCallback, ChangeEvent } from "react";
import { motion } from "framer-motion";
import {
  ImagePlus,
  Upload,
  Sparkles,
  Lock,
  Loader2,
  ExternalLink,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserTier } from "@/hooks/useWaldogeBalance";
import { NFT_MINT_FEE_PERCENT } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NFTTabProps {
  tier: UserTier;
  canUse: boolean;
  remainingUses: number;
  onUse: () => void;
  isWhale: boolean; // Holds >= 1% supply, waives mint fee
}

type ImageSource = "generate" | "upload";
type ArtStyle = "cosmic" | "pixel" | "watercolor" | "neon" | "chaos";

const artStyles: { value: ArtStyle; label: string; locked?: boolean }[] = [
  { value: "cosmic", label: "🌌 Cosmic Explorer" },
  { value: "pixel", label: "👾 Pixel Art" },
  { value: "watercolor", label: "🎨 Watercolor" },
  { value: "neon", label: "💜 Neon Glow" },
  { value: "chaos", label: "🔥 Chaos Mode", locked: true },
];

const defaultAttributes = [
  { trait: "Wing Glow", value: "Cosmic Purple" },
  { trait: "Hat", value: "Red Beanie" },
  { trait: "Mood", value: "Adventurous" },
  { trait: "Galaxy", value: "Andromeda" },
  { trait: "Backpack Gear", value: "Meme Storage" },
];

const sampleNFTs = [
  {
    name: "WALDOGE Space Badge #001",
    image: "🐕",
    description: "A brave cosmic explorer doge venturing through the stars...",
  },
  {
    name: "WALDOGE Space Badge #042",
    image: "🐕",
    description: "Floating through nebulas with glowing wings of destiny...",
  },
  {
    name: "WALDOGE Space Badge #137",
    image: "🐕",
    description: "The legendary doge who mapped the meme galaxy...",
  },
];

export const NFTTab: FC<NFTTabProps> = ({
  tier,
  canUse,
  remainingUses,
  onUse,
  isWhale,
}) => {
  const [imageSource, setImageSource] = useState<ImageSource>("generate");
  const [artStyle, setArtStyle] = useState<ArtStyle>("cosmic");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("WALDOGE Space Badge #");
  const [description, setDescription] = useState(
    "A unique Space Badge from the WALDOGE collection. This cosmic explorer represents the spirit of adventure and community."
  );
  const [attributes, setAttributes] = useState(defaultAttributes);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  // Token gates temporarily disabled - features unlocked for all connected wallets
  const isLocked = false;
  const isChaosLocked = tier !== "chaos";

  const handleMint = async () => {
    if (!canUse) return;

    setIsMinting(true);
    onUse();

    // Simulate minting process
    await new Promise((r) => setTimeout(r, 3000));

    setMintSuccess(true);
    setIsMinting(false);
  };

  const updateAttribute = (index: number, field: "trait" | "value", value: string) => {
    const newAttrs = [...attributes];
    newAttrs[index] = { ...newAttrs[index], [field]: value };
    setAttributes(newAttrs);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-primary" />
          NFT Creator
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            Space Badges
          </span>
        </h2>
        {!isLocked && (
          <span className="text-xs text-muted-foreground">
            {remainingUses} mints left today
          </span>
        )}
      </div>

      {isLocked ? (
        // Locked state with samples
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">
              NFT Creator Locked
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              {tier === "none"
                ? "Connect your wallet to mint WALDOGE Space Badges"
                : "Hold WALDOGE tokens to unlock NFT minting"}
            </p>
          </motion.div>

          {/* Sample NFTs */}
          <div>
            <h3 className="font-display font-semibold mb-3">
              Sample Space Badges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleNFTs.map((nft, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-4 opacity-60"
                >
                  <div className="aspect-square bg-gradient-cosmic rounded-lg flex items-center justify-center text-6xl mb-3">
                    {nft.image}
                  </div>
                  <h4 className="font-semibold text-sm">{nft.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {nft.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : mintSuccess ? (
        // Success state
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center glow-gold"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h3 className="font-display text-xl font-semibold text-primary mb-2">
            NFT Minted Successfully!
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Your WALDOGE Space Badge is now in your wallet
          </p>

          <div className="glass-card p-4 mb-6 max-w-md mx-auto">
            <p className="text-xs text-muted-foreground mb-1">Mint Address</p>
            <p className="font-mono text-sm break-all">
              WaLd...xxxx (Simulated)
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <Button
              onClick={() => {
                setMintSuccess(false);
                setName("WALDOGE Space Badge #");
              }}
            >
              Mint Another
            </Button>
          </div>
        </motion.div>
      ) : (
        // Minting form
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Form */}
          <div className="space-y-4">
            {/* Image Source */}
            <div className="glass-card p-4">
              <Label className="mb-3 block">Image Source</Label>
              <div className="flex gap-3">
                <Button
                  variant={imageSource === "generate" ? "default" : "outline"}
                  onClick={() => setImageSource("generate")}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
                <Button
                  variant={imageSource === "upload" ? "default" : "outline"}
                  onClick={() => setImageSource("upload")}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              {imageSource === "generate" ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>Art Style</Label>
                    <Select
                      value={artStyle}
                      onValueChange={(v) => setArtStyle(v as ArtStyle)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {artStyles.map((style) => (
                          <SelectItem
                            key={style.value}
                            value={style.value}
                            disabled={style.locked && isChaosLocked}
                          >
                            {style.label}
                            {style.locked && isChaosLocked && " (Tier 2)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Generation Prompt</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your unique WALDOGE Space Badge..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* NFT Details */}
            <div className="glass-card p-4 space-y-3">
              <div>
                <Label>NFT Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            {/* Attributes */}
            <div className="glass-card p-4">
              <Label className="mb-3 block">Attributes</Label>
              <div className="space-y-2">
                {attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={attr.trait}
                      onChange={(e) => updateAttribute(i, "trait", e.target.value)}
                      placeholder="Trait"
                      className="flex-1"
                    />
                    <Input
                      value={attr.value}
                      onChange={(e) => updateAttribute(i, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Preview */}
          <div className="space-y-4">
            <div className="glass-card p-4 sticky top-24">
              <h3 className="font-semibold mb-3">Preview</h3>

              <div className="aspect-square bg-gradient-cosmic rounded-xl flex items-center justify-center text-8xl mb-4 relative overflow-hidden">
                <span className="relative z-10">🐕</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <h4 className="font-display font-semibold">{name || "Untitled"}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {attributes.slice(0, 3).map((attr, i) => (
                  <span
                    key={i}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                  >
                    {attr.trait}: {attr.value}
                  </span>
                ))}
              </div>

              {isWhale ? (
                <div className="flex items-center gap-2 text-xs text-waldoge-success mb-4">
                  <Sparkles className="w-4 h-4" />
                  🐋 Whale status! Minting fee waived
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {NFT_MINT_FEE_PERCENT}% minting fee (waived for 1%+ holders)
                </div>
              )}

              <Button
                onClick={handleMint}
                disabled={!canUse || isMinting}
                className="w-full"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mint NFT to Wallet
                  </>
                )}
              </Button>

              {isMinting && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Uploading to decentralized storage...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collection info */}
      <div className="glass-card p-4 border-primary/20">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          🏷️ WALDOGE Space Badges Collection
        </h4>
        <p className="text-xs text-muted-foreground">
          All minted NFTs are part of the official WALDOGE Space Badges
          collection. Tier 2 holders get verified collection status.
        </p>
      </div>
    </div>
  );
};
