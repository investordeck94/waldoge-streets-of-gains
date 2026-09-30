/** LEVEL 7 — THE TAKER'S CITADEL. Blueprint-authored presentation only. */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor, laddersFor } from "@/game/config/world";
import anonAsset from "@/assets/anon-waldoges-boss.png.asset.json";
// Pre-scaled (25%) copy of the same portrait: drawn 78px tall, so the full
// 1145x1374 original only added ~6 MB of decoded memory to Level 7.
import anonLocalUrl from "@/assets/anon-waldoges-boss-local-l7.png";
import { flicker, renderNow } from "./clock";
import { blueprintSky, sceneTaken, sceneTicker, sceneCopy, sceneCitadelBack, sceneThrone } from "./takerBlueprintScenes";
import { CITADEL_SECTION_BOUNDS, validateCitadelBlueprint } from "@/game/config/citadelBlueprint";
import { residentImage, setImageWanted, isResident } from "./imageResidency";
import takenBg from "@/assets/level7-taken-bg.jpg";
import tickerBg from "@/assets/level7-ticker-bg.jpg";
import copyBg from "@/assets/level7-copy-bg.jpg";
import citadelBg from "@/assets/level7-citadel-bg.jpg";
import throneBg from "@/assets/level7-throne-bg.jpg";

export const TAKER_CITADEL_LEVEL = 6;
export const TAKER_SECTION_WIDTH = 1800;
export const TAKER_SECTIONS = [
  "THE TAKEN DISTRICT",
  "THE TICKER DISTRICT",
  "THE COPY MACHINE",
  "THE INNER CITADEL",
  "TICKER TAKER'S THRONE",
] as const;

export const CITADEL_KEY_POSITION = { x: 6360, y: 262 } as const;
export const ANON_CAGE_POSITION = { x: 6900, y: 88 } as const;

export interface CitadelLandmark {
  id: string;
  section: number;
  x0: number;
  x1: number;
  layer: "background" | "gameplay" | "foreground";
  collision: false;
}

export const CITADEL_BLUEPRINT_MAP: readonly CitadelLandmark[] = [
  { id: "ticker-taker-network", section: 0, x0: 240, x1: 1180, layer: "gameplay", collision: false },
  { id: "acquisition-board", section: 0, x0: 480, x1: 1120, layer: "gameplay", collision: false },
  { id: "all-empires", section: 0, x0: 40, x1: 260, layer: "foreground", collision: false },
  { id: "market-never-sleeps", section: 1, x0: 2040, x1: 3140, layer: "gameplay", collision: false },
  { id: "global-control", section: 1, x0: 3140, x1: 3500, layer: "foreground", collision: false },
  { id: "waldoge-analysis", section: 2, x0: 3740, x1: 4900, layer: "gameplay", collision: false },
  { id: "replication-98", section: 2, x0: 4540, x1: 5160, layer: "gameplay", collision: false },
  { id: "waldoge-detected", section: 2, x0: 4050, x1: 4820, layer: "foreground", collision: false },
  { id: "inner-citadel", section: 3, x0: 5420, x1: 7200, layer: "background", collision: false },
  { id: "key-stronghold", section: 3, x0: 5800, x1: 6600, layer: "gameplay", collision: false },
  { id: "key", section: 3, x0: 6320, x1: 6400, layer: "gameplay", collision: false },
  { id: "anon-prison", section: 3, x0: 6660, x1: 7140, layer: "gameplay", collision: false },
  { id: "cryptoverse-display", section: 4, x0: 7580, x1: 8500, layer: "gameplay", collision: false },
  { id: "ticker-throne", section: 4, x0: 8180, x1: 8620, layer: "gameplay", collision: false },
  { id: "final-arena", section: 4, x0: 7800, x1: 8920, layer: "gameplay", collision: false },
] as const;

export interface CitadelQuestView {
  keyAvailable: boolean;
  keyTaken: boolean;
  rescued: boolean;
}

let quest: CitadelQuestView = { keyAvailable: false, keyTaken: false, rescued: false };
export function setCitadelQuestState(next: CitadelQuestView): void { quest = next; }
export function getCitadelQuestState(): CitadelQuestView { return quest; }

let anonImage: HTMLImageElement | null = null;
let anonReady = false;
export function preloadTakerCitadel(): void {
  if (typeof Image === "undefined" || anonImage) return;
  anonImage = new Image();
  anonImage.decoding = "sync";
  anonImage.onload = () => { anonReady = true; };
  // Keep the uploaded CDN pointer as provenance, but use the bundled original
  // in the canvas: preview middleware can return HTML for asset-pointer URLs.
  residentImage(anonImage, anonLocalUrl, [6], { pin: true });
}
preloadTakerCitadel();

export function hasTakerCitadel(level: number): boolean { return level === TAKER_CITADEL_LEVEL; }

type Tone = "red" | "blue" | "gold" | "purple" | "white";
const TONES: Record<Tone, [string, string, string]> = {
  red: ["#17070c", "#ff2848", "#ffdce2"],
  blue: ["#061526", "#28b8ff", "#dbf5ff"],
  gold: ["#1d1604", "#f4c542", "#fff3bd"],
  purple: ["#160626", "#b851ff", "#f2ddff"],
  white: ["#11151d", "#d9e5ee", "#ffffff"],
};

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: readonly string[], tone: Tone = "red", font = 18): void {
  const [fill, edge, text] = TONES[tone];
  ctx.save();
  ctx.shadowColor = edge; ctx.shadowBlur = 14;
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0; ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `900 ${font}px Impact, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * (i + 1) / (lines.length + 1), w - 18));
  ctx.restore();
}

function takerMark(ctx: CanvasRenderingContext2D, x: number, y: number, size = 18, color = "#ff2848"): void {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, size / 7); ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(x - size, y - size * .7); ctx.lineTo(x + size, y - size * .7); ctx.lineTo(x, y + size); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - size * .45, y - size * .35); ctx.lineTo(x + size * .45, y - size * .35); ctx.lineTo(x, y + size * .42); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function windows(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = color;
  for (let py = y + 10; py < y + h - 5; py += 19) for (let px = x + 10; px < x + w - 5; px += 23) ctx.fillRect(px, py, 8, 5);
  ctx.restore();
}

/**
 * The blueprint's "7.x TITLE" header is a document caption above each panel,
 * not in-world scenery. Drawing it in the sky collided with the game's own
 * "LEVEL 7/7 — WAVE" readout, so it is intentionally not rendered in-game.
 */
function sectionMasthead(_ctx: CanvasRenderingContext2D, _start: number, _title: string, _subtitle: string): void {
  // intentionally empty
}

function candles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save(); ctx.fillStyle = "#07131d"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#28b8ff"; ctx.strokeRect(x, y, w, h);
  const values = [42, 67, 34, 81, 56, 96, 72, 112, 86, 124, 103, 137];
  const step = w / values.length;
  values.forEach((value, index) => {
    const px = x + step * index + step / 2; const up = index % 3 !== 1;
    ctx.strokeStyle = up ? "#45f0a1" : "#ff3657"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, y + h - value - 13); ctx.lineTo(px, y + h - value + 17); ctx.stroke();
    ctx.fillStyle = up ? "#45f0a1" : "#ff3657"; ctx.fillRect(px - 5, y + h - value, 10, 17);
  }); ctx.restore();
}

function waldogeScan(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = "rgba(255,40,72,.78)"; ctx.strokeStyle = "#ff9aac"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -67, 24, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-18, -87); ctx.lineTo(-32, -112); ctx.lineTo(-4, -98); ctx.lineTo(18, -88); ctx.lineTo(34, -111); ctx.lineTo(31, -74); ctx.closePath(); ctx.fill();
  ctx.fillRect(-23, -44, 46, 68); ctx.fillRect(-39, -34, 18, 57); ctx.fillRect(21, -34, 18, 57); ctx.fillRect(-22, 22, 17, 54); ctx.fillRect(5, 22, 17, 54);
  ctx.beginPath(); ctx.moveTo(-19, -67); ctx.lineTo(19, -67); ctx.stroke(); ctx.restore();
}

function copyBay(ctx: CanvasRenderingContext2D, x: number, y: number, accent: string): void {
  ctx.fillStyle = "#080d17"; ctx.fillRect(x, y, 126, 88); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.strokeRect(x, y, 126, 88);
  ctx.beginPath(); ctx.arc(x + 63, y + 43, 25, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = accent; ctx.fillRect(x + 56, y + 20, 14, 44); ctx.fillRect(x + 42, y + 37, 42, 11);
}

function tower(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, accent: string): void {
  const top = GROUND_Y - h;
  ctx.fillStyle = "#080d19"; ctx.fillRect(x, top, w, h);
  ctx.strokeStyle = "#253650"; ctx.lineWidth = 4; ctx.strokeRect(x, top, w, h);
  ctx.fillStyle = "#111c2d";
  for (let y = top + 16; y < GROUND_Y - 18; y += 26) ctx.fillRect(x + 10, y, w - 20, 12);
  ctx.fillStyle = accent;
  for (let y = top + 18; y < GROUND_Y - 18; y += 52) {
    for (let wx = x + 18; wx < x + w - 12; wx += 34) ctx.fillRect(wx, y, 12, 6);
  }
  ctx.fillStyle = "#05070d"; ctx.fillRect(x - 8, top - 14, w + 16, 14);
  ctx.fillStyle = accent; ctx.fillRect(x - 8, top - 14, w + 16, 3);
  if (w > 125) takerMark(ctx, x + w / 2, top + 24, 10, accent);
}

function skyline(ctx: CanvasRenderingContext2D, start: number, index: number): void {
  ctx.fillStyle = index === 4 ? "#08050d" : "#050a16";
  ctx.fillRect(start, -80, TAKER_SECTION_WIDTH, GROUND_Y + 80);
  for (let i = 0; i < 12; i++) {
    const x = start + i * 160 - 40;
    const h = 120 + ((i * 73 + index * 51) % 165);
    tower(ctx, x, 118 + ((i * 29) % 46), h, i % 3 === 0 ? "#d91f43" : "#16395d");
  }
  // Blueprint red searchlight towers.
  for (const off of [110, 610, 1120, 1640]) {
    const x = start + off;
    ctx.fillStyle = "#0d111c"; ctx.fillRect(x - 18, 42, 36, GROUND_Y - 42);
    ctx.strokeStyle = "#ff2848"; ctx.lineWidth = 3; ctx.strokeRect(x - 18, 42, 36, GROUND_Y - 42);
    const beam = ctx.createLinearGradient(x, 42, x, GROUND_Y);
    beam.addColorStop(0, "rgba(255,40,72,.34)"); beam.addColorStop(1, "rgba(255,40,72,0)");
    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(x - 8, 50); ctx.lineTo(x - 90, GROUND_Y); ctx.lineTo(x + 90, GROUND_Y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ff3350"; ctx.fillRect(x - 7, 45, 14, 9);
  }
}

function cables(ctx: CanvasRenderingContext2D, start: number): void {
  ctx.strokeStyle = "#321528"; ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(start + i * 390, 0);
    ctx.bezierCurveTo(start + 130 + i * 390, 110, start + 250 + i * 390, 100, start + 390 + i * 390, 0);
    ctx.stroke();
  }
}

function industrialFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent = "#ff2848"): void {
  ctx.save();
  ctx.fillStyle = "#080c15"; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#253650"; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  for (let px = x + 18; px < x + w; px += 74) {
    ctx.beginPath(); ctx.moveTo(px, y + h); ctx.lineTo(px + 38, y); ctx.stroke();
  }
  ctx.fillStyle = accent; ctx.fillRect(x, y, w, 4);
  ctx.restore();
}

function verticalCore(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, accent: string): void {
  ctx.fillStyle = "#050810"; ctx.fillRect(x, top, w, GROUND_Y - top);
  ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.strokeRect(x, top, w, GROUND_Y - top);
  ctx.fillStyle = accent;
  for (let y = top + 14; y < GROUND_Y - 8; y += 34) ctx.fillRect(x + 8, y, w - 16, 4);
}

function dataColumns(ctx: CanvasRenderingContext2D, x: number, y: number, columns: number, rows: number): void {
  ctx.save(); ctx.font = "700 10px monospace"; ctx.textAlign = "left";
  for (let col = 0; col < columns; col++) {
    const px = x + col * 92;
    ctx.fillStyle = col % 2 ? "#31c5ff" : "#ff3657";
    for (let row = 0; row < rows; row++) {
      const value = ((col + 3) * 173 + row * 47) % 997;
      ctx.fillText(`${value.toString().padStart(3, "0")}.${(row * 7) % 10}`, px, y + row * 15);
    }
  }
  ctx.restore();
}

function conduit(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, accent: string): void {
  ctx.save();
  ctx.strokeStyle = "#111a29"; ctx.lineWidth = 12; ctx.lineCap = "square";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
  for (let x = x0 + 24; x < x1; x += 64) {
    ctx.fillStyle = "#324157"; ctx.fillRect(x, y0 - 7, 5, 14);
  }
  ctx.restore();
}

function terminal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tone: Tone, label: string): void {
  const [fill, edge, text] = TONES[tone];
  ctx.save();
  ctx.fillStyle = "#050810"; ctx.fillRect(x - 7, y - 7, w + 14, h + 25);
  ctx.strokeStyle = "#28384d"; ctx.lineWidth = 3; ctx.strokeRect(x - 7, y - 7, w + 14, h + 25);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = text; ctx.font = "900 11px monospace"; ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 16, w - 8);
  ctx.fillStyle = edge;
  for (let row = 0; row < 4; row++) {
    const width = 22 + ((row * 29 + x) % Math.max(24, w - 42));
    ctx.fillRect(x + 10, y + 27 + row * 10, Math.min(width, w - 20), 3);
  }
  ctx.fillStyle = "#1d2939"; ctx.fillRect(x + w / 2 - 5, y + h, 10, 18);
  ctx.fillRect(x + w / 2 - 22, y + h + 16, 44, 4);
  ctx.restore();
}

function girderBay(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string): void {
  ctx.save();
  ctx.strokeStyle = "#253650"; ctx.lineWidth = 7; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.fillStyle = accent; ctx.fillRect(x - 3, y - 3, 7, 7); ctx.fillRect(x + w - 4, y - 3, 7, 7);
  ctx.restore();
}

/** Architectural backing follows the locked collision decks exactly. */
function geometryArchitecture(ctx: CanvasRenderingContext2D, section: number): void {
  const accent = section === 3 ? "#a948e3" : section === 1 || section === 2 ? "#21a8d9" : "#d91f43";
  for (const deck of landingDecksFor(TAKER_CITADEL_LEVEL)) {
    if (deck.section !== section) continue;
    const w = deck.x1 - deck.x0;
    ctx.fillStyle = "#09101b"; ctx.fillRect(deck.x0, deck.y + 10, w, 10);
    ctx.fillStyle = accent; ctx.fillRect(deck.x0, deck.y + 10, w, 2);
    for (let sx = deck.x0 + 16; sx < deck.x1 - 8; sx += 72) {
      const supportH = Math.min(48, GROUND_Y - deck.y - 20);
      if (supportH <= 4) continue;
      ctx.strokeStyle = "#26384e"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(sx, deck.y + 18); ctx.lineTo(sx, deck.y + 18 + supportH); ctx.stroke();
      ctx.strokeStyle = accent; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, deck.y + 18); ctx.lineTo(Math.min(sx + 42, deck.x1), deck.y + 18 + supportH); ctx.stroke();
    }
  }
  // Ladder wells are visual housings around the existing navigation objects;
  // the actual rungs remain the shared terrain renderer's responsibility.
  for (const ladder of laddersFor(TAKER_CITADEL_LEVEL)) {
    if (ladder.section !== section) continue;
    ctx.fillStyle = "rgba(4,8,16,.72)";
    ctx.fillRect(ladder.x - 24, ladder.top - 30, 48, ladder.bottom - ladder.top + 32);
    ctx.strokeStyle = accent; ctx.lineWidth = 1;
    ctx.strokeRect(ladder.x - 25, ladder.top - 31, 50, ladder.bottom - ladder.top + 34);
  }
}

function drawTaken(ctx: CanvasRenderingContext2D, x: number): void {
  sceneTaken(ctx, x); sectionMasthead(ctx, x, "7.1  THE TAKEN DISTRICT", "EVERYTHING IS MINE"); geometryArchitecture(ctx, 0);
}
function drawTicker(ctx: CanvasRenderingContext2D, x: number): void {
  sceneTicker(ctx, x); sectionMasthead(ctx, x, "7.2  THE TICKER DISTRICT", "THE MARKET NEVER SLEEPS"); geometryArchitecture(ctx, 1);
}
function drawCopy(ctx: CanvasRenderingContext2D, x: number): void {
  sceneCopy(ctx, x); sectionMasthead(ctx, x, "7.3  THE COPY MACHINE", "ANALYSE. REPLICATE. DOMINATE."); geometryArchitecture(ctx, 2);
}

function keyDisplay(ctx: CanvasRenderingContext2D): void {
  if (quest.keyTaken) return;
  const { x, y } = CITADEL_KEY_POSITION;
  const bob = Math.sin(renderNow() / 300) * 4;
  ctx.save(); ctx.translate(x, y - 34 + bob);
  ctx.shadowColor = quest.keyAvailable ? "#ffd940" : "#ff2848"; ctx.shadowBlur = 20;
  ctx.strokeStyle = quest.keyAvailable ? "#ffd940" : "#a05c20"; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(-11, 0, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(36, 0); ctx.lineTo(36, 12); ctx.moveTo(24, 0); ctx.lineTo(24, 10); ctx.stroke();
  ctx.restore();
  panel(ctx, x - 145, y - 112, 290, 44, [quest.keyAvailable ? "TAKE THE KEY" : "KEY — GUARDED", "TICKER TAKER'S FORCES"], quest.keyAvailable ? "gold" : "red", 12);
}

function drawAnon(ctx: CanvasRenderingContext2D, x: number, feetY: number, height: number): void {
  if (!anonImage || (!anonReady && (!anonImage.complete || anonImage.naturalWidth === 0))) return;
  const bob = Math.sin(renderNow() / 520) * 2;
  const width = height * anonImage.naturalWidth / anonImage.naturalHeight;
  ctx.drawImage(anonImage, x - width / 2, feetY - height + bob, width, height);
}

function anonCage(ctx: CanvasRenderingContext2D): void {
  const { x, y } = ANON_CAGE_POSITION;
  const w = 190, h = 86, left = x - w / 2, top = y - h;
  drawAnon(ctx, quest.rescued ? x + 138 : x, y, 78);
  ctx.save();
  if (!quest.rescued) {
    ctx.fillStyle = "rgba(10,4,22,.55)"; ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = "#bb57ff"; ctx.lineWidth = 5; ctx.strokeRect(left, top, w, h);
    for (let bx = left + 16; bx < left + w; bx += 24) { ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx, y); ctx.stroke(); }
    ctx.fillStyle = quest.keyTaken ? "#ffd940" : "#9fabb8"; ctx.fillRect(x - 12, y - 42, 24, 22);
  } else {
    ctx.strokeStyle = "#6e3a91"; ctx.lineWidth = 5; ctx.strokeRect(left, top, w, h);
    ctx.save(); ctx.translate(left - 8, y); ctx.rotate(-0.42); ctx.strokeRect(0, -h, w / 2, h); ctx.restore();
  }
  ctx.restore();
  panel(ctx, x - 150, top - 38, 300, 32, [quest.rescued ? "ANON RESCUED" : "ANON WALDOGE'S BOSS — CAPTURED"], "purple", 13);
}

function drawCitadel(ctx: CanvasRenderingContext2D, x: number): void {
  sceneCitadelBack(ctx, x);
  sectionMasthead(ctx, x, "7.4  THE INNER CITADEL", "TOTAL CONTROL");
  geometryArchitecture(ctx, 3);
  keyDisplay(ctx);
  anonCage(ctx);
}

function statue(ctx: CanvasRenderingContext2D, x: number, kind: "cat" | "dog"): void {
  ctx.save(); ctx.fillStyle = "#d4a938"; ctx.shadowColor = "#f5d66d"; ctx.shadowBlur = 15;
  ctx.fillRect(x - 18, GROUND_Y - 72, 36, 58); ctx.beginPath(); ctx.arc(x, GROUND_Y - 88, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  if (kind === "cat") { ctx.moveTo(x - 16, GROUND_Y - 101); ctx.lineTo(x - 11, GROUND_Y - 121); ctx.lineTo(x - 2, GROUND_Y - 105); ctx.moveTo(x + 16, GROUND_Y - 101); ctx.lineTo(x + 11, GROUND_Y - 121); ctx.lineTo(x + 2, GROUND_Y - 105); }
  else { ctx.ellipse(x - 18, GROUND_Y - 90, 8, 20, -.35, 0, Math.PI * 2); ctx.ellipse(x + 18, GROUND_Y - 90, 8, 20, .35, 0, Math.PI * 2); }
  ctx.fill();
  ctx.fillStyle = "#504019"; ctx.fillRect(x - 28, GROUND_Y - 14, 56, 14); ctx.restore();
}

function drawThrone(ctx: CanvasRenderingContext2D, x: number): void {
  sceneThrone(ctx, x); sectionMasthead(ctx, x, "7.5  TICKER TAKER'S THRONE", "THE FINAL FIGHT"); geometryArchitecture(ctx, 4);
}

/**
 * Painted blueprint backdrops — one per section, repainted from the supplied
 * section blueprints (architecture only: no characters, ladders or walkable
 * platforms, which stay the game's own world objects). World-anchored: each
 * spans 1800 units from start+100 so its landmark sits at the gameplay
 * camera centre (start+1000). Only the camera's section and its neighbours
 * stay decoded, keeping Level 7's picture memory low on phones.
 */
const BACKDROP_SOURCES = [takenBg, tickerBg, copyBg, citadelBg, throneBg] as const;
const BACKDROP_OFFSET = 100;
const backdrops: Array<HTMLImageElement | null> = [null, null, null, null, null];
const backdropReady = [false, false, false, false, false];

function backdropFor(index: number): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!backdrops[index]) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { backdropReady[index] = true; };
    backdrops[index] = residentImage(img, BACKDROP_SOURCES[index], [TAKER_CITADEL_LEVEL]);
  }
  return backdrops[index];
}

/** Keep only the backdrops of the camera's section and its neighbours. */
function streamBackdrops(camX: number, canvasW: number): void {
  const centre = Math.floor((camX + canvasW / 2 - BACKDROP_OFFSET) / TAKER_SECTION_WIDTH);
  for (let i = 0; i < 5; i++) {
    const want = Math.abs(i - centre) <= 1;
    if (want) backdropFor(i);
    if (!want && backdrops[i]) backdropReady[i] = false;
    setImageWanted(backdrops[i], want);
  }
}

/** Draws the painted backdrop; false while it is loading (procedural fallback). */
function paintedBackdrop(ctx: CanvasRenderingContext2D, index: number, start: number): boolean {
  const img = backdrops[index];
  if (!img || !isResident(img) || !img.complete || img.naturalWidth < 16) return false;
  if (!backdropReady[index]) backdropReady[index] = true;
  const w = TAKER_SECTION_WIDTH;
  const h = w * img.naturalHeight / img.naturalWidth;
  const x = start + BACKDROP_OFFSET;
  ctx.drawImage(img, x, GROUND_Y - h, w, h);
  // Soft structural seam where two painted sections meet.
  const seam = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
  seam.addColorStop(0, "rgba(2,5,11,0)"); seam.addColorStop(0.5, "rgba(2,5,11,.75)"); seam.addColorStop(1, "rgba(2,5,11,0)");
  ctx.fillStyle = seam; ctx.fillRect(x - 40, GROUND_Y - h, 80, h);
  return true;
}

const DRAW = [drawTaken, drawTicker, drawCopy, drawCitadel, drawThrone] as const;

/** Over a painted backdrop: only deck supports + the live key/cage objects. */
const FOREGROUND = [
  (ctx: CanvasRenderingContext2D) => geometryArchitecture(ctx, 0),
  (ctx: CanvasRenderingContext2D) => geometryArchitecture(ctx, 1),
  (ctx: CanvasRenderingContext2D) => geometryArchitecture(ctx, 2),
  (ctx: CanvasRenderingContext2D) => { geometryArchitecture(ctx, 3); keyDisplay(ctx); anonCage(ctx); },
  (ctx: CanvasRenderingContext2D) => geometryArchitecture(ctx, 4),
] as const satisfies ReadonlyArray<(ctx: CanvasRenderingContext2D, start: number) => void>;

function atmosphere(ctx: CanvasRenderingContext2D, start: number, index: number): void {
  cables(ctx, start);
  const glow = ctx.createLinearGradient(start, 0, start + TAKER_SECTION_WIDTH, GROUND_Y);
  glow.addColorStop(0, index === 3 ? "rgba(103,41,160,.08)" : "rgba(28,90,170,.07)");
  glow.addColorStop(0.5, "rgba(210,15,48,.11)"); glow.addColorStop(1, "rgba(0,0,0,.18)");
  ctx.fillStyle = glow; ctx.fillRect(start, -30, TAKER_SECTION_WIDTH, GROUND_Y + 30);
  const pulse = 0.12 + flicker(start, 0.003) * 0.08;
  ctx.fillStyle = `rgba(255,30,62,${pulse})`; ctx.fillRect(start, GROUND_Y - 3, TAKER_SECTION_WIDTH, 3);
}

export function drawTakerCitadel(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  if (!hasTakerCitadel(level)) return;
  getLevelWidth(level);
  ctx.fillStyle = "#02050b"; ctx.fillRect(0, -260, canvasW, GROUND_Y + 580);
  ctx.save(); ctx.translate(-camX, 0);
  streamBackdrops(camX, canvasW);
  const first = Math.max(0, Math.floor(camX / TAKER_SECTION_WIDTH));
  const last = Math.min(4, Math.floor((camX + canvasW) / TAKER_SECTION_WIDTH));
  for (let i = first; i <= last; i++) {
    const start = i * TAKER_SECTION_WIDTH;
    blueprintSky(ctx, start, TAKER_SECTION_WIDTH, i);
    // The painted backdrop for section i spans start+100..start+1900; the
    // previous section's backdrop covers this section's first 100 units.
    const painted = paintedBackdrop(ctx, i, start) && (i === 0 || paintedBackdrop(ctx, i - 1, start - TAKER_SECTION_WIDTH));
    if (!painted) { atmosphere(ctx, start, i); DRAW[i](ctx, start); }
    else FOREGROUND[i](ctx, start);
  }
  ctx.restore();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 260);
  floor.addColorStop(0, "#111725"); floor.addColorStop(1, "#020306");
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND_Y, canvasW, 280);
  ctx.fillStyle = "#3c526c"; ctx.fillRect(0, GROUND_Y - 4, canvasW, 4);
}

export function takerSectionLabelAt(level: number, x: number): string | null {
  if (!hasTakerCitadel(level)) return null;
  return TAKER_SECTIONS[Math.max(0, Math.min(4, Math.floor(x / TAKER_SECTION_WIDTH)))];
}

/** Level-7 validation overlay, called only by the existing CAM debug mode. */
export function drawTakerCitadelDebug(ctx: CanvasRenderingContext2D, level: number, camX: number, canvasW: number): void {
  if (!hasTakerCitadel(level)) return;
  const report = validateCitadelBlueprint();
  ctx.save();
  ctx.font = "9px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
  for (let i = 0; i < CITADEL_SECTION_BOUNDS.length; i++) {
    const sx = CITADEL_SECTION_BOUNDS[i] - camX;
    if (sx < -2 || sx > canvasW + 2) continue;
    ctx.strokeStyle = "rgba(255,215,0,.8)"; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, 500); ctx.stroke();
    ctx.fillStyle = "#ffd700"; ctx.fillText(`S${Math.min(i + 1, 5)} ${CITADEL_SECTION_BOUNDS[i]}`, sx + 3, 92);
  }
  for (const deck of landingDecksFor(level)) {
    const sx = deck.x0 - camX;
    if (sx + deck.x1 - deck.x0 < 0 || sx > canvasW) continue;
    ctx.strokeStyle = "rgba(60,255,170,.9)"; ctx.strokeRect(sx, deck.y - 3, deck.x1 - deck.x0, 6);
    ctx.fillStyle = "#7dffbf"; ctx.fillText(deck.id ?? "deck", sx + 2, deck.y - 16);
  }
  for (const ladder of laddersFor(level)) {
    const sx = ladder.x - camX;
    if (sx < 0 || sx > canvasW) continue;
    ctx.fillStyle = "#6fe7ff"; ctx.fillText(ladder.id ?? "ladder", sx + 4, ladder.top + 4);
  }
  ctx.fillStyle = report.valid ? "#72ff9e" : "#ff4964";
  ctx.fillText(`L7 VALIDATOR: ${report.valid ? "PASS" : "FAIL"} • ${report.deckCount} decks • ${report.ladderCount} ladders`, 250, 10);
  ctx.restore();
}

export const __takerCitadelTest = {
  anonUrl: anonAsset.url,
  anonLocalUrl,
  blueprintMap: CITADEL_BLUEPRINT_MAP,
  keyPosition: CITADEL_KEY_POSITION,
  cagePosition: ANON_CAGE_POSITION,
  deckIds: () => landingDecksFor(TAKER_CITADEL_LEVEL).map((deck) => deck.id),
  ladderIds: () => laddersFor(TAKER_CITADEL_LEVEL).map((ladder) => ladder.id),
};