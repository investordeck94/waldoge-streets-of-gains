/**
 * ruggerSprites.ts — sprite-atlas rendering of the approved RUGGER blueprint.
 *
 * PURELY PRESENTATIONAL. Reads a read-only view of the boss entity (position,
 * facing, combat state, active-move progress) and draws the matching artwork
 * frame from the Rugger blueprint atlas. It never mutates gameplay state and
 * never decides damage, hit frames, cooldowns, AI, phases or knockback — the
 * existing boss systems remain the single source of truth.
 *
 * Frames come straight from the blueprint sheet (idle / jab / cross / hook /
 * kick / dash / hurt / special charge / special thrust / victory / defeat), so
 * the in-game character is the blueprint artwork rather than a reinterpretation.
 */

import atlasAsset from "@/assets/rugger-atlas.png.asset.json";

export interface RuggerView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
  hp: number;
}

/** Martial forms produced by the shared boss move table. */
export type RuggerForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 0, y: 0, w: 125, h: 183, ax: 62.5, ay: 183 },
  jab: { x: 255, y: 0, w: 142, h: 181, ax: 71, ay: 181 },
  cross: { x: 510, y: 0, w: 140, h: 179, ax: 70, ay: 179 },
  hook: { x: 765, y: 0, w: 130, h: 176, ax: 65, ay: 176 },
  kick: { x: 0, y: 214, w: 154, h: 180, ax: 77, ay: 180 },
  dash: { x: 255, y: 214, w: 174, h: 163, ax: 87, ay: 163 },
  hurt: { x: 510, y: 214, w: 162, h: 185, ax: 81, ay: 185 },
  charge: { x: 765, y: 214, w: 168, h: 188, ax: 84, ay: 188 },
  thrust: { x: 0, y: 428, w: 197, h: 162, ax: 98.5, ay: 162 },
  victory: { x: 255, y: 428, w: 246, h: 207, ax: 123, ay: 207 },
  defeat: { x: 510, y: 428, w: 246, h: 101, ax: 123, ay: 101 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 183;
/** Visual size relative to the collision box (art is deliberately larger). */
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
export function preloadRuggerSprites() { getAtlas(); }

function frameFor(
  e: RuggerView,
  form: RuggerForm,
  prog: number,
  telegraphing: boolean,
  clock: number,
): Frame {
  if (e.state === "dead") return F.defeat;
  if (e.state === "hit") return F.hurt;

  if (form) {
    switch (form) {
      case "jab":
        return prog < 0.3 ? F.idle : F.jab;
      case "straight":
      case "counter":
        return telegraphing ? F.charge : prog < 0.3 ? F.jab : F.cross;
      case "combo":
        // Alternating lead / rear hands across the combo beats.
        return Math.floor(prog * 3) % 2 === 0 ? F.jab : F.cross;
      case "roundhouse":
      case "flying_kick":
      case "sweep":
      case "spin":
        return prog < 0.25 ? F.hook : F.kick;
      case "slam":
        return telegraphing || prog < 0.45 ? F.charge : F.hook;
      case "lunge":
        return telegraphing ? F.charge : F.dash;
      case "throw":
        return prog < 0.45 ? F.charge : F.thrust;
      case "dodge":
        return F.dash;
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.6) {
    // Two-beat stride using the blueprint's dash / idle silhouettes.
    return Math.floor(clock / 170) % 2 === 0 ? F.dash : F.idle;
  }
  return F.idle;
}

/**
 * Draws Rugger from the blueprint atlas. Returns false when the artwork has
 * not finished downloading, so the caller can fall back to the existing
 * procedural boss renderer for that frame.
 */
export function drawRuggerSprite(
  ctx: CanvasRenderingContext2D,
  e: RuggerView,
  camX: number,
  form: RuggerForm,
  prog: number,
  telegraphing: boolean,
  bossPhase = 1,
): boolean {
  const img = getAtlas();
  if (!img) return false;

  const sx = e.x - camX;
  const sy = e.y;
  const clock = Date.now();
  const f = frameFor(e, form, prog, telegraphing, clock);
  const base = (e.height * SIZE) / REF_H;

  ctx.save();

  // Ground shadow (world-anchored, stays under the fighter).
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 34, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // Boss aura — same phase colours as the shared boss renderer.
  if (e.state !== "dead") {
    const cy = sy - e.height * 0.9;
    const auraColor = bossPhase >= 3 ? "255, 0, 0" : bossPhase >= 2 ? "255, 100, 0" : "200, 0, 255";
    const aura = ctx.createRadialGradient(sx, cy, 5, sx, cy, 60);
    aura.addColorStop(0, `rgba(${auraColor}, 0.28)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Telegraph ring before heavy/committed moves (unchanged read-only cue).
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 45);
    ctx.beginPath();
    ctx.arc(sx, sy - e.height * 0.9, 62 + pulse * 12, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 210, 60, ${0.25 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Weight / impact squash — visual only.
  let sqx = 1, sqy = 1, bob = 0, lean = 0;
  if (!form && e.state === "idle") {
    bob = Math.sin(clock / 320) * 1.6;
    sqy = 1 + Math.sin(clock / 320) * 0.012;
  } else if (form === "slam" && prog > 0.5) {
    sqx = 1.07; sqy = 0.93;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.16;
  } else if (form === "lunge" || form === "flying_kick") {
    lean = e.facing * 0.14 * Math.sin(Math.PI * prog);
  }

  ctx.translate(sx, sy + bob);
  if (lean) ctx.rotate(lean);
  ctx.scale(e.facing * base * sqx, base * sqy);
  if (e.state === "hit") ctx.globalAlpha = 0.92;
  if (e.state === "dead") ctx.globalAlpha = 0.85;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);

  ctx.restore();
  return true;
}
