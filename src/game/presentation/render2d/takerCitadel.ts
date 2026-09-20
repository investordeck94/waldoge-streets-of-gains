/** LEVEL 7 — THE TAKER'S CITADEL. Blueprint-authored presentation only. */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor, laddersFor } from "@/game/config/world";
import anonAsset from "@/assets/anon-waldoges-boss.png.asset.json";
import { flicker, renderNow } from "./clock";

export const TAKER_CITADEL_LEVEL = 6;
export const TAKER_SECTION_WIDTH = 1800;
export const TAKER_SECTIONS = [
  "THE TAKEN DISTRICT",
  "THE TICKER DISTRICT",
  "THE COPY MACHINE",
  "THE INNER CITADEL",
  "TICKER TAKER'S THRONE",
] as const;

export const CITADEL_KEY_POSITION = { x: 6360, y: 88 } as const;
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
  anonImage.src = anonAsset.url;
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

function drawTaken(ctx: CanvasRenderingContext2D, x: number): void {
  panel(ctx, x + 360, 18, 720, 48, ["TICKER TAKER NETWORK"], "red", 27);
  panel(ctx, x + 470, 76, 610, 150, [
    "JEET DISTRICT — ACQUIRED", "RUGGER EXCHANGE — ACQUIRED", "BAD ACTORS STUDIOS — ACQUIRED",
    "FUDDER MEDIA — ACQUIRED", "EXIT LIQUIDITY — ACQUIRED", "MR. MARKETER — ACQUIRED",
  ], "white", 15);
  panel(ctx, x + 36, 76, 250, 146, ["ALL", "EMPIRES", "NOW HIS"], "red", 25);
  panel(ctx, x + 1260, 54, 430, 104, ["SAME COMMUNITY.", "STRONGER TOGETHER."], "red", 22);
}

function drawTicker(ctx: CanvasRenderingContext2D, x: number): void {
  panel(ctx, x + 300, 28, 860, 46, ["THE MARKET NEVER SLEEPS"], "red", 25);
  panel(ctx, x + 330, 88, 790, 132, ["▁▃▂▅▃▆▅▇  ▲  +98.7%", "╲╱╲╱╲╱╲╱  LIVE MARKET"], "blue", 25);
  panel(ctx, x + 1160, 78, 220, 150, ["BUY", "OBEY", "TRADE", "REPEAT"], "red", 21);
  panel(ctx, x + 1410, 62, 320, 170, ["GLOBAL CONTROL", "REAL TIME", "MANIPULATION"], "white", 19);
}

function drawCopy(ctx: CanvasRenderingContext2D, x: number): void {
  panel(ctx, x + 380, 14, 620, 50, ["WALDOGE ANALYSIS"], "red", 25);
  // Central scanner / observation chamber.
  ctx.save();
  ctx.strokeStyle = "#ff2848"; ctx.lineWidth = 6; ctx.shadowColor = "#ff2848"; ctx.shadowBlur = 22;
  ctx.strokeRect(x + 430, 76, 300, 188); ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,26,70,.11)"; ctx.fillRect(x + 438, 84, 284, 172);
  ctx.fillStyle = "#ff3657"; ctx.font = "900 54px Impact, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("W", x + 580, 190);
  ctx.restore();
  panel(ctx, x + 760, 80, 520, 170, ["MOVESET COPIED  ✓", "COMBAT DATA  ✓", "COMMUNITY PATTERNS  ✓", "BEHAVIOUR MODEL  ✓", "REPLICATION: 98%"], "white", 17);
  panel(ctx, x + 420, 270, 720, 42, ["WALDOGE DETECTED"], "red", 24);
  for (const off of [80, 250, 1320, 1500]) panel(ctx, x + off, 96, 130, 162, ["SERVER", "DATA", "ONLINE"], "blue", 14);
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
  panel(ctx, x - 105, y - 102, 210, 34, [quest.keyAvailable ? "TAKE THE KEY" : "KEY — GUARDED"], quest.keyAvailable ? "gold" : "red", 16);
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
  panel(ctx, x - 150, 0, 300, 32, [quest.rescued ? "ANON RESCUED" : "ANON WALDOGE'S BOSS — CAPTURED"], "purple", 13);
}

function drawCitadel(ctx: CanvasRenderingContext2D, x: number): void {
  panel(ctx, x + 40, 20, 280, 174, ["ONE", "MARKET", "ONE TRUTH", "ONE OWNER"], "red", 22);
  panel(ctx, x + 1270, 34, 300, 130, ["DATA CAPTURE", "COMMUNITY ACQUISITION", "100%"], "red", 17);
  // Key and prison architecture remain distinct.
  ctx.fillStyle = "#080b13"; ctx.fillRect(x + 360, 60, 760, GROUND_Y - 60);
  ctx.strokeStyle = "#263d5b"; ctx.lineWidth = 5; ctx.strokeRect(x + 360, 60, 760, GROUND_Y - 60);
  ctx.fillStyle = "#0a0813"; ctx.fillRect(x + 1100, 0, 620, GROUND_Y);
  ctx.strokeStyle = "#793bb0"; ctx.strokeRect(x + 1100, 0, 620, GROUND_Y);
  keyDisplay(ctx);
  anonCage(ctx);
}

function statue(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.save(); ctx.fillStyle = "#d4a938"; ctx.shadowColor = "#f5d66d"; ctx.shadowBlur = 15;
  ctx.fillRect(x - 18, GROUND_Y - 72, 36, 58); ctx.beginPath(); ctx.arc(x, GROUND_Y - 88, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#504019"; ctx.fillRect(x - 28, GROUND_Y - 14, 56, 14); ctx.restore();
}

function drawThrone(ctx: CanvasRenderingContext2D, x: number): void {
  panel(ctx, x + 250, 18, 910, 46, ["THE CRYPTOVERSE IS MINE"], "red", 25);
  panel(ctx, x + 1310, 48, 330, 120, ["WALDOGE", "WAS JUST", "THE BEGINNING"], "red", 20);
  // Giant globe + throne behind the clear arena lane.
  ctx.save(); ctx.strokeStyle = "#ff2848"; ctx.lineWidth = 5; ctx.shadowColor = "#ff2848"; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(x + 780, 165, 94, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 780, 165, 42, 94, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 690, 150); ctx.lineTo(x + 870, 150); ctx.moveTo(x + 700, 190); ctx.lineTo(x + 860, 190); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = "#350915"; ctx.fillRect(x + 720, 222, 120, 90); ctx.fillRect(x + 698, 206, 164, 28);
  ctx.strokeStyle = "#e4b73d"; ctx.strokeRect(x + 720, 222, 120, 90); ctx.restore();
  statue(ctx, x + 570); statue(ctx, x + 990);
  panel(ctx, x + 650, 270, 260, 38, ["LET'S SEE WHO'S BETTER"], "red", 16);
}

const DRAW = [drawTaken, drawTicker, drawCopy, drawCitadel, drawThrone] as const;

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
  const first = Math.max(0, Math.floor(camX / TAKER_SECTION_WIDTH));
  const last = Math.min(4, Math.floor((camX + canvasW) / TAKER_SECTION_WIDTH));
  for (let i = first; i <= last; i++) {
    const start = i * TAKER_SECTION_WIDTH;
    skyline(ctx, start, i); atmosphere(ctx, start, i); DRAW[i](ctx, start);
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

export const __takerCitadelTest = {
  anonUrl: anonAsset.url,
  blueprintMap: CITADEL_BLUEPRINT_MAP,
  keyPosition: CITADEL_KEY_POSITION,
  cagePosition: ANON_CAGE_POSITION,
  deckIds: () => landingDecksFor(TAKER_CITADEL_LEVEL).map((deck) => deck.id),
  ladderIds: () => laddersFor(TAKER_CITADEL_LEVEL).map((ladder) => ladder.id),
};