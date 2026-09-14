/**
 * LEVEL 5 — THE GRAVEYARD OF GAINS.
 * Deterministic reconstruction of the approved five-section blueprint.
 * Presentation only: collision and encounters remain in config/world.ts.
 */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor } from "@/game/config/world";
import monkoPosterAsset from "@/assets/monko-lost-bananas-poster.png.asset.json";
import monkoPosterLocal from "@/assets/monko-lost-bananas-poster-local.png";
import exitAtlasAsset from "@/assets/exit-liquidity-atlas.png.asset.json";
import exitAtlasLocal from "@/assets/exit-liquidity-atlas-local.png";
import { flicker, renderNow } from "./clock";

export const EXIT_LIQUIDITY_LEVEL = 4;
export const EXIT_SECTION_WIDTH = 1800;
export const EXIT_SECTIONS = [
  "DEAD COIN CEMETERY",
  "LIQUIDATION STREET",
  "THE DEAD EXCHANGE",
  "THE LIQUIDITY VAULT",
  "EXIT LIQUIDITY'S DOMAIN",
] as const;

export const MONKO_POSTER_WORDING = [
  "LOST BANANAS",
  "MONKO",
  "IF FOUND CONTACT",
  "ADDRESS ENDS IN DOGE",
] as const;

export const EXIT_LANDMARKS = [
  "CEMETERY GATE", "RIP 99.9%", "BROKEN ATM", "PROJECT DEAD",
  "LIQUIDATED", "POSITION CLOSED", "ACCOUNT BALANCE £0.00", "MARGIN CALL",
  "DEAD EXCHANGE", "DEAD MONITORS", "EXCHANGE SERVER RACKS", "STACKED EXCHANGE DECKS",
  "LIQUIDITY IN", "VAULT DOOR", "LIQUIDITY OUT", "NO REFUNDS",
  "THANK YOU FOR YOUR CONTRIBUTION", "MONKO'S BANANAS", "LOST BANANAS POSTER",
  "WELCOME TO YOUR EXIT", "ALL TRADERS END HERE", "EXIT LIQUIDITY CATHEDRAL",
] as const;

export const EXIT_VISUAL_DECK_IDS = [
  "cemetery-west", "cemetery-east",
  "liquidation-west", "liquidation-east",
  "exchange-lower-west", "exchange-upper-west", "exchange-lower-east", "exchange-upper-east",
  "vault-west", "vault-upper", "vault-east",
  "domain-west", "domain-east",
] as const;

export interface BlueprintLandmark {
  id: string;
  section: number;
  x0: number;
  x1: number;
  layer: "background" | "gameplay" | "foreground";
  collision: boolean;
  ladderConnection?: string;
  encounter?: number;
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

interface SkylineBlock { x: number; w: number; h: number; spire: boolean }
interface ExitWorld { width: number; skyline: SkylineBlock[] }

let worldCache: ExitWorld | null = null;
let posterImage: HTMLImageElement | null = null;
let posterReady = false;
let exitImage: HTMLImageElement | null = null;
let exitReady = false;

function loadImage(src: string, ready: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const image = new Image();
  image.onload = ready;
  image.src = src;
  return image;
}

export function preloadExitLiquidityTerritory(): void {
  if (!posterImage) posterImage = loadImage(monkoPosterLocal, () => { posterReady = true; });
  if (!exitImage) exitImage = loadImage(exitAtlasLocal, () => { exitReady = true; });
}

preloadExitLiquidityTerritory();

export function exitLiquidityTerritoryFor(level: number): ExitWorld | null {
  if (level !== EXIT_LIQUIDITY_LEVEL) return null;
  const width = getLevelWidth(level);
  if (worldCache?.width === width) return worldCache;
  const skyline: SkylineBlock[] = [];
  for (let x = -220, i = 0; x < width + 420; i += 1) {
    const w = 88 + ((i * 53) % 120);
    skyline.push({ x, w, h: 155 + ((i * 79) % 190), spire: i % 3 === 0 });
    x += w + 10 + ((i * 19) % 24);
  }
  worldCache = { width, skyline };
  return worldCache;
}

export function hasExitLiquidityTerritory(level: number): boolean {
  return level === EXIT_LIQUIDITY_LEVEL;
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = "#101923", stroke = "#566677") {
  ctx.fillStyle = "#05080d"; ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}

function sign(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], yellow = false) {
  panel(ctx, x, y, w, h, yellow ? "#c7b92a" : "#711b25", yellow ? "#f6e653" : "#ef4352");
  ctx.fillStyle = yellow ? "#12150d" : "#ffd8c6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const fs = Math.max(10, Math.min(25, Math.floor(h / (lines.length + 1))));
  ctx.font = `900 ${fs}px Impact, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * ((i + 1) / (lines.length + 1)), w - 12));
}

function gothicBuilding(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, red = false) {
  const top = GROUND_Y - h;
  panel(ctx, x, top, w, h, red ? "#251119" : "#101a27", red ? "#782532" : "#40566b");
  ctx.fillStyle = red ? "#481522" : "#16283a";
  for (let wx = x + 20; wx < x + w - 14; wx += 52) {
    ctx.beginPath(); ctx.moveTo(wx, top + 62); ctx.lineTo(wx + 13, top + 42); ctx.lineTo(wx + 26, top + 62); ctx.lineTo(wx + 26, top + 104); ctx.lineTo(wx, top + 104); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = red ? "#9b3340" : "#344d64"; ctx.lineWidth = 5;
  for (let bx = x + 12; bx < x + w; bx += 74) { ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx, GROUND_Y); ctx.stroke(); }
}

function scaffold(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, red = false) {
  ctx.strokeStyle = red ? "#71242c" : "#455460"; ctx.lineWidth = 4;
  for (let xx = x; xx <= x + w; xx += 56) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
  ctx.lineWidth = 2;
  for (let yy = y; yy <= y + h; yy += 40) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
  for (let xx = x; xx < x + w; xx += 56) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(Math.min(x + w, xx + 56), y + 40); ctx.stroke(); }
}

function deckArchitecture(ctx: CanvasRenderingContext2D, section: number) {
  const start = section * EXIT_SECTION_WIDTH;
  for (const deck of landingDecksFor(EXIT_LIQUIDITY_LEVEL)) {
    if (deck.x1 < start || deck.x0 > start + EXIT_SECTION_WIDTH) continue;
    ctx.fillStyle = "#7b6031"; ctx.fillRect(deck.x0, deck.y - 5, deck.x1 - deck.x0, 10);
    ctx.strokeStyle = "#b08b45"; ctx.lineWidth = 2; ctx.strokeRect(deck.x0, deck.y - 5, deck.x1 - deck.x0, 10);
    scaffold(ctx, deck.x0, deck.y + 6, deck.x1 - deck.x0, GROUND_Y - deck.y - 6, section === 4);
    ctx.strokeStyle = "#71808a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(deck.x0, deck.y - 32); ctx.lineTo(deck.x1, deck.y - 32); ctx.stroke();
    for (let px = deck.x0; px <= deck.x1; px += 42) { ctx.beginPath(); ctx.moveTo(px, deck.y - 32); ctx.lineTo(px, deck.y - 7); ctx.stroke(); }
  }
}

function candle(ctx: CanvasRenderingContext2D, x: number, y = GROUND_Y) {
  ctx.fillStyle = "#e0cda4"; ctx.fillRect(x - 3, y - 15, 6, 15);
  const a = 0.6 + flicker(x, 0.004) * 0.35;
  ctx.fillStyle = `rgba(255,151,45,${a})`; ctx.beginPath(); ctx.ellipse(x, y - 19, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
}

function tomb(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string) {
  ctx.fillStyle = "#434b54"; ctx.beginPath(); ctx.roundRect(x, y, w, h, [w / 2, w / 2, 3, 3]); ctx.fill();
  ctx.strokeStyle = "#7b8790"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#c7cbd0"; ctx.font = `900 ${Math.min(22, w / 4)}px Impact`; ctx.textAlign = "center";
  label.split("|").forEach((line, i) => ctx.fillText(line, x + w / 2, y + 40 + i * 24, w - 12));
}

function atm(ctx: CanvasRenderingContext2D, x: number) {
  panel(ctx, x, 202, 76, 118, "#293a46", "#708694");
  ctx.fillStyle = "#07151d"; ctx.fillRect(x + 12, 218, 52, 31); ctx.fillStyle = "#29c6c2"; ctx.fillRect(x + 19, 228, 36, 3);
  ctx.fillStyle = "#10161b"; ctx.fillRect(x + 18, 271, 40, 6); ctx.strokeStyle = "#a14a3b"; ctx.beginPath(); ctx.moveTo(x + 4, 214); ctx.lineTo(x + 68, 302); ctx.stroke();
}

function monitorBank(ctx: CanvasRenderingContext2D, x: number, count: number) {
  for (let i = 0; i < count; i += 1) {
    const mx = x + i * 62; panel(ctx, mx, 245, 54, 40, "#071018", "#3b5565");
    ctx.strokeStyle = i % 2 ? "#e93445" : "#2ad1d0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx + 6, 268); ctx.lineTo(mx + 18, 256); ctx.lineTo(mx + 29, 273); ctx.lineTo(mx + 47, 251); ctx.stroke();
    ctx.fillStyle = "#38434a"; ctx.fillRect(mx + 24, 285, 6, 14);
  }
  ctx.fillStyle = "#354049"; ctx.fillRect(x - 8, 298, count * 62, 10);
}

function pipes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, green = false) {
  ctx.strokeStyle = green ? "#496c55" : "#4b5962"; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.strokeStyle = green ? "#a5ba55" : "#9b6b31"; ctx.lineWidth = 2;
  for (let px = x + 28; px < x + w; px += 76) ctx.strokeRect(px, y - 6, 10, 12);
}

function vaultDoor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "#283f38"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#78946f"; ctx.lineWidth = 9; ctx.stroke(); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); ctx.lineTo(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58); ctx.stroke(); }
  ctx.fillStyle = "#b5a42b"; ctx.font = "900 25px Impact"; ctx.textAlign = "center"; ctx.fillText("LQ", x, y + 8);
}

function bananaVault(ctx: CanvasRenderingContext2D, x: number) {
  panel(ctx, x, 190, 300, 130, "#203f36", "#90a835"); sign(ctx, x + 48, 199, 204, 34, ["MONKO'S BANANAS"], true);
  ctx.fillStyle = "#f2cf2f";
  for (let row = 0; row < 2; row += 1) for (let i = 0; i < 7; i += 1) {
    const bx = x + 44 + i * 31 + (row % 2) * 8; const by = 258 + row * 27;
    ctx.beginPath(); ctx.arc(bx, by, 13, 0.15, Math.PI * 1.1); ctx.lineWidth = 6; ctx.strokeStyle = "#f2cf2f"; ctx.stroke();
  }
  ctx.strokeStyle = "#758f79"; ctx.lineWidth = 4; for (let bx = x + 18; bx < x + 290; bx += 38) { ctx.beginPath(); ctx.moveTo(bx, 238); ctx.lineTo(bx, 316); ctx.stroke(); }
}

function monkoPoster(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  if (!posterImage || (!posterReady && (!posterImage.complete || posterImage.naturalWidth === 0))) return;
  const w = h * (2 / 3);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 9; ctx.drawImage(posterImage, x, y, w, h); ctx.restore();
}

function exitPresentation(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  panel(ctx, x - 116, y - 18, 232, h + 30, "#250e18", "#882b39");
  if (!exitImage || (!exitReady && (!exitImage.complete || exitImage.naturalWidth === 0))) return;
  const f = { x: 66, y: 0, w: 168, h: 267 };
  const scale = h / f.h;
  ctx.drawImage(exitImage, f.x, f.y, f.w, f.h, x - f.w * scale / 2, y, f.w * scale, h);
}

function drawCemetery(ctx: CanvasRenderingContext2D, x: number) {
  gothicBuilding(ctx, x + 20, 210, 266); sign(ctx, x + 35, 80, 176, 52, ["DEAD COIN", "CEMETERY"]);
  ctx.strokeStyle = "#65717a"; ctx.lineWidth = 8; ctx.strokeRect(x + 20, 105, 210, 215);
  tomb(ctx, x + 270, 142, 150, 178, "RIP|99.9%"); tomb(ctx, x + 460, 194, 100, 126, "PROJECT|DEAD"); atm(ctx, x + 590);
  gothicBuilding(ctx, x + 720, 310, 228); scaffold(ctx, x + 680, 86, 420, 234);
  tomb(ctx, x + 1130, 166, 128, 154, "LIQUIDITY|REMOVED"); monitorBank(ctx, x + 1285, 5);
  tomb(ctx, x + 1590, 202, 92, 118, "DEAD|DREAMS");
  for (const cx of [250, 440, 575, 1085, 1270, 1530, 1720]) candle(ctx, x + cx);
}

function drawLiquidation(ctx: CanvasRenderingContext2D, x: number) {
  gothicBuilding(ctx, x + 20, 510, 285); sign(ctx, x + 105, 94, 350, 142, ["LIQUIDATED", "POSITION CLOSED", "ACCOUNT BALANCE: £0.00", "MARGIN CALL"]);
  monitorBank(ctx, x + 560, 7); scaffold(ctx, x + 520, 70, 520, 250);
  gothicBuilding(ctx, x + 1080, 360, 235); monitorBank(ctx, x + 1130, 5); sign(ctx, x + 1450, 112, 300, 92, ["MARGIN CALL", "FINAL NOTICE"]);
  pipes(ctx, x + 30, 78, 1710);
}

function drawExchange(ctx: CanvasRenderingContext2D, x: number) {
  gothicBuilding(ctx, x + 10, 520, 292); sign(ctx, x + 130, 88, 330, 116, ["DEAD", "EXCHANGE"]);
  monitorBank(ctx, x + 560, 8); gothicBuilding(ctx, x + 1020, 420, 250);
  for (let rx = x + 1050; rx < x + 1400; rx += 72) { panel(ctx, rx, 172, 58, 142, "#121d26"); for (let yy = 185; yy < 300; yy += 18) { ctx.fillStyle = yy % 36 ? "#b83240" : "#2b8990"; ctx.fillRect(rx + 9, yy, 40, 5); } }
  scaffold(ctx, x + 520, 48, 930, 272); vaultDoor(ctx, x + 1610, 225, 94);
}

function drawVault(ctx: CanvasRenderingContext2D, x: number) {
  gothicBuilding(ctx, x + 10, 1780, 286); pipes(ctx, x + 10, 74, 1770, true); pipes(ctx, x + 10, 105, 1770, true);
  sign(ctx, x + 50, 118, 230, 52, ["LIQUIDITY IN"], true); vaultDoor(ctx, x + 700, 207, 112); sign(ctx, x + 1100, 118, 230, 52, ["LIQUIDITY OUT"], true);
  sign(ctx, x + 90, 246, 230, 48, ["NO REFUNDS"], true); sign(ctx, x + 1000, 238, 330, 60, ["THANK YOU FOR", "YOUR CONTRIBUTION"], true);
  bananaVault(ctx, x + 1370); monkoPoster(ctx, x + 1680, 112, 188);
}

function drawDomain(ctx: CanvasRenderingContext2D, x: number) {
  gothicBuilding(ctx, x + 10, 390, 274, true); sign(ctx, x + 60, 120, 280, 92, ["WELCOME TO", "YOUR EXIT"]);
  scaffold(ctx, x + 390, 62, 350, 258, true); gothicBuilding(ctx, x + 730, 1020, 305, true);
  for (const px of [760, 940, 1370, 1550]) { ctx.strokeStyle = "#762632"; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(x + px, 48); ctx.lineTo(x + px, GROUND_Y); ctx.stroke(); }
  sign(ctx, x + 780, 214, 210, 72, ["ALL TRADERS", "END HERE"]); sign(ctx, x + 1490, 214, 220, 72, ["EVERY EXIT", "WAS PLANNED"]);
  exitPresentation(ctx, x + 1240, 55, 248);
  for (const cx of [780, 900, 1570, 1700]) candle(ctx, x + cx);
}

function drawSky(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, world: ExitWorld) {
  const grad = ctx.createLinearGradient(0, -220, 0, GROUND_Y);
  grad.addColorStop(0, "#020711"); grad.addColorStop(0.55, "#0a1830"); grad.addColorStop(1, "#34202b");
  ctx.fillStyle = grad; ctx.fillRect(0, -240, canvasW, GROUND_Y + 560);
  const moonX = 126 - ((camX * 0.03) % 1000); ctx.fillStyle = "rgba(213,226,236,.78)"; ctx.beginPath(); ctx.arc(moonX, 62, 35, 0, Math.PI * 2); ctx.fill();
  const off = camX * 0.13;
  for (const b of world.skyline) {
    const bx = b.x - off; if (bx + b.w < -40 || bx > canvasW + 40) continue;
    ctx.fillStyle = b.spire ? "#070d17" : "#0b1421"; ctx.fillRect(bx, GROUND_Y - b.h, b.w, b.h);
    if (b.spire) { ctx.beginPath(); ctx.moveTo(bx, GROUND_Y - b.h); ctx.lineTo(bx + b.w / 2, GROUND_Y - b.h - 68); ctx.lineTo(bx + b.w, GROUND_Y - b.h); ctx.fill(); }
    ctx.fillStyle = "rgba(184,48,55,.25)"; for (let wx = bx + 16; wx < bx + b.w - 8; wx += 28) ctx.fillRect(wx, GROUND_Y - b.h + 28, 7, 4);
  }
  const fog = 0.055 + Math.sin(renderNow() / 1600) * 0.015; ctx.fillStyle = `rgba(130,185,191,${fog})`; ctx.fillRect(0, 210, canvasW, 110);
}

function drawSection(ctx: CanvasRenderingContext2D, index: number, x: number) {
  deckArchitecture(ctx, index);
  if (index === 0) drawCemetery(ctx, x);
  else if (index === 1) drawLiquidation(ctx, x);
  else if (index === 2) drawExchange(ctx, x);
  else if (index === 3) drawVault(ctx, x);
  else drawDomain(ctx, x);
}

export function drawExitLiquidityTerritory(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  const world = exitLiquidityTerritoryFor(level); if (!world) return;
  drawSky(ctx, camX, canvasW, world);
  ctx.save(); ctx.translate(-camX, 0);
  const first = Math.max(0, Math.floor(camX / EXIT_SECTION_WIDTH));
  const last = Math.min(EXIT_SECTIONS.length - 1, Math.floor((camX + canvasW) / EXIT_SECTION_WIDTH));
  for (let i = first; i <= last; i += 1) drawSection(ctx, i, i * EXIT_SECTION_WIDTH);
  ctx.restore();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 300); floor.addColorStop(0, "#18212a"); floor.addColorStop(1, "#030509");
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND_Y, canvasW, 300); ctx.fillStyle = "#59636a"; ctx.fillRect(0, GROUND_Y - 4, canvasW, 4);
}

export function exitLiquiditySectionLabelAt(level: number, x: number): string | null {
  if (level !== EXIT_LIQUIDITY_LEVEL) return null;
  const i = Math.max(0, Math.min(EXIT_SECTIONS.length - 1, Math.floor(x / EXIT_SECTION_WIDTH)));
  return EXIT_SECTIONS[i];
}

export const __exitLiquidityTerritoryTest = {
  posterUrl: monkoPosterAsset.url,
  bundledPosterUrl: monkoPosterLocal,
  atlasUrl: exitAtlasAsset.url,
  bundledAtlasUrl: exitAtlasLocal,
  posterWording: MONKO_POSTER_WORDING,
  visualDeckIds: EXIT_VISUAL_DECK_IDS,
  blueprintMap: EXIT_BLUEPRINT_MAP,
  posterReady: () => Boolean(posterImage?.complete && posterImage.naturalWidth > 0),
};