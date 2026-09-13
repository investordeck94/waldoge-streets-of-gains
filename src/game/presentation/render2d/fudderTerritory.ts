/**
 * LEVEL 4 — FUDDER TERRITORY.
 * Deterministic reconstruction of the approved five-section blueprint.
 * Presentation only: collision remains exclusively in world.ts.
 */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor } from "@/game/config/world";
import fudderAtlas from "@/assets/fudder-atlas.png.asset.json";
import waldogeHeadUrl from "@/assets/waldoge-head.png";
import { flicker } from "./clock";

export const FUDDER_TERRITORY_LEVEL = 3;
export const FUDDER_SECTION_WIDTH = 1800;
export const FUDDER_SECTIONS = [
  "ENTRANCE — PROPAGANDA STREET",
  "MEDIA DISTRICT",
  "INDUSTRIAL COMPLEX",
  "PROPAGANDA FACTORY",
  "BOSS ARENA — FUDDER",
] as const;

export const FUDDER_LANDMARKS = [
  "ENTRANCE FRAME",
  "FUDDER CONTROLS THE NARRATIVE",
  "INFORMATION CONTROLS EVERYTHING",
  "FUDDER NEWS",
  "FUDDER NEWS ALWAYS RIGHT",
  "SAME STORY DIFFERENT DAY",
  "MANUFACTURED OPINIONS DISTRIBUTED WORLDWIDE",
  "LOADING BAYS 01 AND 02",
  "FUDDER FREIGHT",
  "FUDDER STORAGE TANKS",
  "FEED THE FUD",
  "PROPAGANDA CONVEYOR",
  "CONSUME OBEY REPEAT",
  "FUDDER MAKES THE TRUTH",
  "FUDDER PRESENTATION CHAMBER",
  "INFORMATION IS A PRODUCT",
] as const;

export const FUDDER_POSTER_TEXT = ["WANTED BY FUDDER", "DON'T BUY"] as const;

export const FUDDER_VISUAL_DECK_IDS = [
  "entrance-west", "entrance-east", "media-west", "media-east", "industrial-west",
  "industrial-east", "factory-west", "factory-east", "arena-west", "arena-east",
] as const;

interface SkylineBlock { x: number; w: number; h: number; stack: boolean }
interface TerritoryWorld { width: number; skyline: SkylineBlock[] }
interface FudderFrame { x: number; y: number; w: number; h: number }

const FUDDER_FRAMES: Record<"idle" | "raised" | "double", FudderFrame> = {
  idle: { x: 21, y: 8, w: 190, h: 241 },
  raised: { x: 468, y: 27, w: 224, h: 222 },
  double: { x: 17, y: 257, w: 197, h: 241 },
};

let worldCache: TerritoryWorld | null = null;
let fudderImage: HTMLImageElement | null = null;
let fudderReady = false;
let headImage: HTMLImageElement | null = null;
let headReady = false;

function loadImage(src: string, onReady: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const img = new Image();
  img.onload = onReady;
  img.src = src;
  return img;
}

export function preloadFudderTerritory(): void {
  if (!fudderImage) fudderImage = loadImage(fudderAtlas.url, () => { fudderReady = true; });
  if (!headImage) headImage = loadImage(waldogeHeadUrl, () => { headReady = true; });
}

preloadFudderTerritory();

export function fudderTerritoryFor(level: number): TerritoryWorld | null {
  if (level !== FUDDER_TERRITORY_LEVEL) return null;
  const width = getLevelWidth(level);
  if (worldCache?.width === width) return worldCache;
  const skyline: SkylineBlock[] = [];
  for (let x = -240, i = 0; x < width + 480; i += 1) {
    const w = 82 + ((i * 47) % 118);
    skyline.push({ x, w, h: 145 + ((i * 71) % 165), stack: i % 3 === 0 });
    x += w + 12 + ((i * 23) % 28);
  }
  worldCache = { width, skyline };
  return worldCache;
}

export function hasFudderTerritory(level: number): boolean {
  return level === FUDDER_TERRITORY_LEVEL;
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = "#151b21") {
  ctx.fillStyle = "#080c11"; ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#59616a"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = "#252d34";
  for (let yy = y + 18; yy < y + h; yy += 18) {
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
  }
}

function truss(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, red = false) {
  const color = red ? "#7f2427" : "#39444c";
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2;
  for (let xx = x; xx < x + w; xx += 34) {
    ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(Math.min(xx + 34, x + w), y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xx, y + h); ctx.lineTo(Math.min(xx + 34, x + w), y); ctx.stroke();
  }
}

function industrialBuilding(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, bays = 2) {
  const top = GROUND_Y - h;
  panel(ctx, x, top, w, h, "#141b20");
  ctx.fillStyle = "#263038"; ctx.fillRect(x + 10, top + 10, w - 20, 18);
  for (let i = 0; i < bays; i += 1) {
    const gap = 12;
    const bw = (w - gap * (bays + 1)) / bays;
    const bx = x + gap + i * (bw + gap);
    ctx.fillStyle = "#202830"; ctx.fillRect(bx, GROUND_Y - 91, bw, 87);
    ctx.strokeStyle = "#59626a"; ctx.strokeRect(bx, GROUND_Y - 91, bw, 87);
    for (let yy = GROUND_Y - 82; yy < GROUND_Y - 8; yy += 10) {
      ctx.strokeStyle = "#343e45"; ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(bx + bw, yy); ctx.stroke();
    }
  }
  ctx.fillStyle = "#9c671d";
  for (let wx = x + 18; wx < x + w - 12; wx += 54) ctx.fillRect(wx, top + 43, 14, 18);
}

function scaffold(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = "#3d484e"; ctx.lineWidth = 4;
  for (let xx = x; xx <= x + w; xx += 58) {
    ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke();
  }
  ctx.lineWidth = 2;
  for (let yy = y; yy <= y + h; yy += 42) {
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
  }
  for (let xx = x; xx < x + w; xx += 58) {
    ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(Math.min(xx + 58, x + w), y + 42); ctx.stroke();
  }
}

function pipes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = "#62696a"; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.strokeStyle = "#a66b1d"; ctx.lineWidth = 2;
  for (let px = x + 28; px < x + w; px += 72) ctx.strokeRect(px, y - 5, 8, 10);
}

function cables(ctx: CanvasRenderingContext2D, x: number, w: number, y = 68) {
  ctx.strokeStyle = "#202931"; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath(); ctx.moveTo(x, y + i * 7); ctx.quadraticCurveTo(x + w / 2, y + 25 + i * 9, x + w, y + i * 3); ctx.stroke();
  }
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y = 86, red = false) {
  ctx.strokeStyle = "#515961"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x, y); ctx.stroke();
  const alpha = 0.34 + flicker(x, 0.002) * 0.16;
  const cone = ctx.createLinearGradient(0, y, 0, GROUND_Y);
  cone.addColorStop(0, red ? `rgba(255,57,48,${alpha})` : `rgba(255,186,83,${alpha})`);
  cone.addColorStop(1, "rgba(255,160,60,0)");
  ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 52, GROUND_Y); ctx.lineTo(x + 52, GROUND_Y); ctx.lineTo(x + 8, y); ctx.fill();
  ctx.fillStyle = red ? "#ef4a3f" : "#ffc66b"; ctx.fillRect(x - 9, y - 2, 18, 6);
}

function crate(ctx: CanvasRenderingContext2D, x: number, y = GROUND_Y, scale = 1) {
  const s = 25 * scale;
  ctx.fillStyle = "#744918"; ctx.fillRect(x, y - s, s, s);
  ctx.strokeStyle = "#c17e25"; ctx.lineWidth = 2; ctx.strokeRect(x, y - s, s, s);
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.moveTo(x + s, y - s); ctx.lineTo(x, y); ctx.stroke();
}

function slogan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], blue = false) {
  ctx.save();
  ctx.shadowColor = blue ? "#315e9a" : "#c72f31"; ctx.shadowBlur = 12;
  panel(ctx, x, y, w, h, blue ? "#102643" : "#60171d");
  ctx.shadowBlur = 0; ctx.fillStyle = blue ? "#e6ebff" : "#ffd5bd";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const size = Math.max(12, Math.min(24, Math.floor(h / (lines.length + 1))));
  ctx.font = `900 ${size}px Impact, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * ((i + 1) / (lines.length + 1)), w - 16));
  ctx.restore();
}

function wanted(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const w = 86 * scale; const h = 126 * scale;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#ddd4b8"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#37231c"; ctx.lineWidth = 3; ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = "#471913"; ctx.textAlign = "center";
  ctx.font = `900 ${11 * scale}px Impact, sans-serif`; ctx.fillText("WANTED", w / 2, 15 * scale);
  ctx.font = `800 ${7 * scale}px monospace`; ctx.fillText("BY FUDDER", w / 2, 28 * scale);
  if (headReady && headImage) {
    ctx.save(); ctx.beginPath(); ctx.rect(9 * scale, 31 * scale, w - 18 * scale, 64 * scale); ctx.clip();
    ctx.drawImage(headImage, 8 * scale, 28 * scale, w - 16 * scale, 72 * scale); ctx.restore();
  }
  ctx.fillStyle = "#171313"; ctx.font = `900 ${8 * scale}px Impact, sans-serif`; ctx.fillText("DON'T BUY", w / 2, 113 * scale);
  ctx.restore();
}

function fudderDisplay(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[] = [], pose: keyof typeof FUDDER_FRAMES = "idle", blue = false) {
  panel(ctx, x, y, w, h, blue ? "#14274a" : "#5b181e");
  const textW = lines.length ? Math.min(w * 0.48, 220) : 0;
  if (lines.length) {
    ctx.fillStyle = blue ? "#e4e9ff" : "#ffd2b8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.min(22, Math.max(13, h / (lines.length + 2)))}px Impact, sans-serif`;
    lines.forEach((line, i) => ctx.fillText(line, x + textW / 2, y + h * ((i + 1) / (lines.length + 1)), textW - 10));
  }
  if (!fudderReady || !fudderImage) return;
  const f = FUDDER_FRAMES[pose]; const areaW = w - textW - 8;
  const scale = Math.min(areaW / f.w, (h - 8) / f.h);
  ctx.drawImage(fudderImage, f.x, f.y, f.w, f.h, x + textW + (areaW - f.w * scale) / 2, y + h - f.h * scale - 4, f.w * scale, f.h * scale);
}

function deckArchitecture(ctx: CanvasRenderingContext2D, section: number) {
  const start = section * FUDDER_SECTION_WIDTH;
  for (const deck of landingDecksFor(FUDDER_TERRITORY_LEVEL)) {
    if (deck.x1 < start || deck.x0 > start + FUDDER_SECTION_WIDTH) continue;
    const w = deck.x1 - deck.x0;
    scaffold(ctx, deck.x0, deck.y + 12, w, GROUND_Y - deck.y - 12);
    ctx.strokeStyle = "#687078"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(deck.x0, deck.y - 34); ctx.lineTo(deck.x1, deck.y - 34); ctx.stroke();
    for (let px = deck.x0; px <= deck.x1; px += 44) {
      ctx.beginPath(); ctx.moveTo(px, deck.y - 34); ctx.lineTo(px, deck.y - 7); ctx.stroke();
    }
  }
}

function drawEntrance(ctx: CanvasRenderingContext2D, x: number) {
  truss(ctx, x + 8, 72, 62, 248); pipes(ctx, x + 28, 86, 1720); cables(ctx, x, 1800);
  industrialBuilding(ctx, x + 54, 330, 214, 2);
  fudderDisplay(ctx, x + 105, 112, 290, 118, ["FUDDER", "CONTROLS", "THE NARRATIVE"], "double");
  wanted(ctx, x + 430, 128, 0.96);
  industrialBuilding(ctx, x + 548, 410, 224, 2); scaffold(ctx, x + 540, 78, 440, 242);
  slogan(ctx, x + 790, 104, 330, 132, ["INFORMATION", "CONTROLS", "EVERYTHING"]);
  industrialBuilding(ctx, x + 1160, 300, 208, 2); wanted(ctx, x + 1250, 132, 0.88);
  fudderDisplay(ctx, x + 1470, 118, 220, 112, [], "double"); wanted(ctx, x + 1710, 136, 0.78);
}

function dish(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.strokeStyle = "#7d858b"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 22 * scale, Math.PI * 0.15, Math.PI * 0.95); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16 * scale, y - 18 * scale); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x - 12, y + 30); ctx.lineTo(x + 14, y + 30); ctx.stroke();
}

function drawMedia(ctx: CanvasRenderingContext2D, x: number) {
  slogan(ctx, x + 35, 150, 190, 90, ["FUDDER", "NEWS"]); dish(ctx, x + 125, 132, 0.7);
  industrialBuilding(ctx, x + 250, 310, 222, 2); scaffold(ctx, x + 238, 80, 350, 240); wanted(ctx, x + 575, 132, 0.9);
  fudderDisplay(ctx, x + 690, 105, 420, 132, ["FUDDER NEWS", "ALWAYS RIGHT"], "raised", true);
  industrialBuilding(ctx, x + 1140, 285, 212, 2); wanted(ctx, x + 1190, 132, 0.88);
  slogan(ctx, x + 1425, 132, 310, 112, ["SAME STORY", "DIFFERENT DAY"]);
  scaffold(ctx, x + 1380, 70, 400, 250); dish(ctx, x + 1660, 100, 1.1); wanted(ctx, x + 1730, 140, 0.72);
}

function loadingBay(ctx: CanvasRenderingContext2D, x: number, label: string) {
  panel(ctx, x, 122, 225, 198, "#1b2228");
  ctx.fillStyle = "#d2c4a7"; ctx.fillRect(x + 10, 130, 205, 34);
  ctx.fillStyle = "#1b2024"; ctx.font = "900 22px Impact"; ctx.textAlign = "center"; ctx.fillText(label, x + 112, 154);
  ctx.fillStyle = "#242c32"; ctx.fillRect(x + 18, 176, 189, 140);
  ctx.strokeStyle = "#525b62"; for (let y = 184; y < 310; y += 12) { ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + 207, y); ctx.stroke(); }
}

function truck(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = "#761e22"; ctx.fillRect(x + 74, 206, 330, 80); ctx.fillRect(x + 12, 224, 78, 62);
  ctx.beginPath(); ctx.moveTo(x + 12, 224); ctx.lineTo(x + 48, 190); ctx.lineTo(x + 90, 190); ctx.lineTo(x + 90, 286); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#22313b"; ctx.fillRect(x + 48, 199, 32, 28);
  ctx.fillStyle = "#101216"; for (const wx of [58, 330]) { ctx.beginPath(); ctx.arc(x + wx, 288, 18, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#ffd0b4"; ctx.font = "900 30px Impact"; ctx.textAlign = "center"; ctx.fillText("FUDDER", x + 230, 258);
  if (fudderReady && fudderImage) ctx.drawImage(fudderImage, 21, 8, 190, 241, x + 320, 212, 56, 71);
}

function forklift(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = "#a56c18"; ctx.fillRect(x, 269, 67, 35); ctx.fillRect(x + 28, 233, 34, 41);
  ctx.strokeStyle = "#c58b2a"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 72, 218); ctx.lineTo(x + 72, 305); ctx.moveTo(x + 78, 300); ctx.lineTo(x + 115, 300); ctx.stroke();
  ctx.fillStyle = "#111418"; for (const wx of [15, 54]) { ctx.beginPath(); ctx.arc(x + wx, 306, 11, 0, Math.PI * 2); ctx.fill(); }
}

function tanks(ctx: CanvasRenderingContext2D, x: number) {
  for (let i = 0; i < 4; i += 1) {
    const tx = x + i * 91;
    ctx.fillStyle = "#78827e"; ctx.fillRect(tx, 157, 70, 151);
    ctx.beginPath(); ctx.ellipse(tx + 35, 157, 35, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#b6baa9"; ctx.lineWidth = 2; ctx.strokeRect(tx, 171, 70, 126);
    ctx.fillStyle = "#202626"; ctx.font = "900 12px Impact"; ctx.textAlign = "center"; ctx.fillText("FUDDER", tx + 35, 232);
  }
}

function drawIndustrial(ctx: CanvasRenderingContext2D, x: number) {
  slogan(ctx, x + 20, 112, 245, 140, ["MANUFACTURED", "OPINIONS", "DISTRIBUTED", "WORLDWIDE"], true);
  wanted(ctx, x + 285, 129, 0.95); scaffold(ctx, x + 390, 72, 260, 248); pipes(ctx, x + 400, 105, 250);
  loadingBay(ctx, x + 610, "01"); loadingBay(ctx, x + 845, "02"); forklift(ctx, x + 660);
  truck(ctx, x + 1065); wanted(ctx, x + 1450, 128, 0.92); tanks(ctx, x + 1530);
}

function machine(ctx: CanvasRenderingContext2D, x: number, red = false) {
  ctx.fillStyle = red ? "#5f2023" : "#303a3e"; ctx.fillRect(x, 205, 92, 102);
  ctx.strokeStyle = red ? "#d1433f" : "#697378"; ctx.lineWidth = 2; ctx.strokeRect(x, 205, 92, 102);
  ctx.fillStyle = "#11191e"; ctx.fillRect(x + 12, 217, 68, 28);
  for (let i = 0; i < 3; i += 1) { ctx.fillStyle = i === 0 ? "#e74d42" : "#d7952c"; ctx.beginPath(); ctx.arc(x + 20 + i * 18, 261, 4, 0, Math.PI * 2); ctx.fill(); }
}

function conveyor(ctx: CanvasRenderingContext2D, x: number, w: number) {
  ctx.fillStyle = "#22292e"; ctx.fillRect(x, 267, w, 35); ctx.strokeStyle = "#737b80"; ctx.lineWidth = 4; ctx.strokeRect(x, 267, w, 35);
  for (let rx = x + 20; rx < x + w - 10; rx += 44) { ctx.fillStyle = "#8e9699"; ctx.beginPath(); ctx.arc(rx, 285, 8, 0, Math.PI * 2); ctx.fill(); }
}

function drawFactory(ctx: CanvasRenderingContext2D, x: number) {
  fudderDisplay(ctx, x + 30, 132, 300, 116, ["FEED", "THE FUD"], "double");
  scaffold(ctx, x + 350, 66, 1090, 254); conveyor(ctx, x + 370, 1110);
  for (const mx of [410, 590, 770, 950, 1130, 1310]) machine(ctx, x + mx, mx >= 900);
  wanted(ctx, x + 835, 112, 0.98);
  for (const lx of [430, 610, 790, 970, 1150, 1330]) lamp(ctx, x + lx, 116, lx >= 790);
  slogan(ctx, x + 1510, 132, 250, 116, ["CONSUME", "OBEY", "REPEAT"]);
}

function drawArena(ctx: CanvasRenderingContext2D, x: number) {
  fudderDisplay(ctx, x + 30, 132, 300, 120, ["FUDDER", "MAKES", "THE TRUTH"], "double");
  industrialBuilding(ctx, x + 350, 330, 208, 2); scaffold(ctx, x + 340, 72, 350, 248); wanted(ctx, x + 710, 126, 0.94);
  truss(ctx, x + 820, 58, 520, 262, true);
  for (const lx of [875, 970, 1190, 1285]) lamp(ctx, x + lx, 90, true);
  const glow = ctx.createRadialGradient(x + 1080, 230, 20, x + 1080, 230, 220);
  glow.addColorStop(0, "rgba(245,53,47,0.43)"); glow.addColorStop(1, "rgba(245,53,47,0)");
  ctx.fillStyle = glow; ctx.fillRect(x + 820, 60, 520, 260);
  fudderDisplay(ctx, x + 905, 72, 350, 238, [], "double");
  wanted(ctx, x + 1365, 126, 0.94); industrialBuilding(ctx, x + 1480, 275, 208, 2);
  slogan(ctx, x + 1530, 140, 255, 112, ["INFORMATION", "IS A PRODUCT"]);
}

function drawSection(ctx: CanvasRenderingContext2D, index: number, x: number) {
  pipes(ctx, x, 76, FUDDER_SECTION_WIDTH); pipes(ctx, x, 286, FUDDER_SECTION_WIDTH);
  cables(ctx, x, FUDDER_SECTION_WIDTH);
  deckArchitecture(ctx, index);
  if (index === 0) drawEntrance(ctx, x);
  else if (index === 1) drawMedia(ctx, x);
  else if (index === 2) drawIndustrial(ctx, x);
  else if (index === 3) drawFactory(ctx, x);
  else drawArena(ctx, x);
  for (let cx = x + 18; cx < x + FUDDER_SECTION_WIDTH; cx += 210) crate(ctx, cx, GROUND_Y, cx % 420 === 18 ? 1.1 : 0.85);
}

function drawSky(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, world: TerritoryWorld) {
  const sky = ctx.createLinearGradient(0, -220, 0, GROUND_Y);
  sky.addColorStop(0, "#050a13"); sky.addColorStop(0.55, "#182438"); sky.addColorStop(1, "#613033");
  ctx.fillStyle = sky; ctx.fillRect(0, -240, canvasW, GROUND_Y + 560);
  const off = camX * 0.14;
  for (const b of world.skyline) {
    const bx = b.x - off; if (bx + b.w < -30 || bx > canvasW + 30) continue;
    ctx.fillStyle = b.stack ? "#0d141e" : "#141d27"; ctx.fillRect(bx, GROUND_Y - b.h, b.w, b.h);
    ctx.fillStyle = "#6c471b";
    for (let wx = bx + 14; wx < bx + b.w - 8; wx += 28) ctx.fillRect(wx, GROUND_Y - b.h + 24, 8, 4);
    if (b.stack) { ctx.fillStyle = "rgba(115,104,93,0.23)"; ctx.beginPath(); ctx.ellipse(bx + b.w / 2, GROUND_Y - b.h - 35, 34, 50, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

export function drawFudderTerritory(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  const world = fudderTerritoryFor(level); if (!world) return;
  drawSky(ctx, camX, canvasW, world);
  ctx.save(); ctx.translate(-camX, 0);
  const first = Math.max(0, Math.floor(camX / FUDDER_SECTION_WIDTH));
  const last = Math.min(FUDDER_SECTIONS.length - 1, Math.floor((camX + canvasW) / FUDDER_SECTION_WIDTH));
  for (let index = first; index <= last; index += 1) drawSection(ctx, index, index * FUDDER_SECTION_WIDTH);
  ctx.restore();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 300);
  floor.addColorStop(0, "#252b31"); floor.addColorStop(1, "#07090d");
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND_Y, canvasW, 300);
  ctx.fillStyle = "#777b7d"; ctx.fillRect(0, GROUND_Y - 4, canvasW, 4);
  ctx.fillStyle = "rgba(220,146,45,0.3)";
  const start = -((camX % 96) + 96) % 96;
  for (let fx = start; fx < canvasW + 96; fx += 96) ctx.fillRect(fx, GROUND_Y + 46, 42, 4);
}

export function fudderSectionLabelAt(level: number, x: number): string | null {
  if (level !== FUDDER_TERRITORY_LEVEL) return null;
  return FUDDER_SECTIONS[Math.max(0, Math.min(FUDDER_SECTIONS.length - 1, Math.floor(x / FUDDER_SECTION_WIDTH)))];
}

export const __fudderTerritoryTest = {
  sectionWidth: FUDDER_SECTION_WIDTH,
  posterText: FUDDER_POSTER_TEXT,
  visualDeckIds: FUDDER_VISUAL_DECK_IDS,
  atlasUrl: fudderAtlas.url,
};