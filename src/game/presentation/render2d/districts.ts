/**
 * DISTRICT RENDERER — large, multi-section side-scrolling environments.
 * ---------------------------------------------------------------------------
 * Replaces the stickman-era single-screen backdrops for the redesigned levels:
 *
 *   Level 1 — JEET'S FAST FOOD DISTRICT   (burger/pizza/takeaway strip)
 *   Level 2 — RUGGER'S FINANCIAL EMPIRE   (offices → trading → casino strip)
 *
 * PERFORMANCE CONTRACT
 *   • The whole world is generated ONCE per level and cached (`districtFor`).
 *     Nothing is allocated per frame.
 *   • Deterministic seeded RNG at build time — never `Math.random()` in a draw.
 *   • Animation reads the shared render clock (`renderNow` / `flicker`).
 *   • Every layer is viewport-culled, so a 6,600-unit level costs the same as
 *     the old 3,200-unit one.
 *
 * All branding is fictional and original.
 */

import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
import { flicker, renderNow } from "./clock";

import {
  badActorSectionLabelAt,
  drawBadActorStudios,
  hasBadActorStudios,
} from "./badActorStudios";
import { drawJeetStreet, hasJeetStreet, jeetSectionLabelAt } from "./jeetStreet";
import { drawRuggerEmpire, hasRuggerEmpire, ruggerSectionLabelAt } from "./ruggerEmpire";


// ---------------------------------------------------------------------------
// Deterministic RNG (build-time only)
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

type Section =
  | "street" | "burgerRow" | "pizzaStrip" | "foodCourt" | "jeetTerritory" | "jeetPalace"
  | "financial" | "trading" | "cryptoOffices" | "gambling" | "casinoStrip" | "ruggerEmpire";

interface FarBuilding { x: number; w: number; h: number; tone: number; }

interface MidBuilding {
  x: number; w: number; h: number; tone: number; windows: number; lit: number;
}

/** A street-level building the player walks past (1:1 parallax). */
interface Storefront {
  x: number; w: number; h: number;
  kind: "burger" | "pizza" | "takeaway" | "office" | "casino" | "palace";
  name: string;
  tagline?: string;
  hue: string;      // primary facade colour
  accent: string;   // trim / awning colour
  sign: "board" | "neon" | "marquee" | "rooftop";
  /** Giant rooftop prop (burger, pizza slice, dollar, dice, chip). */
  rooftop?: "burger" | "pizza" | "coin" | "dice" | "chip" | "bull";
  awning: boolean;
  storeys: number;
  seed: number;
}

interface Prop {
  x: number;
  kind: "lamp" | "scooter" | "dumpster" | "bin" | "hydrant" | "poster" | "car" | "bollard" | "ropes" | "ticker";
  text?: string;
  seed: number;
}

interface District {
  level: number;
  width: number;
  sky: [string, string, string];
  night: boolean;
  far: FarBuilding[];
  mid: MidBuilding[];
  fronts: Storefront[];
  props: Prop[];
  sections: { x: number; label: string; kind: Section }[];
}

// ---------------------------------------------------------------------------
// Naming pools (fictional / original)
// ---------------------------------------------------------------------------

const BURGER_NAMES = [
  "JEET BURGER", "JEET'S BURGERS", "JEET'S BIG BUN", "JEET & FRIES",
  "JEET'S GRILL", "JEET'S STACKS", "JEET'S MEGA BURGER", "JEET DOUBLE",
  "JEET SMASH CO.", "JEET'S PATTY BAR",
];
const PIZZA_NAMES = [
  "JEET PIZZA", "JEET'S PIZZA HOUSE", "JEET'S SLICE", "JEET'S 24HR PIZZA",
  "JEET'S PIZZA & PIES", "JEET DEEP PAN", "JEET'S CRUST", "JEET SLICE BAR",
];
const TAKEAWAY_NAMES = [
  "JEET'S TAKEAWAY", "JEET'S DRIVE-THRU", "JEET WINGS", "JEET'S LATE NIGHT",
  "JEET NOODLE BOX", "JEET'S CHIP SHOP", "JEET EXPRESS",
];
const FOOD_TAGS = [
  "BUY THE DIP — GET FRIES", "100X BURGER", "TO THE MOON PIZZA",
  "DIAMOND HANDS COMBO", "DEGEN MEAL", "NEXT 100X SPECIAL",
  "JEET'S SPECIAL", "PAPER HANDS DISCOUNT", "EXIT LIQUIDITY LUNCH",
  "FREE REFILLS, NO REFUNDS",
];

const OFFICE_NAMES = [
  "RUGGER CAPITAL", "RUGGER HOLDINGS", "RUGGER & CO.", "RUGGER INVESTMENTS",
  "RUGGER TRADING", "RUGGER VENTURES", "RUGGER FINANCIAL", "RUGGER SECURITIES",
  "RUGGER GLOBAL", "RUGGER ASSET MGMT",
];
const CASINO_NAMES = [
  "RUGGER'S GAMBLING DEN", "RUGGER'S CASINO", "RUGGER'S HIGH ROLLER CLUB",
  "RUGGER'S HOUSE", "RUGGER'S JACKPOT", "THE RUGGER ROOM", "THE RUG PULL CASINO",
];
const CRYPTO_TAGS = [
  "100X GUARANTEED", "TRUST ME BRO", "NEXT 100X", "DIAMOND HANDS WELCOME",
  "LIQUIDITY LOCKED", "NO REFUNDS", "EARLY INVESTORS ONLY",
  "WITHDRAWALS SUSPENDED", "LIQUIDITY ERROR", "RUGGER COIN", "TO THE MOON",
];

const FOOD_PALETTES: [string, string][] = [
  ["#c2352f", "#ffd23f"], ["#e0623a", "#fff2cc"], ["#8f3324", "#f4b942"],
  ["#2f6f4e", "#ffe08a"], ["#b8452e", "#f7f0d8"], ["#6a3b8f", "#ffd23f"],
  ["#1f4f7a", "#ffc857"],
];
const FIN_PALETTES: [string, string][] = [
  ["#1b2432", "#7fd4ff"], ["#24303f", "#c8a44a"], ["#1a2a3a", "#8fe3b0"],
  ["#2b2233", "#d78cff"], ["#182029", "#ffd166"],
];

// ---------------------------------------------------------------------------
// World generation
// ---------------------------------------------------------------------------

function buildJeetDistrict(width: number): District {
  const rnd = mulberry32(0x1eed01);
  const far: FarBuilding[] = [];
  for (let x = -200; x < width + 400; x += 90 + Math.floor(rnd() * 70)) {
    far.push({ x, w: 70 + rnd() * 80, h: 110 + rnd() * 130, tone: rnd() });
  }
  const mid: MidBuilding[] = [];
  for (let x = -150; x < width + 300; x += 130 + Math.floor(rnd() * 90)) {
    mid.push({
      x, w: 110 + rnd() * 90, h: 150 + rnd() * 120,
      tone: rnd(), windows: 3 + Math.floor(rnd() * 3), lit: rnd(),
    });
  }

  const fronts: Storefront[] = [];
  const props: Prop[] = [];
  let x = 120;
  let i = 0;
  while (x < width - 700) {
    const t = x / width;                    // 0..1 progression through the level
    // Density + branding ramp: early street is mostly plain, late street is all JEET.
    const jeetChance = 0.35 + t * 0.65;
    const isJeet = rnd() < jeetChance;
    const big = rnd() < 0.18 + t * 0.4;
    const storeys = big ? 2 + Math.floor(rnd() * 2) : 1;
    const w = big ? 240 + rnd() * 170 : 130 + rnd() * 110;
    const h = 130 + storeys * 55 + rnd() * 40 + t * 40;
    const kindRoll = rnd();
    const kind: Storefront["kind"] = !isJeet
      ? "takeaway"
      : kindRoll < 0.45 ? "burger" : kindRoll < 0.8 ? "pizza" : "takeaway";
    const pal = FOOD_PALETTES[Math.floor(rnd() * FOOD_PALETTES.length)];
    const namePool = kind === "burger" ? BURGER_NAMES : kind === "pizza" ? PIZZA_NAMES : TAKEAWAY_NAMES;
    fronts.push({
      x, w, h, kind,
      name: isJeet ? namePool[i % namePool.length] : ["CORNER SHOP", "LAUNDRETTE", "NEWSAGENT", "PHONE REPAIR"][i % 4],
      tagline: rnd() < 0.3 + t * 0.5 ? FOOD_TAGS[Math.floor(rnd() * FOOD_TAGS.length)] : undefined,
      hue: pal[0], accent: pal[1],
      sign: big ? (rnd() < 0.5 ? "rooftop" : "neon") : rnd() < 0.4 ? "neon" : "board",
      rooftop: big && isJeet ? (kind === "pizza" ? "pizza" : "burger") : undefined,
      awning: rnd() < 0.65,
      storeys,
      seed: Math.floor(rnd() * 1000),
    });
    // Street furniture between shops
    props.push({ x: x + w + 8, kind: "lamp", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.35) props.push({ x: x + w * 0.5, kind: "scooter", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.3) props.push({ x: x + w + 30, kind: "dumpster", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.3) props.push({ x: x + w * 0.3, kind: "bin", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.22) props.push({ x: x + w + 46, kind: "hydrant", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.3) props.push({
      x: x + w * 0.72, kind: "poster",
      text: FOOD_TAGS[Math.floor(rnd() * FOOD_TAGS.length)],
      seed: Math.floor(rnd() * 1000),
    });
    if (rnd() < 0.18) props.push({ x: x + w + 70, kind: "car", seed: Math.floor(rnd() * 1000) });
    x += w + 40 + rnd() * (t < 0.35 ? 110 : 50);
    i++;
  }

  // Boss destination — JEET'S FOOD PALACE closing off the street.
  const palaceX = width - 620;
  fronts.push({
    x: palaceX, w: 560, h: 300,
    kind: "palace", name: "JEET'S FOOD PALACE", tagline: "MEMBERS ONLY — DEGENS WELCOME",
    hue: "#8f1d18", accent: "#ffd23f", sign: "rooftop", rooftop: "burger",
    awning: true, storeys: 3, seed: 77,
  });
  props.push({ x: palaceX - 60, kind: "car", seed: 12 });
  props.push({ x: palaceX + 600, kind: "lamp", seed: 13 });

  return {
    level: 0, width, night: false,
    sky: ["#2b4a7a", "#e2764a", "#f7c46c"],
    far, mid, fronts, props,
    sections: [
      { x: 0, label: "URBAN STREET", kind: "street" },
      { x: width * 0.2, label: "BURGER DISTRICT", kind: "burgerRow" },
      { x: width * 0.42, label: "PIZZA STRIP", kind: "pizzaStrip" },
      { x: width * 0.62, label: "FAST FOOD DISTRICT", kind: "foodCourt" },
      { x: width * 0.8, label: "JEET'S TERRITORY", kind: "jeetTerritory" },
      { x: width - 640, label: "JEET'S FOOD PALACE", kind: "jeetPalace" },
    ],
  };
}

function buildRuggerDistrict(width: number): District {
  const rnd = mulberry32(0x2affe2);
  const far: FarBuilding[] = [];
  for (let x = -200; x < width + 400; x += 80 + Math.floor(rnd() * 60)) {
    far.push({ x, w: 60 + rnd() * 90, h: 150 + rnd() * 190, tone: rnd() });
  }
  const mid: MidBuilding[] = [];
  for (let x = -150; x < width + 300; x += 120 + Math.floor(rnd() * 80)) {
    mid.push({
      x, w: 100 + rnd() * 110, h: 190 + rnd() * 150,
      tone: rnd(), windows: 4 + Math.floor(rnd() * 3), lit: rnd(),
    });
  }

  const fronts: Storefront[] = [];
  const props: Prop[] = [];
  let x = 120;
  let i = 0;
  while (x < width - 760) {
    const t = x / width;
    const casinoZone = t > 0.55;
    const big = rnd() < 0.3 + t * 0.4;
    const w = big ? 260 + rnd() * 200 : 150 + rnd() * 120;
    const h = casinoZone ? 190 + rnd() * 90 : 200 + rnd() * 110;
    const pal = FIN_PALETTES[Math.floor(rnd() * FIN_PALETTES.length)];
    const kind: Storefront["kind"] = casinoZone ? "casino" : "office";
    fronts.push({
      x, w, h, kind,
      name: casinoZone
        ? CASINO_NAMES[i % CASINO_NAMES.length]
        : OFFICE_NAMES[i % OFFICE_NAMES.length],
      tagline: rnd() < 0.35 + t * 0.55 ? CRYPTO_TAGS[Math.floor(rnd() * CRYPTO_TAGS.length)] : undefined,
      hue: casinoZone ? "#2a1030" : pal[0],
      accent: casinoZone ? "#ff3ea5" : pal[1],
      sign: casinoZone ? "marquee" : big ? "rooftop" : "neon",
      rooftop: big ? (casinoZone ? (rnd() < 0.5 ? "dice" : "chip") : (rnd() < 0.5 ? "coin" : "bull")) : undefined,
      awning: casinoZone && rnd() < 0.5,
      storeys: 3 + Math.floor(rnd() * 3),
      seed: Math.floor(rnd() * 1000),
    });
    props.push({ x: x + w + 10, kind: "lamp", seed: Math.floor(rnd() * 1000) });
    if (!casinoZone && rnd() < 0.5) props.push({
      x: x + w * 0.5, kind: "ticker",
      text: CRYPTO_TAGS[Math.floor(rnd() * CRYPTO_TAGS.length)],
      seed: Math.floor(rnd() * 1000),
    });
    if (casinoZone && rnd() < 0.5) props.push({ x: x + w * 0.45, kind: "ropes", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.3) props.push({ x: x + w + 40, kind: "car", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.3) props.push({ x: x + w * 0.75, kind: "bollard", seed: Math.floor(rnd() * 1000) });
    if (rnd() < 0.35) props.push({
      x: x + w * 0.25, kind: "poster",
      text: CRYPTO_TAGS[Math.floor(rnd() * CRYPTO_TAGS.length)],
      seed: Math.floor(rnd() * 1000),
    });
    x += w + 40 + rnd() * (t < 0.3 ? 90 : 40);
    i++;
  }

  const empireX = width - 680;
  fronts.push({
    x: empireX, w: 620, h: 320,
    kind: "palace", name: "RUGGER'S PRIVATE EMPIRE", tagline: "WITHDRAWALS SUSPENDED",
    hue: "#221024", accent: "#ffcf4d", sign: "marquee", rooftop: "coin",
    awning: true, storeys: 4, seed: 91,
  });
  props.push({ x: empireX - 50, kind: "ropes", seed: 21 });
  props.push({ x: empireX + 660, kind: "lamp", seed: 22 });

  return {
    level: 1, width, night: true,
    sky: ["#070a18", "#141d3a", "#2b1c46"],
    far, mid, fronts, props,
    sections: [
      { x: 0, label: "FINANCIAL DISTRICT", kind: "financial" },
      { x: width * 0.18, label: "TRADING DISTRICT", kind: "trading" },
      { x: width * 0.38, label: "CRYPTO OFFICES", kind: "cryptoOffices" },
      { x: width * 0.56, label: "GAMBLING DISTRICT", kind: "gambling" },
      { x: width * 0.72, label: "CASINO STRIP", kind: "casinoStrip" },
      { x: width - 700, label: "RUGGER'S EMPIRE", kind: "ruggerEmpire" },
    ],
  };
}

const cache = new Map<number, District>();

/** Cached district for a level, or null when the level has no district art. */
export function districtFor(level: number): District | null {
  if (level !== 0 && level !== 1) return null;
  const hit = cache.get(level);
  if (hit) return hit;
  const w = getLevelWidth(level);
  const d = level === 0 ? buildJeetDistrict(w) : buildRuggerDistrict(w);
  cache.set(level, d);
  return d;
}

export function hasDistrict(level: number): boolean {
  return level === 0 || level === 1 || level === 2;
}


// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const FAR_PX = 0.18;
const MID_PX = 0.5;

/** Extra ground drawn below the street so a raised camera never shows a gap. */
export const GROUND_OVERDRAW = 260;

export function drawDistrict(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  camY: number,
  canvasW: number,
): void {
  if (hasJeetStreet(level)) {
    // Level 1 is painted street artwork (falls back to the procedural street
    // below until every panel has decoded).
    drawJeetStreet(ctx, level, camX, canvasW);
    return;
  }
  if (hasBadActorStudios(level)) {
    // Level 3 is painted Bad Actors Studios artwork authored from the blueprint.
    drawBadActorStudios(ctx, level, camX, canvasW);
    return;
  }
  if (hasFilmDistrict(level)) {
    // Procedural fallback until every painted Level 3 panel has decoded.
    drawFilmDistrict(ctx, level, camX, canvasW);
    return;
  }
  if (hasRuggerEmpire(level)) {
    drawRuggerEmpire(ctx, level, camX, canvasW);
    return;
  }
  const d = districtFor(level);
  if (!d) return;
  const now = renderNow();


  // --- SKY (static, extended above and below so camY never reveals a gap) ---
  const skyTop = -GROUND_OVERDRAW;
  const grad = ctx.createLinearGradient(0, skyTop, 0, GROUND_Y);
  grad.addColorStop(0, d.sky[0]);
  grad.addColorStop(0.55, d.sky[1]);
  grad.addColorStop(1, d.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, skyTop, canvasW, GROUND_Y - skyTop + 4);

  if (d.night) drawStars(ctx, camX, canvasW);
  else drawClouds(ctx, camX, canvasW, now);

  // --- FAR SKYLINE ---
  const farOff = camX * FAR_PX;
  ctx.fillStyle = d.night ? "#0d1226" : "#3d5a86";
  for (const b of d.far) {
    const sx = b.x - farOff;
    if (sx + b.w < -60 || sx > canvasW + 60) continue;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(sx, GROUND_Y - b.h, b.w, b.h);
    ctx.globalAlpha = 1;
  }

  // --- MIDGROUND BLOCKS ---
  const midOff = camX * MID_PX;
  for (const b of d.mid) {
    const sx = b.x - midOff;
    if (sx + b.w < -80 || sx > canvasW + 80) continue;
    const top = GROUND_Y - b.h;
    ctx.fillStyle = d.night
      ? `rgb(${18 + b.tone * 14},${20 + b.tone * 16},${34 + b.tone * 20})`
      : `rgb(${70 + b.tone * 40},${78 + b.tone * 36},${96 + b.tone * 30})`;
    ctx.fillRect(sx, top, b.w, b.h);
    // Window grid — deterministic lit pattern, cheap flicker on a few cells.
    const cols = b.windows;
    const cw = b.w / (cols + 1);
    for (let c = 0; c < cols; c++) {
      for (let ry = top + 16; ry < GROUND_Y - 26; ry += 24) {
        const k = (c * 7 + ry) % 11;
        const on = (k / 11 + b.lit) % 1 > 0.45;
        if (!on) continue;
        const f = k === 3 ? 0.55 + flicker(b.x + c + ry, 0.004) * 0.45 : 1;
        ctx.fillStyle = d.night
          ? `rgba(255,214,120,${0.5 * f})`
          : `rgba(190,215,245,${0.55 * f})`;
        ctx.fillRect(sx + cw * (c + 0.6), ry, cw * 0.5, 12);
      }
    }
  }

  // --- STREET SURFACE (1:1) ---
  drawStreet(ctx, d, camX, canvasW);

  // --- STOREFRONTS (1:1) ---
  for (const f of d.fronts) {
    const sx = f.x - camX;
    if (sx + f.w < -120 || sx > canvasW + 120) continue;
    drawStorefront(ctx, d, f, sx, now);
  }

  // --- FOREGROUND PROPS (slight over-scroll for depth) ---
  for (const pr of d.props) {
    const sx = pr.x - camX * 1.06;
    if (sx < -120 || sx > canvasW + 120) continue;
    drawProp(ctx, d, pr, sx, now);
  }
  void camY;
}

function drawClouds(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, now: number) {
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 10; i++) {
    const base = i * 340 + Math.sin(now / 9000 + i) * 18;
    const cx = ((base - camX * 0.08) % (canvasW + 420)) - 140;
    const cy = 26 + ((i * 41) % 70);
    const cw = 70 + ((i * 23) % 50);
    ctx.beginPath(); ctx.ellipse(cx, cy, cw / 2, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 18, cy + 6, cw / 3, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 20, cy + 4, cw / 3.4, 9, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawStars(ctx: CanvasRenderingContext2D, camX: number, canvasW: number) {
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 137 - camX * 0.05) % (canvasW + 60)) - 30;
    const sy = ((i * 53) % 150) - 40;
    const a = 0.35 + flicker(i, 0.002) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(sx, sy, 1.6, 1.6);
  }
}

function drawStreet(ctx: CanvasRenderingContext2D, d: District, camX: number, canvasW: number) {
  const bottom = GROUND_Y + GROUND_OVERDRAW;
  const road = ctx.createLinearGradient(0, GROUND_Y, 0, bottom);
  if (d.night) { road.addColorStop(0, "#20222c"); road.addColorStop(1, "#0c0d12"); }
  else { road.addColorStop(0, "#4a4a52"); road.addColorStop(1, "#232329"); }
  ctx.fillStyle = road;
  ctx.fillRect(0, GROUND_Y, canvasW, bottom - GROUND_Y);

  // Kerb
  ctx.fillStyle = d.night ? "#3a3d4a" : "#6d6d76";
  ctx.fillRect(0, GROUND_Y - 4, canvasW, 5);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, GROUND_Y + 1, canvasW, 2);

  // Lane dashes (world-locked, culled by the modulo window)
  ctx.fillStyle = d.night ? "rgba(210,210,150,0.25)" : "rgba(240,240,220,0.35)";
  const step = 120;
  const start = -((camX % step) + step) % step;
  for (let sx = start; sx < canvasW + step; sx += step) {
    ctx.fillRect(sx, GROUND_Y + 54, 46, 5);
  }
  // Pavement sheen near the shopfronts
  ctx.fillStyle = d.night ? "rgba(120,150,255,0.05)" : "rgba(255,255,255,0.05)";
  ctx.fillRect(0, GROUND_Y, canvasW, 16);
}

function signFont(w: number): string {
  return `bold ${Math.max(9, Math.min(18, Math.round(w / 13)))}px monospace`;
}

function drawStorefront(
  ctx: CanvasRenderingContext2D,
  d: District,
  f: Storefront,
  sx: number,
  now: number,
) {
  const top = GROUND_Y - f.h;
  // Facade
  ctx.fillStyle = f.hue;
  ctx.fillRect(sx, top, f.w, f.h);
  // Vertical shading for volume
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(sx + f.w - 14, top, 14, f.h);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(sx, top, 8, f.h);

  // Upper storey windows
  for (let s = 1; s < f.storeys; s++) {
    const wy = top + 18 + (s - 1) * 58;
    for (let wx = sx + 16; wx < sx + f.w - 34; wx += 54) {
      const lit = (Math.floor(wx) + f.seed) % 3 !== 0;
      ctx.fillStyle = lit ? "rgba(255,226,150,0.75)" : "rgba(30,34,48,0.85)";
      ctx.fillRect(wx, wy, 34, 30);
      ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, wy, 34, 30);
    }
  }

  // Ground floor: big glass window + door
  const gfTop = GROUND_Y - 104;
  ctx.fillStyle = d.night ? "rgba(255,205,110,0.30)" : "rgba(190,225,255,0.42)";
  ctx.fillRect(sx + 12, gfTop, f.w - 88, 84);
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
  ctx.strokeRect(sx + 12, gfTop, f.w - 88, 84);
  // Interior hints
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let ix = sx + 24; ix < sx + f.w - 96; ix += 42) {
    ctx.fillRect(ix, gfTop + 52, 22, 30);
  }
  // Door
  ctx.fillStyle = "#1d1d24";
  ctx.fillRect(sx + f.w - 66, GROUND_Y - 92, 46, 92);
  ctx.fillStyle = f.accent;
  ctx.fillRect(sx + f.w - 66, GROUND_Y - 96, 46, 5);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(sx + f.w - 30, GROUND_Y - 52, 4, 12);

  // Awning
  if (f.awning) {
    const ay = gfTop - 12;
    for (let i = 0; i * 20 < f.w - 80; i++) {
      ctx.fillStyle = i % 2 === 0 ? f.accent : "#f6f2e6";
      ctx.beginPath();
      ctx.moveTo(sx + 10 + i * 20, ay);
      ctx.lineTo(sx + 30 + i * 20, ay);
      ctx.lineTo(sx + 26 + i * 20, ay + 20);
      ctx.lineTo(sx + 14 + i * 20, ay + 20);
      ctx.closePath(); ctx.fill();
    }
  }

  // Signage
  const glow = 0.7 + flicker(f.seed, 0.006) * 0.3;
  if (f.sign === "board" || f.sign === "neon") {
    const by = top + 8;
    ctx.fillStyle = "#12121a";
    ctx.fillRect(sx + 8, by, f.w - 16, 30);
    ctx.strokeStyle = f.accent; ctx.lineWidth = 2;
    ctx.strokeRect(sx + 8, by, f.w - 16, 30);
    ctx.font = signFont(f.w);
    ctx.textAlign = "center";
    if (f.sign === "neon") { ctx.shadowColor = f.accent; ctx.shadowBlur = 12 * glow; }
    ctx.fillStyle = f.sign === "neon" ? f.accent : "#fdf6e3";
    ctx.fillText(f.name, sx + f.w / 2, by + 21);
    ctx.shadowBlur = 0;
  } else if (f.sign === "marquee") {
    const by = top + 6;
    ctx.fillStyle = "#160b1c";
    ctx.fillRect(sx + 6, by, f.w - 12, 40);
    ctx.strokeStyle = f.accent; ctx.lineWidth = 2;
    ctx.strokeRect(sx + 6, by, f.w - 12, 40);
    // Bulb chase
    for (let bx = sx + 14; bx < sx + f.w - 12; bx += 16) {
      const on = (Math.floor(now / 140) + Math.floor(bx / 16)) % 3 !== 0;
      ctx.fillStyle = on ? "#ffe27a" : "#5a4a20";
      ctx.beginPath(); ctx.arc(bx, by + 6, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by + 34, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = signFont(f.w);
    ctx.textAlign = "center";
    ctx.shadowColor = f.accent; ctx.shadowBlur = 14 * glow;
    ctx.fillStyle = "#ffd9f0";
    ctx.fillText(f.name, sx + f.w / 2, by + 26);
    ctx.shadowBlur = 0;
  } else {
    // rooftop sign
    const by = top - 46;
    ctx.fillStyle = "#0f0f16";
    ctx.fillRect(sx + f.w * 0.15, by, f.w * 0.7, 38);
    ctx.strokeStyle = f.accent; ctx.lineWidth = 3;
    ctx.strokeRect(sx + f.w * 0.15, by, f.w * 0.7, 38);
    ctx.font = signFont(f.w * 0.9);
    ctx.textAlign = "center";
    ctx.shadowColor = f.accent; ctx.shadowBlur = 16 * glow;
    ctx.fillStyle = f.accent;
    ctx.fillText(f.name, sx + f.w / 2, by + 26);
    ctx.shadowBlur = 0;
    // Support legs
    ctx.strokeStyle = "#22222c"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + f.w * 0.25, by + 38); ctx.lineTo(sx + f.w * 0.25, top);
    ctx.moveTo(sx + f.w * 0.75, by + 38); ctx.lineTo(sx + f.w * 0.75, top);
    ctx.stroke();
  }

  // Giant rooftop prop
  if (f.rooftop) drawRooftopProp(ctx, f, sx, top - (f.sign === "rooftop" ? 96 : 52));

  // Tagline board in the window
  if (f.tagline) {
    ctx.fillStyle = "rgba(10,10,14,0.85)";
    const tw = Math.min(f.w - 100, 170);
    ctx.fillRect(sx + 18, GROUND_Y - 40, tw, 20);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(f.tagline.slice(0, Math.floor(tw / 6)), sx + 24, GROUND_Y - 26);
  }
  ctx.textAlign = "left";
}

function drawRooftopProp(ctx: CanvasRenderingContext2D, f: Storefront, sx: number, y: number) {
  const cx = sx + f.w / 2;
  ctx.save();
  switch (f.rooftop) {
    case "burger": {
      ctx.fillStyle = "#e0a860";
      ctx.beginPath(); ctx.ellipse(cx, y - 6, 48, 22, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#4a8c3f"; ctx.fillRect(cx - 46, y - 6, 92, 7);
      ctx.fillStyle = "#7a3a20"; ctx.fillRect(cx - 44, y + 1, 88, 11);
      ctx.fillStyle = "#f2c14e"; ctx.fillRect(cx - 46, y + 12, 92, 6);
      ctx.fillStyle = "#d79a52"; ctx.beginPath(); ctx.ellipse(cx, y + 18, 46, 12, 0, 0, Math.PI); ctx.fill();
      break;
    }
    case "pizza": {
      ctx.fillStyle = "#f0c060";
      ctx.beginPath(); ctx.moveTo(cx, y - 34); ctx.lineTo(cx - 34, y + 24); ctx.lineTo(cx + 34, y + 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d8452e";
      for (const [px, py] of [[0, -6], [-14, 10], [14, 12], [0, 16]]) {
        ctx.beginPath(); ctx.arc(cx + px, y + py, 5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "coin": {
      ctx.fillStyle = "#ffcf4d"; ctx.beginPath(); ctx.arc(cx, y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#b8860b"; ctx.font = "bold 30px monospace"; ctx.textAlign = "center";
      ctx.fillText("$", cx, y + 11);
      break;
    }
    case "dice": {
      ctx.fillStyle = "#f6f6fa"; ctx.fillRect(cx - 26, y - 26, 52, 52);
      ctx.fillStyle = "#1b1b22";
      for (const [px, py] of [[-14, -14], [14, -14], [0, 0], [-14, 14], [14, 14]]) {
        ctx.beginPath(); ctx.arc(cx + px, y + py, 4.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "chip": {
      ctx.fillStyle = "#d3315b"; ctx.beginPath(); ctx.arc(cx, y, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fdf6e3"; ctx.lineWidth = 6; ctx.setLineDash([9, 9]);
      ctx.beginPath(); ctx.arc(cx, y, 22, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      break;
    }
    case "bull": {
      ctx.fillStyle = "#8fe3b0";
      ctx.beginPath(); ctx.moveTo(cx - 34, y + 18); ctx.lineTo(cx - 6, y - 6); ctx.lineTo(cx + 10, y + 4); ctx.lineTo(cx + 34, y - 22); ctx.lineTo(cx + 34, y + 18); ctx.closePath(); ctx.fill();
      break;
    }
  }
  ctx.restore();
  ctx.textAlign = "left";
}

function drawProp(ctx: CanvasRenderingContext2D, d: District, p: Prop, sx: number, now: number) {
  switch (p.kind) {
    case "lamp": {
      ctx.fillStyle = "#22242c"; ctx.fillRect(sx, GROUND_Y - 118, 5, 118);
      ctx.fillRect(sx - 16, GROUND_Y - 122, 34, 5);
      const c = d.night ? "#ffe6a0" : "#fff2c0";
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = d.night ? 18 : 6;
      ctx.beginPath(); ctx.arc(sx + 2, GROUND_Y - 116, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case "scooter": {
      ctx.fillStyle = "#c2352f"; ctx.fillRect(sx - 16, GROUND_Y - 30, 34, 12);
      ctx.fillStyle = "#e8d9b0"; ctx.fillRect(sx + 6, GROUND_Y - 48, 16, 16);
      ctx.fillStyle = "#1a1a1f";
      ctx.beginPath(); ctx.arc(sx - 12, GROUND_Y - 12, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 16, GROUND_Y - 12, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#4a4a52"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx + 14, GROUND_Y - 30); ctx.lineTo(sx + 22, GROUND_Y - 52); ctx.stroke();
      break;
    }
    case "dumpster": {
      ctx.fillStyle = "#2d5a3a"; ctx.fillRect(sx - 26, GROUND_Y - 42, 58, 42);
      ctx.fillStyle = "#3a7048"; ctx.fillRect(sx - 30, GROUND_Y - 48, 66, 8);
      ctx.fillStyle = "#1f4028"; ctx.fillRect(sx - 26, GROUND_Y - 8, 58, 8);
      break;
    }
    case "bin": {
      ctx.fillStyle = "#3a3a44"; ctx.fillRect(sx - 10, GROUND_Y - 30, 22, 30);
      ctx.fillStyle = "#565662"; ctx.fillRect(sx - 13, GROUND_Y - 34, 28, 5);
      break;
    }
    case "hydrant": {
      ctx.fillStyle = "#b03028"; ctx.fillRect(sx - 6, GROUND_Y - 24, 12, 24);
      ctx.beginPath(); ctx.arc(sx, GROUND_Y - 26, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(sx - 12, GROUND_Y - 18, 24, 5);
      break;
    }
    case "car": {
      const body = d.night ? "#2c3550" : "#3d6fa8";
      ctx.fillStyle = body; ctx.fillRect(sx - 44, GROUND_Y - 34, 92, 22);
      ctx.beginPath();
      ctx.moveTo(sx - 28, GROUND_Y - 34); ctx.lineTo(sx - 16, GROUND_Y - 52);
      ctx.lineTo(sx + 20, GROUND_Y - 52); ctx.lineTo(sx + 32, GROUND_Y - 34);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(190,225,255,0.6)"; ctx.fillRect(sx - 14, GROUND_Y - 49, 32, 14);
      ctx.fillStyle = "#15151a";
      ctx.beginPath(); ctx.arc(sx - 26, GROUND_Y - 10, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 28, GROUND_Y - 10, 11, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "bollard": {
      ctx.fillStyle = "#c8a44a"; ctx.fillRect(sx - 4, GROUND_Y - 22, 8, 22);
      break;
    }
    case "ropes": {
      ctx.fillStyle = "#c8a44a";
      ctx.fillRect(sx - 30, GROUND_Y - 44, 6, 44);
      ctx.fillRect(sx + 26, GROUND_Y - 44, 6, 44);
      ctx.strokeStyle = "#8b1f3a"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(sx - 27, GROUND_Y - 40);
      ctx.quadraticCurveTo(sx, GROUND_Y - 20, sx + 29, GROUND_Y - 40); ctx.stroke();
      break;
    }
    case "poster": {
      ctx.fillStyle = "#101018"; ctx.fillRect(sx - 34, GROUND_Y - 96, 68, 44);
      ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2; ctx.strokeRect(sx - 34, GROUND_Y - 96, 68, 44);
      ctx.fillStyle = "#ffe9a8"; ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
      const words = (p.text ?? "").split(" ");
      words.slice(0, 4).forEach((w, i) => ctx.fillText(w, sx, GROUND_Y - 84 + i * 10));
      ctx.textAlign = "left";
      break;
    }
    case "ticker": {
      const w = 150;
      ctx.fillStyle = "#07090f"; ctx.fillRect(sx - w / 2, GROUND_Y - 150, w, 24);
      ctx.strokeStyle = "#1d3350"; ctx.lineWidth = 2; ctx.strokeRect(sx - w / 2, GROUND_Y - 150, w, 24);
      ctx.save();
      ctx.beginPath(); ctx.rect(sx - w / 2 + 3, GROUND_Y - 148, w - 6, 20); ctx.clip();
      const msg = `${p.text ?? "RUGGER COIN"}  ▲ +9999%  •  `;
      const scroll = (now / 22 + p.seed * 40) % (msg.length * 7);
      ctx.fillStyle = "#7dffb0"; ctx.font = "bold 11px monospace";
      ctx.fillText(msg + msg, sx - w / 2 + 6 - scroll, GROUND_Y - 133);
      ctx.restore();
      break;
    }
  }
}

/** Section label for a world x — used by the HUD/debug overlay. */
export function sectionLabelAt(level: number, x: number): string | null {
  if (level === 0) return jeetSectionLabelAt(level, x);
  if (level === 1) return ruggerSectionLabelAt(level, x);
  if (hasBadActorStudios(level)) return badActorSectionLabelAt(level, x);
  if (hasFilmDistrict(level)) return filmSectionLabelAt(level, x);
  const d = districtFor(level);
  if (!d) return null;
  let label: string | null = null;
  for (const s of d.sections) if (x >= s.x) label = s.label;
  return label;
}


export const __test = { buildJeetDistrict, buildRuggerDistrict };
