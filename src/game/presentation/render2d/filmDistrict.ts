/**
 * LEVEL 3 — BAD ACTOR'S FILM DISTRICT (Hollywood / movie studio world).
 * ---------------------------------------------------------------------------
 * A dedicated, large side-scrolling environment in the same architecture as
 * the Jeet (L1) and Rugger (L2) districts:
 *
 *   STUDIO ENTRANCE → FILM STUDIO STREET → BACKLOTS → MOVIE SETS →
 *   PRODUCTION STUDIOS → PROP & COSTUME DISTRICT → PREMIERE BOULEVARD →
 *   BAD ACTOR'S STUDIO → BAD ACTOR BOSS ARENA
 *
 * PERFORMANCE CONTRACT (identical to districts.ts)
 *   • The world is generated ONCE and cached. Nothing allocates per frame.
 *   • Deterministic seeded RNG at build time — never Math.random() in a draw.
 *   • Animation reads the shared render clock (renderNow / flicker).
 *   • Every layer is viewport-culled.
 *   • The two SUS'TER ACT artworks are preloaded once at module import; the
 *     renderer falls back to painted panels until they decode.
 *
 * GAMEPLAY: purely visual. No collision, no combat, no spawning here.
 * All branding is fictional and original.
 */

import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
import { flicker, renderNow } from "./clock";
import posterAsset from "@/assets/suster-act-poster.jpg.asset.json";
import screenAsset from "@/assets/suster-act-screen.jpg.asset.json";

export const FILM_LEVEL = 2;

// ---------------------------------------------------------------------------
// SUS'TER ACT artwork (preloaded once)
// ---------------------------------------------------------------------------

function preload(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const i = new Image();
  i.src = src;
  return i;
}

export const SUSTER_POSTER_IMG = preload(posterAsset.url);
export const SUSTER_SCREEN_IMG = preload(screenAsset.url);

function ready(img: HTMLImageElement | null): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

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

export type FilmSection =
  | "entrance" | "studioStreet" | "backlots" | "movieSets"
  | "production" | "propDistrict" | "premiere" | "badActorStudio";

export type BuildingKind =
  | "gate" | "soundStage" | "productionOffice" | "warehouse"
  | "costumeHouse" | "cinema" | "premiereHall" | "badActorStudio";

export interface FilmBuilding {
  x: number; w: number; h: number;
  kind: BuildingKind;
  name: string;
  tagline?: string;
  hue: string;
  accent: string;
  /** Giant rooftop lettering (Hollywood-style) instead of a board sign. */
  rooftopLetters: boolean;
  stageNo?: number;
  seed: number;
}

export type SetKind =
  | "fakeCity" | "police" | "mansion" | "courtroom" | "church"
  | "western" | "scifi" | "horror" | "crime";

/** An open-air movie set on the backlot: facade + studio wall + film crew kit. */
export interface MovieSet {
  x: number; w: number; h: number;
  kind: SetKind;
  label: string;
  seed: number;
  /** The standout SUS'TER ACT church set. */
  hero?: boolean;
}

export type ScreenArt = "poster" | "still" | "text";

/** A giant screen / billboard, usually lit by a projector below it. */
export interface GiantScreen {
  x: number; w: number; h: number;
  /** Height of the screen's bottom edge above the street. */
  lift: number;
  art: ScreenArt;
  text: string;
  sub?: string;
  /** Draw a visible projector + beam under/behind the screen. */
  projector: "ground" | "rooftop" | "none";
  seed: number;
}

export type FilmPropKind =
  | "camera" | "lightRig" | "directorChair" | "cableCoil" | "crate"
  | "boomMic" | "costumeRack" | "filmTruck" | "barrier" | "standee"
  | "clapper" | "spotlight" | "trailer";

export interface FilmProp {
  x: number;
  kind: FilmPropKind;
  text?: string;
  seed: number;
}

export interface FilmDistrict {
  level: number;
  width: number;
  far: { x: number; w: number; h: number; tone: number }[];
  hillLetters: { x: number; w: number };
  mid: { x: number; w: number; h: number; tone: number; kind: "stage" | "tower" | "waterTower" | "crane" }[];
  buildings: FilmBuilding[];
  sets: MovieSet[];
  screens: GiantScreen[];
  props: FilmProp[];
  sections: { x: number; label: string; kind: FilmSection }[];
}

// ---------------------------------------------------------------------------
// Fictional naming pools
// ---------------------------------------------------------------------------

const STUDIO_NAMES = [
  "BAD ACTOR STUDIOS", "BAD ACTOR PICTURES", "BAD ACTOR PRODUCTIONS",
  "BAD ACTOR FILMWORKS", "BAD ACTOR ENTERTAINMENT", "THE BAD ACTOR LOT",
  "BAD ACTOR SOUND STAGE", "BAD ACTOR POST HOUSE",
];
const NEUTRAL_NAMES = [
  "LOT SERVICES", "CAMERA RENTAL", "GRIP & LIGHTING", "CASTING OFFICE",
  "SCRIPT DEPT", "CATERING TRUCK CO.",
];
const CINEMA_NAMES = [
  "THE BAD ACTOR THEATRE", "PREMIERE PALACE", "THE GOLDEN SCREEN",
  "BAD ACTOR CINEPLEX", "THE RED CARPET ROOM",
];
const WAREHOUSE_NAMES = [
  "PROP WAREHOUSE 1", "PROP WAREHOUSE 2", "COSTUME DEPT", "SET STORAGE",
  "WARDROBE HOUSE", "PROPS & FX", "BACKDROP STORE",
];
const JOKES = [
  "100% REAL ACTING", "OSCAR NOMINEE*", "*PROBABLY", "NO CGI — TRUST ME",
  "ACTING IS NOT FINANCIAL ADVICE", "COMING SOON", "COMING SOON FOR 4 YEARS",
  "DIRECTOR'S CUT", "THE RUGGED CUT", "BAD ACTOR APPROVED", "10/10 ACTING",
  "CRITICS HATED IT", "FLOP OR MOON?", "EARLY ACCESS PREMIERE",
  "BASED ON A TRUE ROADMAP", "SEQUEL ALREADY GREENLIT",
];
const SUSTER_LINES = [
  "SUS'TER ACT", "SUS'TER ACT — COMING SOON", "NOW PLAYING",
  "BAD ACTOR PRESENTS: SUS'TER ACT", "SUS'TER ACT II — THE RUGGED CUT",
  "SUS'TER ACT — PREMIERE TONIGHT",
];
const SET_LABELS: Record<SetKind, string> = {
  fakeCity: "SET 4 — FAKE CITY STREET",
  police: "SET 7 — PRECINCT",
  mansion: "SET 9 — MANSION",
  courtroom: "SET 12 — COURTROOM",
  church: "SET 1 — SUS'TER ACT",
  western: "SET 15 — WESTERN TOWN",
  scifi: "SET 18 — DEEP SPACE",
  horror: "SET 21 — HAUNTED LOT",
  crime: "SET 23 — CRIME SCENE",
};

// ---------------------------------------------------------------------------
// World generation
// ---------------------------------------------------------------------------

function buildFilmDistrict(width: number): FilmDistrict {
  const rnd = mulberry32(0x3badac);

  // --- Far: Hollywood hillside skyline + hillside letters -------------------
  const far: FilmDistrict["far"] = [];
  for (let x = -200; x < width + 400; x += 95 + Math.floor(rnd() * 80)) {
    far.push({ x, w: 70 + rnd() * 100, h: 90 + rnd() * 150, tone: rnd() });
  }
  const hillLetters = { x: Math.round(width * 0.1), w: 520 };

  // --- Mid: sound stages, towers, cranes ------------------------------------
  const mid: FilmDistrict["mid"] = [];
  for (let x = -150; x < width + 300; x += 150 + Math.floor(rnd() * 110)) {
    const r = rnd();
    mid.push({
      x, w: 140 + rnd() * 130, h: 150 + rnd() * 150, tone: rnd(),
      kind: r < 0.6 ? "stage" : r < 0.78 ? "tower" : r < 0.9 ? "waterTower" : "crane",
    });
  }

  const buildings: FilmBuilding[] = [];
  const sets: MovieSet[] = [];
  const screens: GiantScreen[] = [];
  const props: FilmProp[] = [];

  // --- Studio entrance gate --------------------------------------------------
  buildings.push({
    x: 90, w: 300, h: 210, kind: "gate",
    name: "THE BAD ACTOR LOT", tagline: "CAST & CREW ONLY",
    hue: "#5b4636", accent: "#ffd166", rooftopLetters: false, seed: 3,
  });
  props.push({ x: 420, kind: "barrier", seed: 4 });
  props.push({ x: 470, kind: "clapper", seed: 5 });

  // --- Main generation pass --------------------------------------------------
  const bossZone = width - 900;
  let x = 470;
  let i = 0;
  let stageNo = 1;
  let setIdx = 0;
  let churchPlaced = false;
  const setOrder: SetKind[] = [
    "fakeCity", "police", "crime", "church", "mansion",
    "western", "courtroom", "scifi", "horror",
  ];

  while (x < bossZone - 220) {
    const t = x / width;                       // 0..1 progression
    const badActorChance = 0.4 + t * 0.6;      // branding ramps toward the boss
    const branded = rnd() < badActorChance;

    // Zone selection: backlot sets dominate the middle, cinemas the late level.
    const roll = rnd();
    const wantSet = t > 0.18 && t < 0.7 && roll < 0.45;
    const wantCinema = t > 0.56 && roll > 0.5;
    const wantWarehouse = t > 0.46 && t < 0.8 && roll > 0.3 && roll < 0.5;

    if (wantSet) {
      // ---- OPEN-AIR MOVIE SET (backlot) -------------------------------------
      let kind = setOrder[setIdx % setOrder.length];
      setIdx++;
      if (kind === "church" && churchPlaced) kind = setOrder[setIdx++ % setOrder.length];
      const hero = kind === "church" && !churchPlaced;
      if (hero) churchPlaced = true;
      const w = hero ? 520 : 300 + rnd() * 180;
      const h = hero ? 250 : 170 + rnd() * 70;
      sets.push({ x, w, h, kind, label: SET_LABELS[kind], seed: Math.floor(rnd() * 1000), hero });
      // Every set is a working set: crew kit in front of it.
      props.push({ x: x + 24, kind: "camera", seed: Math.floor(rnd() * 1000) });
      props.push({ x: x + w - 30, kind: "lightRig", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.7) props.push({ x: x + w * 0.35, kind: "directorChair", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.6) props.push({ x: x + w * 0.6, kind: "boomMic", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.5) props.push({ x: x + w * 0.8, kind: "cableCoil", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.5) props.push({ x: x + w * 0.15, kind: "crate", text: "PROPS", seed: Math.floor(rnd() * 1000) });
      if (hero) {
        // The standout SUS'TER ACT church set gets its own screen + projector.
        screens.push({
          x: x + 40, w: 300, h: 168, lift: 210, art: "still",
          text: "SUS'TER ACT", sub: "SET 1 — NOW SHOOTING",
          projector: "ground", seed: 42,
        });
        props.push({ x: x + w - 70, kind: "standee", text: "SUS'TER ACT", seed: 43 });
        props.push({ x: x + w + 24, kind: "costumeRack", seed: 44 });
      }
      x += w + 46 + rnd() * 40;
    } else if (wantCinema) {
      // ---- CINEMA / PREMIERE HALL -------------------------------------------
      const w = 340 + rnd() * 180;
      const h = 250 + rnd() * 70 + t * 40;
      const kind: BuildingKind = t > 0.78 ? "premiereHall" : "cinema";
      buildings.push({
        x, w, h, kind,
        name: CINEMA_NAMES[i % CINEMA_NAMES.length],
        tagline: SUSTER_LINES[i % SUSTER_LINES.length],
        hue: "#2a1420", accent: "#ffcf4d", rooftopLetters: rnd() < 0.5,
        seed: Math.floor(rnd() * 1000),
      });
      screens.push({
        x: x + 30, w: w - 60, h: Math.min(180, (w - 60) * 0.42), lift: h - 30,
        art: rnd() < 0.5 ? "still" : "poster",
        text: SUSTER_LINES[(i + 2) % SUSTER_LINES.length],
        sub: JOKES[(i * 3) % JOKES.length],
        projector: "rooftop", seed: Math.floor(rnd() * 1000),
      });
      props.push({ x: x + w * 0.2, kind: "standee", text: "SUS'TER ACT", seed: Math.floor(rnd() * 1000) });
      props.push({ x: x + w * 0.8, kind: "spotlight", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.6) props.push({ x: x + w + 30, kind: "barrier", seed: Math.floor(rnd() * 1000) });
      x += w + 50 + rnd() * 40;
    } else if (wantWarehouse) {
      // ---- PROP / COSTUME DISTRICT -------------------------------------------
      const w = 260 + rnd() * 160;
      const h = 200 + rnd() * 60;
      buildings.push({
        x, w, h, kind: rnd() < 0.5 ? "warehouse" : "costumeHouse",
        name: WAREHOUSE_NAMES[i % WAREHOUSE_NAMES.length],
        tagline: rnd() < 0.6 ? JOKES[(i * 5) % JOKES.length] : undefined,
        hue: "#3d4450", accent: "#e0a54a", rooftopLetters: false,
        seed: Math.floor(rnd() * 1000),
      });
      props.push({ x: x + w * 0.3, kind: "crate", text: "SET 1", seed: Math.floor(rnd() * 1000) });
      props.push({ x: x + w * 0.66, kind: "costumeRack", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.5) props.push({ x: x + w + 34, kind: "filmTruck", seed: Math.floor(rnd() * 1000) });
      x += w + 40 + rnd() * 40;
    } else {
      // ---- SOUND STAGE / PRODUCTION OFFICE -----------------------------------
      const big = rnd() < 0.3 + t * 0.5;
      const w = big ? 340 + rnd() * 200 : 210 + rnd() * 140;
      const h = (big ? 250 : 190) + rnd() * 70 + t * 50;
      const kind: BuildingKind = rnd() < 0.55 ? "soundStage" : "productionOffice";
      buildings.push({
        x, w, h, kind,
        name: branded ? STUDIO_NAMES[i % STUDIO_NAMES.length] : NEUTRAL_NAMES[i % NEUTRAL_NAMES.length],
        tagline: rnd() < 0.3 + t * 0.5 ? JOKES[(i * 7) % JOKES.length] : undefined,
        hue: branded ? "#4a3a52" : "#414a58",
        accent: branded ? "#ffd166" : "#9fd0ff",
        rooftopLetters: big && branded,
        stageNo: kind === "soundStage" ? stageNo++ : undefined,
        seed: Math.floor(rnd() * 1000),
      });
      // Giant screens appear more and more often as the level progresses.
      if (rnd() < 0.15 + t * 0.5) {
        screens.push({
          x: x + w * 0.15, w: 260 + rnd() * 160, h: 150 + rnd() * 60,
          lift: h + 20 + rnd() * 40,
          art: rnd() < 0.45 ? "poster" : rnd() < 0.8 ? "still" : "text",
          text: SUSTER_LINES[(i + 1) % SUSTER_LINES.length],
          sub: JOKES[(i * 2) % JOKES.length],
          projector: rnd() < 0.5 ? "ground" : "rooftop",
          seed: Math.floor(rnd() * 1000),
        });
      }
      props.push({ x: x + w + 12, kind: "spotlight", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.45) props.push({ x: x + w * 0.45, kind: "camera", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.4) props.push({ x: x + w * 0.72, kind: "cableCoil", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.35) props.push({ x: x + w + 44, kind: "trailer", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.3) props.push({ x: x + w * 0.25, kind: "crate", text: "GRIP", seed: Math.floor(rnd() * 1000) });
      if (rnd() < 0.3) props.push({ x: x + w * 0.9, kind: "directorChair", seed: Math.floor(rnd() * 1000) });
      x += w + 38 + rnd() * (t < 0.3 ? 60 : 34);
    }
    i++;
  }

  // --- BAD ACTOR'S PERSONAL STUDIO / BOSS ARENA ------------------------------
  const arenaX = bossZone + 40;
  buildings.push({
    x: arenaX, w: 780, h: 330, kind: "badActorStudio",
    name: "BAD ACTOR STUDIOS", tagline: "STAGE 1 — CLOSED SET",
    hue: "#241826", accent: "#ffcf4d", rooftopLetters: true, seed: 99,
  });
  screens.push({
    x: arenaX + 120, w: 520, h: 250, lift: 300, art: "still",
    text: "BAD ACTOR PRESENTS", sub: "SUS'TER ACT", projector: "ground", seed: 100,
  });
  props.push({ x: arenaX + 60, kind: "spotlight", seed: 101 });
  props.push({ x: arenaX + 720, kind: "spotlight", seed: 102 });
  props.push({ x: arenaX - 40, kind: "camera", seed: 103 });
  props.push({ x: arenaX + 780, kind: "camera", seed: 104 });
  props.push({ x: arenaX + 30, kind: "standee", text: "10/10 ACTING", seed: 105 });

  return {
    level: FILM_LEVEL, width, far, hillLetters, mid, buildings, sets, screens, props,
    sections: [
      { x: 0, label: "STUDIO ENTRANCE", kind: "entrance" },
      { x: width * 0.1, label: "FILM STUDIO STREET", kind: "studioStreet" },
      { x: width * 0.22, label: "THE BACKLOTS", kind: "backlots" },
      { x: width * 0.36, label: "MOVIE SETS", kind: "movieSets" },
      { x: width * 0.5, label: "PRODUCTION STUDIOS", kind: "production" },
      { x: width * 0.62, label: "PROP & COSTUME DISTRICT", kind: "propDistrict" },
      { x: width * 0.74, label: "PREMIERE BOULEVARD", kind: "premiere" },
      { x: bossZone, label: "BAD ACTOR'S STUDIO", kind: "badActorStudio" },
    ],
  };
}

let cached: FilmDistrict | null = null;

export function filmDistrictFor(level: number): FilmDistrict | null {
  if (level !== FILM_LEVEL) return null;
  if (!cached) cached = buildFilmDistrict(getLevelWidth(FILM_LEVEL));
  return cached;
}

export function hasFilmDistrict(level: number): boolean {
  return level === FILM_LEVEL;
}

export function filmSectionLabelAt(level: number, x: number): string | null {
  const d = filmDistrictFor(level);
  if (!d) return null;
  let label: string | null = null;
  for (const s of d.sections) if (x >= s.x) label = s.label;
  return label;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const FAR_PX = 0.18;
const MID_PX = 0.5;
const PROP_PX = 1.06;
/** Extra ground drawn below the street so a raised camera never shows a gap. */
export const FILM_GROUND_OVERDRAW = 260;

export function drawFilmDistrict(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const d = filmDistrictFor(level);
  if (!d) return;
  const now = renderNow();

  drawSky(ctx, canvasW);
  drawSearchlights(ctx, canvasW, now);

  // --- FAR: hills + skyline + hillside lettering ----------------------------
  const farOff = camX * FAR_PX;
  ctx.fillStyle = "#2c2438";
  ctx.beginPath();
  ctx.moveTo(-10, GROUND_Y);
  ctx.lineTo(-10, 150);
  ctx.quadraticCurveTo(canvasW * 0.3, 84, canvasW * 0.62, 150);
  ctx.quadraticCurveTo(canvasW * 0.85, 190, canvasW + 10, 140);
  ctx.lineTo(canvasW + 10, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  for (const b of d.far) {
    const sx = b.x - farOff;
    if (sx + b.w < -60 || sx > canvasW + 60) continue;
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = "#1d1a2c";
    ctx.fillRect(sx, GROUND_Y - b.h, b.w, b.h);
    ctx.globalAlpha = 1;
  }
  drawHillLetters(ctx, d.hillLetters.x - farOff, d.hillLetters.w);

  // --- MID: sound stages, towers, cranes ------------------------------------
  const midOff = camX * MID_PX;
  for (const b of d.mid) {
    const sx = b.x - midOff;
    if (sx + b.w < -100 || sx > canvasW + 100) continue;
    drawMidStructure(ctx, b, sx);
  }

  // --- LOT SURFACE (1:1) ----------------------------------------------------
  drawLotFloor(ctx, camX, canvasW);

  // --- BUILDINGS + SETS (1:1) -----------------------------------------------
  for (const s of d.sets) {
    const sx = s.x - camX;
    if (sx + s.w < -140 || sx > canvasW + 140) continue;
    drawMovieSet(ctx, s, sx, now);
  }
  for (const b of d.buildings) {
    const sx = b.x - camX;
    if (sx + b.w < -160 || sx > canvasW + 160) continue;
    drawFilmBuilding(ctx, b, sx, now);
  }

  // --- GIANT SCREENS + PROJECTOR BEAMS (1:1) --------------------------------
  for (const s of d.screens) {
    const sx = s.x - camX;
    if (sx + s.w < -200 || sx > canvasW + 200) continue;
    drawGiantScreen(ctx, s, sx, now);
  }

  // --- FOREGROUND FILM KIT (slight over-scroll) ------------------------------
  for (const p of d.props) {
    const sx = p.x - camX * PROP_PX;
    if (sx < -140 || sx > canvasW + 140) continue;
    drawFilmProp(ctx, p, sx, now);
  }
}

function drawSky(ctx: CanvasRenderingContext2D, canvasW: number) {
  const top = -FILM_GROUND_OVERDRAW;
  const g = ctx.createLinearGradient(0, top, 0, GROUND_Y);
  g.addColorStop(0, "#150d22");
  g.addColorStop(0.5, "#3a1f3d");
  g.addColorStop(1, "#8a3f45");
  ctx.fillStyle = g;
  ctx.fillRect(0, top, canvasW, GROUND_Y - top + 4);
  // A few stars over the hills
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97) % canvasW;
    const sy = ((i * 37) % 110) - 30;
    ctx.fillStyle = `rgba(255,240,210,${0.25 + flicker(i, 0.0015) * 0.4})`;
    ctx.fillRect(sx, sy, 1.6, 1.6);
  }
}

/** Premiere searchlights sweeping the sky — cheap, clock-driven, no RNG. */
function drawSearchlights(ctx: CanvasRenderingContext2D, canvasW: number, now: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const baseX = canvasW * (0.2 + i * 0.3);
    const a = Math.sin(now / 2600 + i * 2.1) * 0.5;
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#ffe6a8";
    ctx.beginPath();
    ctx.moveTo(baseX, GROUND_Y - 20);
    ctx.lineTo(baseX + Math.cos(a - 1.35) * 620, -200);
    ctx.lineTo(baseX + Math.cos(a - 1.1) * 620, -200);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawHillLetters(ctx: CanvasRenderingContext2D, sx: number, w: number) {
  if (sx + w < -80 || sx > 2000) return;
  const y = 138;
  ctx.save();
  ctx.font = "bold 34px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "#efe6d6";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;
  ctx.fillText("BAD ACTOR", sx, y);
  ctx.shadowBlur = 0;
  // Support struts under the letters
  ctx.strokeStyle = "rgba(60,50,60,0.8)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const lx = sx + 10 + i * 21;
    ctx.beginPath(); ctx.moveTo(lx, y + 4); ctx.lineTo(lx, y + 16); ctx.stroke();
  }
  ctx.restore();
  ctx.textAlign = "left";
}

function drawMidStructure(
  ctx: CanvasRenderingContext2D,
  b: FilmDistrict["mid"][number],
  sx: number,
) {
  const top = GROUND_Y - b.h;
  const shade = 26 + b.tone * 22;
  switch (b.kind) {
    case "stage": {
      // Windowless sound stage with a curved roof and a stage number.
      ctx.fillStyle = `rgb(${shade + 14},${shade + 8},${shade + 24})`;
      ctx.fillRect(sx, top + 16, b.w, b.h - 16);
      ctx.beginPath();
      ctx.moveTo(sx, top + 18);
      ctx.quadraticCurveTo(sx + b.w / 2, top - 14, sx + b.w, top + 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(sx + b.w - 12, top + 16, 12, b.h - 16);
      ctx.fillStyle = "rgba(255,214,140,0.35)";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${1 + (Math.floor(b.x / 97) % 30)}`, sx + b.w / 2, top + 70);
      ctx.textAlign = "left";
      break;
    }
    case "tower": {
      ctx.fillStyle = `rgb(${shade + 6},${shade + 4},${shade + 18})`;
      ctx.fillRect(sx + b.w * 0.2, top, b.w * 0.6, b.h);
      for (let ry = top + 14; ry < GROUND_Y - 30; ry += 26) {
        for (let c = 0; c < 3; c++) {
          const on = ((Math.floor(ry) + c * 5 + Math.floor(b.x)) % 7) > 2;
          ctx.fillStyle = on ? "rgba(255,208,130,0.5)" : "rgba(20,18,30,0.8)";
          ctx.fillRect(sx + b.w * 0.26 + c * (b.w * 0.16), ry, b.w * 0.1, 12);
        }
      }
      break;
    }
    case "waterTower": {
      const cx = sx + b.w / 2;
      const tankY = top + 40;
      ctx.strokeStyle = `rgb(${shade + 10},${shade + 6},${shade + 16})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 34, GROUND_Y); ctx.lineTo(cx - 10, tankY + 40);
      ctx.moveTo(cx + 34, GROUND_Y); ctx.lineTo(cx + 10, tankY + 40);
      ctx.stroke();
      ctx.fillStyle = "#514059";
      ctx.fillRect(cx - 38, tankY, 76, 44);
      ctx.beginPath(); ctx.moveTo(cx - 38, tankY); ctx.lineTo(cx, tankY - 20); ctx.lineTo(cx + 38, tankY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BAD ACTOR", cx, tankY + 26);
      ctx.textAlign = "left";
      break;
    }
    case "crane": {
      ctx.strokeStyle = "#3b3348";
      ctx.lineWidth = 4;
      const cx = sx + b.w / 2;
      ctx.beginPath();
      ctx.moveTo(cx, GROUND_Y); ctx.lineTo(cx, top);
      ctx.lineTo(cx + 90, top + 26);
      ctx.moveTo(cx, top + 20); ctx.lineTo(cx - 60, top + 40);
      ctx.stroke();
      ctx.fillStyle = "#5b5068";
      ctx.fillRect(cx + 84, top + 22, 22, 14);
      break;
    }
  }
}

function drawLotFloor(ctx: CanvasRenderingContext2D, camX: number, canvasW: number) {
  const bottom = GROUND_Y + FILM_GROUND_OVERDRAW;
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, bottom);
  g.addColorStop(0, "#33303c");
  g.addColorStop(1, "#151319");
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, canvasW, bottom - GROUND_Y);

  ctx.fillStyle = "#4a4553";
  ctx.fillRect(0, GROUND_Y - 4, canvasW, 5);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, GROUND_Y + 1, canvasW, 2);

  // Painted lot markings + taped cable runs, world-locked
  const step = 150;
  const start = -((camX % step) + step) % step;
  for (let sx = start; sx < canvasW + step; sx += step) {
    ctx.fillStyle = "rgba(255,214,120,0.18)";
    ctx.fillRect(sx, GROUND_Y + 46, 60, 4);
    ctx.fillStyle = "rgba(240,240,240,0.08)";
    ctx.fillRect(sx + 74, GROUND_Y + 70, 40, 3);
  }
  ctx.fillStyle = "rgba(255,220,160,0.05)";
  ctx.fillRect(0, GROUND_Y, canvasW, 16);
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

function fitFont(w: number, min = 9, max = 20): string {
  return `bold ${Math.max(min, Math.min(max, Math.round(w / 13)))}px monospace`;
}

function drawFilmBuilding(
  ctx: CanvasRenderingContext2D,
  b: FilmBuilding,
  sx: number,
  now: number,
) {
  const top = GROUND_Y - b.h;
  const glow = 0.7 + flicker(b.seed, 0.006) * 0.3;

  if (b.kind === "gate") {
    drawStudioGate(ctx, b, sx, top);
    return;
  }

  // Body
  ctx.fillStyle = b.hue;
  ctx.fillRect(sx, top, b.w, b.h);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(sx + b.w - 16, top, 16, b.h);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(sx, top, 9, b.h);

  if (b.kind === "soundStage" || b.kind === "warehouse" || b.kind === "costumeHouse") {
    // Ribbed hangar shell + giant sliding elephant door
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 2;
    for (let rx = sx + 18; rx < sx + b.w - 12; rx += 26) {
      ctx.beginPath(); ctx.moveTo(rx, top + 10); ctx.lineTo(rx, GROUND_Y - 4); ctx.stroke();
    }
    const dw = Math.min(150, b.w * 0.42);
    const dh = 130;
    ctx.fillStyle = "#1b1a22";
    ctx.fillRect(sx + b.w / 2 - dw / 2, GROUND_Y - dh, dw, dh);
    ctx.strokeStyle = b.accent; ctx.lineWidth = 3;
    ctx.strokeRect(sx + b.w / 2 - dw / 2, GROUND_Y - dh, dw, dh);
    ctx.fillStyle = "rgba(255,220,150,0.16)";
    ctx.fillRect(sx + b.w / 2 - dw / 2 + 6, GROUND_Y - dh + 6, dw - 12, dh - 12);
    if (b.stageNo !== undefined) {
      ctx.fillStyle = b.accent;
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`STAGE ${b.stageNo}`, sx + b.w / 2, GROUND_Y - dh - 16);
      ctx.textAlign = "left";
    }
    // Red "shooting" light over the door
    const on = Math.floor(now / 900) % 2 === 0;
    ctx.fillStyle = on ? "#ff4b4b" : "#5a1e1e";
    ctx.beginPath(); ctx.arc(sx + b.w / 2 + dw / 2 + 14, GROUND_Y - dh + 10, 6, 0, Math.PI * 2); ctx.fill();
  } else {
    // Offices / cinemas: glazing + entrance
    for (let ry = top + 22; ry < GROUND_Y - 120; ry += 40) {
      for (let cx0 = sx + 18; cx0 < sx + b.w - 40; cx0 += 52) {
        const lit = (Math.floor(cx0) + Math.floor(ry) + b.seed) % 4 !== 0;
        ctx.fillStyle = lit ? "rgba(255,222,160,0.55)" : "rgba(24,22,32,0.85)";
        ctx.fillRect(cx0, ry, 36, 26);
      }
    }
    // Box office / lobby
    ctx.fillStyle = "rgba(255,205,120,0.28)";
    ctx.fillRect(sx + 16, GROUND_Y - 108, b.w - 32, 92);
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
    ctx.strokeRect(sx + 16, GROUND_Y - 108, b.w - 32, 92);
    ctx.fillStyle = "#191420";
    ctx.fillRect(sx + b.w / 2 - 30, GROUND_Y - 96, 60, 96);
    if (b.kind === "cinema" || b.kind === "premiereHall" || b.kind === "badActorStudio") {
      // Red carpet + rope line
      ctx.fillStyle = "#8c1d2c";
      ctx.fillRect(sx + b.w / 2 - 56, GROUND_Y, 112, 26);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(sx + b.w / 2 - 56, GROUND_Y, 112, 3);
      // Marquee bulbs
      for (let bx = sx + 20; bx < sx + b.w - 16; bx += 18) {
        const lit = (Math.floor(now / 130) + Math.floor(bx / 18)) % 3 !== 0;
        ctx.fillStyle = lit ? "#ffe27a" : "#5a4a20";
        ctx.beginPath(); ctx.arc(bx, GROUND_Y - 116, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Curtains flanking the boss studio front
  if (b.kind === "badActorStudio") {
    drawCurtains(ctx, sx, top, b.w, b.h);
  }

  // Signage
  if (b.rooftopLetters) {
    const by = top - 44;
    ctx.font = fitFont(b.w * 0.85, 12, 26);
    ctx.textAlign = "center";
    ctx.shadowColor = b.accent; ctx.shadowBlur = 16 * glow;
    ctx.fillStyle = b.accent;
    ctx.fillText(b.name, sx + b.w / 2, by + 26);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#26202c"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + b.w * 0.28, by + 32); ctx.lineTo(sx + b.w * 0.28, top);
    ctx.moveTo(sx + b.w * 0.72, by + 32); ctx.lineTo(sx + b.w * 0.72, top);
    ctx.stroke();
  } else {
    const by = top + 10;
    ctx.fillStyle = "#14111c";
    ctx.fillRect(sx + 10, by, b.w - 20, 30);
    ctx.strokeStyle = b.accent; ctx.lineWidth = 2;
    ctx.strokeRect(sx + 10, by, b.w - 20, 30);
    ctx.font = fitFont(b.w);
    ctx.textAlign = "center";
    ctx.shadowColor = b.accent; ctx.shadowBlur = 10 * glow;
    ctx.fillStyle = "#fdf3dd";
    ctx.fillText(b.name, sx + b.w / 2, by + 21);
    ctx.shadowBlur = 0;
  }

  if (b.tagline) {
    ctx.fillStyle = "rgba(10,8,14,0.85)";
    const tw = Math.min(b.w - 60, 210);
    ctx.fillRect(sx + 20, GROUND_Y - 36, tw, 20);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(b.tagline.slice(0, Math.floor(tw / 6)), sx + 26, GROUND_Y - 22);
  }
  ctx.textAlign = "left";
}

function drawStudioGate(ctx: CanvasRenderingContext2D, b: FilmBuilding, sx: number, top: number) {
  // Two stone pillars, an arch sign and a security booth.
  ctx.fillStyle = b.hue;
  ctx.fillRect(sx, top + 40, 46, b.h - 40);
  ctx.fillRect(sx + b.w - 46, top + 40, 46, b.h - 40);
  ctx.fillStyle = "#6d5744";
  ctx.fillRect(sx - 6, top + 30, 58, 14);
  ctx.fillRect(sx + b.w - 52, top + 30, 58, 14);
  // Arch
  ctx.strokeStyle = "#6d5744"; ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(sx + 20, top + 36);
  ctx.quadraticCurveTo(sx + b.w / 2, top - 18, sx + b.w - 20, top + 36);
  ctx.stroke();
  ctx.font = "bold 17px monospace";
  ctx.textAlign = "center";
  ctx.shadowColor = b.accent; ctx.shadowBlur = 12;
  ctx.fillStyle = b.accent;
  ctx.fillText(b.name, sx + b.w / 2, top + 22);
  ctx.shadowBlur = 0;
  // Security booth
  ctx.fillStyle = "#3c3040";
  ctx.fillRect(sx + b.w / 2 - 34, GROUND_Y - 96, 68, 96);
  ctx.fillStyle = "rgba(190,225,255,0.35)";
  ctx.fillRect(sx + b.w / 2 - 26, GROUND_Y - 86, 52, 40);
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 8px monospace";
  ctx.fillText(b.tagline ?? "", sx + b.w / 2, GROUND_Y - 22);
  ctx.textAlign = "left";
}

function drawCurtains(ctx: CanvasRenderingContext2D, sx: number, top: number, w: number, h: number) {
  for (const side of [0, 1]) {
    const cw = 62;
    const cx = side === 0 ? sx - 6 : sx + w - cw + 6;
    const g = ctx.createLinearGradient(cx, 0, cx + cw, 0);
    g.addColorStop(0, "#5e0f1e");
    g.addColorStop(0.5, "#9b1c33");
    g.addColorStop(1, "#4a0c18");
    ctx.fillStyle = g;
    ctx.fillRect(cx, top, cw, h);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < 4; i++) ctx.fillRect(cx + 6 + i * 14, top, 4, h);
  }
}

// ---------------------------------------------------------------------------
// Movie sets (open-air backlot facades)
// ---------------------------------------------------------------------------

function drawMovieSet(ctx: CanvasRenderingContext2D, s: MovieSet, sx: number, now: number) {
  const top = GROUND_Y - s.h;

  // Painted backdrop wall behind the facade — makes it read as a SET.
  ctx.fillStyle = "#2b2736";
  ctx.fillRect(sx - 10, top - 26, s.w + 20, s.h + 26);
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
  for (let gx = sx; gx < sx + s.w; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, top - 26); ctx.lineTo(gx, GROUND_Y); ctx.stroke();
  }

  switch (s.kind) {
    case "church": drawChurchSet(ctx, s, sx, top, now); break;
    case "police": drawFacade(ctx, sx, top, s.w, s.h, "#3f4a63", "#cfe0ff", "PRECINCT 42"); break;
    case "mansion": drawFacade(ctx, sx, top, s.w, s.h, "#6b5a44", "#ffe6b8", "THE MANSION"); break;
    case "courtroom": drawFacade(ctx, sx, top, s.w, s.h, "#59493c", "#f5e6c8", "COURTHOUSE"); break;
    case "western": drawWesternSet(ctx, s, sx, top); break;
    case "scifi": drawSciFiSet(ctx, s, sx, top, now); break;
    case "horror": drawFacade(ctx, sx, top, s.w, s.h, "#2a2733", "#8fd7a8", "MOTEL — NO VACANCY"); break;
    case "crime": drawFacade(ctx, sx, top, s.w, s.h, "#3a3340", "#ff9b7a", "CRIME SCENE"); break;
    default: drawFacade(ctx, sx, top, s.w, s.h, "#4a4353", "#ffd9a8", "FAKE CITY STREET"); break;
  }

  // Scaffolding braces revealing the facade is fake
  ctx.strokeStyle = "rgba(190,160,110,0.55)"; ctx.lineWidth = 3;
  for (let bx = sx + 26; bx < sx + s.w - 20; bx += 90) {
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y);
    ctx.lineTo(bx + 26, top + 20);
    ctx.stroke();
  }

  // Set placard
  ctx.fillStyle = "rgba(12,10,16,0.9)";
  ctx.fillRect(sx + 6, top - 24, Math.min(210, s.w - 12), 20);
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(s.label, sx + 12, top - 10);

  // Crew silhouettes in front of the set (static, deterministic)
  ctx.fillStyle = "rgba(8,6,12,0.55)";
  for (let i = 0; i < 2; i++) {
    const cx = sx + 60 + ((s.seed + i * 137) % Math.max(60, s.w - 120));
    ctx.fillRect(cx - 6, GROUND_Y - 46, 12, 46);
    ctx.beginPath(); ctx.arc(cx, GROUND_Y - 52, 7, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFacade(
  ctx: CanvasRenderingContext2D,
  sx: number, top: number, w: number, h: number,
  hue: string, accent: string, label: string,
) {
  ctx.fillStyle = hue;
  ctx.fillRect(sx, top, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(sx + w - 12, top, 12, h);
  // Windows
  for (let ry = top + 26; ry < GROUND_Y - 90; ry += 44) {
    for (let cx0 = sx + 20; cx0 < sx + w - 44; cx0 += 58) {
      ctx.fillStyle = "rgba(255,224,170,0.35)";
      ctx.fillRect(cx0, ry, 40, 28);
      ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx0, ry, 40, 28);
    }
  }
  // Door + steps
  ctx.fillStyle = "#1c1922";
  ctx.fillRect(sx + w / 2 - 26, GROUND_Y - 84, 52, 84);
  ctx.fillStyle = accent;
  ctx.fillRect(sx + w / 2 - 34, GROUND_Y - 90, 68, 7);
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.fillText(label, sx + w / 2, top + 20);
  ctx.textAlign = "left";
}

function drawChurchSet(
  ctx: CanvasRenderingContext2D,
  s: MovieSet, sx: number, top: number, now: number,
) {
  const w = s.w;
  // Chapel body
  ctx.fillStyle = "#e6dcc4";
  ctx.fillRect(sx + w * 0.12, top + 60, w * 0.76, s.h - 60);
  // Gable + steeple
  ctx.fillStyle = "#d8cbae";
  ctx.beginPath();
  ctx.moveTo(sx + w * 0.1, top + 62);
  ctx.lineTo(sx + w / 2, top + 6);
  ctx.lineTo(sx + w * 0.9, top + 62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#c9b993";
  ctx.fillRect(sx + w * 0.46, top - 46, w * 0.08, 56);
  // Cross
  ctx.fillStyle = "#e3b23c";
  ctx.fillRect(sx + w * 0.492, top - 82, w * 0.016, 40);
  ctx.fillRect(sx + w * 0.462, top - 70, w * 0.076, w * 0.016);
  // Stained-glass rose window
  const cx = sx + w / 2;
  const cy = top + 100;
  for (let i = 0; i < 8; i++) {
    const hue = (i * 45 + Math.floor(now / 400)) % 360;
    ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.85)`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 26, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = "#6b5a3c"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
  // Arched doors
  ctx.fillStyle = "#5a3f26";
  ctx.beginPath();
  ctx.moveTo(cx - 40, GROUND_Y);
  ctx.lineTo(cx - 40, GROUND_Y - 70);
  ctx.quadraticCurveTo(cx, GROUND_Y - 128, cx + 40, GROUND_Y - 70);
  ctx.lineTo(cx + 40, GROUND_Y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#e3b23c"; ctx.lineWidth = 2; ctx.stroke();
  // Small crosses along the facade
  ctx.fillStyle = "#b9a374";
  for (let i = 0; i < 4; i++) {
    const px = sx + w * 0.2 + i * (w * 0.2);
    ctx.fillRect(px, top + 150, 4, 20);
    ctx.fillRect(px - 6, top + 156, 16, 4);
  }
  // Banner
  ctx.fillStyle = "#7a1230";
  ctx.fillRect(sx + w * 0.18, top + 190, w * 0.64, 26);
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("SUS'TER ACT", cx, top + 209);
  ctx.textAlign = "left";
}

function drawWesternSet(ctx: CanvasRenderingContext2D, s: MovieSet, sx: number, top: number) {
  ctx.fillStyle = "#7a5a38";
  ctx.fillRect(sx, top + 30, s.w, s.h - 30);
  // False front
  ctx.fillStyle = "#8d6a42";
  ctx.beginPath();
  ctx.moveTo(sx, top + 32);
  ctx.lineTo(sx + s.w * 0.3, top);
  ctx.lineTo(sx + s.w * 0.7, top);
  ctx.lineTo(sx + s.w, top + 32);
  ctx.closePath(); ctx.fill();
  // Porch
  ctx.fillStyle = "#5c4229";
  ctx.fillRect(sx + 10, GROUND_Y - 96, s.w - 20, 10);
  ctx.fillStyle = "#4a341f";
  for (let px = sx + 22; px < sx + s.w - 20; px += 70) ctx.fillRect(px, GROUND_Y - 96, 8, 96);
  ctx.fillStyle = "#ffe0a3";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText("SALOON — NO REFUNDS", sx + s.w / 2, top + 24);
  ctx.textAlign = "left";
  // Planks
  ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1;
  for (let ry = top + 46; ry < GROUND_Y; ry += 14) {
    ctx.beginPath(); ctx.moveTo(sx, ry); ctx.lineTo(sx + s.w, ry); ctx.stroke();
  }
}

function drawSciFiSet(ctx: CanvasRenderingContext2D, s: MovieSet, sx: number, top: number, now: number) {
  ctx.fillStyle = "#232b3e";
  ctx.fillRect(sx, top, s.w, s.h);
  ctx.strokeStyle = "#5ef2ff"; ctx.lineWidth = 2;
  ctx.strokeRect(sx + 12, top + 12, s.w - 24, s.h - 24);
  // Blast door
  const cx = sx + s.w / 2;
  ctx.fillStyle = "#161d2c";
  ctx.fillRect(cx - 54, GROUND_Y - 110, 108, 110);
  ctx.strokeStyle = "#5ef2ff";
  ctx.beginPath(); ctx.moveTo(cx, GROUND_Y - 110); ctx.lineTo(cx, GROUND_Y); ctx.stroke();
  // Panel lights
  for (let i = 0; i < 6; i++) {
    const on = (Math.floor(now / 320) + i) % 3 !== 0;
    ctx.fillStyle = on ? "rgba(94,242,255,0.85)" : "rgba(30,60,80,0.85)";
    ctx.fillRect(sx + 26 + i * 26, top + 30, 16, 6);
  }
  ctx.fillStyle = "#5ef2ff";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("AIRLOCK 7 — DO NOT OPEN", cx, top + 62);
  ctx.textAlign = "left";
}

// ---------------------------------------------------------------------------
// Giant screens + projectors
// ---------------------------------------------------------------------------

function drawGiantScreen(ctx: CanvasRenderingContext2D, s: GiantScreen, sx: number, now: number) {
  const bottom = GROUND_Y - s.lift;
  const top = bottom - s.h;

  // Projector + beam first, so the screen sits on top of the light.
  if (s.projector !== "none") {
    const px = s.projector === "ground" ? sx - 40 : sx + s.w + 40;
    const py = s.projector === "ground" ? GROUND_Y - 26 : bottom - 12;
    drawProjector(ctx, px, py, s.projector === "ground" ? 1 : -1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.1 + flicker(s.seed, 0.01) * 0.06;
    ctx.fillStyle = "#fff0c0";
    ctx.beginPath();
    ctx.moveTo(px, py - 8);
    ctx.lineTo(sx, top);
    ctx.lineTo(sx + s.w, top + s.h * 0.2);
    ctx.lineTo(px, py + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Frame
  ctx.fillStyle = "#0e0c14";
  ctx.fillRect(sx - 8, top - 8, s.w + 16, s.h + 16);
  ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3;
  ctx.strokeRect(sx - 8, top - 8, s.w + 16, s.h + 16);

  // Picture
  const img = s.art === "poster" ? SUSTER_POSTER_IMG : SUSTER_SCREEN_IMG;
  if (s.art !== "text" && ready(img)) {
    ctx.drawImage(img, sx, top, s.w, s.h);
    // Subtle projector shimmer over the picture
    ctx.fillStyle = `rgba(255,244,214,${0.05 + flicker(s.seed + 3, 0.02) * 0.05})`;
    ctx.fillRect(sx, top, s.w, s.h);
  } else {
    // Painted fallback (also used for pure text billboards)
    const g = ctx.createLinearGradient(sx, top, sx, top + s.h);
    g.addColorStop(0, "#241633");
    g.addColorStop(1, "#0e0a16");
    ctx.fillStyle = g;
    ctx.fillRect(sx, top, s.w, s.h);
    ctx.fillStyle = "#ffd166";
    ctx.font = fitFont(s.w, 12, 26);
    ctx.textAlign = "center";
    ctx.fillText(s.text, sx + s.w / 2, top + s.h / 2);
    if (s.sub) {
      ctx.fillStyle = "#f3e7c6";
      ctx.font = "bold 10px monospace";
      ctx.fillText(s.sub, sx + s.w / 2, top + s.h / 2 + 22);
    }
    ctx.textAlign = "left";
  }

  // Caption strip under the screen
  ctx.fillStyle = "rgba(10,8,14,0.9)";
  ctx.fillRect(sx - 8, bottom + 8, s.w + 16, 22);
  ctx.strokeStyle = "rgba(255,209,102,0.6)"; ctx.lineWidth = 1.5;
  ctx.strokeRect(sx - 8, bottom + 8, s.w + 16, 22);
  ctx.fillStyle = "#ffe9a8";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  const flash = Math.floor(now / 1600) % 2 === 0 ? s.text : (s.sub ?? s.text);
  ctx.fillText(flash, sx + s.w / 2, bottom + 23);
  ctx.textAlign = "left";

  // Support pylons down to the ground
  ctx.strokeStyle = "#2a2434"; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sx + s.w * 0.2, bottom + 30); ctx.lineTo(sx + s.w * 0.2, GROUND_Y);
  ctx.moveTo(sx + s.w * 0.8, bottom + 30); ctx.lineTo(sx + s.w * 0.8, GROUND_Y);
  ctx.stroke();
}

function drawProjector(ctx: CanvasRenderingContext2D, sx: number, y: number, dir: 1 | -1) {
  ctx.save();
  ctx.translate(sx, y);
  ctx.scale(dir, 1);
  // Body
  ctx.fillStyle = "#2c2a36";
  ctx.fillRect(-26, -22, 52, 26);
  ctx.fillStyle = "#41404f";
  ctx.fillRect(-26, -22, 52, 5);
  // Twin film reels
  ctx.fillStyle = "#c9c4d6";
  ctx.beginPath(); ctx.arc(-12, -34, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -34, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a3846";
  ctx.beginPath(); ctx.arc(-12, -34, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -34, 3, 0, Math.PI * 2); ctx.fill();
  // Lens
  ctx.fillStyle = "#ffe9b0";
  ctx.fillRect(24, -16, 12, 10);
  // Tripod
  ctx.strokeStyle = "#2c2a36"; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, 4); ctx.lineTo(-18, 26);
  ctx.moveTo(8, 4); ctx.lineTo(18, 26);
  ctx.moveTo(0, 4); ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Foreground film kit
// ---------------------------------------------------------------------------

function drawFilmProp(ctx: CanvasRenderingContext2D, p: FilmProp, sx: number, now: number) {
  switch (p.kind) {
    case "camera": {
      // Studio camera on a tripod, roughly shoulder-height next to Waldoge.
      ctx.strokeStyle = "#23212c"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, GROUND_Y - 54); ctx.lineTo(sx - 16, GROUND_Y);
      ctx.moveTo(sx, GROUND_Y - 54); ctx.lineTo(sx + 16, GROUND_Y);
      ctx.moveTo(sx, GROUND_Y - 54); ctx.lineTo(sx + 2, GROUND_Y);
      ctx.stroke();
      ctx.fillStyle = "#2f2d3a";
      ctx.fillRect(sx - 20, GROUND_Y - 86, 44, 30);
      ctx.fillStyle = "#1a1922";
      ctx.fillRect(sx + 22, GROUND_Y - 78, 14, 14);
      ctx.fillStyle = "#c9c4d6";
      ctx.beginPath(); ctx.arc(sx - 8, GROUND_Y - 94, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 12, GROUND_Y - 92, 7, 0, Math.PI * 2); ctx.fill();
      const rec = Math.floor(now / 700) % 2 === 0;
      ctx.fillStyle = rec ? "#ff4b4b" : "#5a1e1e";
      ctx.beginPath(); ctx.arc(sx - 16, GROUND_Y - 80, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "lightRig": {
      ctx.strokeStyle = "#24222d"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, GROUND_Y - 92); ctx.lineTo(sx, GROUND_Y);
      ctx.moveTo(sx, GROUND_Y); ctx.lineTo(sx - 14, GROUND_Y);
      ctx.moveTo(sx, GROUND_Y); ctx.lineTo(sx + 14, GROUND_Y);
      ctx.stroke();
      ctx.fillStyle = "#3a3745";
      ctx.fillRect(sx - 18, GROUND_Y - 118, 36, 28);
      const beam = 0.35 + flicker(p.seed, 0.008) * 0.25;
      ctx.fillStyle = `rgba(255,238,190,${beam})`;
      ctx.beginPath();
      ctx.moveTo(sx + 18, GROUND_Y - 114);
      ctx.lineTo(sx + 92, GROUND_Y - 130);
      ctx.lineTo(sx + 92, GROUND_Y - 74);
      ctx.lineTo(sx + 18, GROUND_Y - 96);
      ctx.closePath(); ctx.fill();
      break;
    }
    case "spotlight": {
      ctx.fillStyle = "#2a2833";
      ctx.fillRect(sx - 16, GROUND_Y - 26, 32, 26);
      ctx.fillStyle = "#413e4e";
      ctx.beginPath(); ctx.ellipse(sx, GROUND_Y - 34, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12 + flicker(p.seed, 0.006) * 0.08;
      ctx.fillStyle = "#ffeec0";
      const sway = Math.sin(now / 2200 + p.seed) * 40;
      ctx.beginPath();
      ctx.moveTo(sx - 14, GROUND_Y - 40);
      ctx.lineTo(sx - 70 + sway, GROUND_Y - 300);
      ctx.lineTo(sx + 40 + sway, GROUND_Y - 300);
      ctx.lineTo(sx + 14, GROUND_Y - 40);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      break;
    }
    case "directorChair": {
      ctx.strokeStyle = "#4a3726"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - 14, GROUND_Y); ctx.lineTo(sx + 10, GROUND_Y - 40);
      ctx.moveTo(sx + 14, GROUND_Y); ctx.lineTo(sx - 10, GROUND_Y - 40);
      ctx.moveTo(sx - 12, GROUND_Y - 40); ctx.lineTo(sx - 12, GROUND_Y - 66);
      ctx.stroke();
      ctx.fillStyle = "#8c1d2c";
      ctx.fillRect(sx - 16, GROUND_Y - 44, 32, 9);
      ctx.fillRect(sx - 16, GROUND_Y - 68, 32, 12);
      ctx.fillStyle = "#ffe0a3";
      ctx.font = "bold 6px monospace"; ctx.textAlign = "center";
      ctx.fillText("DIRECTOR", sx, GROUND_Y - 59);
      ctx.textAlign = "left";
      break;
    }
    case "cableCoil": {
      ctx.strokeStyle = "#16151c"; ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(sx, GROUND_Y - 6 - i * 4, 22 - i * 4, 7 - i, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "#22212a"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + 20, GROUND_Y - 4);
      ctx.quadraticCurveTo(sx + 60, GROUND_Y - 12, sx + 96, GROUND_Y - 3);
      ctx.stroke();
      break;
    }
    case "crate": {
      ctx.fillStyle = "#6b5232";
      ctx.fillRect(sx - 22, GROUND_Y - 40, 46, 40);
      ctx.strokeStyle = "#4a3721"; ctx.lineWidth = 3;
      ctx.strokeRect(sx - 22, GROUND_Y - 40, 46, 40);
      ctx.beginPath(); ctx.moveTo(sx - 22, GROUND_Y - 40); ctx.lineTo(sx + 24, GROUND_Y); ctx.stroke();
      ctx.fillStyle = "#f0e0b8";
      ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
      ctx.fillText(p.text ?? "PROPS", sx + 1, GROUND_Y - 18);
      ctx.textAlign = "left";
      break;
    }
    case "boomMic": {
      ctx.strokeStyle = "#2b2934"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 20, GROUND_Y - 40); ctx.lineTo(sx + 44, GROUND_Y - 108);
      ctx.stroke();
      ctx.fillStyle = "#57525f";
      ctx.save();
      ctx.translate(sx + 48, GROUND_Y - 112);
      ctx.rotate(-0.8);
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "#3a3745"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(sx - 20, GROUND_Y - 40); ctx.lineTo(sx - 20, GROUND_Y); ctx.stroke();
      break;
    }
    case "costumeRack": {
      ctx.strokeStyle = "#4b4757"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 30, GROUND_Y); ctx.lineTo(sx - 30, GROUND_Y - 84);
      ctx.moveTo(sx + 30, GROUND_Y); ctx.lineTo(sx + 30, GROUND_Y - 84);
      ctx.moveTo(sx - 32, GROUND_Y - 84); ctx.lineTo(sx + 32, GROUND_Y - 84);
      ctx.stroke();
      const cols = ["#8c1d2c", "#2c3f7a", "#1b1b22", "#c9a227", "#e6dcc4"];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = cols[i];
        ctx.fillRect(sx - 26 + i * 12, GROUND_Y - 80, 9, 52);
      }
      break;
    }
    case "filmTruck": {
      ctx.fillStyle = "#37344a";
      ctx.fillRect(sx - 66, GROUND_Y - 74, 96, 62);
      ctx.fillStyle = "#4a4660";
      ctx.fillRect(sx + 30, GROUND_Y - 56, 42, 44);
      ctx.fillStyle = "rgba(190,225,255,0.5)";
      ctx.fillRect(sx + 38, GROUND_Y - 50, 26, 18);
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
      ctx.fillText("BAD ACTOR", sx - 18, GROUND_Y - 44);
      ctx.font = "bold 7px monospace";
      ctx.fillText("CAMERA DEPT", sx - 18, GROUND_Y - 32);
      ctx.textAlign = "left";
      ctx.fillStyle = "#14131a";
      ctx.beginPath(); ctx.arc(sx - 44, GROUND_Y - 10, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 46, GROUND_Y - 10, 12, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "barrier": {
      ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - 22, GROUND_Y); ctx.lineTo(sx - 22, GROUND_Y - 44);
      ctx.moveTo(sx + 22, GROUND_Y); ctx.lineTo(sx + 22, GROUND_Y - 44);
      ctx.stroke();
      ctx.strokeStyle = "#8c1d2c"; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx - 20, GROUND_Y - 40);
      ctx.quadraticCurveTo(sx, GROUND_Y - 22, sx + 20, GROUND_Y - 40);
      ctx.stroke();
      break;
    }
    case "standee": {
      // Cardboard cut-out of the SUS'TER ACT poster on the pavement.
      const w = 54, h = 92;
      if (ready(SUSTER_POSTER_IMG)) {
        ctx.drawImage(SUSTER_POSTER_IMG, sx - w / 2, GROUND_Y - h, w, h);
      } else {
        ctx.fillStyle = "#241633";
        ctx.fillRect(sx - w / 2, GROUND_Y - h, w, h);
      }
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
      ctx.strokeRect(sx - w / 2, GROUND_Y - h, w, h);
      ctx.fillStyle = "rgba(10,8,14,0.85)";
      ctx.fillRect(sx - w / 2, GROUND_Y - 16, w, 14);
      ctx.fillStyle = "#ffe9a8";
      ctx.font = "bold 6px monospace"; ctx.textAlign = "center";
      ctx.fillText((p.text ?? "SUS'TER ACT").slice(0, 12), sx, GROUND_Y - 6);
      ctx.textAlign = "left";
      break;
    }
    case "clapper": {
      ctx.fillStyle = "#16151c";
      ctx.fillRect(sx - 20, GROUND_Y - 34, 44, 30);
      ctx.fillStyle = "#f2eee6";
      for (let i = 0; i < 4; i++) ctx.fillRect(sx - 18 + i * 12, GROUND_Y - 44, 7, 9);
      ctx.fillStyle = "#16151c";
      ctx.fillRect(sx - 20, GROUND_Y - 44, 44, 9);
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
      ctx.fillText("TAKE 99", sx + 2, GROUND_Y - 16);
      ctx.textAlign = "left";
      break;
    }
    case "trailer": {
      ctx.fillStyle = "#d8d3c6";
      ctx.fillRect(sx - 56, GROUND_Y - 84, 112, 72);
      ctx.fillStyle = "#b7b1a2";
      ctx.fillRect(sx - 56, GROUND_Y - 84, 112, 8);
      ctx.fillStyle = "#2c2a36";
      ctx.fillRect(sx + 16, GROUND_Y - 66, 28, 54);
      ctx.fillStyle = "rgba(190,225,255,0.55)";
      ctx.fillRect(sx - 44, GROUND_Y - 68, 34, 24);
      ctx.fillStyle = "#8c1d2c";
      ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
      ctx.fillText("TALENT ONLY", sx - 12, GROUND_Y - 26);
      ctx.textAlign = "left";
      ctx.fillStyle = "#14131a";
      ctx.beginPath(); ctx.arc(sx - 30, GROUND_Y - 10, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 30, GROUND_Y - 10, 11, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }
}

export const __filmTest = { buildFilmDistrict };
