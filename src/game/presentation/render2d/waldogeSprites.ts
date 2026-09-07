/**
 * waldogeSprites.ts — sprite-atlas rendering of the approved Waldoge blueprint.
 *
 * PURELY PRESENTATIONAL. Reads a read-only snapshot of the player (position,
 * velocity, facing, combat state, stateTimer) and draws the matching artwork
 * frame from the blueprint atlas. It never mutates gameplay state, never
 * advances timers and never decides damage, hit frames, cooldowns, combos,
 * knockback, stamina or AI — StreetBrawler.tsx remains the source of truth.
 *
 * Combat state -> blueprint animation:
 *   idle | walk (walk/run by |vx|) | jump | punch | kick | uppercut |
 *   spinkick | dashpunch | groundpound (air + impact) | style special |
 *   hit | dead
 */

import type { StyleName } from "@/lib/fightStyles";
import atlasAsset from "@/assets/waldoge-atlas.png.asset.json";
import punchExtAsset from "@/assets/waldoge-punch-extended.png.asset.json";
import { drawWaldogeFighter, type FighterView, type WaldogeWeapon } from "./waldogeFighter";

export type { FighterView, WaldogeWeapon };

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

/** Frame rects inside the atlas, with a feet anchor (ax = feet x, ay = feet y). */
const F: Record<string, Frame> = {
  idle0: { x: 0, y: 0, w: 130, h: 171, ax: 64.5, ay: 171 },
  walk0: { x: 269, y: 0, w: 124, h: 170, ax: 61.5, ay: 170 },
  walk1: { x: 538, y: 0, w: 130, h: 170, ax: 65, ay: 170 },
  walk2: { x: 807, y: 0, w: 128, h: 172, ax: 62, ay: 172 },
  run0: { x: 1076, y: 0, w: 124, h: 173, ax: 61.5, ay: 173 },
  run1: { x: 0, y: 220, w: 130, h: 173, ax: 64.5, ay: 173 },
  run2: { x: 269, y: 220, w: 125, h: 174, ax: 61.5, ay: 174 },
  punch0: { x: 538, y: 220, w: 139, h: 157, ax: 66.5, ay: 157 },
  punch1: { x: 807, y: 220, w: 138, h: 155, ax: 68.5, ay: 155 },
  punch2: { x: 1076, y: 220, w: 129, h: 152, ax: 58, ay: 152 },
  kick0: { x: 0, y: 440, w: 131, h: 156, ax: 60.5, ay: 156 },
  kick1: { x: 269, y: 440, w: 137, h: 156, ax: 63, ay: 156 },
  kick2: { x: 538, y: 440, w: 100, h: 158, ax: 49.5, ay: 158 },
  uppercut0: { x: 807, y: 440, w: 150, h: 145, ax: 70.5, ay: 145 },
  uppercut1: { x: 1076, y: 440, w: 137, h: 191, ax: 67.5, ay: 191 },
  spinkick0: { x: 0, y: 660, w: 144, h: 176, ax: 75.5, ay: 176 },
  spinkick1: { x: 269, y: 660, w: 168, h: 181, ax: 83.5, ay: 181 },
  dashpunch0: { x: 538, y: 660, w: 146, h: 166, ax: 77, ay: 166 },
  dashpunch1: { x: 807, y: 660, w: 257, h: 161, ax: 124, ay: 161 },
  groundpound0: { x: 1076, y: 660, w: 139, h: 213, ax: 69, ay: 213 },
  groundpound1: { x: 0, y: 880, w: 160, h: 171, ax: 79.5, ay: 171 },
  stylespecial0: { x: 269, y: 880, w: 228, h: 199, ax: 114, ay: 199 },
  hit0: { x: 538, y: 880, w: 200, h: 183, ax: 99.5, ay: 183 },
  jump0: { x: 807, y: 880, w: 162, h: 220, ax: 80.5, ay: 220 },
  dead0: { x: 1076, y: 880, w: 269, h: 94, ax: 128, ay: 94 },
};

/**
 * The atlas cell for the fully extended jab is clipped at the cell border, so
 * the lead glove is sliced off the arm. This standalone frame replaces it.
 */
const PUNCH_EXT: Frame = { x: 0, y: 0, w: 156, h: 165, ax: 63, ay: 165 };

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 171;
/** Visual size relative to the collision box (art is deliberately larger). */
const SIZE = 1.95;

let atlas: HTMLImageElement | null = null;
let atlasReady = false;
let punchExt: HTMLImageElement | null = null;
let punchExtReady = false;

function getAtlas(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    atlas.onload = () => { atlasReady = true; };
    atlas.src = atlasAsset.url;
  }
  return atlasReady && atlas.complete && atlas.naturalWidth > 0 ? atlas : null;
}

function getPunchExt(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!punchExt) {
    punchExt = new Image();
    punchExt.onload = () => { punchExtReady = true; };
    punchExt.src = punchExtAsset.url;
  }
  return punchExtReady && punchExt.complete && punchExt.naturalWidth > 0 ? punchExt : null;
}

/** Kick off the download early (called once from the game bootstrap). */
export function preloadWaldogeSprites() { getAtlas(); getPunchExt(); }


function styleTint(style: StyleName): string {
  return style === "rush" ? "#00ccff"
    : style === "muayThai" ? "#ff8800"
    : style === "greenCandle" ? "#00ff66"
    : "#FFD700";
}

/** 0..1 progress through the current state (visual only). */
function prog(e: FighterView, frames: number): number {
  return 1 - Math.min(1, Math.max(0, e.stateTimer / frames));
}

function pick<T>(arr: T[], t: number): T {
  return arr[Math.min(arr.length - 1, Math.max(0, Math.floor(t * arr.length)))];
}

/** True while the fighter is off the ground (vy is zeroed on landing). */
function airborne(e: FighterView): boolean {
  return Math.abs(e.vy) > 0.4;
}

interface Pick { f: Frame; ext?: boolean }

function frameFor(e: FighterView, specialActive: boolean, clock: number): Pick {
  const speed = Math.abs(e.vx);
  switch (e.state) {
    case "walk":
    case "idle": {
      // The combat state stays idle/walk while jumping — read the air pose off
      // the actual vertical motion so Waldoge never floats in a ground stance.
      if (airborne(e)) return { f: F.jump0 };
      if (e.state === "idle") return { f: F.idle0 };
      const running = speed > 3.4;
      const cycle = Math.floor(clock / (running ? 90 : 140)) % 3;
      return { f: F[(running ? "run" : "walk") + cycle] };
    }
    case "jump":
      return { f: F.jump0 };
    case "punch": {
      const t = prog(e, 12);
      // Wind-up → full extension (standalone frame) → recovery.
      if (t < 0.25) return { f: F.punch0 };
      if (t < 0.7) return { f: PUNCH_EXT, ext: true };
      return { f: F.punch2 };
    }
    case "kick":
      // Grounded style special reuses the "kick" combat state.
      if (specialActive) return { f: F.stylespecial0 };
      return { f: pick([F.kick0, F.kick1, F.kick2], prog(e, 14)) };
    case "uppercut":
      return { f: prog(e, 18) < 0.35 ? F.uppercut0 : F.uppercut1 };
    case "spinkick":
      return { f: Math.floor(clock / 60) % 2 === 0 ? F.spinkick0 : F.spinkick1 };
    case "dashpunch":
      return { f: prog(e, 14) < 0.3 ? F.dashpunch0 : F.dashpunch1 };
    case "groundpound":
      return { f: e.vy > 0.5 ? F.groundpound0 : F.groundpound1 };
    case "hit":
      return { f: F.hit0 };
    case "dead":
      return { f: F.dead0 };
    default:
      return { f: airborne(e) ? F.jump0 : F.idle0 };
  }
}


function weaponInHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  weapon: WaldogeWeapon,
) {
  if (!weapon) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (weapon === "bat") {
    ctx.fillStyle = "#8B4513"; ctx.fillRect(-3, -30, 6, 32);
    ctx.fillStyle = "#A0522D"; ctx.fillRect(-6, -36, 12, 10);
  } else if (weapon === "sword") {
    ctx.fillStyle = "#ccc"; ctx.fillRect(-2, -38, 4, 40);
    ctx.fillStyle = "#888"; ctx.fillRect(-6, -2, 12, 5);
  } else {
    ctx.fillStyle = "#cc44ff";
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.rotate((i * Math.PI) / 2); ctx.fillRect(-1.5, -11, 3, 11); ctx.restore();
    }
  }
  ctx.restore();
}

export function drawWaldogeSprite(
  ctx: CanvasRenderingContext2D,
  e: FighterView,
  camX: number,
  headImg: HTMLImageElement | null,
  weaponType: WaldogeWeapon = null,
  style: StyleName = "brawler",
  specialActive = false,
) {
  const img = getAtlas();
  if (!img) {
    // Artwork not downloaded yet — keep the procedural fighter as a fallback.
    drawWaldogeFighter(ctx, e, camX, headImg, weaponType, style);
    return;
  }

  const sx = e.x - camX;
  const sy = e.y;
  const clock = Date.now();
  const f = frameFor(e, specialActive, clock);
  const base = (e.height * SIZE) / REF_H;
  const tint = styleTint(style);

  // Subtle breathing / impact weight — visual only.
  let sqx = 1, sqy = 1, bob = 0;
  if (e.state === "idle") {
    bob = Math.sin(clock / 340) * 1.4;
    sqy = 1 + Math.sin(clock / 340) * 0.012;
  } else if (e.state === "groundpound" && e.vy <= 0.5) {
    sqx = 1.06; sqy = 0.94;
  } else if (e.state === "hit") {
    sqx = 1.04; sqy = 0.97;
  }

  ctx.save();

  // Ground shadow (world-anchored).
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 26, 6.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // Style aura under the fighter (non-default styles only).
  if (style !== "brawler") {
    ctx.save();
    const pulse = 0.5 + Math.sin(clock / 160) * 0.2;
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 30, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.translate(sx, sy + bob);
  ctx.scale(e.facing * base * sqx, base * sqy);
  if (e.state === "hit") ctx.globalAlpha = 0.9;
  if (e.state === "dead") ctx.globalAlpha = 0.85;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);

  // Weapon rides the lead glove.
  weaponInHand(ctx, f.w * 0.32, -f.h * 0.52, 1, weaponType);

  ctx.restore();
}
