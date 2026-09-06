/**
 * badActorSprites.ts — sprite-atlas rendering of the approved BAD ACTOR
 * blueprint (mafia boss: brown fedora, dark pinstripe three-piece suit, red
 * tie and pocket square, long brown overcoat, black dress shoes, Tommy gun
 * with drum magazine).
 *
 * PURELY PRESENTATIONAL. It reads a read-only view of the boss (position,
 * facing, state, active martial form and progress) and picks the matching
 * blueprint frame. It never mutates gameplay state and never decides damage,
 * hit frames, cooldowns, ranges, AI or HP — the existing boss/combat systems
 * stay the single source of truth.
 *
 * Form → animation mapping (existing move table drives the timing):
 *   throw            → aim ▸ shoot (Tommy gun burst) ▸ reload recovery
 *   lunge            → running shoot / advancing gun rush
 *   slam / counter   → heavy close-range Tommy-gun melee strike
 *   jab / combo      → quick gun-butt strikes
 *   dodge            → repositioning stride
 */

import atlasAsset from "@/assets/badactor-atlas.png.asset.json";

export interface BadActorView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
}

/** Martial forms produced by the shared boss move table. */
export type BadActorForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 0, y: 0, w: 123, h: 223, ax: 65.9, ay: 223 },
  walk: { x: 232, y: 0, w: 123, h: 212, ax: 97.7, ay: 212 },
  aim: { x: 464, y: 0, w: 115, h: 212, ax: 56.7, ay: 212 },
  shoot: { x: 696, y: 0, w: 164, h: 218, ax: 90.0, ay: 218 },
  runshoot: { x: 0, y: 249, w: 220, h: 213, ax: 165.7, ay: 213 },
  reload: { x: 232, y: 249, w: 140, h: 226, ax: 78.8, ay: 226 },
  hurt: { x: 464, y: 249, w: 170, h: 237, ax: 108.7, ay: 237 },
  defeat: { x: 696, y: 249, w: 136, h: 153, ax: 65.2, ay: 153 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 223;
/** Visual size relative to the collision box: a boss reads bigger than grunts. */
const SIZE = 2.35;

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
export function preloadBadActorSprites() { getAtlas(); }

interface Pose { f: Frame; firing: boolean; melee: boolean }

function poseFor(
  e: BadActorView,
  form: BadActorForm,
  prog: number,
  telegraphing: boolean,
  clock: number,
): Pose {
  if (e.state === "dead") return { f: F.defeat, firing: false, melee: false };
  if (e.state === "hit") return { f: F.hurt, firing: false, melee: false };

  if (form) {
    switch (form) {
      // Ranged volley: line up the Tommy gun, fire, then reload while he
      // recovers — the vulnerable window the move table already provides.
      case "throw":
        if (prog < 0.35) return { f: F.aim, firing: false, melee: false };
        if (prog < 0.8) return { f: F.shoot, firing: true, melee: false };
        return { f: F.reload, firing: false, melee: false };
      // Advancing gun rush: keeps firing while he closes the gap.
      case "lunge":
        return { f: F.runshoot, firing: prog > 0.25 && prog < 0.75, melee: false };
      // Heavy close-range Tommy-gun melee strike.
      case "slam":
      case "counter":
      case "roundhouse":
      case "flying_kick":
      case "spin":
      case "sweep":
        if (telegraphing || prog < 0.4) return { f: F.reload, firing: false, melee: false };
        return { f: F.shoot, firing: false, melee: true };
      // Quick gun-butt jabs at point-blank range.
      case "jab":
      case "straight":
      case "combo":
        return prog < 0.3
          ? { f: F.aim, firing: false, melee: false }
          : { f: F.shoot, firing: false, melee: true };
      case "dodge":
        return { f: F.walk, firing: false, melee: false };
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.5) {
    return { f: Math.floor(clock / 170) % 2 === 0 ? F.walk : F.idle, firing: false, melee: false };
  }
  return { f: F.idle, firing: false, melee: false };
}

/**
 * Draws Bad Actor from the blueprint atlas. Returns false while the artwork is
 * still downloading so the caller falls back to the shared procedural boss
 * renderer for that frame.
 */
export function drawBadActorSprite(
  ctx: CanvasRenderingContext2D,
  e: BadActorView,
  camX: number,
  form: BadActorForm,
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

  // Ground shadow (world-anchored).
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 36, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  if (e.state !== "dead") {
    const cy = sy - e.height * 0.95;
    const auraColor = bossPhase >= 3 ? "255, 0, 0" : bossPhase >= 2 ? "255, 120, 0" : "180, 140, 40";
    const aura = ctx.createRadialGradient(sx, cy, 6, sx, cy, 64);
    aura.addColorStop(0, `rgba(${auraColor}, 0.26)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 64, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Telegraph ring before the heavy gun-melee strike.
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 45);
    ctx.beginPath();
    ctx.arc(sx, sy - e.height * 0.95, 64 + pulse * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 60, 60, ${0.25 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Weight, recoil and impact lean — visual only.
  let sqx = 1, sqy = 1, bob = 0, lean = 0, kick = 0;
  if (!form && e.state !== "dead" && e.state !== "hit") {
    bob = Math.sin(clock / 230) * 1.6;
    sqy = 1 + Math.sin(clock / 230) * 0.014;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.22;
  } else if (pose.firing) {
    // Tommy-gun recoil shudder while the burst is going out.
    kick = -e.facing * (1.6 + Math.sin(clock / 28) * 1.6);
    bob = Math.sin(clock / 31) * 1.2;
  } else if (pose.melee) {
    sqx = 1.06; sqy = 0.96; lean = e.facing * 0.06;
  }

  ctx.translate(sx + kick, sy + bob);
  if (lean) ctx.rotate(lean);
  ctx.scale(e.facing * base * sqx, base * sqy);
  if (e.state === "hit") ctx.globalAlpha = 0.92;
  if (e.state === "dead") ctx.globalAlpha = 0.88;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);

  // Extra muzzle glow on firing frames (the blueprint flash is baked in; this
  // just adds the light it throws).
  if (pose.firing) {
    const gx = f.w - f.ax;
    const gy = -f.h * 0.62;
    const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, 46);
    glow.addColorStop(0, "rgba(255, 220, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 140, 0, 0)");
    ctx.beginPath();
    ctx.arc(gx, gy, 46, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  ctx.restore();
  return true;
}
