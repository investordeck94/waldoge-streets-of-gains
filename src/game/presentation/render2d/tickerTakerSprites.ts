/**
 * tickerTakerSprites.ts — sprite-atlas rendering of the approved TICKER TAKER
 * blueprint (the ULTIMATE BOSS / anti-Waldoge: canonical PUNP beanie + red and
 * white striped bandit mask head, black tracksuit with red/white racing
 * stripes, red gloves, red-white high tops, fluffy tail).
 *
 * PURELY PRESENTATIONAL. It reads a read-only view of the boss (position,
 * facing, state, active martial form, progress) and picks the matching
 * blueprint frame. It never mutates gameplay state and never decides damage,
 * hit frames, cooldowns, ranges, AI, energy or HP — the shared boss/combat
 * systems (bossMoves.ts + StreetBrawler.tsx) remain the single source of truth,
 * exactly as for every other boss.
 *
 * COMBAT SCALE
 * Drawn at hitboxHeight * SIZE with SIZE pinned near Waldoge's own 1.95, so
 * Ticker Taker stands at Waldoge's height. He is the ultimate boss through his
 * moves, AI and VFX — never through size.
 *
 * Form → animation mapping (the shared move table drives ALL timing):
 *   jab / straight        → Waldoge-style straight punch
 *   combo                 → punch ▸ kick ▸ punch mirror combo
 *   roundhouse / sweep    → high roundhouse kick
 *   lunge / flying_kick   → dash-punch lunge (Waldoge's dash strike)
 *   throw                 → flyer / chart-shard throw
 *   slam                  → megaphone broadcast (Mr Marketer's weapon)
 *   spin                  → scythe reap (Exit Liquidity's weapon)
 *   counter               → scythe overhead / heavy slash
 *   straight w/ gun moves → Tommy gun burst (Bad Actor's weapon)
 *   dodge                 → sidestep reposition
 */

import { renderNow, flicker } from "./clock";
import atlasAsset from "@/assets/ticker-taker-atlas.png.asset.json";

export interface TickerTakerView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
  /** Id of the move currently playing — lets weapon poses be exact. */
  bossMoveId?: string;
}

/** Martial forms produced by the shared boss move table. */
export type TickerTakerForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 0, y: 0, w: 366, h: 540, ax: 193, ay: 540 },
  walk: { x: 372, y: 0, w: 333, h: 546, ax: 169.6, ay: 546 },
  punch: { x: 711, y: 0, w: 449, h: 541, ax: 187.8, ay: 541 },
  kick: { x: 1166, y: 0, w: 461, h: 535, ax: 185.9, ay: 535 },
  drain: { x: 0, y: 552, w: 477, h: 597, ax: 204.6, ay: 597 },
  gun: { x: 483, y: 552, w: 523, h: 589, ax: 186.3, ay: 589 },
  scythe: { x: 1012, y: 552, w: 600, h: 591, ax: 296.5, ay: 591 },
  mega: { x: 0, y: 1155, w: 572, h: 597, ax: 273.7, ay: 597 },
  flyers: { x: 578, y: 1155, w: 509, h: 561, ax: 190, ay: 561 },
  hurt: { x: 1093, y: 1155, w: 600, h: 496, ax: 275.7, ay: 496 },
  defeat: { x: 0, y: 1758, w: 586, h: 268, ax: 277.9, ay: 268 },
  dash: { x: 592, y: 1758, w: 485, h: 560, ax: 240.8, ay: 560 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 540;
// Draw scale is pinned to Waldoge's combat scale (he renders at
// hitboxHeight * 1.95). Ticker Taker is his mirror, so he stands at
// essentially the same height. The blueprint is a design reference only.
const SIZE = 1.95;

/**
 * MEMORY BUDGET — why this atlas is resampled once on load.
 *
 * The Ticker Taker sheet is authored at roughly 1700x2330 px: ~4 MP, which a
 * browser keeps as ~16 MB of decoded RGBA — about four times any other
 * character sheet in the game. On a mobile browser that extra pressure makes
 * the engine drop decoded image data (and, on iOS, whole canvas backing
 * stores) mid-fight, which is what made Waldoge, Ticker Taker and the minions
 * all blink out and return together during Level 7 only.
 *
 * The game canvas is capped at devicePixelRatio 2 and Ticker Taker is drawn at
 * roughly 136 CSS px tall from a 540 px source frame, so no more than ~55% of
 * the authored resolution can ever reach a pixel. Downsampling once to
 * ATLAS_SCALE therefore costs nothing visible and cuts the resident cost by
 * ~64%. Frame rects are scaled by the same factor at draw time; every
 * DESTINATION rect is untouched, so pose, anchor, size, hitbox, timing and
 * combat behaviour are bit-for-bit what they were.
 */
export const ATLAS_SCALE = 0.6;

type Sheet = HTMLImageElement | HTMLCanvasElement;

let atlas: HTMLImageElement | null = null;
let sheet: Sheet | null = null;
let srcScale = 1;
let ready = false;

/** Resample the loaded atlas down to ATLAS_SCALE and release the original. */
function buildSheet(img: HTMLImageElement): Sheet {
  if (typeof document === "undefined" || ATLAS_SCALE >= 1) return img;
  const w = Math.max(1, Math.round(img.naturalWidth * ATLAS_SCALE));
  const h = Math.max(1, Math.round(img.naturalHeight * ATLAS_SCALE));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cx = c.getContext("2d");
  if (!cx) return img;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(img, 0, 0, w, h);
  return c;
}

function getAtlas(): Sheet | null {
  if (sheet) return sheet;
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    atlas.onload = () => { ready = true; };
    atlas.src = atlasAsset.url;
  }
  if (!(ready && atlas.complete && atlas.naturalWidth > 0)) return null;
  sheet = buildSheet(atlas);
  if (sheet !== atlas) {
    srcScale = ATLAS_SCALE;
    // Drop the full-resolution reference so the browser can reclaim it.
    atlas = null;
  }
  return sheet;
}

/** Kick off the download early (called once from the game bootstrap). */
export function preloadTickerTakerSprites() { getAtlas(); }

/** Source-rect scale currently in use (1 when the sheet is not resampled). */
export function atlasSourceScale(): number {
  return srcScale;
}

interface Pose {
  f: Frame;
  striking: boolean;
  draining: boolean;
  firing: boolean;
  reaping: boolean;
  shouting: boolean;
}

const P = (
  f: Frame,
  o: Partial<Omit<Pose, "f">> = {},
): Pose => ({
  f,
  striking: false, draining: false, firing: false, reaping: false, shouting: false,
  ...o,
});

/** Weapon specials are identified by move id so each weapon poses correctly. */
function weaponOf(id?: string): "gun" | "scythe" | "mega" | "drain" | null {
  if (!id) return null;
  if (id.startsWith("tt_gun")) return "gun";
  if (id.startsWith("tt_scythe") || id.startsWith("tt_reap")) return "scythe";
  if (id.startsWith("tt_mega")) return "mega";
  if (id.startsWith("tt_drain") || id.startsWith("tt_siphon")) return "drain";
  return null;
}

function poseFor(
  e: TickerTakerView,
  form: TickerTakerForm,
  prog: number,
  telegraphing: boolean,
  clock: number,
): Pose {
  if (e.state === "dead") return P(F.defeat);
  if (e.state === "hit") return P(F.hurt);

  // Weapon specials take priority — they are the readable, telegraphed moves.
  const weapon = weaponOf(e.bossMoveId);
  if (weapon === "gun") {
    // Draw ▸ aim ▸ fire ▸ recover.
    if (prog < 0.28) return P(F.walk);
    return P(F.gun, { firing: prog < 0.85 });
  }
  if (weapon === "scythe") {
    if (prog < 0.3) return P(F.idle);
    return P(F.scythe, { striking: true, reaping: true });
  }
  if (weapon === "mega") {
    if (telegraphing || prog < 0.32) return P(F.walk);
    return P(F.mega, { shouting: true });
  }
  if (weapon === "drain") {
    if (prog < 0.35) return P(F.idle, { draining: true });
    return P(F.drain, { draining: true, striking: prog > 0.45 });
  }

  if (form) {
    switch (form) {
      // Waldoge's jab / straight — coil then extend.
      case "jab":
      case "straight":
        return prog < 0.38 ? P(F.idle) : P(F.punch, { striking: true });
      // Waldoge's light chain: punch ▸ kick ▸ punch.
      case "combo":
        if (prog < 0.24) return P(F.idle);
        if (prog < 0.5) return P(F.punch, { striking: true });
        return prog < 0.78 ? P(F.kick, { striking: true }) : P(F.punch, { striking: true });
      case "roundhouse":
      case "sweep":
        return prog < 0.32 ? P(F.walk) : P(F.kick, { striking: true });
      // Dash strike — Waldoge's dashpunch, mirrored.
      case "lunge":
      case "flying_kick":
        return prog < 0.3 ? P(F.dash) : P(F.punch, { striking: true });
      case "throw":
        return prog < 0.35 ? P(F.walk) : P(F.flyers, { striking: true });
      case "slam":
        return prog < 0.4 ? P(F.walk) : P(F.mega, { shouting: true });
      case "spin":
        return P(F.scythe, { striking: prog > 0.3, reaping: true });
      case "counter":
        return prog < 0.4 ? P(F.idle, { draining: true }) : P(F.drain, { draining: true });
      case "dodge":
        return P(F.walk);
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.5) {
    return P(Math.floor(clock / 150) % 2 === 0 ? F.walk : F.idle);
  }
  return P(F.idle);
}

/** Draws a Ticker Taker projectile (tommy-gun round / dark chart shard). */
export function drawTickerTakerShot(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  dir: number,
): boolean {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(dir >= 0 ? 1 : -1, 1);
  ctx.shadowColor = "rgba(255,60,60,0.9)";
  ctx.shadowBlur = 12;
  // Tracer streak.
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(8, 0);
  ctx.strokeStyle = "rgba(255,190,90,0.9)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(6, 0, 6, 3.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#ff3c3c";
  ctx.fill();
  ctx.restore();
  return true;
}

/**
 * Draws Ticker Taker from the blueprint atlas. Returns false while the artwork
 * is still downloading so the caller falls back to the shared procedural boss
 * renderer for that frame.
 */
export function drawTickerTakerSprite(
  ctx: CanvasRenderingContext2D,
  e: TickerTakerView,
  camX: number,
  form: TickerTakerForm,
  prog: number,
  telegraphing: boolean,
  bossPhase = 1,
): boolean {
  const img = getAtlas();
  if (!img) return false;

  const sx = e.x - camX;
  const sy = e.y;
  const clock = renderNow();
  const pose = poseFor(e, form, prog, telegraphing, clock);
  const f = pose.f;
  const base = (e.height * SIZE) / REF_H;

  // Ground shadow (world-anchored).
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 34, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // Dark-mirror aura — deep red, hotter and blacker in later phases.
  if (e.state !== "dead") {
    const cy = sy - e.height * 0.95;
    const color = bossPhase >= 3 ? "255, 20, 20" : bossPhase >= 2 ? "220, 30, 60" : "180, 20, 40";
    const aura = ctx.createRadialGradient(sx, cy, 6, sx, cy, 72);
    aura.addColorStop(0, `rgba(${color}, 0.3)`);
    aura.addColorStop(1, `rgba(${color}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 72, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Telegraph ring before every committed move.
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 42);
    ctx.beginPath();
    ctx.arc(sx, sy - e.height * 0.95, 64 + pulse * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 60, 60, ${0.3 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // ENERGY STEAL: dark spiral pulling toward Ticker Taker. Visual only — the
  // drain itself is resolved by the shared hit-frame code.
  if (pose.draining && e.state !== "dead") {
    const cx = sx + e.facing * 34;
    const cy = sy - e.height * 1.0;
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const t = ((clock / 120) + i * 0.4) % 1.4;
      const r = 70 * (1 - t) + 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 40, 60, ${Math.max(0, 0.55 - t * 0.35)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Tommy gun muzzle flash.
  if (pose.firing && e.state !== "dead") {
    const mx = sx + e.facing * 62;
    const my = sy - e.height * 0.98;
    const flick = 0.6 + flicker(e.x) * 0.4;
    ctx.save();
    ctx.globalAlpha = flick;
    const g = ctx.createRadialGradient(mx, my, 2, mx, my, 26);
    g.addColorStop(0, "rgba(255,240,180,0.95)");
    g.addColorStop(1, "rgba(255,90,20,0)");
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  // Scythe reap arc.
  if (pose.reaping && e.state !== "dead") {
    const cx = sx + e.facing * 22;
    const cy = sy - e.height * 0.85;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(e.facing, 1);
    ctx.rotate(-0.6 + prog * 1.9);
    ctx.beginPath();
    ctx.arc(0, 0, 74, -0.9, 0.9);
    ctx.strokeStyle = "rgba(255, 40, 60, 0.75)";
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 74, -0.6, 0.6);
    ctx.strokeStyle = "rgba(255, 230, 230, 0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // Megaphone broadcast cone + shout.
  if (pose.shouting && e.state !== "dead") {
    const ox = sx + e.facing * 46;
    const oy = sy - e.height * 1.1;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(e.facing, 1);
    for (let i = 0; i < 4; i++) {
      const t = ((clock / 85) + i * 0.55) % 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + t * 64, -0.6, 0.6);
      ctx.strokeStyle = `rgba(255, 40, 60, ${Math.max(0, 0.6 - t * 0.27)})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();

  // Weight, breathing and impact lean — visual only.
  let sqx = 1, sqy = 1, bob = 0, lean = 0, push = 0;
  if (!form && e.state !== "dead" && e.state !== "hit") {
    bob = Math.sin(clock / 200) * 1.6;
    sqy = 1 + Math.sin(clock / 200) * 0.02;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.32;
  } else if (pose.striking) {
    push = e.facing * 6;
    sqx = 1.05; sqy = 0.97;
  }

  ctx.translate(sx + push, sy + bob);
  if (lean) ctx.rotate(lean);
  ctx.scale(e.facing * base * sqx, base * sqy);
  if (e.state === "hit") ctx.globalAlpha = 0.92;
  if (e.state === "dead") ctx.globalAlpha = 0.88;

  ctx.imageSmoothingEnabled = true;
  // Source rect follows the resampled sheet; destination rect is unchanged so
  // the on-screen pose, anchor and size are identical to the full-res sheet.
  const s = srcScale;
  ctx.drawImage(img, f.x * s, f.y * s, f.w * s, f.h * s, -f.ax, -f.ay, f.w, f.h);

  ctx.restore();
  return true;
}
