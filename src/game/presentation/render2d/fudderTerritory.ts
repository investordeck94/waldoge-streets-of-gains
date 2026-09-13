/**
 * LEVEL 4 — FUDDER TERRITORY.
 * Five-section reconstruction of the approved industrial-propaganda blueprint.
 * Presentation only: the flat floor, decks, ladders and encounters are authored
 * separately in world.ts. Decorative machinery never creates collision.
 */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
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
  "FUDDER CONTROLS THE NARRATIVE",
  "INFORMATION CONTROLS EVERYTHING",
  "FUDDER NEWS",
  "FUDDER NEWS ALWAYS RIGHT",
  "SAME STORY DIFFERENT DAY",
  "MANUFACTURED OPINIONS DISTRIBUTED WORLDWIDE",
  "FUDDER FREIGHT",
  "FUDDER STORAGE TANKS",
  "FEED THE FUD",
  "PROPAGANDA CONVEYOR",
  "CONSUME OBEY REPEAT",
  "FUDDER MAKES THE TRUTH",
  "INFORMATION IS A PRODUCT",
] as const;

interface SkylineBlock { x: number; w: number; h: number; stack: boolean }
interface TerritoryWorld { width: number; skyline: SkylineBlock[] }

let worldCache: TerritoryWorld | null = null;
let fudderImage: HTMLImageElement | null = null;
let fudderReady = false;
let headImage: HTMLImageElement | null = null;
let headReady = false;

function image(src: string, onReady: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const img = new Image();
  img.onload = onReady;
  img.src = src;
  return img;
}

export function preloadFudderTerritory(): void {
  if (!fudderImage) fudderImage = image(fudderAtlas.url, () => { fudderReady = true; });
  if (!headImage) headImage = image(waldogeHeadUrl, () => { headReady = true; });
}

preloadFudderTerritory();

export function fudderTerritoryFor(level: number): TerritoryWorld | null {
  if (level !== FUDDER_TERRITORY_LEVEL) return null;
  const width = getLevelWidth(level);
  if (worldCache?.width === width) return worldCache;
  const skyline: SkylineBlock[] = [];
  for (let x = -260, i = 0; x < width + 500; i++) {
    const w = 74 + ((i * 47) % 102);
    skyline.push({ x, w, h: 130 + ((i * 71) % 175), stack: i % 4 === 0 });
    x += w + 16 + ((i * 23) % 38);
  }
  worldCache = { width, skyline };
  return worldCache;
}

export function hasFudderTerritory(level: number): boolean {
  return level === FUDDER_TERRITORY_LEVEL;
}

function sign(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], red = true) {
  ctx.save();
  ctx.fillStyle = "#11151b"; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  const glow = ctx.createLinearGradient(x, y, x, y + h);
  glow.addColorStop(0, red ? "#7c1720" : "#122b48");
  glow.addColorStop(1, red ? "#351319" : "#0b1728");
  ctx.fillStyle = glow; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = red ? "#d84a45" : "#688fc4"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = red ? "#ffd0b4" : "#e7ebff";
  const size = Math.max(10, Math.min(22, Math.floor(h / (lines.length + 1))));
  ctx.font = `900 ${size}px Impact, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * ((i + 1) / (lines.length + 1)), w - 12));
  ctx.restore();
}

function wanted(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const w = 86 * scale, h = 122 * scale;
  ctx.save();
  ctx.fillStyle = "#ddd5bd"; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#3a2620"; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#4b1713"; ctx.textAlign = "center";
  ctx.font = `900 ${12 * scale}px Impact, sans-serif`; ctx.fillText("WANTED", x + w / 2, y + 15 * scale);
  ctx.font = `700 ${7 * scale}px monospace`; ctx.fillText("BY FUDDER", x + w / 2, y + 27 * scale);
  if (headReady && headImage) {
    ctx.save(); ctx.beginPath(); ctx.rect(x + 10 * scale, y + 31 * scale, w - 20 * scale, 62 * scale); ctx.clip();
    ctx.drawImage(headImage, x + 9 * scale, y + 28 * scale, w - 18 * scale, 70 * scale); ctx.restore();
  } else {
    ctx.fillStyle = "#d7a44d"; ctx.beginPath(); ctx.arc(x + w / 2, y + 61 * scale, 23 * scale, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#171313"; ctx.font = `900 ${8 * scale}px Impact, sans-serif`;
  ctx.fillText("DON'T BUY", x + w / 2, y + 108 * scale);
  ctx.restore();
}

function fudderBoard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, caption?: readonly string[]) {
  ctx.fillStyle = "#40151b"; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#c43b39"; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  const captionW = caption ? Math.min(w * 0.52, 220) : 0;
  if (caption) {
    ctx.fillStyle = "#ffd1b4"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 18px Impact, sans-serif";
    caption.forEach((line, i) => ctx.fillText(line, x + captionW / 2, y + h * ((i + 1) / (caption.length + 1)), captionW - 12));
  }
  if (fudderReady && fudderImage) {
    const dx = x + captionW + 4;
    const dw = w - captionW - 8;
    // Exact approved idle pose; contain it without changing the character.
    const scale = Math.min(dw / 190, (h - 8) / 241);
    ctx.drawImage(fudderImage, 21, 8, 190, 241, dx + (dw - 190 * scale) / 2, y + h - 241 * scale - 4, 190 * scale, 241 * scale);
  }
}

function pipeGrid(ctx: CanvasRenderingContext2D, sx: number, width: number, dense = false) {
  ctx.strokeStyle = "#39424b"; ctx.lineWidth = 5;
  for (let x = sx + 35; x < sx + width; x += dense ? 92 : 140) {
    ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, GROUND_Y - 8); ctx.stroke();
    ctx.strokeStyle = "#9b651d"; ctx.lineWidth = 2;
    for (let y = 122; y < GROUND_Y - 12; y += 32) ctx.strokeRect(x - 4, y, 8, 11);
    ctx.strokeStyle = "#39424b"; ctx.lineWidth = 5;
  }
  ctx.beginPath(); ctx.moveTo(sx, 132); ctx.lineTo(sx + width, 132); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx, 260); ctx.lineTo(sx + width, 260); ctx.stroke();
}

function lamp(ctx: CanvasRenderingContext2D, x: number, floorY = GROUND_Y) {
  ctx.strokeStyle = "#434851"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 76); ctx.lineTo(x, 106); ctx.stroke();
  const a = 0.45 + flicker(x, 0.002) * 0.2;
  const cone = ctx.createLinearGradient(0, 94, 0, floorY);
  cone.addColorStop(0, `rgba(255,190,93,${a})`); cone.addColorStop(1, "rgba(255,190,93,0)");
  ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(x - 8, 100); ctx.lineTo(x - 48, floorY); ctx.lineTo(x + 48, floorY); ctx.lineTo(x + 8, 100); ctx.fill();
  ctx.fillStyle = "#ffc76e"; ctx.fillRect(x - 8, 96, 16, 5);
}

function crate(ctx: CanvasRenderingContext2D, x: number, y = GROUND_Y, n = 1) {
  for (let i = 0; i < n; i++) {
    const bx = x + (i % 2) * 28, by = y - 26 - Math.floor(i / 2) * 27;
    ctx.fillStyle = "#754717"; ctx.fillRect(bx, by, 25, 25);
    ctx.strokeStyle = "#c1812b"; ctx.lineWidth = 2; ctx.strokeRect(bx, by, 25, 25);
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 25, by + 25); ctx.moveTo(bx + 25, by); ctx.lineTo(bx, by + 25); ctx.stroke();
  }
}

function building(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, doors = 2) {
  const top = GROUND_Y - h;
  ctx.fillStyle = "#171c22"; ctx.fillRect(x, top, w, h);
  ctx.strokeStyle = "#343d45"; ctx.lineWidth = 3; ctx.strokeRect(x, top, w, h);
  ctx.fillStyle = "#222b31";
  for (let d = 0; d < doors; d++) {
    const dw = Math.min(145, (w - 30) / doors - 12), dx = x + 16 + d * (dw + 12);
    ctx.fillRect(dx, GROUND_Y - 112, dw, 108); ctx.strokeStyle = "#56606a"; ctx.strokeRect(dx, GROUND_Y - 112, dw, 108);
    ctx.fillStyle = "#aeb0a6"; ctx.font = "900 14px monospace"; ctx.textAlign = "center"; ctx.fillText(`0${d + 1}`, dx + dw / 2, GROUND_Y - 91);
    ctx.fillStyle = "#222b31";
  }
}

function tanks(ctx: CanvasRenderingContext2D, x: number, count: number) {
  for (let i = 0; i < count; i++) {
    const tx = x + i * 86;
    ctx.fillStyle = "#5f6968"; ctx.fillRect(tx, 165, 64, 145);
    ctx.beginPath(); ctx.ellipse(tx + 32, 165, 32, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#a9aa94"; ctx.strokeRect(tx, 175, 64, 124);
    ctx.fillStyle = "#171b1b"; ctx.font = "900 11px Impact"; ctx.textAlign = "center"; ctx.fillText("FUDDER", tx + 32, 230);
  }
}

function drawSection(ctx: CanvasRenderingContext2D, index: number, x: number) {
  pipeGrid(ctx, x, FUDDER_SECTION_WIDTH, index === 3);
  for (let lx = x + 90; lx < x + FUDDER_SECTION_WIDTH; lx += 310) lamp(ctx, lx);
  if (index === 0) {
    building(ctx, x + 30, 410, 220, 2); fudderBoard(ctx, x + 100, 118, 260, 104, ["FUDDER", "CONTROLS THE NARRATIVE"]);
    wanted(ctx, x + 475, 145, 0.9); building(ctx, x + 600, 460, 190, 2);
    sign(ctx, x + 1110, 114, 300, 116, ["INFORMATION", "CONTROLS", "EVERYTHING"]);
    building(ctx, x + 1450, 300, 210, 2); fudderBoard(ctx, x + 1510, 130, 190, 96);
  } else if (index === 1) {
    sign(ctx, x + 75, 170, 180, 82, ["FUDDER", "NEWS"]); building(ctx, x + 295, 340, 225, 2);
    wanted(ctx, x + 675, 146, 0.9); fudderBoard(ctx, x + 810, 118, 390, 112, ["FUDDER NEWS", "ALWAYS RIGHT"]);
    building(ctx, x + 1230, 280, 185, 2); sign(ctx, x + 1515, 145, 245, 100, ["SAME STORY", "DIFFERENT DAY"]);
  } else if (index === 2) {
    sign(ctx, x + 35, 116, 230, 135, ["MANUFACTURED", "OPINIONS", "DISTRIBUTED", "WORLDWIDE"], false);
    wanted(ctx, x + 300, 140, 0.95); building(ctx, x + 430, 560, 212, 2);
    ctx.fillStyle = "#611a1c"; ctx.fillRect(x + 1020, 240, 310, 66); ctx.fillStyle = "#b62d2e"; ctx.fillRect(x + 960, 264, 82, 42);
    ctx.fillStyle = "#f2c7ab"; ctx.font = "900 24px Impact"; ctx.textAlign = "center"; ctx.fillText("FUDDER", x + 1175, 279);
    wanted(ctx, x + 1370, 145, 0.85); tanks(ctx, x + 1490, 3);
  } else if (index === 3) {
    fudderBoard(ctx, x + 45, 146, 290, 102, ["FEED", "THE FUD"]);
    // Blueprint conveyor: literal propaganda production line.
    ctx.fillStyle = "#20262c"; ctx.fillRect(x + 390, 246, 1060, 38); ctx.strokeStyle = "#69717a"; ctx.lineWidth = 4; ctx.strokeRect(x + 390, 246, 1060, 38);
    for (let cx = x + 410; cx < x + 1430; cx += 54) { ctx.fillStyle = "#899099"; ctx.beginPath(); ctx.arc(cx, 265, 9, 0, Math.PI * 2); ctx.fill(); }
    for (let mx = x + 470; mx < x + 1410; mx += 180) { ctx.fillStyle = "#343b42"; ctx.fillRect(mx, 176, 96, 68); crate(ctx, mx + 115, 246, 2); }
    wanted(ctx, x + 790, 116, 0.92); sign(ctx, x + 1505, 133, 250, 112, ["CONSUME", "OBEY", "REPEAT"]);
  } else {
    sign(ctx, x + 70, 151, 280, 104, ["FUDDER", "MAKES", "THE TRUTH"]);
    building(ctx, x + 390, 330, 190, 2); wanted(ctx, x + 755, 148, 0.9);
    // Central red-lit boss presentation chamber from the blueprint.
    ctx.fillStyle = "#57151b"; ctx.fillRect(x + 900, 84, 360, 226);
    for (let px = x + 920; px < x + 1250; px += 54) { ctx.strokeStyle = "#b62d2f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, 90); ctx.lineTo(px, 305); ctx.stroke(); }
    fudderBoard(ctx, x + 930, 98, 300, 200);
    wanted(ctx, x + 1290, 145, 0.9); building(ctx, x + 1400, 350, 190, 2);
    sign(ctx, x + 1490, 153, 270, 100, ["INFORMATION", "IS A PRODUCT"]);
  }
  for (let cx = x + 20; cx < x + FUDDER_SECTION_WIDTH; cx += 235) crate(ctx, cx, GROUND_Y, 1 + ((cx / 235) % 3 === 0 ? 1 : 0));
}

function drawSky(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, world: TerritoryWorld) {
  const sky = ctx.createLinearGradient(0, -240, 0, GROUND_Y);
  sky.addColorStop(0, "#050b16"); sky.addColorStop(0.58, "#17243a"); sky.addColorStop(1, "#6b3033");
  ctx.fillStyle = sky; ctx.fillRect(0, -260, canvasW, GROUND_Y + 620);
  const off = camX * 0.15;
  for (const b of world.skyline) {
    const x = b.x - off; if (x + b.w < -30 || x > canvasW + 30) continue;
    ctx.fillStyle = b.stack ? "#111823" : "#17202a"; ctx.fillRect(x, GROUND_Y - b.h, b.w, b.h);
    if (b.stack) { ctx.fillStyle = "rgba(100,92,85,0.22)"; ctx.beginPath(); ctx.ellipse(x + b.w / 2, GROUND_Y - b.h - 38, 30, 48, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

export function drawFudderTerritory(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  const world = fudderTerritoryFor(level); if (!world) return;
  drawSky(ctx, camX, canvasW, world);
  ctx.save(); ctx.translate(-camX, 0);
  const first = Math.max(0, Math.floor(camX / FUDDER_SECTION_WIDTH));
  const last = Math.min(FUDDER_SECTIONS.length - 1, Math.floor((camX + canvasW) / FUDDER_SECTION_WIDTH));
  for (let i = first; i <= last; i++) drawSection(ctx, i, i * FUDDER_SECTION_WIDTH);
  ctx.restore();
  // Flat floor exactly aligned with the authoritative gameplay plane.
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 300);
  floor.addColorStop(0, "#252b31"); floor.addColorStop(1, "#07090d");
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND_Y, canvasW, 300);
  ctx.fillStyle = "#71757a"; ctx.fillRect(0, GROUND_Y - 4, canvasW, 4);
  ctx.fillStyle = "rgba(221,153,55,0.28)";
  const start = -((camX % 96) + 96) % 96;
  for (let x = start; x < canvasW + 96; x += 96) ctx.fillRect(x, GROUND_Y + 46, 42, 4);
}

export function fudderSectionLabelAt(level: number, x: number): string | null {
  if (level !== FUDDER_TERRITORY_LEVEL) return null;
  return FUDDER_SECTIONS[Math.max(0, Math.min(FUDDER_SECTIONS.length - 1, Math.floor(x / FUDDER_SECTION_WIDTH)))];
}

export const __fudderTerritoryTest = { sectionWidth: FUDDER_SECTION_WIDTH };