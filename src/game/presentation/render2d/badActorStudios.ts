/**
 * LEVEL 3 — BAD ACTORS STUDIOS (blueprint build).
 * ---------------------------------------------------------------------------
 * The level is authored as THIRTEEN discrete studio areas, in the exact order
 * of the approved blueprint. Each area owns its own painted 1200x400 section of
 * the world, so the player physically travels the studio complex instead of
 * seeing every landmark at once:
 *
 *   1  BAD ACTORS STUDIOS main entrance      8  Stage 2
 *   2  Outdoor film lot                      9  Green screen stage
 *   3  REDACTED HOLLYWOOD billboard         10  Prop department
 *   4  Director / production office         11  Makeup / dressing rooms
 *   5  BAD ACTOR DISTRICT projector         12  Backstage equipment storage
 *   6  SUS'TER ACT promotional plaza        13  Rooftop / backlot boss arena
 *   7  Stage 1
 *
 * Identity imagery is composited from the approved references rather than
 * re-invented by the scenery art:
 *   • REDACTED HOLLYWOOD billboard  -> `susdog-original.jpg` (NO nun outfit)
 *   • BAD ACTOR DISTRICT screen     -> `badactor-boss-head.png`
 *   • SUS'TER ACT posters / screens -> the two exact supplied nun characters
 *
 * Presentation only. Collision, ladders, decks, encounters, combat and AI all
 * live in `src/game/config/world.ts` and the gameplay loop and are untouched.
 *
 * PERFORMANCE CONTRACT
 *   • Images preload once at module import; nothing decodes per frame.
 *   • The parallax skyline is generated once and cached per world width.
 *   • Every layer is viewport-culled; no per-frame allocation, no Math.random,
 *     no Date.now (animation reads the shared render clock).
 */

import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
import { flicker } from "./clock";

import entranceArt from "@/assets/l3-01-entrance.jpg.asset.json";
import lotArt from "@/assets/l3-02-lot.jpg.asset.json";
import redactedArt from "@/assets/l3-03-redacted.jpg.asset.json";
import officeArt from "@/assets/l3-04-office.jpg.asset.json";
import projectorArt from "@/assets/l3-05-projector.jpg.asset.json";
import susterArt from "@/assets/l3-06-suster.jpg.asset.json";
import stage1Art from "@/assets/l3-07-stage1.jpg.asset.json";
import stage2Art from "@/assets/l3-08-stage2.jpg.asset.json";
import greenScreenArt from "@/assets/l3-09-greenscreen.jpg.asset.json";
import propsArt from "@/assets/l3-10-props.jpg.asset.json";
import makeupArt from "@/assets/l3-11-makeup.jpg.asset.json";
import backstageArt from "@/assets/l3-12-backstage.jpg.asset.json";
import rooftopArt from "@/assets/l3-13-rooftop.jpg.asset.json";

import susDogUrl from "@/assets/susdog-original.jpg";
import badActorHeadUrl from "@/assets/badactor-boss-head.png";
import nunFrogAsset from "@/assets/suster-act-nun-frog.png.asset.json";
import nunSusDogAsset from "@/assets/suster-act-nun-sus-dog.png.asset.json";

export const BAD_ACTOR_LEVEL = 2;

/** Horizontal span of one authored area, in world units. */
export const AREA_W = 1200;
/** Painted section height; 0.84 of it sits above the combat floor. */
const AREA_H = 400;
const FLOOR_FRACTION = 0.84;
const TOP_Y = GROUND_Y - AREA_H * FLOOR_FRACTION;

/** A reference image composited onto a painted area at a fixed rectangle. */
interface Overlay {
  /** Image URL. */
  src: string;
  /** Rect in area-local fractions (0..1 of AREA_W / AREA_H). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** `contain` letterboxes inside the frame, `cover` fills it. */
  fit: "contain" | "cover";
  /** Optional warm/cool tint strength for screen surfaces. */
  glow?: string;
}

/** Distinct art treatments — every ad in the studio looks different. */
export type SusterStyle =
  | "marquee"
  | "noir"
  | "neon"
  | "technicolor"
  | "curtain"
  | "filmstrip"
  | "onesheet"
  | "premiere"
  | "storyboard"
  | "drivein"
  | "lobbycard";

/** A physical SUS'TER ACT advertisement carrying both exact character images. */
export interface SusterAd {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "poster" | "billboard" | "backlit" | "screen";
  /** Unique visual treatment for this individual advertisement. */
  style: SusterStyle;
  /** Bottom strap line, always a release tease. */
  tagline?: string;
}


export interface StudioArea {
  /** HUD / debug label. */
  label: string;
  /** Painted section URL. */
  art: string;
  /** Approved identity imagery composited on top. */
  overlays: Overlay[];
  /** Physical movie advertising integrated into this area. */
  susterAds: readonly SusterAd[];
}

export const SUSTER_CHARACTER_URLS = {
  nunFrog: nunFrogAsset.url,
  nunSusDog: nunSusDogAsset.url,
} as const;

const noAds: readonly SusterAd[] = [];

/** The blueprint area order. Index = traversal order. */
export const BAD_ACTOR_AREAS: readonly StudioArea[] = [
  {
    label: "BAD ACTORS STUDIOS",
    art: entranceArt.url,
    overlays: [],
    susterAds: [{ x: 0.06, y: 0.25, w: 0.2, h: 0.55, kind: "backlit", style: "marquee", tagline: "COMING SOON" }],
  },
  {
    label: "OUTDOOR FILM LOT",
    art: lotArt.url,
    overlays: [],
    susterAds: [{ x: 0.66, y: 0.18, w: 0.28, h: 0.48, kind: "billboard", style: "technicolor", tagline: "COMING SOON" }],
  },
  {
    label: "REDACTED HOLLYWOOD",
    art: redactedArt.url,
    // Sus Dog on the billboard — approved face, NO nun outfit.
    overlays: [{ src: susDogUrl, x: 0.556, y: 0.125, w: 0.253, h: 0.29, fit: "cover" }],
    susterAds: noAds,
  },
  {
    label: "DIRECTOR'S OFFICE",
    art: officeArt.url,
    overlays: [],
    susterAds: [{ x: 0.08, y: 0.24, w: 0.18, h: 0.54, kind: "poster", style: "noir", tagline: "COMING SOON" }],
  },
  {
    label: "BAD ACTOR DISTRICT",
    art: projectorArt.url,
    // Bad Actor's own head fills the giant projector screen.
    overlays: [
      { src: badActorHeadUrl, x: 0.515, y: 0.19, w: 0.36, h: 0.47, fit: "contain", glow: "rgba(255,60,60,0.16)" },
    ],
    susterAds: noAds,
  },
  {
    label: "SUS'TER ACT MOVIE SET",
    art: susterArt.url,
    overlays: [],
    susterAds: [
      { x: 0.07, y: 0.18, w: 0.2, h: 0.62, kind: "backlit", style: "neon", tagline: "COMING SOON" },
      { x: 0.31, y: 0.12, w: 0.38, h: 0.59, kind: "billboard", style: "premiere", tagline: "COMING SOON" },
      { x: 0.73, y: 0.18, w: 0.2, h: 0.62, kind: "backlit", style: "curtain", tagline: "COMING SOON" },
    ],
  },
  {
    label: "STAGE 1",
    art: stage1Art.url,
    overlays: [],
    susterAds: [{ x: 0.69, y: 0.2, w: 0.24, h: 0.54, kind: "screen", style: "drivein", tagline: "COMING SOON" }],
  },
  {
    label: "STAGE 2",
    art: stage2Art.url,
    overlays: [],
    susterAds: [{ x: 0.08, y: 0.23, w: 0.2, h: 0.54, kind: "poster", style: "onesheet", tagline: "COMING SOON" }],
  },
  {
    label: "GREEN SCREEN STAGE",
    art: greenScreenArt.url,
    overlays: [],
    susterAds: [{ x: 0.68, y: 0.2, w: 0.25, h: 0.55, kind: "screen", style: "storyboard", tagline: "COMING SOON" }],
  },
  { label: "PROP DEPARTMENT", art: propsArt.url, overlays: [], susterAds: noAds },
  {
    label: "MAKEUP / DRESSING ROOMS",
    art: makeupArt.url,
    overlays: [],
    susterAds: [{ x: 0.06, y: 0.23, w: 0.21, h: 0.57, kind: "backlit", style: "lobbycard", tagline: "COMING SOON" }],
  },
  {
    label: "BACKSTAGE STORAGE",
    art: backstageArt.url,
    overlays: [],
    susterAds: [{ x: 0.69, y: 0.22, w: 0.24, h: 0.53, kind: "poster", style: "filmstrip", tagline: "COMING SOON" }],
  },
  { label: "ROOFTOP / BAD ACTOR ARENA", art: rooftopArt.url, overlays: [], susterAds: noAds },
];

/** Labels only, for tests and the debug overlay. */
export const BAD_ACTOR_SECTIONS = BAD_ACTOR_AREAS.map((a) => a.label);

// ---------------------------------------------------------------------------
// Image cache
// ---------------------------------------------------------------------------

const images = new Map<string, HTMLImageElement>();

function load(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const existing = images.get(src);
  if (existing) return existing;
  const image = new Image();
  image.src = src;
  images.set(src, image);
  return image;
}

for (const area of BAD_ACTOR_AREAS) {
  load(area.art);
  for (const o of area.overlays) load(o.src);
}
load(SUSTER_CHARACTER_URLS.nunFrog);
load(SUSTER_CHARACTER_URLS.nunSusDog);

function ready(src: string): HTMLImageElement | null {
  const image = images.get(src) ?? load(src);
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}

/** True once every painted area has decoded (overlays may still be loading). */
export function badActorStudiosReady(): boolean {
  return BAD_ACTOR_AREAS.every((a) => !!ready(a.art));
}

export function hasBadActorStudios(level: number): boolean {
  return level === BAD_ACTOR_LEVEL && badActorStudiosReady();
}

// ---------------------------------------------------------------------------
// Parallax skyline (cached)
// ---------------------------------------------------------------------------

interface SkylineBlock { x: number; w: number; h: number; lit: number }
interface StudioWorld { width: number; areas: number; skyline: SkylineBlock[] }

let cachedWorld: StudioWorld | null = null;

export function badActorWorldFor(level: number): StudioWorld | null {
  if (level !== BAD_ACTOR_LEVEL) return null;
  const width = getLevelWidth(level);
  if (cachedWorld?.width === width) return cachedWorld;
  const skyline: SkylineBlock[] = [];
  for (let x = -280, i = 0; x < width + 520; i++) {
    const w = 64 + ((i * 53) % 104);
    skyline.push({ x, w, h: 120 + ((i * 71) % 190), lit: (i * 41) % 100 });
    x += w + 22 + ((i * 23) % 38);
  }
  cachedWorld = { width, areas: Math.ceil(width / AREA_W), skyline };
  return cachedWorld;
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  camX: number,
  canvasW: number,
  world: StudioWorld,
) {
  const sky = ctx.createLinearGradient(0, -320, 0, GROUND_Y);
  sky.addColorStop(0, "#03060f");
  sky.addColorStop(0.6, "#0a1426");
  sky.addColorStop(1, "#1b1524");
  ctx.fillStyle = sky;
  ctx.fillRect(0, -360, canvasW, GROUND_Y + 640);

  const offset = camX * 0.13;
  for (const b of world.skyline) {
    const x = b.x - offset;
    if (x + b.w < -20 || x > canvasW + 20) continue;
    ctx.fillStyle = b.lit > 52 ? "#0d1626" : "#09111f";
    ctx.fillRect(x, GROUND_Y - b.h - 120, b.w, b.h);
    ctx.fillStyle = b.lit % 3 ? "rgba(255,186,84,0.26)" : "rgba(74,199,224,0.22)";
    for (let wx = x + 9; wx < x + b.w - 6; wx += 17) {
      for (let wy = GROUND_Y - b.h - 104; wy < GROUND_Y - 150; wy += 23) {
        if ((Math.round(wx + wy + b.lit) % 5) !== 0) ctx.fillRect(wx, wy, 6, 8);
      }
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const baseX = canvasW * (0.2 + i * 0.3);
    const sweep = (flicker(i * 137, 0.0006) - 0.5) * 1.1;
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#cfe6ff";
    ctx.beginPath();
    ctx.moveTo(baseX, GROUND_Y - 80);
    ctx.lineTo(baseX + Math.cos(sweep - 1.35) * 700, -320);
    ctx.lineTo(baseX + Math.cos(sweep - 1.06) * 700, -320);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  o: Overlay,
  areaScreenX: number,
) {
  const image = ready(o.src);
  if (!image) return;
  const fx = areaScreenX + o.x * AREA_W;
  const fy = TOP_Y + o.y * AREA_H;
  const fw = o.w * AREA_W;
  const fh = o.h * AREA_H;

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(fx, fy, fw, fh);

  const ar = image.naturalWidth / image.naturalHeight;
  let dw = fw;
  let dh = fh;
  if (o.fit === "cover") {
    if (fw / fh > ar) dh = fw / ar;
    else dw = fh * ar;
  } else if (fw / fh > ar) {
    dw = fh * ar;
  } else {
    dh = fw / ar;
  }
  ctx.drawImage(image, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
  ctx.restore();

  // Frame edge so composited art reads as printed/projected, not pasted.
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(fx, fy, fw, fh);
  if (o.glow) {
    ctx.fillStyle = o.glow;
    ctx.fillRect(fx, fy, fw, fh);
  }
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + h - dh, dw, dh);
}

/** Draws one consistent physical movie ad while preserving both source images. */
function drawSusterAd(
  ctx: CanvasRenderingContext2D,
  ad: SusterAd,
  areaScreenX: number,
) {
  const frog = ready(SUSTER_CHARACTER_URLS.nunFrog);
  const dog = ready(SUSTER_CHARACTER_URLS.nunSusDog);
  if (!frog || !dog) return;

  const x = areaScreenX + ad.x * AREA_W;
  const y = TOP_Y + ad.y * AREA_H;
  const w = ad.w * AREA_W;
  const h = ad.h * AREA_H;
  const frame = ad.kind === "billboard" ? 6 : 4;
  const titleH = Math.max(20, h * 0.19);

  ctx.save();
  ctx.shadowColor = ad.kind === "backlit" || ad.kind === "screen" ? "rgba(255,55,38,0.72)" : "rgba(0,0,0,0.65)";
  ctx.shadowBlur = ad.kind === "backlit" || ad.kind === "screen" ? 16 : 5;
  ctx.fillStyle = "#e8dfc8";
  ctx.fillRect(x - frame, y - frame, w + frame * 2, h + frame * 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#09090d";
  ctx.fillRect(x, y, w, h);

  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const characterTop = y + titleH;
  const characterH = h - titleH;
  const gutter = Math.max(2, w * 0.018);
  const halfW = (w - gutter * 3) / 2;
  drawContainedImage(ctx, frog, x + gutter, characterTop, halfW, characterH);
  drawContainedImage(ctx, dog, x + gutter * 2 + halfW, characterTop, halfW, characterH);

  const titleSize = Math.max(11, Math.min(42, titleH * 0.64));
  ctx.fillStyle = "rgba(8,8,12,0.9)";
  ctx.fillRect(x, y, w, titleH);
  ctx.fillStyle = "#f4d04b";
  ctx.font = `900 ${titleSize}px Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SUS'TER ACT", x + w / 2, y + titleH * 0.52, w * 0.94);
  ctx.restore();

  ctx.strokeStyle = "rgba(8,8,12,0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - frame, y - frame, w + frame * 2, h + frame * 2);
}

export function drawBadActorStudios(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const world = badActorWorldFor(level);
  if (!world) return;
  drawSky(ctx, camX, canvasW, world);

  const first = Math.max(0, Math.floor(camX / AREA_W));
  const last = Math.min(world.areas - 1, Math.floor((camX + canvasW) / AREA_W));

  for (let i = first; i <= last; i++) {
    const area = BAD_ACTOR_AREAS[Math.min(i, BAD_ACTOR_AREAS.length - 1)];
    const image = ready(area.art);
    if (!image) continue;
    const x = Math.round(i * AREA_W - camX);
    ctx.drawImage(image, x, TOP_Y, AREA_W + 1, AREA_H);
    for (const o of area.overlays) drawOverlay(ctx, o, x);
    for (const ad of area.susterAds) drawSusterAd(ctx, ad, x);
  }

  // Area transitions read as dark service alleys rather than hard cuts.
  for (let i = first; i <= last + 1; i++) {
    const x = Math.round(i * AREA_W - camX);
    if (x < -26 || x > canvasW + 26) continue;
    const seam = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
    seam.addColorStop(0, "rgba(2,4,10,0)");
    seam.addColorStop(0.5, "rgba(2,4,10,0.7)");
    seam.addColorStop(1, "rgba(2,4,10,0)");
    ctx.fillStyle = seam;
    ctx.fillRect(x - 26, TOP_Y, 52, AREA_H * FLOOR_FRACTION);
  }

  // Stage-light bloom along the working floor.
  const pulse = 0.04 + flicker(camX, 0.0018) * 0.04;
  ctx.fillStyle = `rgba(255,178,64,${pulse})`;
  ctx.fillRect(0, GROUND_Y - 3, canvasW, 3);

  // Solid understructure so a lowered camera never sees past the artwork.
  const floorTop = TOP_Y + AREA_H - 1;
  const floor = ctx.createLinearGradient(0, floorTop, 0, GROUND_Y + 460);
  floor.addColorStop(0, "#141520");
  floor.addColorStop(1, "#06070d");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorTop, canvasW, GROUND_Y + 460 - floorTop);
}

/** Area label for a world x — used by the HUD/debug overlay. */
export function badActorSectionLabelAt(level: number, x: number): string | null {
  if (level !== BAD_ACTOR_LEVEL) return null;
  const i = Math.max(
    0,
    Math.min(BAD_ACTOR_AREAS.length - 1, Math.floor(x / AREA_W)),
  );
  return BAD_ACTOR_AREAS[i].label;
}

/** World x range owned by an area index. */
export function badActorAreaBounds(index: number): { x0: number; x1: number } {
  return { x0: index * AREA_W, x1: (index + 1) * AREA_W };
}

export const __badActorStudiosTest = { AREA_W, AREA_H, TOP_Y, FLOOR_FRACTION };
