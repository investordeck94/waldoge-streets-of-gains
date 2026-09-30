/**
 * LEVEL 4 — FUDDER TERRITORY.
 * Painted reconstruction of the approved five-section blueprint.
 * Presentation only: collision, encounters, ladders and progression remain in config/world.ts.
 */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor, laddersFor } from "@/game/config/world";
import fudderAtlas from "@/assets/fudder-atlas.png.asset.json";
import fudderAtlasLocal from "@/assets/fudder-atlas-local.png";
import waldogeHeadUrl from "@/assets/waldoge-head.png";
import entranceAsset from "@/assets/level4-entrance.jpg.asset.json";
import mediaAsset from "@/assets/level4-media.jpg.asset.json";
import industrialAsset from "@/assets/level4-industrial.jpg.asset.json";
import factoryAsset from "@/assets/level4-factory.jpg.asset.json";
import arenaAsset from "@/assets/level4-arena.jpg.asset.json";
import entranceLocal from "@/assets/level4-entrance.jpg-local.jpg";
import mediaLocal from "@/assets/level4-media.jpg-local.jpg";
import industrialLocal from "@/assets/level4-industrial.jpg-local.jpg";
import factoryLocal from "@/assets/level4-factory.jpg-local.jpg";
import arenaLocal from "@/assets/level4-arena.jpg-local.jpg";
import { flicker, renderNow } from "./clock";
import { residentImage } from "./imageResidency";

export const FUDDER_TERRITORY_LEVEL = 3;
export const FUDDER_SECTION_WIDTH = 1800;
export const FUDDER_SECTIONS = [
  "ENTRANCE — PROPAGANDA STREET", "MEDIA DISTRICT", "INDUSTRIAL COMPLEX",
  "PROPAGANDA FACTORY", "BOSS ARENA — FUDDER",
] as const;

export const FUDDER_LANDMARKS = [
  "ENTRANCE FRAME", "FUDDER CONTROLS THE NARRATIVE", "INFORMATION CONTROLS EVERYTHING",
  "FUDDER NEWS", "FUDDER NEWS ALWAYS RIGHT", "SAME STORY DIFFERENT DAY",
  "MANUFACTURED OPINIONS DISTRIBUTED WORLDWIDE", "LOADING BAYS 01 AND 02",
  "FUDDER FREIGHT", "FUDDER STORAGE TANKS", "FEED THE FUD", "PROPAGANDA CONVEYOR",
  "CONSUME OBEY REPEAT", "FUDDER MAKES THE TRUTH", "FUDDER PRESENTATION CHAMBER",
  "INFORMATION IS A PRODUCT",
] as const;
export const FUDDER_POSTER_TEXT = ["WANTED BY FUDDER", "DON'T BUY"] as const;
export const FUDDER_VISUAL_DECK_IDS = [
  "entrance-west", "entrance-east", "media-west", "media-east", "industrial-west",
  "industrial-east", "factory-west", "factory-east", "arena-west", "arena-east",
] as const;

type Layer = "background" | "gameplay" | "foreground";
export interface FudderBlueprintLandmark {
  id: string; section: number; x0: number; x1: number; y0: number; y1: number;
  layer: Layer; module: string; scale: "supporting" | "major" | "dominant";
  gameplayStructure?: string;
}
export const FUDDER_BLUEPRINT_MAP: readonly FudderBlueprintLandmark[] = [
  { id: "entrance-frame", section: 0, x0: 0, x1: 90, y0: 45, y1: 320, layer: "gameplay", module: "painted-truss", scale: "supporting" },
  { id: "narrative-display", section: 0, x0: 80, x1: 470, y0: 55, y1: 205, layer: "gameplay", module: "atlas-display", scale: "dominant" },
  { id: "entrance-west-deck", section: 0, x0: 660, x1: 1120, y0: 190, y1: 320, layer: "gameplay", module: "integrated-catwalk", scale: "major", gameplayStructure: "entrance-west" },
  { id: "information-display", section: 0, x0: 760, x1: 1135, y0: 70, y1: 205, layer: "gameplay", module: "propaganda-screen", scale: "dominant" },
  { id: "entrance-east-deck", section: 0, x0: 1320, x1: 1700, y0: 190, y1: 320, layer: "gameplay", module: "integrated-catwalk", scale: "major", gameplayStructure: "entrance-east" },
  { id: "media-broadcast-complex", section: 1, x0: 1800, x1: 2400, y0: 30, y1: 320, layer: "gameplay", module: "painted-broadcast", scale: "major", gameplayStructure: "media-west" },
  { id: "media-main-screen", section: 1, x0: 2370, x1: 2940, y0: 55, y1: 220, layer: "gameplay", module: "atlas-display", scale: "dominant" },
  { id: "media-right-screen", section: 1, x0: 3120, x1: 3560, y0: 65, y1: 220, layer: "gameplay", module: "propaganda-screen", scale: "major", gameplayStructure: "media-east" },
  { id: "loading-complex", section: 2, x0: 3600, x1: 4580, y0: 45, y1: 320, layer: "gameplay", module: "painted-loading-bays", scale: "dominant", gameplayStructure: "industrial-west" },
  { id: "fudder-freight", section: 2, x0: 4520, x1: 5070, y0: 185, y1: 320, layer: "gameplay", module: "painted-freight", scale: "major", gameplayStructure: "industrial-east" },
  { id: "storage-tanks", section: 2, x0: 5070, x1: 5400, y0: 55, y1: 320, layer: "gameplay", module: "painted-tanks", scale: "dominant" },
  { id: "factory-line", section: 3, x0: 5400, x1: 7200, y0: 45, y1: 320, layer: "gameplay", module: "painted-production-line", scale: "dominant", gameplayStructure: "factory-west/factory-east" },
  { id: "arena-workshops", section: 4, x0: 7200, x1: 7900, y0: 45, y1: 320, layer: "gameplay", module: "painted-workshops", scale: "major", gameplayStructure: "arena-west" },
  { id: "presentation-chamber", section: 4, x0: 7790, x1: 8420, y0: 30, y1: 320, layer: "gameplay", module: "atlas-chamber", scale: "dominant" },
  { id: "arena-terminal", section: 4, x0: 8420, x1: 9000, y0: 45, y1: 320, layer: "gameplay", module: "painted-workshops", scale: "major", gameplayStructure: "arena-east" },
] as const;

interface TerritoryWorld { width: number }
interface Frame { x: number; y: number; w: number; h: number }
const FRAMES: Record<"idle" | "raised" | "double", Frame> = {
  idle: { x: 21, y: 8, w: 190, h: 241 }, raised: { x: 468, y: 27, w: 224, h: 222 },
  double: { x: 17, y: 257, w: 197, h: 241 },
};
const sectionAssets = [entranceAsset, mediaAsset, industrialAsset, factoryAsset, arenaAsset] as const;
const sectionSources = [entranceLocal, mediaLocal, industrialLocal, factoryLocal, arenaLocal] as const;
let worldCache: TerritoryWorld | null = null;
let fudderImage: HTMLImageElement | null = null;
let headImage: HTMLImageElement | null = null;
let fudderReady = false;
let headReady = false;
const sectionImages: Array<HTMLImageElement | null> = [null, null, null, null, null];
const sectionReady = [false, false, false, false, false];

function loadImage(src: string, ready: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const image = new Image(); image.decoding = "sync"; image.onload = ready; residentImage(image, src, [3]); return image;
}
export function preloadFudderTerritory(): void {
  if (!fudderImage) fudderImage = loadImage(fudderAtlasLocal, () => { fudderReady = true; });
  if (!headImage) headImage = loadImage(waldogeHeadUrl, () => { headReady = true; });
  sectionSources.forEach((source, index) => {
    if (!sectionImages[index]) sectionImages[index] = loadImage(source, () => { sectionReady[index] = true; });
  });
}
preloadFudderTerritory();
export function fudderTerritoryFor(level: number): TerritoryWorld | null {
  if (level !== FUDDER_TERRITORY_LEVEL) return null;
  const width = getLevelWidth(level); if (worldCache?.width === width) return worldCache;
  worldCache = { width }; return worldCache;
}
export function hasFudderTerritory(level: number): boolean { return level === FUDDER_TERRITORY_LEVEL; }

function paintedSection(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  const image = sectionImages[index];
  if (!image || (!sectionReady[index] && (!image.complete || image.naturalWidth === 0))) return;
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight * 0.88, x, -18, FUDDER_SECTION_WIDTH, GROUND_Y + 18);
}
function screen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], blue = false): void {
  ctx.save(); ctx.shadowColor = blue ? "rgba(69,104,191,.8)" : "rgba(235,35,45,.75)"; ctx.shadowBlur = 16;
  ctx.fillStyle = blue ? "#102b58" : "#68141c"; ctx.fillRect(x, y, w, h); ctx.shadowBlur = 0;
  ctx.strokeStyle = blue ? "#6784c4" : "#d5524d"; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#ffe0cf"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const size = Math.max(12, Math.min(30, Math.floor(h / (lines.length + .8)))); ctx.font = `900 ${size}px Impact, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * ((i + 1) / (lines.length + 1)), w - 16)); ctx.restore();
}
function wanted(ctx: CanvasRenderingContext2D, x: number, y: number, h = 120): void {
  const w = h * .69; ctx.save(); ctx.translate(x, y); ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 8;
  ctx.fillStyle = "#ddd4b8"; ctx.fillRect(0, 0, w, h); ctx.shadowBlur = 0; ctx.strokeStyle = "#37231c"; ctx.lineWidth = 3; ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = "#471913"; ctx.textAlign = "center"; ctx.font = `900 ${h * .105}px Impact`; ctx.fillText("WANTED", w / 2, h * .14);
  ctx.font = `800 ${h * .06}px monospace`; ctx.fillText("BY FUDDER", w / 2, h * .25);
  if (headReady && headImage) { ctx.save(); ctx.beginPath(); ctx.rect(w * .1, h * .28, w * .8, h * .49); ctx.clip(); ctx.drawImage(headImage, w * .08, h * .22, w * .84, w * .84); ctx.restore(); }
  ctx.fillStyle = "#171313"; ctx.font = `900 ${h * .07}px Impact`; ctx.fillText("DON'T BUY", w / 2, h * .91); ctx.restore();
}
function fudder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pose: keyof typeof FRAMES): void {
  if (!fudderImage || (!fudderReady && (!fudderImage.complete || fudderImage.naturalWidth === 0))) return;
  const f = FRAMES[pose]; const scale = Math.min(w / f.w, h / f.h);
  ctx.save(); ctx.shadowColor = "rgba(242,58,42,.65)"; ctx.shadowBlur = 18;
  ctx.drawImage(fudderImage, f.x, f.y, f.w, f.h, x + (w - f.w * scale) / 2, y + h - f.h * scale, f.w * scale, f.h * scale); ctx.restore();
}
function labelledFudder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], pose: keyof typeof FRAMES, blue = false): void {
  screen(ctx, x, y, w, h, [], blue); const textW = Math.min(w * .49, 240);
  ctx.fillStyle = "#ffe0cf"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `900 ${Math.max(13, Math.min(28, h / (lines.length + 1.5)))}px Impact`;
  lines.forEach((line, i) => ctx.fillText(line, x + textW / 2, y + h * ((i + 1) / (lines.length + 1)), textW - 12));
  fudder(ctx, x + textW, y + 6, w - textW - 6, h - 10, pose);
}
function drawDecksAndLadders(ctx: CanvasRenderingContext2D, section: number): void {
  const start = section * FUDDER_SECTION_WIDTH;
  for (const deck of landingDecksFor(FUDDER_TERRITORY_LEVEL)) {
    if (deck.x1 < start || deck.x0 >= start + FUDDER_SECTION_WIDTH) continue;
    const w = deck.x1 - deck.x0; ctx.fillStyle = "#151b20"; ctx.fillRect(deck.x0, deck.y - 9, w, 12); ctx.fillStyle = "#b17a27"; ctx.fillRect(deck.x0, deck.y - 9, w, 3);
    ctx.strokeStyle = "#4f5960"; ctx.lineWidth = 4;
    for (let px = deck.x0 + 12; px < deck.x1; px += 48) { ctx.beginPath(); ctx.moveTo(px, deck.y + 3); ctx.lineTo(px + 24, Math.min(GROUND_Y - 2, deck.y + 38)); ctx.stroke(); }
  }
  ctx.strokeStyle = "#c28a25"; ctx.lineWidth = 5;
  for (const ladder of laddersFor(FUDDER_TERRITORY_LEVEL)) {
    if (ladder.x < start || ladder.x >= start + FUDDER_SECTION_WIDTH) continue;
    const top = Math.min(ladder.top, ladder.bottom); const bottom = Math.max(ladder.top, ladder.bottom);
    ctx.beginPath(); ctx.moveTo(ladder.x - 10, top); ctx.lineTo(ladder.x - 10, bottom); ctx.moveTo(ladder.x + 10, top); ctx.lineTo(ladder.x + 10, bottom); ctx.stroke(); ctx.lineWidth = 3;
    for (let y = top + 8; y < bottom; y += 16) { ctx.beginPath(); ctx.moveTo(ladder.x - 10, y); ctx.lineTo(ladder.x + 10, y); ctx.stroke(); } ctx.lineWidth = 5;
  }
}
function drawLandmarks(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  if (index === 0) {
    labelledFudder(ctx, x + 95, 58, 380, 145, ["FUDDER", "CONTROLS", "THE NARRATIVE"], "double");
    wanted(ctx, x + 510, 72, 122); screen(ctx, x + 780, 64, 370, 142, ["INFORMATION", "CONTROLS", "EVERYTHING"]);
    wanted(ctx, x + 1260, 76, 118); fudder(ctx, x + 1420, 67, 190, 130, "double"); wanted(ctx, x + 1680, 80, 108);
  } else if (index === 1) {
    screen(ctx, x + 80, 112, 190, 88, ["FUDDER", "NEWS"]); wanted(ctx, x + 510, 82, 118);
    labelledFudder(ctx, x + 600, 58, 560, 158, ["FUDDER NEWS", "ALWAYS RIGHT"], "raised", true);
    wanted(ctx, x + 1210, 78, 120); screen(ctx, x + 1390, 75, 350, 132, ["SAME STORY", "DIFFERENT DAY"]); wanted(ctx, x + 1720, 92, 100);
  } else if (index === 2) {
    screen(ctx, x + 28, 72, 255, 150, ["MANUFACTURED", "OPINIONS", "DISTRIBUTED", "WORLDWIDE"], true); wanted(ctx, x + 310, 82, 116);
    screen(ctx, x + 600, 145, 195, 38, ["01"]); screen(ctx, x + 825, 145, 195, 38, ["02"]);
    labelledFudder(ctx, x + 1020, 188, 430, 90, ["FUDDER"], "idle"); wanted(ctx, x + 1480, 82, 116);
    for (const tx of [1570, 1640, 1710, 1780]) { ctx.fillStyle = "rgba(213,219,203,.72)"; ctx.fillRect(x + tx, 118, 58, 160); ctx.strokeStyle = "#969d91"; ctx.strokeRect(x + tx, 118, 58, 160); ctx.fillStyle = "#202626"; ctx.font = "900 10px Impact"; ctx.textAlign = "center"; ctx.fillText("FUDDER", x + tx + 29, 210); }
  } else if (index === 3) {
    labelledFudder(ctx, x + 40, 82, 310, 128, ["FEED", "THE FUD"], "double"); wanted(ctx, x + 840, 68, 126);
    screen(ctx, x + 1490, 78, 265, 132, ["CONSUME", "OBEY", "REPEAT"]);
  } else {
    labelledFudder(ctx, x + 35, 80, 340, 128, ["FUDDER", "MAKES", "THE TRUTH"], "double"); wanted(ctx, x + 620, 72, 122);
    fudder(ctx, x + 795, 46, 430, 255, "double"); wanted(ctx, x + 1280, 72, 122);
    labelledFudder(ctx, x + 1450, 80, 330, 128, ["INFORMATION", "IS A PRODUCT"], "double");
  }
}
function atmosphere(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  const now = renderNow(); const red = index >= 3; const glow = ctx.createLinearGradient(0, 40, 0, GROUND_Y);
  glow.addColorStop(0, red ? "rgba(170,14,24,.08)" : "rgba(246,105,37,.04)"); glow.addColorStop(1, red ? "rgba(230,28,34,.14)" : "rgba(228,107,35,.08)");
  ctx.fillStyle = glow; ctx.fillRect(x, 0, FUDDER_SECTION_WIDTH, GROUND_Y);
  ctx.fillStyle = `rgba(80,90,103,${.025 + Math.sin(now / 1700 + index) * .008})`; ctx.fillRect(x, GROUND_Y - 65, FUDDER_SECTION_WIDTH, 65);
  for (const lx of [170, 520, 900, 1280, 1640]) { const alpha = .08 + flicker(x + lx, .002) * .05; ctx.fillStyle = red ? `rgba(255,40,36,${alpha})` : `rgba(255,174,72,${alpha})`; ctx.beginPath(); ctx.moveTo(x + lx - 7, 58); ctx.lineTo(x + lx - 72, GROUND_Y); ctx.lineTo(x + lx + 72, GROUND_Y); ctx.lineTo(x + lx + 7, 58); ctx.fill(); }
}
function drawSection(ctx: CanvasRenderingContext2D, index: number): void {
  const x = index * FUDDER_SECTION_WIDTH; paintedSection(ctx, index, x); atmosphere(ctx, index, x); drawDecksAndLadders(ctx, index); drawLandmarks(ctx, index, x);
}
export function drawFudderTerritory(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  const world = fudderTerritoryFor(level); if (!world) return;
  ctx.fillStyle = "#070b12"; ctx.fillRect(0, -240, canvasW, GROUND_Y + 560);
  ctx.save(); ctx.translate(-camX, 0);
  const first = Math.max(0, Math.floor(camX / FUDDER_SECTION_WIDTH));
  const last = Math.min(FUDDER_SECTIONS.length - 1, Math.floor((camX + canvasW) / FUDDER_SECTION_WIDTH));
  for (let index = first; index <= last; index += 1) drawSection(ctx, index); ctx.restore();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 300); floor.addColorStop(0, "#20252b"); floor.addColorStop(1, "#06080c");
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND_Y, canvasW, 300); ctx.fillStyle = "#85888a"; ctx.fillRect(0, GROUND_Y - 4, canvasW, 4);
}
export function fudderSectionLabelAt(level: number, x: number): string | null {
  if (level !== FUDDER_TERRITORY_LEVEL) return null;
  return FUDDER_SECTIONS[Math.max(0, Math.min(FUDDER_SECTIONS.length - 1, Math.floor(x / FUDDER_SECTION_WIDTH)))];
}
export const __fudderTerritoryTest = {
  sectionWidth: FUDDER_SECTION_WIDTH, posterText: FUDDER_POSTER_TEXT, visualDeckIds: FUDDER_VISUAL_DECK_IDS,
  blueprintMap: FUDDER_BLUEPRINT_MAP, atlasUrl: fudderAtlas.url, bundledAtlasUrl: fudderAtlasLocal,
  sectionArtUrls: sectionAssets.map((asset) => asset.url), bundledSectionArtUrls: sectionSources,
  atlasReady: () => Boolean(fudderImage?.complete && fudderImage.naturalWidth > 0),
  sectionArtReady: () => sectionReady.every(Boolean),
};
