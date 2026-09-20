/** LEVEL 7 — THE TAKER'S CITADEL. Blueprint-authored presentation only. */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor, laddersFor } from "@/game/config/world";
import anonAsset from "@/assets/anon-waldoges-boss.png.asset.json";
import anonLocalUrl from "@/assets/anon-waldoges-boss-local.png";
import { flicker, renderNow } from "./clock";
import { CITADEL_SECTION_BOUNDS, validateCitadelBlueprint } from "@/game/config/citadelBlueprint";

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
  anonImage.src = anonLocalUrl;
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
  industrialFrame(ctx, x + 20, 112, 280, 208);
  industrialFrame(ctx, x + 1160, 118, 610, 202);
  for (const off of [325, 785, 1120, 1325, 1710]) verticalCore(ctx, x + off, 66, 46, "#ff2848");
  girderBay(ctx, x + 300, 214, 320, 98, "#ff2848");
  girderBay(ctx, x + 800, 156, 320, 156, "#ff2848");
  girderBay(ctx, x + 1420, 214, 280, 98, "#ff2848");
  panel(ctx, x + 360, 18, 720, 48, ["TICKER TAKER NETWORK"], "red", 27);
  panel(ctx, x + 470, 76, 610, 150, [
    "JEET DISTRICT — ACQUIRED", "RUGGER EXCHANGE — ACQUIRED", "BAD ACTORS STUDIOS — ACQUIRED",
    "FUDDER MEDIA — ACQUIRED", "EXIT LIQUIDITY — ACQUIRED", "MR. MARKETER — ACQUIRED",
  ], "white", 15);
  panel(ctx, x + 36, 76, 250, 146, ["ALL", "EMPIRES", "NOW HIS"], "red", 25);
  panel(ctx, x + 1260, 54, 430, 104, ["SAME COMMUNITY.", "STRONGER TOGETHER."], "red", 22);
  terminal(ctx, x + 650, 236, 116, 62, "red", "EMPIRE 01");
  terminal(ctx, x + 1140, 230, 108, 62, "white", "ACQUIRED");
  conduit(ctx, x + 30, 246, x + 1740, 246, "#ff2848");
  dataColumns(ctx, x + 42, 238, 3, 4);
  geometryArchitecture(ctx, 0);
}

function drawTicker(ctx: CanvasRenderingContext2D, x: number): void {
  industrialFrame(ctx, x + 18, 92, 260, 228, "#28b8ff");
  industrialFrame(ctx, x + 1390, 88, 380, 232, "#ff2848");
  verticalCore(ctx, x + 286, 52, 42, "#ff2848");
  verticalCore(ctx, x + 1344, 44, 42, "#28b8ff");
  panel(ctx, x + 300, 28, 860, 46, ["THE MARKET NEVER SLEEPS"], "red", 25);
  panel(ctx, x + 330, 88, 790, 132, ["▁▃▂▅▃▆▅▇  ▲  +98.7%", "╲╱╲╱╲╱╲╱  LIVE MARKET"], "blue", 25);
  panel(ctx, x + 1160, 78, 220, 150, ["BUY", "OBEY", "TRADE", "REPEAT"], "red", 21);
  panel(ctx, x + 1410, 62, 320, 170, ["GLOBAL CONTROL", "REAL TIME", "MANIPULATION"], "white", 19);
  terminal(ctx, x + 860, 232, 126, 64, "blue", "BTC / USD");
  terminal(ctx, x + 1008, 232, 126, 64, "red", "WALDOGE");
  terminal(ctx, x + 1240, 238, 96, 58, "blue", "VOLUME");
  girderBay(ctx, x + 2460 - 1800, 214, 600, 98, "#28b8ff");
  girderBay(ctx, x + 2760 - 1800, 156, 260, 48, "#ff2848");
  conduit(ctx, x + 22, 274, x + 1738, 274, "#28b8ff");
  dataColumns(ctx, x + 36, 118, 2, 11);
  dataColumns(ctx, x + 1168, 246, 3, 5);
  ctx.strokeStyle = "#31c5ff"; ctx.lineWidth = 4; ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const px = x + 360 + i * 88, py = 266 - ((i * 37 + 28) % 76);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  geometryArchitecture(ctx, 1);
}

function drawCopy(ctx: CanvasRenderingContext2D, x: number): void {
  industrialFrame(ctx, x + 8, 96, 360, 224, "#28b8ff");
  industrialFrame(ctx, x + 1300, 90, 470, 230, "#ff2848");
  for (const off of [48, 218, 1320, 1500]) {
    verticalCore(ctx, x + off, 72, 38, off < 500 ? "#28b8ff" : "#ff2848");
  }
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
  for (const off of [1120, 1240]) {
    ctx.fillStyle = "#111824"; ctx.fillRect(x + off, 174, 94, 146);
    ctx.strokeStyle = "#31c5ff"; ctx.strokeRect(x + off, 174, 94, 146);
    ctx.fillStyle = "#ff2848"; ctx.beginPath(); ctx.arc(x + off + 47, 224, 28, 0, Math.PI * 2); ctx.fill();
  }
  for (const off of [82, 220]) {
    ctx.fillStyle = "#111824"; ctx.fillRect(x + off, 210, 92, 102);
    ctx.strokeStyle = "#31c5ff"; ctx.strokeRect(x + off, 210, 92, 102);
    ctx.fillStyle = "#31c5ff"; ctx.beginPath(); ctx.arc(x + off + 46, 246, 22, 0, Math.PI * 2); ctx.fill();
  }
  conduit(ctx, x + 365, 242, x + 1295, 242, "#31c5ff");
  conduit(ctx, x + 510, 74, x + 1180, 116, "#ff2848");
  girderBay(ctx, x + 4260 - 3600, 214, 600, 98, "#28b8ff");
  girderBay(ctx, x + 4560 - 3600, 156, 240, 48, "#ff2848");
  terminal(ctx, x + 1035, 94, 110, 62, "red", "CLONE 06");
  geometryArchitecture(ctx, 2);
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
  // A single dominant fortress silhouette supports the real key/prison decks.
  ctx.fillStyle = "#050712"; ctx.beginPath();
  ctx.moveTo(x + 180, GROUND_Y); ctx.lineTo(x + 360, 36); ctx.lineTo(x + 610, 36);
  ctx.lineTo(x + 690, -34); ctx.lineTo(x + 830, -34); ctx.lineTo(x + 930, 36);
  ctx.lineTo(x + 1510, 36); ctx.lineTo(x + 1710, GROUND_Y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#ff2848"; ctx.lineWidth = 5; ctx.stroke();
  for (const off of [340, 560, 880, 1100, 1360, 1580]) verticalCore(ctx, x + off, 42, 38, off > 1000 ? "#b851ff" : "#ff2848");
  panel(ctx, x + 40, 20, 280, 174, ["ONE", "MARKET", "ONE TRUTH", "ONE OWNER"], "red", 22);
  panel(ctx, x + 1270, 34, 300, 130, ["DATA CAPTURE", "COMMUNITY ACQUISITION", "100%"], "red", 17);
  // Key and prison architecture remain distinct.
  ctx.fillStyle = "#080b13"; ctx.fillRect(x + 360, 60, 760, GROUND_Y - 60);
  ctx.strokeStyle = "#263d5b"; ctx.lineWidth = 5; ctx.strokeRect(x + 360, 60, 760, GROUND_Y - 60);
  ctx.fillStyle = "#0a0813"; ctx.fillRect(x + 1100, 0, 620, GROUND_Y);
  ctx.strokeStyle = "#793bb0"; ctx.strokeRect(x + 1100, 0, 620, GROUND_Y);
  // The four visible tiers correspond exactly to the locked collision bands.
  for (const [y, x0, x1] of [
    [262, 5400, 6500], [204, 6380, 7160], [146, 6500, 7060], [88, 6750, 7000],
  ] as const) {
    ctx.fillStyle = "#101625"; ctx.fillRect(x0, y + 10, x1 - x0, 9);
    ctx.fillStyle = y === 88 ? "#b851ff" : "#ff2848"; ctx.fillRect(x0, y + 10, x1 - x0, 2);
    for (let sx = x0 + 28; sx < x1 - 18; sx += 84) girderBay(ctx, sx, y + 19, Math.min(60, x1 - sx), Math.min(34, GROUND_Y - y - 20), y === 88 ? "#b851ff" : "#7b263b");
  }
  panel(ctx, x + 370, 74, 230, 48, ["INNER CITADEL"], "red", 18);
  panel(ctx, x + 720, 98, 215, 44, ["KEY STRONGHOLD"], "gold", 16);
  terminal(ctx, x + 420, 156, 112, 60, "red", "ACCESS 7.4");
  terminal(ctx, x + 946, 218, 106, 60, "purple", "PRISON NET");
  conduit(ctx, x + 350, 232, x + 1690, 232, "#b851ff");
  geometryArchitecture(ctx, 3);
  keyDisplay(ctx);
  anonCage(ctx);
}

function statue(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.save(); ctx.fillStyle = "#d4a938"; ctx.shadowColor = "#f5d66d"; ctx.shadowBlur = 15;
  ctx.fillRect(x - 18, GROUND_Y - 72, 36, 58); ctx.beginPath(); ctx.arc(x, GROUND_Y - 88, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#504019"; ctx.fillRect(x - 28, GROUND_Y - 14, 56, 14); ctx.restore();
}

function drawThrone(ctx: CanvasRenderingContext2D, x: number): void {
  // Wide final hall: architecture remains behind y=250, preserving the full
  // main-floor boss lane from the approach through x=9000.
  industrialFrame(ctx, x + 10, 94, 220, 226);
  industrialFrame(ctx, x + 1160, 102, 610, 218);
  for (const off of [80, 260, 1260, 1540, 1720]) verticalCore(ctx, x + off, 42, 44, "#ff2848");
  panel(ctx, x + 250, 18, 910, 46, ["THE CRYPTOVERSE IS MINE"], "red", 25);
  panel(ctx, x + 34, 46, 190, 120, ["YOU", "TRADE", "I TAKE"], "red", 21);
  panel(ctx, x + 1310, 48, 330, 120, ["WALDOGE", "WAS JUST", "THE BEGINNING"], "red", 20);
  // Giant globe + throne behind the clear arena lane.
  ctx.save(); ctx.strokeStyle = "#ff2848"; ctx.lineWidth = 5; ctx.shadowColor = "#ff2848"; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(x + 780, 165, 94, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 780, 165, 42, 94, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 690, 150); ctx.lineTo(x + 870, 150); ctx.moveTo(x + 700, 190); ctx.lineTo(x + 860, 190); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = "#350915"; ctx.fillRect(x + 720, 222, 120, 90); ctx.fillRect(x + 698, 206, 164, 28);
  ctx.strokeStyle = "#e4b73d"; ctx.strokeRect(x + 720, 222, 120, 90); ctx.restore();
  for (const off of [490, 570, 990, 1070]) statue(ctx, x + off);
  verticalCore(ctx, x + 636, 82, 32, "#e4b73d");
  verticalCore(ctx, x + 892, 82, 32, "#e4b73d");
  girderBay(ctx, x + 300, 222, 320, 90, "#ff2848");
  girderBay(ctx, x + 940, 222, 320, 90, "#ff2848");
  conduit(ctx, x + 244, 244, x + 1310, 244, "#e4b73d");
  geometryArchitecture(ctx, 4);
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