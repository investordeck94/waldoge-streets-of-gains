/**
 * LEVEL 5 — THE GRAVEYARD OF GAINS.
 * Painted visual reconstruction of the approved five-section blueprint.
 * Presentation only: collision, encounters, ladders and progression remain in config/world.ts.
 */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor, laddersFor } from "@/game/config/world";
import monkoPosterAsset from "@/assets/monko-lost-bananas-poster.png.asset.json";
import monkoPosterLocal from "@/assets/monko-lost-bananas-poster-local.png";
import exitAtlasAsset from "@/assets/exit-liquidity-atlas.png.asset.json";
import exitAtlasLocal from "@/assets/exit-liquidity-atlas-local.png";
import cemeteryAsset from "@/assets/level5-cemetery.jpg.asset.json";
import liquidationAsset from "@/assets/level5-liquidation-street.jpg.asset.json";
import exchangeAsset from "@/assets/level5-dead-exchange.jpg.asset.json";
import vaultAsset from "@/assets/level5-liquidity-vault.jpg.asset.json";
import domainAsset from "@/assets/level5-exit-domain.jpg.asset.json";
import { flicker, renderNow } from "./clock";

export const EXIT_LIQUIDITY_LEVEL = 4;
export const EXIT_SECTION_WIDTH = 1800;
export const EXIT_SECTIONS = [
  "DEAD COIN CEMETERY", "LIQUIDATION STREET", "THE DEAD EXCHANGE",
  "THE LIQUIDITY VAULT", "EXIT LIQUIDITY'S DOMAIN",
] as const;

export const MONKO_POSTER_WORDING = ["LOST BANANAS", "MONKO", "IF FOUND CONTACT", "ADDRESS ENDS IN DOGE"] as const;
export const EXIT_LANDMARKS = [
  "CEMETERY GATE", "RIP 99.9%", "BROKEN ATM", "PROJECT DEAD",
  "LIQUIDATED", "POSITION CLOSED", "ACCOUNT BALANCE £0.00", "MARGIN CALL",
  "DEAD EXCHANGE", "DEAD MONITORS", "EXCHANGE SERVER RACKS", "STACKED EXCHANGE DECKS",
  "LIQUIDITY IN", "VAULT DOOR", "LIQUIDITY OUT", "NO REFUNDS",
  "THANK YOU FOR YOUR CONTRIBUTION", "MONKO'S BANANAS", "LOST BANANAS POSTER",
  "WELCOME TO YOUR EXIT", "ALL TRADERS END HERE", "EXIT LIQUIDITY CATHEDRAL",
] as const;
export const EXIT_VISUAL_DECK_IDS = [
  "cemetery-west", "cemetery-east", "liquidation-west", "liquidation-east",
  "exchange-lower-west", "exchange-upper-west", "exchange-lower-east", "exchange-upper-east",
  "vault-west", "vault-upper", "vault-east", "domain-west", "domain-east",
] as const;

export interface BlueprintLandmark {
  id: string; section: number; x0: number; x1: number;
  layer: "background" | "gameplay" | "foreground"; collision: boolean;
  ladderConnection?: string; encounter?: number;
}
export const EXIT_BLUEPRINT_MAP: readonly BlueprintLandmark[] = [
  { id: "cemetery-gate", section: 0, x0: 30, x1: 260, layer: "gameplay", collision: false },
  { id: "crypto-tombs", section: 0, x0: 250, x1: 1050, layer: "gameplay", collision: false, encounter: 900 },
  { id: "cemetery-decks", section: 0, x0: 620, x1: 1700, layer: "gameplay", collision: true, ladderConnection: "cemetery-west/east" },
  { id: "liquidated-building", section: 1, x0: 1840, x1: 2460, layer: "gameplay", collision: false },
  { id: "liquidation-catwalks", section: 1, x0: 2200, x1: 3440, layer: "gameplay", collision: true, ladderConnection: "liquidation-west/east", encounter: 2700 },
  { id: "dead-exchange", section: 2, x0: 3600, x1: 4260, layer: "gameplay", collision: false },
  { id: "exchange-stacks", section: 2, x0: 4000, x1: 5260, layer: "gameplay", collision: true, ladderConnection: "exchange-lower/upper", encounter: 4500 },
  { id: "liquidity-vault", section: 3, x0: 5400, x1: 6400, layer: "gameplay", collision: false },
  { id: "vault-walkways", section: 3, x0: 5520, x1: 7040, layer: "gameplay", collision: true, ladderConnection: "vault-west/upper/east", encounter: 6300 },
  { id: "monko-banana-vault", section: 3, x0: 6430, x1: 6810, layer: "gameplay", collision: false },
  { id: "monko-poster", section: 3, x0: 6840, x1: 6980, layer: "foreground", collision: false },
  { id: "domain-gateway", section: 4, x0: 7200, x1: 7700, layer: "gameplay", collision: false, encounter: 7650 },
  { id: "exit-cathedral", section: 4, x0: 7750, x1: 9000, layer: "gameplay", collision: false },
  { id: "boss-arena", section: 4, x0: 8100, x1: 9000, layer: "gameplay", collision: false },
] as const;

interface ExitWorld { width: number }
const sectionAssets = [cemeteryAsset, liquidationAsset, exchangeAsset, vaultAsset, domainAsset] as const;
let worldCache: ExitWorld | null = null;
let posterImage: HTMLImageElement | null = null;
let exitImage: HTMLImageElement | null = null;
let posterReady = false;
let exitReady = false;
const sectionImages: Array<HTMLImageElement | null> = [null, null, null, null, null];
const sectionReady = [false, false, false, false, false];

function loadImage(src: string, ready: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const image = new Image();
  image.decoding = "sync";
  image.onload = ready;
  image.src = src;
  return image;
}

export function preloadExitLiquidityTerritory(): void {
  if (!posterImage) posterImage = loadImage(monkoPosterLocal, () => { posterReady = true; });
  if (!exitImage) exitImage = loadImage(exitAtlasLocal, () => { exitReady = true; });
  sectionAssets.forEach((asset, index) => {
    if (!sectionImages[index]) sectionImages[index] = loadImage(asset.url, () => { sectionReady[index] = true; });
  });
}
preloadExitLiquidityTerritory();

export function exitLiquidityTerritoryFor(level: number): ExitWorld | null {
  if (level !== EXIT_LIQUIDITY_LEVEL) return null;
  const width = getLevelWidth(level);
  if (worldCache?.width === width) return worldCache;
  worldCache = { width };
  return worldCache;
}
export function hasExitLiquidityTerritory(level: number): boolean { return level === EXIT_LIQUIDITY_LEVEL; }

function drawPaintedSection(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  const image = sectionImages[index];
  if (!image || (!sectionReady[index] && (!image.complete || image.naturalWidth === 0))) return;
  // The source's painted street line is aligned exactly to the canonical floor.
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight * 0.88, x, -18, EXIT_SECTION_WIDTH, GROUND_Y + 18);
}

function plaque(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], gold = false): void {
  ctx.save();
  ctx.shadowColor = gold ? "rgba(224,191,64,.7)" : "rgba(239,43,58,.75)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = gold ? "#cfbb36" : "#6f111c";
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = gold ? "#f4df63" : "#ef3c49";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = gold ? "#11170e" : "#ffe0cf";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const size = Math.max(12, Math.min(34, Math.floor(h / (lines.length + 0.7))));
  ctx.font = `900 ${size}px Impact, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * ((i + 1) / (lines.length + 1)), w - 16));
  ctx.restore();
}

function candle(ctx: CanvasRenderingContext2D, x: number, y = GROUND_Y): void {
  ctx.fillStyle = "#e5d3ad"; ctx.fillRect(x - 3, y - 14, 6, 14);
  const a = 0.62 + flicker(x, 0.004) * 0.34;
  ctx.shadowColor = `rgba(255,126,35,${a})`; ctx.shadowBlur = 12;
  ctx.fillStyle = `rgba(255,158,49,${a})`; ctx.beginPath(); ctx.ellipse(x, y - 19, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawIntegratedDecks(ctx: CanvasRenderingContext2D, section: number): void {
  const start = section * EXIT_SECTION_WIDTH;
  const accent = section === 3 ? "#82a35c" : section === 4 ? "#963141" : "#9a814d";
  for (const deck of landingDecksFor(EXIT_LIQUIDITY_LEVEL)) {
    if (deck.x1 < start || deck.x0 > start + EXIT_SECTION_WIDTH) continue;
    const w = deck.x1 - deck.x0;
    ctx.fillStyle = "#15191d"; ctx.fillRect(deck.x0, deck.y - 9, w, 12);
    ctx.fillStyle = accent; ctx.fillRect(deck.x0, deck.y - 9, w, 3);
    ctx.strokeStyle = "#4b4f50"; ctx.lineWidth = 4;
    for (let px = deck.x0 + 12; px < deck.x1; px += 48) {
      ctx.beginPath(); ctx.moveTo(px, deck.y + 3); ctx.lineTo(px + 22, Math.min(GROUND_Y - 2, deck.y + 34)); ctx.stroke();
    }
  }
  ctx.strokeStyle = section === 3 ? "#b9a747" : "#bb7638"; ctx.lineWidth = 5;
  for (const ladder of laddersFor(EXIT_LIQUIDITY_LEVEL)) {
    if (ladder.x < start || ladder.x >= start + EXIT_SECTION_WIDTH) continue;
    const top = Math.min(ladder.top, ladder.bottom); const bottom = Math.max(ladder.top, ladder.bottom); const lx = ladder.x;
    ctx.beginPath(); ctx.moveTo(lx - 10, top); ctx.lineTo(lx - 10, bottom); ctx.moveTo(lx + 10, top); ctx.lineTo(lx + 10, bottom); ctx.stroke();
    ctx.lineWidth = 3;
    for (let y = top + 8; y < bottom; y += 16) { ctx.beginPath(); ctx.moveTo(lx - 10, y); ctx.lineTo(lx + 10, y); ctx.stroke(); }
    ctx.lineWidth = 5;
  }
}

function monkoPoster(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  if (!posterImage || (!posterReady && (!posterImage.complete || posterImage.naturalWidth === 0))) return;
  const w = h * (2 / 3);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = 10; ctx.drawImage(posterImage, x, y, w, h); ctx.restore();
}
function exitPresentation(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  if (!exitImage || (!exitReady && (!exitImage.complete || exitImage.naturalWidth === 0))) return;
  const f = { x: 66, y: 0, w: 168, h: 267 }; const scale = h / f.h;
  ctx.save(); ctx.shadowColor = "rgba(35,225,229,.65)"; ctx.shadowBlur = 24;
  ctx.drawImage(exitImage, f.x, f.y, f.w, f.h, x - f.w * scale / 2, y, f.w * scale, h); ctx.restore();
}

function drawLandmarks(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  if (index === 0) {
    plaque(ctx, x + 42, 54, 230, 54, ["DEAD COIN CEMETERY"]);
    plaque(ctx, x + 435, 160, 160, 112, ["RIP", "99.9%"]);
    plaque(ctx, x + 1440, 202, 140, 78, ["PROJECT", "DEAD"]);
    for (const p of [320, 410, 610, 740, 990, 1210, 1480, 1700]) candle(ctx, x + p);
  } else if (index === 1) {
    plaque(ctx, x + 110, 50, 590, 165, ["LIQUIDATED", "POSITION CLOSED", "ACCOUNT BALANCE: £0.00", "MARGIN CALL"]);
    plaque(ctx, x + 1390, 92, 330, 82, ["MARGIN CALL", "FINAL NOTICE"]);
  } else if (index === 2) {
    plaque(ctx, x + 650, 48, 500, 126, ["DEAD", "EXCHANGE"]);
    for (const p of [90, 360, 690, 1110, 1460, 1710]) candle(ctx, x + p);
  } else if (index === 3) {
    plaque(ctx, x + 85, 54, 250, 52, ["LIQUIDITY IN"], true);
    plaque(ctx, x + 1060, 54, 260, 52, ["LIQUIDITY OUT"], true);
    plaque(ctx, x + 100, 218, 230, 50, ["NO REFUNDS"], true);
    plaque(ctx, x + 1010, 205, 340, 66, ["THANK YOU FOR", "YOUR CONTRIBUTION"], true);
    plaque(ctx, x + 1390, 164, 250, 54, ["MONKO'S BANANAS"], true);
    monkoPoster(ctx, x + 1645, 105, 202);
  } else {
    plaque(ctx, x + 70, 126, 260, 72, ["WELCOME TO", "YOUR EXIT"]);
    plaque(ctx, x + 1430, 180, 270, 72, ["ALL TRADERS", "END HERE"]);
    exitPresentation(ctx, x + 900, 42, 268);
    for (const p of [520, 630, 745, 1055, 1170, 1280]) candle(ctx, x + p);
  }
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  const glow = ctx.createLinearGradient(x, 0, x + EXIT_SECTION_WIDTH, GROUND_Y);
  const tint = index === 0 ? "rgba(68,112,170,.11)" : index === 3 ? "rgba(39,198,145,.09)" : "rgba(172,23,37,.09)";
  glow.addColorStop(0, "rgba(0,0,0,.05)"); glow.addColorStop(.5, tint); glow.addColorStop(1, "rgba(0,0,0,.12)");
  ctx.fillStyle = glow; ctx.fillRect(x, -20, EXIT_SECTION_WIDTH, GROUND_Y + 20);
  const fog = 0.04 + Math.sin(renderNow() / 1700 + index) * 0.014;
  ctx.fillStyle = `rgba(170,202,207,${fog})`; ctx.fillRect(x, GROUND_Y - 70, EXIT_SECTION_WIDTH, 70);
}

function drawSection(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  drawPaintedSection(ctx, index, x);
  drawAtmosphere(ctx, index, x);
  drawIntegratedDecks(ctx, index);
  drawLandmarks(ctx, index, x);
}

export function drawExitLiquidityTerritory(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  const world = exitLiquidityTerritoryFor(level); if (!world) return;
  ctx.fillStyle = "#03070d"; ctx.fillRect(0, -260, canvasW, GROUND_Y + 580);
  ctx.save(); ctx.translate(-camX, 0);
  const first = Math.max(0, Math.floor(camX / EXIT_SECTION_WIDTH));
  const last = Math.min(EXIT_SECTIONS.length - 1, Math.floor((camX + canvasW) / EXIT_SECTION_WIDTH));
  for (let i = first; i <= last; i += 1) drawSection(ctx, i, i * EXIT_SECTION_WIDTH);
  ctx.restore();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 300);
  floor.addColorStop(0, "#151a1e"); floor.addColorStop(1, "#020407");
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND_Y, canvasW, 300);
  ctx.fillStyle = "#666c6d"; ctx.fillRect(0, GROUND_Y - 3, canvasW, 3);
}

export function exitLiquiditySectionLabelAt(level: number, x: number): string | null {
  if (level !== EXIT_LIQUIDITY_LEVEL) return null;
  return EXIT_SECTIONS[Math.max(0, Math.min(EXIT_SECTIONS.length - 1, Math.floor(x / EXIT_SECTION_WIDTH)))];
}

export const __exitLiquidityTerritoryTest = {
  posterUrl: monkoPosterAsset.url,
  bundledPosterUrl: monkoPosterLocal,
  atlasUrl: exitAtlasAsset.url,
  bundledAtlasUrl: exitAtlasLocal,
  sectionArtUrls: sectionAssets.map((asset) => asset.url),
  posterWording: MONKO_POSTER_WORDING,
  visualDeckIds: EXIT_VISUAL_DECK_IDS,
  blueprintMap: EXIT_BLUEPRINT_MAP,
  posterReady: () => Boolean(posterImage?.complete && posterImage.naturalWidth > 0),
  sectionArtReady: () => sectionReady.every(Boolean),
};
