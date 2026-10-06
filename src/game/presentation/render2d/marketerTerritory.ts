/**
 * LEVEL 6 — MR. MARKETER'S TERRITORY ("THE MARKETING MACHINE").
 *
 * Painted visual reconstruction of the approved five-section blueprint.
 * PRESENTATION ONLY: collision, decks, ladders, encounters and progression all
 * live in `@/game/config/world.ts`. Nothing here creates gameplay geometry.
 *
 *   6.1 ADVERTISING STREET      X 0-1800
 *   6.2 COLD CALL DISTRICT      X 1800-3600
 *   6.3 THE FUNNEL FACTORY      X 3600-5400   (key guard encounter)
 *   6.4 MANIPULATION DISTRICT   X 5400-7200   (SQUIRREL: CAPTURED display)
 *   6.5 MR. MARKETER HQ         X 7200-9000   (cage + boss arena)
 */

import { GROUND_Y } from "@/game/config";
import { getLevelWidth, landingDecksFor, laddersFor } from "@/game/config/world";
import advertisingArt from "@/assets/level6-advertising.jpg";
import coldCallArt from "@/assets/level6-coldcall.jpg";
import funnelArt from "@/assets/level6-funnel.jpg";
import manipulationArt from "@/assets/level6-manipulation.jpg";
import hqArt from "@/assets/level6-hq.jpg";
import squirrelArt from "@/assets/squirrel/idle.png";
import squirrelCagedArt from "@/assets/squirrel/caged.png";
import squirrelCapturedArt from "@/assets/squirrel/captured.png";
import marketerAtlasAsset from "@/assets/mr-marketer-atlas.png.asset.json";
import { flicker, renderNow } from "./clock";
import { residentImage } from "./imageResidency";
import { drawFilfKey } from "./filfKey";

export const MARKETER_TERRITORY_LEVEL = 5;
export const MARKETER_SECTION_WIDTH = 1800;
export const MARKETER_SECTIONS = [
  "ADVERTISING STREET",
  "COLD CALL DISTRICT",
  "THE FUNNEL FACTORY",
  "MANIPULATION DISTRICT",
  "MR. MARKETER HQ",
] as const;

/** Authored story object positions (world units, feet-anchored). */
export const KEY_POSITION = { x: 4540, y: 108 } as const;
export const CAGE_POSITION = { x: 8360, y: GROUND_Y } as const;

export interface MarketerLandmark {
  id: string;
  section: number;
  x0: number;
  x1: number;
  y: number;
  layer: "background" | "gameplay" | "foreground";
  scale: "supporting" | "major" | "dominant";
  collision: false;
  deck?: string;
}

/** Deterministic authored landmark map — same world x always the same art. */
export const MARKETER_BLUEPRINT_MAP: readonly MarketerLandmark[] = [
  { id: "advertising_gate_01", section: 0, x0: 20, x1: 300, y: 40, layer: "gameplay", scale: "major", collision: false },
  { id: "boost_mart", section: 0, x0: 120, x1: 430, y: 150, layer: "gameplay", scale: "major", collision: false },
  { id: "buy_now_billboard", section: 0, x0: 470, x1: 940, y: 44, layer: "gameplay", scale: "dominant", collision: false, deck: "ads-west" },
  { id: "sale_sign", section: 0, x0: 990, x1: 1180, y: 60, layer: "gameplay", scale: "supporting", collision: false },
  { id: "hype_display", section: 0, x0: 1210, x1: 1470, y: 46, layer: "gameplay", scale: "major", collision: false, deck: "ads-east" },
  { id: "limited_time_only", section: 0, x0: 1500, x1: 1760, y: 150, layer: "gameplay", scale: "supporting", collision: false },
  { id: "dont_think_just_buy", section: 0, x0: 1180, x1: 1450, y: 214, layer: "foreground", scale: "supporting", collision: false },
  { id: "ninety_nine_off", section: 0, x0: 640, x1: 880, y: 214, layer: "foreground", scale: "supporting", collision: false },
  { id: "call_centre_central", section: 1, x0: 1880, x1: 2360, y: 44, layer: "gameplay", scale: "dominant", collision: false, deck: "call-west" },
  { id: "no_not_yet", section: 1, x0: 2420, x1: 2660, y: 62, layer: "gameplay", scale: "supporting", collision: false },
  { id: "call_until_they_buy", section: 1, x0: 2720, x1: 3080, y: 44, layer: "gameplay", scale: "major", collision: false, deck: "call-east" },
  { id: "conversion_display", section: 1, x0: 3120, x1: 3520, y: 120, layer: "gameplay", scale: "major", collision: false },
  { id: "sell_sell_sell", section: 1, x0: 2380, x1: 2620, y: 208, layer: "foreground", scale: "supporting", collision: false },
  { id: "happiness_subscription", section: 1, x0: 3140, x1: 3540, y: 232, layer: "foreground", scale: "supporting", collision: false },
  { id: "boost_everything", section: 2, x0: 3660, x1: 3980, y: 60, layer: "gameplay", scale: "major", collision: false },
  { id: "funnel_factory", section: 2, x0: 4020, x1: 5060, y: 30, layer: "background", scale: "dominant", collision: false },
  { id: "marketing_funnel", section: 2, x0: 4320, x1: 4760, y: 60, layer: "gameplay", scale: "dominant", collision: false, deck: "funnel-upper" },
  { id: "lead_prospect_customer", section: 2, x0: 4180, x1: 4900, y: 232, layer: "foreground", scale: "major", collision: false },
  { id: "key_guard_arena", section: 2, x0: 4180, x1: 4820, y: 190, layer: "gameplay", scale: "major", collision: false, deck: "funnel-lower" },
  { id: "key_display", section: 2, x0: 4500, x1: 4580, y: 108, layer: "gameplay", scale: "major", collision: false, deck: "funnel-upper" },
  { id: "convert_everything", section: 2, x0: 5080, x1: 5340, y: 70, layer: "gameplay", scale: "supporting", collision: false },
  { id: "maximum_conversion", section: 2, x0: 5120, x1: 5380, y: 216, layer: "foreground", scale: "supporting", collision: false },
  { id: "trust_us", section: 3, x0: 5460, x1: 5720, y: 60, layer: "gameplay", scale: "supporting", collision: false },
  { id: "everyone_loves_it", section: 3, x0: 5780, x1: 6060, y: 56, layer: "gameplay", scale: "supporting", collision: false },
  { id: "manipulation_control_room", section: 3, x0: 6080, x1: 6420, y: 44, layer: "gameplay", scale: "major", collision: false, deck: "manip-west" },
  { id: "squirrel_status_screen", section: 3, x0: 6460, x1: 6960, y: 62, layer: "gameplay", scale: "dominant", collision: false },
  { id: "dont_ask_questions", section: 3, x0: 6640, x1: 6940, y: 228, layer: "foreground", scale: "supporting", collision: false },
  { id: "no_refunds", section: 3, x0: 7000, x1: 7180, y: 214, layer: "foreground", scale: "supporting", collision: false },
  { id: "mr_marketer_hq", section: 4, x0: 7220, x1: 7620, y: 40, layer: "gameplay", scale: "major", collision: false, deck: "hq-west" },
  { id: "deal_of_your_life", section: 4, x0: 7320, x1: 7640, y: 150, layer: "gameplay", scale: "supporting", collision: false },
  { id: "mr_marketer_boss_arena", section: 4, x0: 7700, x1: 8300, y: 40, layer: "gameplay", scale: "dominant", collision: false },
  { id: "squirrel_cage", section: 4, x0: 8260, x1: 8460, y: 180, layer: "gameplay", scale: "dominant", collision: false },
  { id: "squirrel_not_for_sale", section: 4, x0: 8240, x1: 8500, y: 120, layer: "gameplay", scale: "supporting", collision: false },
  { id: "cant_afford_to_say_no", section: 4, x0: 8620, x1: 8940, y: 150, layer: "foreground", scale: "supporting", collision: false, deck: "hq-east" },
] as const;

export const MARKETER_VISUAL_DECK_IDS = [
  "ads-west", "ads-east", "call-west", "call-east",
  "funnel-lower", "funnel-upper", "manip-west", "manip-east",
  "hq-west", "hq-east",
] as const;

// ---------------------------------------------------------------------------
// Story state (written by the game loop, read by the renderer only)
// ---------------------------------------------------------------------------

export interface MarketerQuestState {
  /** The key guard encounter has been defeated. */
  keyAvailable: boolean;
  /** Waldoge is carrying the key. */
  keyTaken: boolean;
  /** The cage has been unlocked and Squirrel is free. */
  rescued: boolean;
}

let quest: MarketerQuestState = { keyAvailable: false, keyTaken: false, rescued: false };
export function setMarketerQuestState(next: MarketerQuestState): void { quest = next; }
export function getMarketerQuestState(): MarketerQuestState { return quest; }

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

const sectionSources = [advertisingArt, coldCallArt, funnelArt, manipulationArt, hqArt] as const;
const sectionImages: Array<HTMLImageElement | null> = [null, null, null, null, null];
const sectionReady = [false, false, false, false, false];
let squirrelImage: HTMLImageElement | null = null;
let squirrelReady = false;
let squirrelCagedImage: HTMLImageElement | null = null;
let squirrelCapturedImage: HTMLImageElement | null = null;
const imgOk = (i: HTMLImageElement | null): i is HTMLImageElement => !!i && i.complete && i.naturalWidth > 0;

function loadImage(src: string, ready: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const image = new Image();
  image.decoding = "sync";
  image.onload = ready;
  residentImage(image, src, [5]);
  return image;
}

export function preloadMarketerTerritory(): void {
  sectionSources.forEach((source, index) => {
    if (!sectionImages[index]) sectionImages[index] = loadImage(source, () => { sectionReady[index] = true; });
  });
  if (!squirrelImage) squirrelImage = loadImage(squirrelArt, () => { squirrelReady = true; });
  if (!squirrelCagedImage) squirrelCagedImage = loadImage(squirrelCagedArt, () => {});
  if (!squirrelCapturedImage) squirrelCapturedImage = loadImage(squirrelCapturedArt, () => {});
}
preloadMarketerTerritory();

export function hasMarketerTerritory(level: number): boolean {
  return level === MARKETER_TERRITORY_LEVEL;
}

// ---------------------------------------------------------------------------
// Modular art kit
// ---------------------------------------------------------------------------

function paintedSection(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  const image = sectionImages[index];
  if (!image || (!sectionReady[index] && (!image.complete || image.naturalWidth === 0))) return;
  ctx.drawImage(
    image, 0, 0, image.naturalWidth, image.naturalHeight * 0.88,
    x, -18, MARKETER_SECTION_WIDTH, GROUND_Y + 18,
  );
}

type SignTone = "neon" | "red" | "gold" | "blue" | "white";

const TONE: Record<SignTone, { fill: string; edge: string; text: string; glow: string }> = {
  neon: { fill: "#2a0c3d", edge: "#ff3ce0", text: "#ffe9fb", glow: "rgba(255,60,224,.7)" },
  red: { fill: "#6d0d16", edge: "#ff3244", text: "#fff0ef", glow: "rgba(255,50,68,.75)" },
  gold: { fill: "#5a4406", edge: "#ffcc3d", text: "#fff6d8", glow: "rgba(255,204,61,.7)" },
  blue: { fill: "#08243f", edge: "#3fb6ff", text: "#eaf7ff", glow: "rgba(63,182,255,.7)" },
  white: { fill: "#e9e9e6", edge: "#9a9a96", text: "#12100f", glow: "rgba(255,255,255,.45)" },
};

/** A lit marketing sign — the level's primary signage module. */
function sign(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  lines: readonly string[],
  tone: SignTone = "neon",
): void {
  const t = TONE[tone];
  ctx.save();
  // Mount frame.
  ctx.fillStyle = "#101014";
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 20;
  ctx.fillStyle = t.fill;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = t.edge;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = t.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = Math.max(13, Math.min(40, Math.floor(h / (lines.length + 0.6))));
  ctx.font = `900 ${size}px Impact, sans-serif`;
  lines.forEach((line, i) =>
    ctx.fillText(line, x + w / 2, y + h * ((i + 1) / (lines.length + 1)), w - 18));
  ctx.restore();
}

/** Small hanging lamp with a flicker, used to break up flat wall stretches. */
function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, colour = "#ffcf7a"): void {
  const a = 0.55 + flicker(x, 0.003) * 0.4;
  ctx.save();
  ctx.fillStyle = "#1a1a1e";
  ctx.fillRect(x - 3, y - 16, 6, 16);
  ctx.shadowColor = colour;
  ctx.shadowBlur = 18;
  ctx.globalAlpha = a;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Stacked crate prop for foreground dressing. */
function crate(ctx: CanvasRenderingContext2D, x: number, y: number, s = 34): void {
  ctx.save();
  ctx.fillStyle = "#4a3a22";
  ctx.fillRect(x, y - s, s, s);
  ctx.strokeStyle = "#f0b93b";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 3, y - s + 3, s - 6, s - 6);
  ctx.restore();
}

/** Wall-mounted surveillance camera (Manipulation District module). */
function camera(ctx: CanvasRenderingContext2D, x: number, y: number, dir = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = "#23252b";
  ctx.fillRect(-4, -12, 8, 12);
  ctx.fillRect(0, -6, 26, 12);
  ctx.beginPath();
  ctx.arc(26, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ff2e3a";
  ctx.shadowColor = "rgba(255,46,58,.8)";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

/** Golden award statue (HQ module). */
function statue(ctx: CanvasRenderingContext2D, x: number, y: number, h = 96): void {
  ctx.save();
  ctx.fillStyle = "#151318";
  ctx.fillRect(x - 18, y - 24, 36, 24);
  ctx.shadowColor = "rgba(255,206,74,.6)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#e8b83c";
  ctx.beginPath();
  ctx.moveTo(x, y - 24 - h);
  ctx.lineTo(x + 14, y - 24 - h * 0.45);
  ctx.lineTo(x + 8, y - 24);
  ctx.lineTo(x - 8, y - 24);
  ctx.lineTo(x - 14, y - 24 - h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The one and only quest key, on its guarded display plinth. */
function keyDisplay(ctx: CanvasRenderingContext2D): void {
  if (quest.keyTaken) return;
  const { x, y } = KEY_POSITION;
  const locked = !quest.keyAvailable;
  ctx.save();
  // Plinth / holder.
  ctx.fillStyle = "#1b1d23";
  ctx.fillRect(x - 26, y - 14, 52, 14);
  ctx.strokeStyle = locked ? "#ff3244" : "#ffcc3d";
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 26, y - 14, 52, 14);
  // Beacon.
  const beam = ctx.createLinearGradient(x, y - 150, x, y);
  beam.addColorStop(0, locked ? "rgba(255,50,68,0)" : "rgba(255,204,61,0)");
  beam.addColorStop(1, locked ? "rgba(255,50,68,.22)" : "rgba(255,204,61,.3)");
  ctx.fillStyle = beam;
  ctx.fillRect(x - 26, y - 150, 52, 150);
  // Same pixel key, size and animation as Levels 1–5. This renderer is
  // already in world space, so translate locally before its screen culling.
  ctx.translate(x, 0);
  drawFilfKey(ctx, 0, y, 0, Math.floor(renderNow() * 60 / 1000));
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 15px Impact, sans-serif";
  ctx.fillStyle = locked ? "#ff5566" : "#ffd23f";
  ctx.fillText(locked ? "GUARDED" : "TAKE THE KEY", x, y - 84);
  ctx.restore();
}

/** Squirrel's cage — the level's story landmark. */
function squirrelCage(ctx: CanvasRenderingContext2D): void {
  const { x } = CAGE_POSITION;
  const ground = GROUND_Y;
  const w = 168;
  const h = 210;
  const left = x - w / 2;
  const top = ground - h;
  ctx.save();
  // Plinth + cage body.
  ctx.fillStyle = "#14151a";
  ctx.fillRect(left - 10, ground - 14, w + 20, 14);

  // Supplied caged frame (cage + Squirrel) while locked; supplied idle frame beside the opened cage after rescue.
  const cagedArt = !quest.rescued && imgOk(squirrelCagedImage) ? squirrelCagedImage : null;
  if (cagedArt) {
    const ch = h + 14;
    const cw = ch * (cagedArt.naturalWidth / cagedArt.naturalHeight);
    ctx.drawImage(cagedArt, x - cw / 2, ground - ch, cw, ch);
  } else if (quest.rescued && squirrelImage && (squirrelReady || imgOk(squirrelImage))) {
    const sh = 120;
    const sw = sh * (squirrelImage.naturalWidth / squirrelImage.naturalHeight);
    const bob = Math.sin(renderNow() / 520) * 3;
    ctx.drawImage(squirrelImage, x + w / 2 + 40 - sw / 2, ground - sh + bob, sw, sh);
  }

  if (!quest.rescued) {
    if (!cagedArt) {
    ctx.fillStyle = "rgba(10,10,14,.55)";
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = "#c8ccd2";
    ctx.lineWidth = 5;
    for (let bx = left + 12; bx < left + w; bx += 22) {
      ctx.beginPath();
      ctx.moveTo(bx, top + 12);
      ctx.lineTo(bx, ground);
      ctx.stroke();
    }
    ctx.lineWidth = 7;
    ctx.strokeRect(left, top, w, h);
    }
    // Padlock.
    ctx.fillStyle = quest.keyTaken ? "#ffd23f" : "#9aa0a8";
    const lx = cagedArt ? x + 52 : x;
    ctx.fillRect(lx - 13, ground - h / 2 - 12, 26, 24);
    ctx.strokeStyle = quest.keyTaken ? "#ffd23f" : "#9aa0a8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(lx, ground - h / 2 - 12, 9, Math.PI, 0);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "900 16px Impact, sans-serif";
    ctx.fillStyle = quest.keyTaken ? "#ffd23f" : "#ff5566";
    ctx.fillText(quest.keyTaken ? "USE THE KEY" : "LOCKED", x, top - 12);
  } else {
    ctx.textAlign = "center";
    ctx.font = "900 16px Impact, sans-serif";
    ctx.fillStyle = "#54ff9f";
    ctx.fillText("SQUIRREL FREE", x, top - 12);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function drawAdvertising(ctx: CanvasRenderingContext2D, x: number): void {
  sign(ctx, x + 40, 40, 240, 64, ["BOOST MART"], "neon");
  sign(ctx, x + 480, 44, 430, 138, ["BUY NOW", "YOU NEED THIS"], "red");
  sign(ctx, x + 990, 60, 190, 76, ["SALE"], "neon");
  sign(ctx, x + 1215, 46, 250, 120, ["HYPE", "BUILDS", "BETTER HUMANS"], "gold");
  sign(ctx, x + 1500, 150, 255, 84, ["LIMITED", "TIME ONLY"], "red");
  sign(ctx, x + 1185, 168, 260, 62, ["DON'T THINK", "JUST BUY"], "white");
  sign(ctx, x + 645, 196, 230, 58, ["99% OFF*"], "gold");
  for (const p of [210, 520, 980, 1330, 1690]) lamp(ctx, x + p, 132, "#ff7bd8");
  for (const p of [330, 905, 1455]) crate(ctx, x + p, GROUND_Y);
}

function drawColdCall(ctx: CanvasRenderingContext2D, x: number): void {
  sign(ctx, x + 80, 44, 400, 92, ["COLD CALL CENTRAL"], "blue");
  sign(ctx, x + 620, 62, 240, 62, ["NO = NOT YET"], "white");
  sign(ctx, x + 920, 44, 360, 96, ["CALL UNTIL", "THEY BUY"], "white");
  sign(ctx, x + 1320, 120, 400, 150, [
    "CONVERSION RATE: 87%",
    "CUSTOMER RESISTANCE: 13%",
    "KEEP CALLING",
  ], "blue");
  sign(ctx, x + 580, 150, 240, 96, ["SELL.", "SELL.", "SELL."], "red");
  sign(ctx, x + 1340, 286, 400, 52, ["HAPPINESS IS A SUBSCRIPTION"], "red");
  for (const p of [260, 700, 1180, 1620]) lamp(ctx, x + p, 150, "#8fd8ff");
  for (const p of [430, 1050]) crate(ctx, x + p, GROUND_Y);
}

function drawFunnel(ctx: CanvasRenderingContext2D, x: number): void {
  sign(ctx, x + 60, 60, 300, 110, ["BOOST", "EVERYTHING"], "red");
  sign(ctx, x + 560, 56, 720, 54, ["LEAD  →  PROSPECT  →  CUSTOMER"], "gold");
  sign(ctx, x + 1480, 70, 260, 90, ["CONVERT", "EVERYTHING"], "gold");
  sign(ctx, x + 1520, 176, 250, 70, ["MAXIMUM", "CONVERSION"], "red");
  for (const p of [400, 860, 1300, 1700]) lamp(ctx, x + p, 140, "#ff5a4a");
  for (const p of [520, 1150]) crate(ctx, x + p, GROUND_Y);
  keyDisplay(ctx);
}

function drawManipulation(ctx: CanvasRenderingContext2D, x: number): void {
  sign(ctx, x + 60, 60, 250, 66, ["TRUST US"], "white");
  sign(ctx, x + 380, 56, 280, 74, ["EVERYONE", "LOVES IT"], "blue");
  sign(ctx, x + 690, 44, 300, 132, ["YOUR CHOICE™", "☑ BE HAPPY", "☑ CONSUME", "☑ OBEY"], "white");
  // The story display: Squirrel is captured.
  const sx = x + 1060;
  sign(ctx, sx, 62, 500, 168, ["TARGET: SQUIRREL", "STATUS: CAPTURED"], "red");
  const statusArt = imgOk(squirrelCapturedImage) ? squirrelCapturedImage : squirrelImage;
  if (statusArt && imgOk(statusArt)) {
    const h = 104;
    const w = h * (statusArt.naturalWidth / statusArt.naturalHeight);
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(statusArt, sx + 340, 92, w, h);
    ctx.strokeStyle = "#ff3244";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + 340 + i * 22, 92);
      ctx.lineTo(sx + 340 + i * 22, 92 + h);
      ctx.stroke();
    }
    ctx.restore();
  }
  sign(ctx, x + 1240, 256, 300, 52, ["DON'T ASK QUESTIONS"], "white");
  sign(ctx, x + 1600, 186, 180, 54, ["NO REFUNDS"], "red");
  for (const p of [220, 640, 1020, 1520]) camera(ctx, x + p, 110, p % 2 === 0 ? 1 : -1);
  for (const p of [340, 900, 1420]) lamp(ctx, x + p, 150, "#b58cff");
}

function drawHq(ctx: CanvasRenderingContext2D, x: number): void {
  sign(ctx, x + 110, 126, 320, 82, ["THE DEAL", "OF YOUR LIFE"], "red");
  sign(ctx, x + 560, 40, 540, 160, ["MR. MARKETER", "BOOSTS", "THE WORLD"], "red");
  sign(ctx, x + 470, 60, 280, 68, ["SQUIRREL IS", "NOT FOR SALE"], "white");
  sign(ctx, x + 1420, 116, 330, 78, ["YOU CAN'T AFFORD", "TO SAY NO"], "gold");
  for (const p of [380, 500, 1240, 1360]) statue(ctx, x + p, GROUND_Y, 104);
  for (const p of [180, 760, 1120, 1660]) lamp(ctx, x + p, 132, "#ff5a5a");
  squirrelCage(ctx);
}

const SECTION_DRAW = [drawAdvertising, drawColdCall, drawFunnel, drawManipulation, drawHq];

function drawDecksAndLadders(ctx: CanvasRenderingContext2D, section: number): void {
  const start = section * MARKETER_SECTION_WIDTH;
  const end = start + MARKETER_SECTION_WIDTH;
  const accent = section === 4 ? "#e8b83c" : section === 2 ? "#ff7a2a" : "#3fb6ff";
  for (const deck of landingDecksFor(MARKETER_TERRITORY_LEVEL)) {
    if (deck.x1 < start || deck.x0 > end) continue;
    const w = deck.x1 - deck.x0;
    ctx.fillStyle = "#15181d";
    ctx.fillRect(deck.x0, deck.y - 10, w, 13);
    ctx.fillStyle = accent;
    ctx.fillRect(deck.x0, deck.y - 10, w, 3);
    ctx.strokeStyle = "#4b4f55";
    ctx.lineWidth = 4;
    for (let px = deck.x0 + 14; px < deck.x1; px += 54) {
      ctx.beginPath();
      ctx.moveTo(px, deck.y + 3);
      ctx.lineTo(px + 20, Math.min(GROUND_Y - 2, deck.y + 36));
      ctx.stroke();
    }
    // Safety rail so decks read as real walkable structures.
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(deck.x0, deck.y - 34);
    ctx.lineTo(deck.x1, deck.y - 34);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let px = deck.x0; px <= deck.x1; px += 70) {
      ctx.beginPath();
      ctx.moveTo(px, deck.y - 34);
      ctx.lineTo(px, deck.y - 10);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "#f0c33c";
  for (const ladder of laddersFor(MARKETER_TERRITORY_LEVEL)) {
    if (ladder.x < start || ladder.x >= end) continue;
    const top = Math.min(ladder.top, ladder.bottom);
    const bottom = Math.max(ladder.top, ladder.bottom);
    const lx = ladder.x;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lx - 10, top); ctx.lineTo(lx - 10, bottom);
    ctx.moveTo(lx + 10, top); ctx.lineTo(lx + 10, bottom);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let y = top + 8; y < bottom; y += 16) {
      ctx.beginPath();
      ctx.moveTo(lx - 10, y); ctx.lineTo(lx + 10, y);
      ctx.stroke();
    }
  }
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  const tint = index === 0
    ? "rgba(214,54,196,.10)"
    : index === 1
      ? "rgba(52,140,224,.10)"
      : index === 2
        ? "rgba(233,102,30,.10)"
        : index === 3
          ? "rgba(122,74,214,.10)"
          : "rgba(214,36,46,.12)";
  const glow = ctx.createLinearGradient(x, 0, x + MARKETER_SECTION_WIDTH, GROUND_Y);
  glow.addColorStop(0, "rgba(0,0,0,.06)");
  glow.addColorStop(0.5, tint);
  glow.addColorStop(1, "rgba(0,0,0,.14)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, -20, MARKETER_SECTION_WIDTH, GROUND_Y + 20);
  const haze = 0.035 + Math.sin(renderNow() / 1800 + index) * 0.012;
  ctx.fillStyle = `rgba(190,205,225,${haze})`;
  ctx.fillRect(x, GROUND_Y - 70, MARKETER_SECTION_WIDTH, 70);
}

function drawSection(ctx: CanvasRenderingContext2D, index: number, x: number): void {
  paintedSection(ctx, index, x);
  drawAtmosphere(ctx, index, x);
  drawDecksAndLadders(ctx, index);
  SECTION_DRAW[index](ctx, x);
}

export function drawMarketerTerritory(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  if (!hasMarketerTerritory(level)) return;
  getLevelWidth(level);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, -260, canvasW, GROUND_Y + 580);
  ctx.save();
  ctx.translate(-camX, 0);
  const first = Math.max(0, Math.floor(camX / MARKETER_SECTION_WIDTH));
  const last = Math.min(MARKETER_SECTIONS.length - 1, Math.floor((camX + canvasW) / MARKETER_SECTION_WIDTH));
  for (let i = first; i <= last; i += 1) drawSection(ctx, i, i * MARKETER_SECTION_WIDTH);
  ctx.restore();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 300);
  floor.addColorStop(0, "#16181d");
  floor.addColorStop(1, "#030408");
  ctx.fillStyle = floor;
  ctx.fillRect(0, GROUND_Y, canvasW, 300);
  ctx.fillStyle = "#6a707a";
  ctx.fillRect(0, GROUND_Y - 3, canvasW, 3);
}

export function marketerSectionLabelAt(level: number, x: number): string | null {
  if (!hasMarketerTerritory(level)) return null;
  const i = Math.max(0, Math.min(MARKETER_SECTIONS.length - 1, Math.floor(x / MARKETER_SECTION_WIDTH)));
  return MARKETER_SECTIONS[i];
}

export const __marketerTerritoryTest = {
  sectionArtUrls: sectionSources,
  squirrelUrl: squirrelArt,
  marketerAtlasUrl: marketerAtlasAsset.url,
  blueprintMap: MARKETER_BLUEPRINT_MAP,
  visualDeckIds: MARKETER_VISUAL_DECK_IDS,
  keyPosition: KEY_POSITION,
  cagePosition: CAGE_POSITION,
  sectionArtReady: () => sectionReady.every(Boolean),
};
