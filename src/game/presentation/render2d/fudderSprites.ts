/**
 * fudderSprites.ts — sprite-atlas rendering of the approved FUDDER blueprint
 * (chubby sumo boss: dark hair, thick beard, FUD sunglasses, lime-green
 * covered wrestling mankini, white wristbands, big palms, sneakers).
 *
 * PURELY PRESENTATIONAL. It reads a read-only view of the boss (position,
 * facing, state, active martial form and progress) and picks the matching
 * blueprint frame. It never mutates gameplay state and never decides damage,
 * hit frames, cooldowns, ranges, AI or HP — the existing boss/combat systems
 * stay the single source of truth (see bossMoves.ts + StreetBrawler.tsx).
 *
 * Form → animation mapping (existing move table drives the timing):
 *   jab / straight   → single palm slap (wind-up ▸ strike)
 *   combo            → double palm slap
 *   lunge            → sumo charge
 *   slam / counter   → heavy body bump (deep crouch ▸ body slam)
 *   spin / sweep     → wide double-palm sweep
 *   dodge            → heavy repositioning shuffle
 */

import atlasAsset from "@/assets/fudder-atlas.png.asset.json";

export interface FudderView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
}

/** Martial forms produced by the shared boss move table. */
export type FudderForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 21, y: 8, w: 190, h: 241, ax: 95, ay: 241 },
  walk: { x: 262, y: 8, w: 171, h: 241, ax: 85.5, ay: 241 },
  windup: { x: 468, y: 27, w: 224, h: 222, ax: 112, ay: 222 },
  slap: { x: 712, y: 8, w: 199, h: 241, ax: 99.5, ay: 241 },
  double: { x: 17, y: 257, w: 197, h: 241, ax: 98.5, ay: 241 },
  charge: { x: 236, y: 277, w: 223, h: 221, ax: 111.5, ay: 221 },
  hurt: { x: 468, y: 267, w: 223, h: 231, ax: 111.5, ay: 231 },
  defeat: { x: 700, y: 278, w: 224, h: 220, ax: 112, ay: 220 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 241;
/** Visual size relative to the collision box: a heavy boss reads bigger. */
// Draw scale is pinned to Waldoge's combat scale (he renders at
// hitboxHeight * 1.95). This keeps the boss's on-screen height within a few
// percent of Waldoge's so attacks, spacing and foot placement read naturally.
// The blueprint artwork is a design reference, never an in-game scale.
const SIZE = 1.86;

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
export function preloadFudderSprites() { getAtlas(); }

interface Pose { f: Frame; slapping: boolean; heavy: boolean }

function poseFor(
  e: FudderView,
  form: FudderForm,
  prog: number,
  telegraphing: boolean,
  clock: number,
): Pose {
  if (e.state === "dead") return { f: F.defeat, slapping: false, heavy: false };
  if (e.state === "hit") return { f: F.hurt, slapping: false, heavy: false };

  if (form) {
    switch (form) {
      // Single palm slap: coil low, then explode forward.
      case "jab":
      case "straight":
      case "roundhouse":
        return prog < 0.42
          ? { f: F.windup, slapping: false, heavy: false }
          : { f: F.slap, slapping: true, heavy: false };
      // Double palm slap — both palms out on the second beat.
      case "combo":
      case "spin":
      case "sweep":
        if (prog < 0.3) return { f: F.windup, slapping: false, heavy: false };
        return prog < 0.6
          ? { f: F.slap, slapping: true, heavy: false }
          : { f: F.double, slapping: true, heavy: false };
      // Sumo charge / dread leap — shoulder down, full body weight forward.
      case "lunge":
      case "flying_kick":
        return { f: F.charge, slapping: false, heavy: true };
      // Heavy body bump: deep crouch anticipation, then all his mass.
      case "slam":
      case "counter":
      case "throw":
        if (telegraphing || prog < 0.4) return { f: F.windup, slapping: false, heavy: false };
        return { f: F.double, slapping: false, heavy: true };
      case "dodge":
        return { f: F.walk, slapping: false, heavy: false };
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.5) {
    return { f: Math.floor(clock / 190) % 2 === 0 ? F.walk : F.idle, slapping: false, heavy: false };
  }
  return { f: F.idle, slapping: false, heavy: false };
}

/**
 * Draws Fudder from the blueprint atlas. Returns false while the artwork is
 * still downloading so the caller falls back to the shared procedural boss
 * renderer for that frame.
 */
export function drawFudderSprite(
  ctx: CanvasRenderingContext2D,
  e: FudderView,
  camX: number,
  form: FudderForm,
  prog: number,
  telegraphing: boolean,
  bossPhase = 1,
): boolean {
  const img = getAtlas();
  if (!img) return false;

  const sx = e.x - camX;
  const sy = e.y;
  const clock = Date.now();
  const pose = poseFor(e, form, prog, telegraphing, clock);
  const f = pose.f;
  const base = (e.height * SIZE) / REF_H;

  ctx.save();

  // Ground shadow (world-anchored) — wide, he is heavy.
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 44, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  if (e.state !== "dead") {
    const cy = sy - e.height * 0.95;
    const auraColor = bossPhase >= 3 ? "255, 0, 0" : bossPhase >= 2 ? "255, 120, 0" : "160, 230, 60";
    const aura = ctx.createRadialGradient(sx, cy, 6, sx, cy, 70);
    aura.addColorStop(0, `rgba(${auraColor}, 0.26)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 70, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Telegraph ring before heavy palm / body attacks.
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 45);
    ctx.beginPath();
    ctx.arc(sx, sy - e.height * 0.95, 70 + pulse * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 60, 60, ${0.25 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Weight, wobble and impact lean — visual only.
  let sqx = 1, sqy = 1, bob = 0, lean = 0, push = 0;
  if (!form && e.state !== "dead" && e.state !== "hit") {
    // Heavy breathing.
    bob = Math.sin(clock / 260) * 2.2;
    sqy = 1 + Math.sin(clock / 260) * 0.02;
    sqx = 1 - Math.sin(clock / 260) * 0.012;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.26;
  } else if (pose.slapping) {
    push = e.facing * 4;
    sqx = 1.05; sqy = 0.97;
  } else if (pose.heavy) {
    push = e.facing * 6;
    sqx = 1.08; sqy = 0.94; lean = e.facing * 0.08;
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
