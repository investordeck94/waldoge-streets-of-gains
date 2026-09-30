/**
 * raidingTeamSprites.ts — MR MARKETER'S RAIDING TEAM (Level 6 elite henchmen).
 *
 * PURELY PRESENTATIONAL. Reads a read-only view of the enemy (position,
 * facing, state) and draws the matching frame from the approved Raiding Team
 * character sheet. It never mutates gameplay state, never decides damage,
 * hit frames, AI, HP, knockback or hitboxes.
 *
 * Frame rects are measured from the approved blueprint's animation row; each
 * frame shares the same feet baseline so the fighter stays glued to the same
 * 30x70 collision body used by every other grunt.
 */

import { renderNow } from "./clock";
import atlasSrc from "@/assets/raiding-team-atlas.png";
import { residentImage } from "./imageResidency";

export interface RaidingTeamView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
  hp: number;
  maxHp: number;
  /** Set by the game loop while the SMG wind-up / shot is active. */
  raiderAim?: number;
}

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const BASELINE = 117;
const mk = (x: number, y: number, w: number, h: number): Frame =>
  ({ x, y, w, h, ax: w / 2, ay: BASELINE - y });

export const RAIDER_FRAMES: Record<string, Frame> = {
  idle: mk(6, 6, 89, 111),
  walk: mk(101, 6, 96, 111),
  run: mk(203, 6, 110, 111),
  aim: mk(319, 12, 130, 105),
  shoot: mk(455, 11, 87, 106),
  reload: mk(548, 10, 94, 107),
  // Punch and kick sit next to their neighbours on the sheet: the rects are
  // trimmed to the fighter's own silhouette so no slice of the adjacent pose
  // bleeds in and reads as a second body. The kick anchor is the planted foot,
  // not the rect centre, so the extended leg does not shift him off the floor.
  punch: mk(648, 17, 97, 100),
  kick: { ...mk(767, 12, 107, 105), ax: 25.5 },
  hit: mk(903, 6, 100, 111),
  dead: mk(1009, 11, 115, 106),
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 111;
/** Visual size relative to the collision box, matched to Waldoge's 1.95. */
const SIZE = 1.9;

let atlas: HTMLImageElement | null = null;
let ready = false;

function getAtlas(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    atlas.decoding = "sync";
    atlas.onload = () => { ready = true; };
    residentImage(atlas, atlasSrc, [5]);
  }
  return ready && atlas.complete && atlas.naturalWidth > 0 ? atlas : null;
}

export function preloadRaidingTeamSprites() { getAtlas(); }

export function raiderFrameFor(state: string, aim: number, clock: number): Frame {
  if (state === "dead") return RAIDER_FRAMES.dead;
  if (state === "hit") return RAIDER_FRAMES.hit;
  if (aim > 0) return aim > 12 ? RAIDER_FRAMES.aim : RAIDER_FRAMES.shoot;
  switch (state) {
    case "punch": return RAIDER_FRAMES.punch;
    case "kick":
    case "uppercut": return RAIDER_FRAMES.kick;
    case "jump": return RAIDER_FRAMES.run;
    case "walk": return Math.floor(clock / 140) % 2 === 0 ? RAIDER_FRAMES.walk : RAIDER_FRAMES.run;
    default: return RAIDER_FRAMES.idle;
  }
}

/**
 * Draws a Raiding Team henchman. Returns false while the artwork is still
 * decoding so the caller can fall back to the existing procedural renderer.
 */
export function drawRaidingTeamSprite(
  ctx: CanvasRenderingContext2D,
  e: RaidingTeamView,
  camX: number,
): boolean {
  const img = getAtlas();
  if (!img) return false;

  const sx = e.x - camX;
  const sy = e.y;
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return true;

  const clock = renderNow();
  const f = raiderFrameFor(e.state, e.raiderAim ?? 0, clock);
  const base = (e.height * SIZE) / REF_H;

  // Ground shadow (world-anchored, never mirrored).
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 20, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // BOOST/TRENDING red visor glow, brighter while aiming.
  const aiming = (e.raiderAim ?? 0) > 0;
  if (e.state !== "dead") {
    const headY = sy - e.height * SIZE * 0.9;
    const pulse = aiming ? 1 : 0.55 + Math.sin(clock / 220) * 0.2;
    const glow = ctx.createRadialGradient(sx, headY, 1, sx, headY, 20);
    glow.addColorStop(0, `rgba(255, 46, 58, ${0.26 * pulse})`);
    glow.addColorStop(1, "rgba(255, 46, 58, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, headY, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  let bob = 0;
  if (e.state === "idle" && !aiming) bob = Math.sin(clock / 300) * 1.1;
  ctx.translate(sx, sy + bob);
  ctx.scale(e.facing * base, base);
  if (e.state === "hit") ctx.globalAlpha = 0.92;
  if (e.state === "dead") ctx.globalAlpha = 0.85;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);
  ctx.restore();

  // Muzzle flash on the shot frame.
  if ((e.raiderAim ?? 0) > 0 && (e.raiderAim ?? 0) <= 12 && e.state !== "dead") {
    const mx = sx + e.facing * 34;
    const my = sy - e.height * SIZE * 0.52;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#ffd04a";
    ctx.beginPath();
    ctx.ellipse(mx, my, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // HP bar above the helmet — same contract as the candle minion.
  if (e.state !== "dead") {
    const barW = 28;
    const barH = 3;
    const barX = sx - barW / 2;
    const barY = sy - e.height * SIZE - 10;
    ctx.fillStyle = "#000";
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = "#1a0000";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = e.hp > e.maxHp * 0.4 ? "#ff2e3a" : "#ffaa00";
    ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, e.hp / e.maxHp)), barH);
  }

  return true;
}
