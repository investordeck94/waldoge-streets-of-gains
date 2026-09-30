/**
 * candleMinionSprites.ts — sprite-atlas rendering of the Candle Minion.
 *
 * PURELY PRESENTATIONAL. Reads a read-only view of the minion (position,
 * facing, combat state, hp) and draws the matching artwork frame from the
 * candle-minion atlas. It never mutates gameplay state, never advances
 * timers and never decides damage, hit frames, AI, HP, knockback or
 * hitboxes — StreetBrawler.tsx remains the single source of truth.
 *
 * The artwork is feet-anchored: every frame carries an anchor (ax = ground
 * centre x, ay = feet y) so the character stays glued to the existing
 * 30x70 collision body at every animation state, and only cosmetic parts
 * (flame, gloves, drips) extend outside it.
 */

import { renderNow } from "./clock";
import atlasAsset from "@/assets/candle-minion-atlas.png.asset.json";
import { residentImage } from "./imageResidency";

export interface CandleMinionView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
  stateTimer?: number;
  hp: number;
  maxHp: number;
}

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

/** Frame rects inside the atlas (measured from the concept sheet). */
const F: Record<string, Frame> = {
  idle:  { x: 80,   y: 15,  w: 312, h: 453, ax: 133.5, ay: 453 },
  walk:  { x: 600,  y: 16,  w: 277, h: 451, ax: 133,   ay: 451 },
  punch: { x: 1070, y: 74,  w: 455, h: 393, ax: 147.5, ay: 393 },
  kick:  { x: 52,   y: 521, w: 405, h: 433, ax: 170.5, ay: 433 },
  hit:   { x: 552,  y: 550, w: 405, h: 401, ax: 235,   ay: 401 },
  dead:  { x: 1039, y: 655, w: 469, h: 304, ax: 234,   ay: 304 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 453;
/**
 * Visual size relative to the collision box. Matches Waldoge's 1.95 so the
 * minion reads as an equal-sized opponent, same 30x70 hurtbox.
 */
const SIZE = 1.95;

let atlas: HTMLImageElement | null = null;
let ready = false;

function getAtlas(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    atlas.onload = () => { ready = true; };
    residentImage(atlas, atlasAsset.url, "always", { pin: true });
  }
  return ready && atlas.complete && atlas.naturalWidth > 0 ? atlas : null;
}

/** Kick off the download early (called once from the game bootstrap). */
export function preloadCandleMinionSprites() { getAtlas(); }

function frameFor(e: CandleMinionView, clock: number): Frame {
  switch (e.state) {
    case "dead": return F.dead;
    case "hit": return F.hit;
    case "punch": return F.punch;
    case "kick":
    case "uppercut": return F.kick;
    case "jump": return F.walk;
    case "walk": {
      // Two-beat stride: alternate stride pose / planted pose.
      return Math.floor(clock / 150) % 2 === 0 ? F.walk : F.idle;
    }
    default: return F.idle;
  }
}

/**
 * Draws the Candle Minion. Returns false when the atlas has not downloaded
 * yet so the caller can fall back to the legacy procedural renderer.
 */
export function drawCandleMinionSprite(
  ctx: CanvasRenderingContext2D,
  e: CandleMinionView,
  camX: number,
): boolean {
  const img = getAtlas();
  if (!img) return false;

  const sx = e.x - camX;
  const sy = e.y;
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return true;

  const clock = renderNow();
  const f = frameFor(e, clock);
  const base = (e.height * SIZE) / REF_H;

  // Cosmetic weight: breathing on idle, wax wobble on impact.
  let sqx = 1, sqy = 1, bob = 0;
  if (e.state === "idle") {
    bob = Math.sin(clock / 320) * 1.2;
    sqy = 1 + Math.sin(clock / 320) * 0.014;
  } else if (e.state === "hit") {
    sqx = 1.05; sqy = 0.95;
  } else if (e.state === "punch") {
    sqx = 1.02;
  }

  ctx.save();

  // Ground shadow (world-anchored, never mirrored).
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 20, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // Flame glow around the wick — cheap radial, no per-frame randomness.
  if (e.state !== "dead") {
    const headY = sy - e.height * SIZE * 0.94 + bob;
    const pulse = 0.7 + Math.sin(clock / 130) * 0.3;
    const glow = ctx.createRadialGradient(sx, headY, 1, sx, headY, 22);
    glow.addColorStop(0, `rgba(255, 176, 60, ${0.3 * pulse})`);
    glow.addColorStop(1, "rgba(255, 176, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, headY, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(sx, sy + bob);
  ctx.scale(e.facing * base * sqx, base * sqy);
  if (e.state === "hit") ctx.globalAlpha = 0.92;
  if (e.state === "dead") ctx.globalAlpha = 0.8;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);
  ctx.restore();

  // HP bar above the flame — same size/behaviour as before.
  if (e.state !== "dead") {
    const barW = 28;
    const barH = 3;
    const barX = sx - barW / 2;
    const barY = sy - e.height * SIZE - 10;
    ctx.fillStyle = "#000";
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = "#1a0000";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = e.hp > e.maxHp * 0.4 ? "#ff4040" : "#ffaa00";
    ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, e.hp / e.maxHp)), barH);
  }

  return true;
}
