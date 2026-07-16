import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const INFO = {
  project: "WALDOGE — Waldoge: Street of Gains",
  mascot: "Yellow Shiba Inu, red/white beanie & hoodie, pixel shades, gold chain, red gloves.",
  chain: "Solana",
  tokenMint: "D77tASqthikebejDx15MtphmZAbpU4Jxmr1JXgD2doge",
  tiers: {
    TIER_0: "0 WALDOGE — preview mode",
    TIER_1: "500,000 WALDOGE — chat + meme unlocked",
    TIER_2: "1,000,000 WALDOGE — Chaos Mode unlocked",
    WHALE: "10,000,000 WALDOGE — NFT mint fee waived (1% of supply)",
  },
  features: [
    "Bark Zero — AI personality with Constitution, Memory, Diary, Dreams",
    "Launch Lab — token concept ideation (owner-approved launches only)",
    "Street Brawler — canvas beat-em-up with fight styles",
    "Where's Waldoge — 6-level hidden object game",
    "AI meme + raid reply generators",
  ],
  siteAI: "Bark Zero: dry British crypto/culture personality. Slogan: 'Respect the craft.'",
  disclaimer: "No financial advice. Nothing here is a promise of returns.",
};

export default defineTool({
  name: "waldoge_info",
  title: "Waldoge project info",
  description: "Return public info about the Waldoge project: mascot, chain, token mint, tier thresholds, and feature list.",
  inputSchema: {
    topic: z
      .string()
      .describe("Optional topic to focus on: 'tiers', 'features', 'mascot', 'token'. Empty string returns everything.")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ topic }) => {
    const t = (topic ?? "").toLowerCase().trim();
    const pick =
      t === "tiers" ? { tiers: INFO.tiers } :
      t === "features" ? { features: INFO.features } :
      t === "mascot" ? { mascot: INFO.mascot } :
      t === "token" ? { chain: INFO.chain, tokenMint: INFO.tokenMint } :
      INFO;
    return {
      content: [{ type: "text", text: JSON.stringify(pick, null, 2) }],
      structuredContent: pick,
    };
  },
});
