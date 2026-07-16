import { defineMcp } from "@lovable.dev/mcp-js";
import barkZeroAsk from "./tools/bark-zero-chat";
import launchLabConcept from "./tools/launch-lab-concept";
import marketScan from "./tools/market-scan";
import waldogeInfo from "./tools/waldoge-info";

export default defineMcp({
  name: "waldoge-mcp",
  title: "Waldoge / Bark Zero",
  version: "0.1.0",
  instructions:
    "Public MCP server for the Waldoge project. Use `bark_zero_ask` to talk to Bark Zero (dry British crypto AI persona), `launch_lab_concept` to draft token IDEAS only (no launches — owner-approved in-app), `market_scan` for AI-estimated narrative rankings, and `waldoge_info` for public project info (tiers, mascot, token mint).",
  tools: [barkZeroAsk, launchLabConcept, marketScan, waldogeInfo],
});
