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
import { getLevelWidth, groundYAt } from "@/game/config/world";
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
import { residentImage } from "./imageResidency";

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
    susterAds: noAds,
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
  residentImage(image, src, [2]);
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

/** Per-advertisement art treatment. Characters stay identical; the ad changes. */
interface SusterTheme {
  /** Outer physical frame colour. */
  frame: string;
  /** Backdrop gradient behind the two characters. */
  top: string;
  bottom: string;
  /** Title bar fill and lettering. */
  titleBar: string;
  title: string;
  titleFont: string;
  /** Strap-line bar at the foot of the ad. */
  strapBar: string;
  strap: string;
  /** Ambient glow of the housing. */
  glow: string;
}

const SUSTER_THEMES: Record<SusterStyle, SusterTheme> = {
  marquee: {
    frame: "#f2e6c4", top: "#fbf3dc", bottom: "#e6d5a8",
    titleBar: "#f6edd4", title: "#b31724", titleFont: "900 {s}px Georgia, serif",
    strapBar: "#1a1206", strap: "#f6edd4", glow: "rgba(255,214,120,0.85)",
  },
  technicolor: {
    frame: "#f0c04a", top: "#ffd9a3", bottom: "#e8663c",
    titleBar: "#b31724", title: "#ffe9b0", titleFont: "900 {s}px Impact, sans-serif",
    strapBar: "#2a0d0a", strap: "#ffd36b", glow: "rgba(255,140,60,0.6)",
  },
  noir: {
    frame: "#1c1c20", top: "#14161c", bottom: "#05060a",
    titleBar: "#0a0a0e", title: "#d9d9df", titleFont: "700 {s}px Georgia, serif",
    strapBar: "#0a0a0e", strap: "#9aa0aa", glow: "rgba(140,170,220,0.35)",
  },
  neon: {
    frame: "#221033", top: "#2a1046", bottom: "#120720",
    titleBar: "#160a26", title: "#4ef0ff", titleFont: "900 {s}px Impact, sans-serif",
    strapBar: "#160a26", strap: "#ff5ad0", glow: "rgba(120,60,255,0.8)",
  },
  premiere: {
    frame: "#c9a227", top: "#3a0b12", bottom: "#12040a",
    titleBar: "#12040a", title: "#f4d04b", titleFont: "900 {s}px Georgia, serif",
    strapBar: "#c9a227", strap: "#2a0810", glow: "rgba(255,190,80,0.6)",
  },
  curtain: {
    frame: "#8d1220", top: "#6d1020", bottom: "#2c0610",
    titleBar: "#f0e2bd", title: "#8d1220", titleFont: "900 {s}px Georgia, serif",
    strapBar: "#2c0610", strap: "#f0e2bd", glow: "rgba(255,70,70,0.5)",
  },
  drivein: {
    frame: "#3b4048", top: "#1d2b3a", bottom: "#0a1018",
    titleBar: "#0d1420", title: "#eaf4ff", titleFont: "900 {s}px Impact, sans-serif",
    strapBar: "#0d1420", strap: "#8fd0ff", glow: "rgba(160,220,255,0.55)",
  },
  onesheet: {
    frame: "#e6e1d4", top: "#f3efe2", bottom: "#cfc6ae",
    titleBar: "#111318", title: "#f3efe2", titleFont: "900 {s}px Impact, sans-serif",
    strapBar: "#b31724", strap: "#fdf6e2", glow: "rgba(0,0,0,0.4)",
  },
  storyboard: {
    frame: "#8a8070", top: "#d9d2bd", bottom: "#a89d83",
    titleBar: "#2d2a22", title: "#e8e0c8", titleFont: "700 {s}px Courier New, monospace",
    strapBar: "#2d2a22", strap: "#e8e0c8", glow: "rgba(0,0,0,0.4)",
  },
  lobbycard: {
    frame: "#d8b45a", top: "#2b6b6b", bottom: "#0e2e30",
    titleBar: "#d8b45a", title: "#11292b", titleFont: "900 {s}px Georgia, serif",
    strapBar: "#11292b", strap: "#d8b45a", glow: "rgba(120,230,220,0.5)",
  },
  filmstrip: {
    frame: "#17171a", top: "#463a2c", bottom: "#1b1610",
    titleBar: "#0d0d10", title: "#e5c07a", titleFont: "700 {s}px Courier New, monospace",
    strapBar: "#0d0d10", strap: "#e5c07a", glow: "rgba(0,0,0,0.5)",
  },
};

/** Style-specific decoration drawn behind the characters, inside the clip. */
function drawSusterDecor(
  ctx: CanvasRenderingContext2D,
  style: SusterStyle,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  switch (style) {
    case "marquee": {
      // Bulb border, like a cinema frontage.
      const r = Math.max(1.6, h * 0.012);
      const step = Math.max(10, w / 14);
      for (let bx = x + step / 2; bx < x + w; bx += step) {
        const a = 0.55 + flicker(bx, 0.003) * 0.45;
        ctx.fillStyle = `rgba(255,206,110,${a})`;
        ctx.beginPath();
        ctx.arc(bx, y + r * 2, r, 0, Math.PI * 2);
        ctx.arc(bx, y + h - r * 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "technicolor": {
      // Sunburst rays behind the pair.
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#fff0c0";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.55);
        ctx.lineTo(x + w / 2 + Math.cos(a) * w, y + h * 0.55 + Math.sin(a) * h);
        ctx.lineTo(x + w / 2 + Math.cos(a + 0.13) * w, y + h * 0.55 + Math.sin(a + 0.13) * h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case "noir": {
      // Hard diagonal spotlight wedge.
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#cfe0ff";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.75, y);
      ctx.lineTo(x + w * 0.3, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case "neon": {
      ctx.save();
      ctx.strokeStyle = "rgba(255,90,208,0.75)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
      ctx.strokeStyle = "rgba(78,240,255,0.6)";
      ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
      ctx.restore();
      break;
    }
    case "premiere": {
      // Deco arch and searchlight beams.
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#ffe6a8";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.1, y + h);
      ctx.lineTo(x + w * 0.42, y);
      ctx.lineTo(x + w * 0.56, y);
      ctx.lineTo(x + w * 0.26, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.9, y + h);
      ctx.lineTo(x + w * 0.58, y);
      ctx.lineTo(x + w * 0.44, y);
      ctx.lineTo(x + w * 0.74, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case "curtain": {
      const folds = Math.max(6, Math.round(w / 26));
      for (let i = 0; i < folds; i++) {
        const fx = x + (i / folds) * w;
        ctx.fillStyle = i % 2 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)";
        ctx.fillRect(fx, y, w / folds / 2, h);
      }
      break;
    }
    case "drivein": {
      // Starfield above a flat horizon.
      for (let i = 0; i < 26; i++) {
        const sx = x + ((i * 97) % Math.max(1, Math.round(w)));
        const sy = y + ((i * 53) % Math.max(1, Math.round(h * 0.6)));
        ctx.fillStyle = i % 3 ? "rgba(255,255,255,0.5)" : "rgba(180,220,255,0.7)";
        ctx.fillRect(sx, sy, 1.6, 1.6);
      }
      break;
    }
    case "onesheet": {
      ctx.strokeStyle = "rgba(179,23,36,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
      break;
    }
    case "storyboard": {
      ctx.strokeStyle = "rgba(45,42,34,0.35)";
      ctx.lineWidth = 1;
      for (let gx = x; gx < x + w; gx += 18) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }
      for (let gy = y; gy < y + h; gy += 18) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
      break;
    }
    case "lobbycard": {
      ctx.strokeStyle = "rgba(216,180,90,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
      ctx.fillStyle = "rgba(216,180,90,0.25)";
      ctx.fillRect(x + 6, y + h * 0.52, w - 12, 2);
      break;
    }
    case "filmstrip": {
      const hole = Math.max(3, w * 0.035);
      ctx.fillStyle = "#0b0b0e";
      ctx.fillRect(x, y, hole * 1.8, h);
      ctx.fillRect(x + w - hole * 1.8, y, hole * 1.8, h);
      ctx.fillStyle = "#d8d2c4";
      for (let hy = y + hole; hy < y + h - hole; hy += hole * 2.4) {
        ctx.fillRect(x + hole * 0.4, hy, hole, hole);
        ctx.fillRect(x + w - hole * 1.4, hy, hole, hole);
      }
      break;
    }
  }
}

/** Draws one physical movie ad. Every ad differs; the two characters never do. */
function drawSusterAd(
  ctx: CanvasRenderingContext2D,
  ad: SusterAd,
  areaScreenX: number,
) {
  const frog = ready(SUSTER_CHARACTER_URLS.nunFrog);
  const dog = ready(SUSTER_CHARACTER_URLS.nunSusDog);
  if (!frog || !dog) return;

  const theme = SUSTER_THEMES[ad.style];
  const x = areaScreenX + ad.x * AREA_W;
  const y = TOP_Y + ad.y * AREA_H;
  const w = ad.w * AREA_W;
  const h = ad.h * AREA_H;
  const frame = ad.kind === "billboard" ? 6 : 4;
  const titleH = Math.max(18, h * 0.17);
  const strapH = Math.max(12, h * 0.11);

  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = ad.kind === "backlit" || ad.kind === "screen" ? 16 : 6;
  ctx.fillStyle = theme.frame;
  ctx.fillRect(x - frame, y - frame, w + frame * 2, h + frame * 2);
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, theme.top);
  bg.addColorStop(1, theme.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  drawSusterDecor(ctx, ad.style, x, y, w, h);

  // The two supplied characters, unchanged, side by side.
  const characterTop = y + titleH;
  const characterH = h - titleH - strapH;
  const gutter = Math.max(2, w * 0.018);
  const halfW = (w - gutter * 3) / 2;
  drawContainedImage(ctx, frog, x + gutter, characterTop, halfW, characterH);
  drawContainedImage(ctx, dog, x + gutter * 2 + halfW, characterTop, halfW, characterH);

  // Title bar.
  const titleSize = Math.max(10, Math.min(40, titleH * 0.66));
  ctx.fillStyle = theme.titleBar;
  ctx.fillRect(x, y, w, titleH);
  ctx.fillStyle = theme.title;
  ctx.font = theme.titleFont.replace("{s}", String(Math.round(titleSize)));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SUS'TER ACT", x + w / 2, y + titleH * 0.54, w * 0.94);

  // "COMING SOON" strap line at the foot of every advertisement.
  const strapSize = Math.max(8, Math.min(22, strapH * 0.6));
  ctx.fillStyle = theme.strapBar;
  ctx.fillRect(x, y + h - strapH, w, strapH);
  ctx.fillStyle = theme.strap;
  ctx.font = `700 ${Math.round(strapSize)}px Arial, sans-serif`;
  ctx.fillText(ad.tagline ?? "COMING SOON", x + w / 2, y + h - strapH * 0.46, w * 0.9);
  ctx.restore();

  ctx.strokeStyle = "rgba(8,8,12,0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - frame, y - frame, w + frame * 2, h + frame * 2);
}

/** Places the exact two stars inside the movie set's five existing poster frames. */
function drawSusterMarqueePanels(
  ctx: CanvasRenderingContext2D,
  areaScreenX: number,
) {
  const frog = ready(SUSTER_CHARACTER_URLS.nunFrog);
  const dog = ready(SUSTER_CHARACTER_URLS.nunSusDog);
  if (!frog || !dog) return;

  const panels = [
    { x: 0.300, w: 0.047 },
    { x: 0.389, w: 0.047 },
    { x: 0.479, w: 0.047 },
    { x: 0.570, w: 0.047 },
    { x: 0.661, w: 0.047 },
  ];
  const panelY = TOP_Y + AREA_H * 0.470;
  const panelH = AREA_H * 0.273;

  ctx.save();
  ctx.beginPath();
  ctx.rect(areaScreenX, TOP_Y, AREA_W, AREA_H);
  ctx.clip();
  panels.forEach((panel, index) => {
    const panelX = areaScreenX + AREA_W * panel.x;
    const panelW = AREA_W * panel.w;
    const image = index % 2 === 0 ? frog : dog;
    const sourceX = image === frog ? 65 : 65;
    const sourceW = image === frog ? 833 : 873;
    const scale = Math.max(panelW / sourceW, panelH / image.naturalHeight);
    const drawW = sourceW * scale;
    const drawH = image.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX, panelY, panelW, panelH);
    ctx.clip();
    ctx.drawImage(
      image,
      sourceX,
      0,
      sourceW,
      image.naturalHeight,
      panelX + (panelW - drawW) / 2,
      panelY + (panelH - drawH) / 2,
      drawW,
      drawH,
    );
    ctx.restore();
  });
  ctx.restore();
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
    if (i === 5) drawSusterMarqueePanels(ctx, x);
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

  // Stage-light bloom follows the same authored painted-floor profile used by
  // collision, rather than implying one legacy y=320 floor across every panel.
  const pulse = 0.04 + flicker(camX, 0.0018) * 0.04;
  ctx.fillStyle = `rgba(255,178,64,${pulse})`;
  for (let screenX = 0; screenX < canvasW; screenX += 8) {
    ctx.fillRect(screenX, groundYAt(level, camX + screenX, Number.POSITIVE_INFINITY) - 3, 8, 3);
  }

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
