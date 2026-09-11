/**
 * mrMarketerSprites.ts — sprite-atlas rendering of the approved MR MARKETER
 * blueprint (sales executive boss: canonical head with BOOST / TRENDING
 * sunglasses, black suit, red tie, CEO lanyard, walkie-talkie, megaphone,
 * BOOST/TRENDING leaflets, black-red-white high tops).
 *
 * PURELY PRESENTATIONAL. It reads a read-only view of the boss (position,
 * facing, state, active martial form and progress) and picks the matching
 * blueprint frame. It never mutates gameplay state and never decides damage,
 * hit frames, cooldowns, ranges, AI, energy or HP — the existing boss/combat
 * systems stay the single source of truth (bossMoves.ts + StreetBrawler.tsx).
 *
 * Form → animation mapping (the shared move table drives all timing):
 *   jab / straight        → sales-executive punch (wind-up ▸ strike)
 *   combo                 → punch ▸ kick short combo
 *   roundhouse / sweep    → forward kick
 *   flying_kick / lunge   → charging kick / viral rush
 *   throw                 → leaflet throw (BOOST/TRENDING paper)
 *   slam / spin           → megaphone broadcast (BOOST! / TRENDING! cone)
 *   counter               → walkie-talkie raiding-team call
 *   dodge                 → business reposition step
 */

import { renderNow } from "./clock";
import atlasAsset from "@/assets/mr-marketer-atlas.png.asset.json";

export interface MrMarketerView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
}

/** Martial forms produced by the shared boss move table. */
export type MrMarketerForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 0, y: 0, w: 238, h: 325, ax: 119, ay: 325 },
  walk: { x: 244, y: 0, w: 200, h: 325, ax: 100, ay: 325 },
  punch: { x: 450, y: 0, w: 274, h: 325, ax: 137, ay: 325 },
  kick: { x: 730, y: 0, w: 254, h: 296, ax: 127, ay: 296 },
  mega: { x: 0, y: 331, w: 231, h: 309, ax: 115.5, ay: 309 },
  mega2: { x: 237, y: 331, w: 205, h: 324, ax: 102.5, ay: 324 },
  walkie: { x: 448, y: 331, w: 226, h: 312, ax: 113, ay: 312 },
  hurt: { x: 680, y: 331, w: 248, h: 302, ax: 124, ay: 302 },
  defeat: { x: 0, y: 661, w: 344, h: 163, ax: 172, ay: 163 },
  leaflet: { x: 350, y: 661, w: 117, h: 96, ax: 58.5, ay: 96 },
  throw: { x: 473, y: 661, w: 295, h: 330, ax: 147.5, ay: 330 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 325;
/** Visual size relative to the collision box. */
// Draw scale is pinned to Waldoge's combat scale (he renders at
// hitboxHeight * 1.95). This keeps the boss's on-screen height within a few
// percent of Waldoge's so attacks, spacing and foot placement read naturally.
// The blueprint artwork is a design reference, never an in-game scale.
const SIZE = 1.89;

let atlas: HTMLImageElement | null = null;
let ready = false;

function getAtlas(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    atlas.onload = () => { ready = true; };
    atlas.src = atlasAsset.url;
  }
  return ready && atlas.complete && atlas.naturalWidth > 0 ? atlas : null;
}

/** Kick off the download early (called once from the game bootstrap). */
export function preloadMrMarketerSprites() { getAtlas(); }

interface Pose { f: Frame; striking: boolean; broadcasting: boolean; radio: boolean }

const P = (f: Frame, striking = false, broadcasting = false, radio = false): Pose =>
  ({ f, striking, broadcasting, radio });

function poseFor(
  e: MrMarketerView,
  form: MrMarketerForm,
  prog: number,
  telegraphing: boolean,
  clock: number,
): Pose {
  if (e.state === "dead") return P(F.defeat);
  if (e.state === "hit") return P(F.hurt);

  if (form) {
    switch (form) {
      // Fast executive punch — coil, then extend.
      case "jab":
      case "straight":
        return prog < 0.4 ? P(F.idle) : P(F.punch, true);
      // Punch into kick.
      case "combo":
        if (prog < 0.28) return P(F.idle);
        return prog < 0.6 ? P(F.punch, true) : P(F.kick, true);
      // Forward / side kick.
      case "roundhouse":
      case "sweep":
        return prog < 0.35 ? P(F.walk) : P(F.kick, true);
      // Viral rush — leading with the kick, body committed forward.
      case "lunge":
      case "flying_kick":
        return prog < 0.3 ? P(F.walk) : P(F.kick, true);
      // Leaflet throw — pull the stack, then release.
      case "throw":
        return prog < 0.35 ? P(F.walk) : P(F.throw, true);
      // Megaphone broadcast — raise it, then shout the cone.
      case "slam":
      case "spin":
        if (telegraphing || prog < 0.35) return P(F.mega2);
        return P(F.mega, false, true);
      // Walkie-talkie: call in the raiding team.
      case "counter":
        return P(F.walkie, false, false, true);
      case "dodge":
        return P(F.walk);
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.5) {
    return P(Math.floor(clock / 170) % 2 === 0 ? F.walk : F.idle);
  }
  return P(F.idle);
}

/** Draws a single spinning BOOST/TRENDING leaflet projectile from the atlas. */
export function drawMarketerLeaflet(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  dir: number,
): boolean {
  const img = getAtlas();
  if (!img) return false;
  const f = F.leaflet;
  const scale = 30 / f.h;
  ctx.save();
  ctx.translate(sx, sy);
  // Slight spinning / floating motion as it flies.
  ctx.rotate(Math.sin(renderNow() / 90 + sx * 0.05) * 0.5);
  ctx.scale((dir >= 0 ? 1 : -1) * scale, scale);
  ctx.shadowColor = "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 8;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.w / 2, -f.h / 2, f.w, f.h);
  ctx.restore();
  return true;
}

/**
 * Draws Mr Marketer from the blueprint atlas. Returns false while the artwork
 * is still downloading so the caller falls back to the shared procedural boss
 * renderer for that frame.
 */
export function drawMrMarketerSprite(
  ctx: CanvasRenderingContext2D,
  e: MrMarketerView,
  camX: number,
  form: MrMarketerForm,
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
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 36, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // Marketing-red hype aura, hotter in later phases.
  if (e.state !== "dead") {
    const cy = sy - e.height * 0.95;
    const auraColor = bossPhase >= 3 ? "255, 0, 0" : bossPhase >= 2 ? "255, 90, 40" : "255, 60, 60";
    const aura = ctx.createRadialGradient(sx, cy, 6, sx, cy, 68);
    aura.addColorStop(0, `rgba(${auraColor}, 0.24)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 68, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Telegraph ring before committed moves.
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 45);
    ctx.beginPath();
    ctx.arc(sx, sy - e.height * 0.95, 66 + pulse * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 210, 60, ${0.25 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Megaphone sound-wave cone + BOOST / TRENDING shout (visual only — the
  // energy drain itself is resolved by the shared hit-frame code).
  if (pose.broadcasting && e.state !== "dead") {
    const originX = sx + e.facing * 44;
    const originY = sy - e.height * 1.15;
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(e.facing, 1);
    for (let i = 0; i < 4; i++) {
      const t = ((clock / 90) + i * 0.55) % 2.2;
      const r = 26 + t * 62;
      ctx.beginPath();
      ctx.arc(0, 0, r, -0.6, 0.6);
      ctx.strokeStyle = `rgba(255, 60, 60, ${Math.max(0, 0.55 - t * 0.25)})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 22px Impact, sans-serif";
    ctx.fillStyle = "#ff2b3c";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    const label = Math.floor(clock / 220) % 2 === 0 ? "BOOST!" : "TRENDING!";
    const lx = sx + e.facing * 92;
    const ly = originY - 26 + Math.sin(clock / 120) * 4;
    ctx.strokeText(label, lx, ly);
    ctx.fillText(label, lx, ly);
    ctx.restore();
  }

  // Walkie-talkie radio signal rings while calling the raiding team.
  if (pose.radio && e.state !== "dead") {
    const ox = sx + e.facing * 18;
    const oy = sy - e.height * 1.35;
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const t = ((clock / 110) + i * 0.5) % 1.6;
      ctx.beginPath();
      ctx.arc(ox, oy, 10 + t * 40, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 220, 60, ${Math.max(0, 0.5 - t * 0.32)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();

  // Weight, hype bounce and impact lean — visual only.
  let sqx = 1, sqy = 1, bob = 0, lean = 0, push = 0;
  if (!form && e.state !== "dead" && e.state !== "hit") {
    bob = Math.sin(clock / 220) * 1.8;
    sqy = 1 + Math.sin(clock / 220) * 0.018;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.3;
  } else if (pose.striking) {
    push = e.facing * 5;
    sqx = 1.04; sqy = 0.98;
  } else if (pose.broadcasting) {
    sqx = 1.03; sqy = 1.02;
  }

  ctx.translate(sx + push, sy + bob);
  if (lean) ctx.rotate(lean);
  ctx.scale(e.facing * base * sqx, base * sqy);
  if (e.state === "hit") ctx.globalAlpha = 0.92;
  if (e.state === "dead") ctx.globalAlpha = 0.88;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);

  ctx.restore();
  return true;
}
