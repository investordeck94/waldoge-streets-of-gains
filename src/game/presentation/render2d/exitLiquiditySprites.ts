/**
 * exitLiquiditySprites.ts — sprite-atlas rendering of the approved
 * EXIT LIQUIDITY blueprint (grim-reaper boss: canonical ghost head with top
 * hat, red dollar-sign eyes and gold chain, long tattered black robe, huge
 * spectral scythe).
 *
 * PURELY PRESENTATIONAL. It reads a read-only view of the boss (position,
 * facing, state, active martial form and progress) and picks the matching
 * blueprint frame plus the supernatural VFX for that pose. It never mutates
 * gameplay state and never decides damage, hit frames, cooldowns, ranges, AI
 * or HP — the existing boss/combat systems stay the single source of truth
 * (see bossMoves.ts + StreetBrawler.tsx).
 *
 * Form → animation mapping (the shared move table drives all timing):
 *   jab / straight    → fast horizontal scythe slash
 *   combo / sweep     → wind-up ▸ slash ▸ heavy reap follow-through
 *   roundhouse        → reverse hook swing
 *   slam              → overhead reaper strike (raise ▸ downward smash)
 *   spin              → 360° spinning reap
 *   lunge / flying_kick → reaper dash (dark blur) ▸ slash
 *   throw             → ranged dark-energy crescent cast
 *   counter           → LIQUIDATION area wind-up ▸ ground smash
 *   dodge             → drifting reposition
 */

import { renderNow } from "./clock";
import atlasAsset from "@/assets/exit-liquidity-atlas.png.asset.json";
import { residentImage } from "./imageResidency";

export interface ExitLiquidityView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
}

/** Martial forms produced by the shared boss move table. */
export type ExitLiquidityForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 66, y: 0, w: 168, h: 267, ax: 79.3, ay: 267 },
  walk: { x: 344, y: 15, w: 212, h: 252, ax: 98.9, ay: 252 },
  slash: { x: 607, y: 45, w: 285, h: 222, ax: 128.2, ay: 222 },
  windup: { x: 923, y: 42, w: 253, h: 225, ax: 152.4, ay: 225 },
  reap: { x: 3, y: 267, w: 294, h: 267, ax: 129.3, ay: 267 },
  overheadUp: { x: 320, y: 280, w: 259, h: 254, ax: 160.9, ay: 254 },
  overheadHit: { x: 638, y: 314, w: 223, h: 220, ax: 94.6, ay: 220 },
  spin: { x: 913, y: 277, w: 273, h: 257, ax: 126.4, ay: 257 },
  dash: { x: 7, y: 628, w: 286, h: 173, ax: 135.5, ay: 173 },
  cast: { x: 300, y: 556, w: 300, h: 245, ax: 142, ay: 245 },
  hurt: { x: 608, y: 566, w: 283, h: 235, ax: 169.7, ay: 235 },
  defeat: { x: 924, y: 708, w: 251, h: 93, ax: 120.3, ay: 93 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 267;
/** Visual size relative to the collision box: a tall reaper reads bigger. */
// Draw scale is pinned to Waldoge's combat scale (he renders at
// hitboxHeight * 1.95). This keeps the boss's on-screen height within a few
// percent of Waldoge's so attacks, spacing and foot placement read naturally.
// The blueprint artwork is a design reference, never an in-game scale.
const SIZE = 2.1;

let atlas: HTMLImageElement | null = null;
let ready = false;

function getAtlas(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    atlas.onload = () => { ready = true; };
    residentImage(atlas, atlasAsset.url, [4]);
  }
  return ready && atlas.complete && atlas.naturalWidth > 0 ? atlas : null;
}

/** Kick off the download early (called once from the game bootstrap). */
export function preloadExitLiquiditySprites() { getAtlas(); }

interface Pose {
  f: Frame;
  /** Draw a sweeping spectral slash arc behind the blade. */
  arc: number;
  /** Ghostly after-image trail (dash / spin). */
  trail: boolean;
  /** Ground-level dark energy ring (LIQUIDATION / overhead impact). */
  ground: number;
}

const NONE: Omit<Pose, "f"> = { arc: 0, trail: false, ground: 0 };

function poseFor(
  e: ExitLiquidityView,
  form: ExitLiquidityForm,
  prog: number,
  telegraphing: boolean,
  clock: number,
): Pose {
  if (e.state === "dead") return { f: F.defeat, ...NONE };
  if (e.state === "hit") return { f: F.hurt, ...NONE };

  if (form) {
    switch (form) {
      // Fast horizontal reaping slash.
      case "jab":
      case "straight":
        return prog < 0.35
          ? { f: F.windup, ...NONE }
          : { f: F.slash, arc: 1, trail: false, ground: 0 };
      // Heavy reap: pull the blade back, then the full sweeping follow-through.
      case "combo":
      case "sweep":
      case "roundhouse":
        if (prog < 0.34) return { f: F.windup, ...NONE };
        return prog < 0.62
          ? { f: F.slash, arc: 1, trail: false, ground: 0 }
          : { f: F.reap, arc: 1.35, trail: true, ground: 0 };
      // Overhead reaper strike — raise high, then smash down.
      case "slam":
        if (telegraphing || prog < 0.45) return { f: F.overheadUp, ...NONE };
        return { f: F.overheadHit, arc: 0.8, trail: false, ground: 1 };
      // 360° spinning reap.
      case "spin":
        return { f: F.spin, arc: 1.5, trail: true, ground: 0 };
      // Reaper dash — dark blur in, blade out.
      case "lunge":
      case "flying_kick":
        return prog < 0.7
          ? { f: F.dash, arc: 0.5, trail: true, ground: 0 }
          : { f: F.slash, arc: 1, trail: true, ground: 0 };
      // Ranged dark-energy crescent.
      case "throw":
        return prog < 0.4
          ? { f: F.overheadUp, ...NONE }
          : { f: F.cast, arc: 0.6, trail: false, ground: 0 };
      // LIQUIDATION — plant the scythe, dark energy floods the ground.
      case "counter":
        if (telegraphing || prog < 0.5) return { f: F.overheadUp, arc: 0, trail: false, ground: 0.4 };
        return { f: F.overheadHit, arc: 1, trail: false, ground: 1.6 };
      case "dodge":
        return { f: F.walk, arc: 0, trail: true, ground: 0 };
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.5) {
    return { f: Math.floor(clock / 200) % 2 === 0 ? F.walk : F.idle, ...NONE };
  }
  return { f: F.idle, ...NONE };
}

/**
 * Draws Exit Liquidity from the blueprint atlas. Returns false while the
 * artwork is still downloading so the caller falls back to the shared
 * procedural boss renderer for that frame.
 */
export function drawExitLiquiditySprite(
  ctx: CanvasRenderingContext2D,
  e: ExitLiquidityView,
  camX: number,
  form: ExitLiquidityForm,
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
  const cy = sy - e.height * 1.05;

  ctx.save();

  // Ground shadow — narrow, he floats more than he stands.
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 34, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // Spectral fog pooling at his feet.
  if (e.state !== "dead") {
    for (let i = 0; i < 3; i++) {
      const t = clock / 900 + i * 2.1;
      const ox = Math.sin(t) * 26;
      const r = 16 + Math.sin(t * 1.7) * 6;
      ctx.beginPath();
      ctx.ellipse(sx + ox, sy - 6, r, r * 0.34, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60, 230, 205, ${0.05 + 0.04 * Math.sin(t * 2)})`;
      ctx.fill();
    }
  }

  // Death aura — teal by default, hotter as the phases escalate.
  if (e.state !== "dead") {
    const auraColor = bossPhase >= 3 ? "255, 40, 60" : bossPhase >= 2 ? "180, 120, 255" : "60, 235, 205";
    const aura = ctx.createRadialGradient(sx, cy, 8, sx, cy, 82);
    aura.addColorStop(0, `rgba(${auraColor}, 0.24)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 82, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Ground-level dark energy ring (LIQUIDATION / overhead impact).
  if (pose.ground > 0 && e.state !== "dead") {
    const g = pose.ground;
    const rr = 40 + g * 90 * (0.6 + 0.4 * Math.sin(clock / 60));
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(sx, sy - 4, rr, rr * 0.3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(90, 255, 220, ${Math.min(0.85, 0.3 + g * 0.4)})`;
    ctx.lineWidth = 3 + g * 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(sx, sy - 4, rr * 0.62, rr * 0.19, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(20, 20, 30, ${0.3 + g * 0.3})`;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  // Telegraph ring before heavy / committed reaps.
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 45);
    ctx.beginPath();
    ctx.arc(sx, cy, 76 + pulse * 16, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120, 255, 225, ${0.25 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Sweeping spectral slash arc, drawn in the swing direction.
  if (pose.arc > 0 && e.state !== "dead") {
    const a = pose.arc;
    const swing = Math.min(1, Math.max(0, (prog - 0.3) / 0.6));
    ctx.save();
    ctx.translate(sx, cy);
    ctx.scale(e.facing, 1);
    ctx.rotate(-0.9 + swing * 1.9);
    ctx.beginPath();
    ctx.arc(0, 0, 62 * a, -1.1, 1.1);
    ctx.strokeStyle = `rgba(110, 255, 225, ${0.5 * (1 - swing * 0.4)})`;
    ctx.lineWidth = 10 * a;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 62 * a, -0.8, 0.8);
    ctx.strokeStyle = `rgba(230, 255, 250, ${0.45 * (1 - swing * 0.4)})`;
    ctx.lineWidth = 3 * a;
    ctx.stroke();
    ctx.restore();
  }

  // Body transform — supernatural float, hit rock-back, dash lean.
  let bob = 0, lean = 0, push = 0, alpha = 1;
  if (!form && e.state !== "dead" && e.state !== "hit") {
    bob = Math.sin(clock / 420) * 3.5;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.3;
  } else if (pose.trail) {
    push = e.facing * 6;
    lean = e.facing * 0.1;
  }

  // Ghostly after-images for dash / spin.
  if (pose.trail && e.state !== "dead") {
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.globalAlpha = 0.12 * i;
      ctx.translate(sx + push - e.facing * i * 16, sy + bob);
      ctx.scale(e.facing * base, base);
      ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);
      ctx.restore();
    }
  }

  ctx.translate(sx + push, sy + bob);
  if (lean) ctx.rotate(lean);
  ctx.scale(e.facing * base, base);
  if (e.state === "hit") alpha = 0.92;
  if (e.state === "dead") alpha = 0.85;
  ctx.globalAlpha = alpha;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);

  ctx.restore();
  return true;
}
