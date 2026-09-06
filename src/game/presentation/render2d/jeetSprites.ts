/**
 * jeetSprites.ts — sprite-atlas rendering of the approved JEET blueprint.
 *
 * PURELY PRESENTATIONAL. Reads a read-only view of the fighter (position,
 * facing, combat state, active-move form/progress) and draws the matching
 * artwork frame from the Jeet blueprint atlas. It never mutates gameplay
 * state and never decides damage, hit frames, cooldowns, AI, HP or knockback
 * — the existing enemy/boss systems remain the single source of truth.
 *
 * Frames come straight from the blueprint animation strip (idle, walk, jab,
 * strong spatula swing, hurt, defeat), so the in-game character is the
 * blueprint artwork: fries cap, panicked face, white "2X BURGER" tee, black
 * striped track trousers, red/white sneakers and the burger spatula.
 */

import atlasAsset from "@/assets/jeet-atlas.png.asset.json";

export interface JeetView {
  x: number;
  y: number;
  height: number;
  vx?: number;
  facing: number;
  state: string;
}

/** Martial forms produced by the shared boss move table. */
export type JeetForm =
  | "jab" | "straight" | "combo" | "roundhouse" | "flying_kick" | "sweep"
  | "spin" | "slam" | "lunge" | "throw" | "dodge" | "counter" | null;

interface Frame { x: number; y: number; w: number; h: number; ax: number; ay: number }

const F: Record<string, Frame> = {
  idle: { x: 0, y: 0, w: 167, h: 216, ax: 79.7, ay: 216 },
  walk: { x: 346, y: 0, w: 224, h: 229, ax: 135.3, ay: 229 },
  jab: { x: 692, y: 0, w: 329, h: 212, ax: 90.9, ay: 212 },
  strong: { x: 0, y: 243, w: 251, h: 231, ax: 122.5, ay: 231 },
  hurt: { x: 346, y: 243, w: 226, h: 225, ax: 81.1, ay: 225 },
  defeat: { x: 692, y: 243, w: 334, h: 104, ax: 257.4, ay: 104 },
};

/** Reference height of the idle pose — every frame scales against this. */
const REF_H = 216;
/** Visual size relative to the collision box (art is deliberately larger). */
// Draw scale is pinned to Waldoge's combat scale (he renders at
// hitboxHeight * 1.95). This keeps the boss's on-screen height within a few
// percent of Waldoge's so attacks, spacing and foot placement read naturally.
// The blueprint artwork is a design reference, never an in-game scale.
const SIZE = 1.83;

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
export function preloadJeetSprites() { getAtlas(); }

function frameFor(e: JeetView, form: JeetForm, prog: number, telegraphing: boolean, clock: number): Frame {
  if (e.state === "dead") return F.defeat;
  if (e.state === "hit") return F.hurt;

  if (form) {
    switch (form) {
      // Quick, low-commitment spatula swats.
      case "jab":
      case "straight":
      case "combo":
        return prog < 0.28 ? F.idle : F.jab;
      // Wild, telegraphed haymakers with the spatula.
      case "roundhouse":
      case "flying_kick":
      case "sweep":
      case "spin":
      case "slam":
      case "counter":
        return telegraphing || prog < 0.4 ? F.strong : F.jab;
      case "throw":
        return prog < 0.5 ? F.strong : F.jab;
      case "lunge":
      case "dodge":
        return F.walk;
    }
  }

  if (e.state === "walk" || Math.abs(e.vx ?? 0) > 0.5) {
    // Two-beat awkward shuffle using the blueprint's walk / idle poses.
    return Math.floor(clock / 160) % 2 === 0 ? F.walk : F.idle;
  }
  return F.idle;
}

/**
 * Draws Jeet from the blueprint atlas. Returns false when the artwork has not
 * finished downloading, so the caller can fall back to the existing
 * procedural renderer for that frame.
 */
export function drawJeetSprite(
  ctx: CanvasRenderingContext2D,
  e: JeetView,
  camX: number,
  form: JeetForm,
  prog: number,
  telegraphing: boolean,
  bossPhase = 1,
  showAura = true,
): boolean {
  const img = getAtlas();
  if (!img) return false;

  const sx = e.x - camX;
  const sy = e.y;
  const clock = Date.now();
  const f = frameFor(e, form, prog, telegraphing, clock);
  const base = (e.height * SIZE) / REF_H;

  ctx.save();

  // Ground shadow (world-anchored).
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 30, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  if (showAura && e.state !== "dead") {
    const cy = sy - e.height * 0.9;
    const auraColor = bossPhase >= 3 ? "255, 0, 0" : bossPhase >= 2 ? "255, 100, 0" : "200, 0, 255";
    const aura = ctx.createRadialGradient(sx, cy, 5, sx, cy, 55);
    aura.addColorStop(0, `rgba(${auraColor}, 0.25)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.beginPath();
    ctx.arc(sx, cy, 55, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Telegraph ring before his wild swings (read-only cue, unchanged timing).
  if (telegraphing && e.state !== "dead") {
    const pulse = 0.5 + 0.5 * Math.sin(clock / 45);
    ctx.beginPath();
    ctx.arc(sx, sy - e.height * 0.9, 58 + pulse * 12, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 210, 60, ${0.25 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Nervous shifting / impact weight — visual only.
  let sqx = 1, sqy = 1, bob = 0, lean = 0;
  if (!form && e.state !== "dead" && e.state !== "hit") {
    bob = Math.sin(clock / 210) * 1.8;
    sqy = 1 + Math.sin(clock / 210) * 0.015;
    lean = Math.sin(clock / 520) * 0.02;
  } else if (e.state === "hit") {
    lean = -e.facing * 0.2;
  } else if (form === "slam" || form === "spin" || form === "roundhouse") {
    if (prog > 0.5) { sqx = 1.05; sqy = 0.95; }
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
