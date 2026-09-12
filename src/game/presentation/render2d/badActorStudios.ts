/**
 * LEVEL 3 — BAD ACTORS STUDIOS (painted panels).
 * ---------------------------------------------------------------------------
 * Painted, panel-based Hollywood studio district authored directly from the
 * approved Level 3 blueprint: studio entrance gate, REDACTED HOLLYWOOD hillside
 * sign, BAD ACTOR DISTRICT projector stage, SUS'TER ACT poster, makeup/prop and
 * backstage rooms, Stage 2, rooftop / backlot and the boss approach.
 *
 * Presentation only. Collision, ladders, encounters and combat all stay in
 * `src/game/config/world.ts` and the gameplay loop. When a panel has not yet
 * decoded, the caller falls back to the procedural film district renderer.
 *
 * PERFORMANCE CONTRACT (identical to the Level 1 / Level 2 painted districts)
 *   • Images preload once at module import.
 *   • The parallax skyline is generated once and cached per width.
 *   • Every layer is viewport-culled; nothing allocates per frame.
 *   • Animation reads the shared render clock — never Date.now()/Math.random().
 */

import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
import panelA from "@/assets/badactor-studios-a.jpg.asset.json";
import panelB from "@/assets/badactor-studios-b.jpg.asset.json";
import panelC from "@/assets/badactor-studios-c.jpg.asset.json";
import panelD from "@/assets/badactor-studios-d.jpg.asset.json";
import { flicker } from "./clock";

export const BAD_ACTOR_LEVEL = 2;

const PANEL_W = 1350;
const PANEL_H = PANEL_W / 3;
/** Fraction of a panel's height that sits above the playable street line. */
const PAVEMENT = 0.9;
const TOP_Y = GROUND_Y - PANEL_H * PAVEMENT;

/**
 * Panel running order across the 10,400-unit world:
 *   A entrance + REDACTED HOLLYWOOD, B main projector stage,
 *   C SUS'TER ACT / makeup / props, D sound stage + Stage 2 + rooftop/backlot.
 */
const PANEL_ORDER = [0, 0, 1, 1, 2, 2, 3, 3] as const;

/** Blueprint key locations, in traversal order. */
export const BAD_ACTOR_SECTIONS = [
  "BAD ACTORS STUDIOS",
  "OUTDOOR STUDIO LOT",
  "REDACTED HOLLYWOOD",
  "DIRECTOR'S OFFICE",
  "BAD ACTOR DISTRICT",
  "SUS'TER ACT MOVIE SET",
  "MAKEUP / DRESSING ROOMS",
  "PROP DEPARTMENT",
  "BACKSTAGE STORAGE",
  "SOUND STAGE",
  "STAGE 2",
  "ROOFTOP / BACKLOT",
  "BAD ACTOR BOSS ARENA",
] as const;

function preload(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const image = new Image();
  image.src = src;
  return image;
}

const IMAGES = [panelA.url, panelB.url, panelC.url, panelD.url].map(preload);

function ready(image: HTMLImageElement | null): image is HTMLImageElement {
  return !!image && image.complete && image.naturalWidth > 0;
}

export function badActorStudiosReady(): boolean {
  return IMAGES.every(ready);
}

export function hasBadActorStudios(level: number): boolean {
  return level === BAD_ACTOR_LEVEL && badActorStudiosReady();
}

interface SkylineBlock { x: number; w: number; h: number; lit: number }
interface StudioWorld { width: number; skyline: SkylineBlock[] }

let cachedWorld: StudioWorld | null = null;

export function badActorWorldFor(level: number): StudioWorld | null {
  if (level !== BAD_ACTOR_LEVEL) return null;
  const width = getLevelWidth(level);
  if (cachedWorld?.width === width) return cachedWorld;
  const skyline: SkylineBlock[] = [];
  for (let x = -260, i = 0; x < width + 520; i++) {
    const w = 64 + ((i * 53) % 104);
    skyline.push({ x, w, h: 120 + ((i * 71) % 190), lit: (i * 41) % 100 });
    x += w + 22 + ((i * 23) % 38);
  }
  cachedWorld = { width, skyline };
  return cachedWorld;
}

function drawParallaxSkyline(
  ctx: CanvasRenderingContext2D,
  camX: number,
  canvasW: number,
  world: StudioWorld,
) {
  const sky = ctx.createLinearGradient(0, -260, 0, GROUND_Y);
  sky.addColorStop(0, "#03060f");
  sky.addColorStop(0.6, "#0a1426");
  sky.addColorStop(1, "#1b1524");
  ctx.fillStyle = sky;
  ctx.fillRect(0, -300, canvasW, GROUND_Y + 560);

  const offset = camX * 0.13;
  for (const b of world.skyline) {
    const x = b.x - offset;
    if (x + b.w < -20 || x > canvasW + 20) continue;
    ctx.fillStyle = b.lit > 52 ? "#0d1626" : "#09111f";
    ctx.fillRect(x, GROUND_Y - b.h - 80, b.w, b.h);
    ctx.fillStyle = b.lit % 3 ? "rgba(255,186,84,0.30)" : "rgba(74,199,224,0.26)";
    for (let wx = x + 9; wx < x + b.w - 6; wx += 17) {
      for (let wy = GROUND_Y - b.h - 64; wy < GROUND_Y - 100; wy += 23) {
        if ((Math.round(wx + wy + b.lit) % 5) !== 0) ctx.fillRect(wx, wy, 6, 8);
      }
    }
  }

  // Premiere searchlights raking the sky behind the lot.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const baseX = canvasW * (0.22 + i * 0.29);
    const sweep = (flicker(i * 137, 0.0006) - 0.5) * 1.1;
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#cfe6ff";
    ctx.beginPath();
    ctx.moveTo(baseX, GROUND_Y - 60);
    ctx.lineTo(baseX + Math.cos(sweep - 1.35) * 640, -260);
    ctx.lineTo(baseX + Math.cos(sweep - 1.08) * 640, -260);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawBadActorStudios(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const world = badActorWorldFor(level);
  if (!world) return;
  drawParallaxSkyline(ctx, camX, canvasW, world);

  const slots = Math.ceil(world.width / PANEL_W);
  const first = Math.max(0, Math.floor(camX / PANEL_W));
  const last = Math.min(slots - 1, Math.floor((camX + canvasW) / PANEL_W));
  for (let slot = first; slot <= last; slot++) {
    const image = IMAGES[PANEL_ORDER[Math.min(slot, PANEL_ORDER.length - 1)]];
    if (!ready(image)) continue;
    const x = Math.round(slot * PANEL_W - camX);
    ctx.drawImage(image, x, TOP_Y, PANEL_W + 1, PANEL_H);
  }

  // Panel seams read as dark service alleys rather than visible cuts.
  for (let slot = first; slot <= last + 1; slot++) {
    const x = Math.round(slot * PANEL_W - camX);
    if (x < -24 || x > canvasW + 24) continue;
    const seam = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
    seam.addColorStop(0, "rgba(2,4,10,0)");
    seam.addColorStop(0.5, "rgba(2,4,10,0.66)");
    seam.addColorStop(1, "rgba(2,4,10,0)");
    ctx.fillStyle = seam;
    ctx.fillRect(x - 24, TOP_Y, 48, PANEL_H * PAVEMENT);
  }

  // Warm stage-light bloom along the working floor keeps the paintings alive.
  const pulse = 0.04 + flicker(camX, 0.0018) * 0.04;
  ctx.fillStyle = `rgba(255,178,64,${pulse})`;
  ctx.fillRect(0, GROUND_Y - 3, canvasW, 3);

  // Solid lot surface below the painted street so a raised camera sees no gap.
  const floorTop = TOP_Y + PANEL_H - 1;
  const floor = ctx.createLinearGradient(0, floorTop, 0, GROUND_Y + 420);
  floor.addColorStop(0, "#171821");
  floor.addColorStop(1, "#070810");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorTop, canvasW, GROUND_Y + 420 - floorTop);
}

export function badActorSectionLabelAt(level: number, x: number): string | null {
  if (level !== BAD_ACTOR_LEVEL) return null;
  const width = getLevelWidth(level);
  const index = Math.max(
    0,
    Math.min(
      BAD_ACTOR_SECTIONS.length - 1,
      Math.floor((x / width) * BAD_ACTOR_SECTIONS.length),
    ),
  );
  return BAD_ACTOR_SECTIONS[index];
}

export const __badActorStudiosTest = { PANEL_W, PANEL_H, TOP_Y, PANEL_ORDER };
