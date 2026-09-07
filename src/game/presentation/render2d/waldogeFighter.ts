/**
 * waldogeFighter.ts — full-body 2D fighting-game rendering for the player.
 *
 * PURELY PRESENTATIONAL. This module reads an entity snapshot (position,
 * facing, state, stateTimer, hp) and draws it. It never mutates gameplay
 * state, never advances timers, and never decides damage, hit frames,
 * cooldowns, combos, knockback, stamina or AI. The existing combat code in
 * StreetBrawler.tsx remains the single source of truth for all of that.
 *
 * The visual states map 1:1 onto the combat states already produced by the
 * game loop:
 *   idle / walk (walk vs run chosen by |vx|) / jump / punch / kick /
 *   uppercut / spinkick / dashpunch / groundpound / hit / dead
 * The "style special" look is the per-style tinting + aura applied on top of
 * the groundpound / spinkick poses, driven by the active fight style.
 */

import type { StyleName } from "@/lib/fightStyles";


/** Minimal read-only view of the player the renderer needs. */
export interface FighterView {
  x: number;
  y: number;
  vx: number;
  vy: number;
  height: number;
  facing: 1 | -1;
  state: string;
  stateTimer: number;
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const INK = "#1a1114";
const TRACK_RED = "#d92b2b";
const TRACK_RED_DARK = "#a81f1f";
const TRACK_WHITE = "#f5ece0";
const GLOVE_RED = "#e33b3b";
const GLOVE_DARK = "#a82626";
const FUR = "#f2b33d";
const FUR_DARK = "#d99327";
const FUR_CREAM = "#fdf1dc";
const SHOE_WHITE = "#f7f2ea";

function styleTint(style: StyleName): string {
  return style === "rush" ? "#00ccff"
    : style === "muayThai" ? "#ff8800"
    : style === "greenCandle" ? "#00ff66"
    : "#FFD700";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

type P = [number, number];

interface Pose {
  /** Vertical body offset (crouch / airborne lift). */
  bob: number;
  /** Forward lean in radians (positive = lean towards facing). */
  lean: number;
  /** Whole-body rotation (spin kick, death fall). */
  spin: number;
  hip: P; chest: P; head: P;
  /** shoulder → elbow → glove */
  armFront: [P, P, P];
  armBack: [P, P, P];
  /** hip → knee → foot */
  legFront: [P, P, P];
  legBack: [P, P, P];
  /** extra squash on the torso */
  squash: number;
}

const HIP_Y = -31;
const CHEST_Y = -54;
const HEAD_Y = -76;

function basePose(): Pose {
  return {
    bob: 0,
    lean: 0,
    spin: 0,
    squash: 1,
    hip: [0, HIP_Y],
    chest: [0, CHEST_Y],
    head: [2, HEAD_Y],
    // Boxing guard: gloves up near the chin.
    armFront: [[4, CHEST_Y + 2], [13, CHEST_Y + 12], [17, CHEST_Y + 4]],
    armBack: [[-4, CHEST_Y + 2], [-13, CHEST_Y + 12], [-11, CHEST_Y + 3]],
    // Low, wide stance: feet apart, knees bent.
    legFront: [[3, HIP_Y], [14, HIP_Y + 20], [17, 0]],
    legBack: [[-3, HIP_Y], [-14, HIP_Y + 19], [-16, 0]],
  };
}

/** 0..1 progress through the current state (visual only). */
function anim(e: FighterView, frames: number): number {
  const t = 1 - Math.min(1, Math.max(0, e.stateTimer / frames));
  return t;
}

function poseFor(e: FighterView, style: StyleName, clock: number): Pose {
  const p = basePose();
  const moving = Math.abs(e.vx) > 0.2;
  const running = Math.abs(e.vx) > 3.4;
  // The combat state stays idle/walk while jumping, so read the airborne pose
  // off the actual vertical motion (vy is zeroed the moment Waldoge lands).
  const inAir = Math.abs(e.vy) > 0.4;
  const state = inAir && (e.state === "idle" || e.state === "walk") ? "jump" : e.state;

  switch (state) {

    case "walk": {
      const sp = running ? 8 : 5.5;
      const s = Math.sin(clock / (running ? 70 : 110)) * sp;
      const c = Math.cos(clock / (running ? 70 : 110));
      p.bob = -Math.abs(c) * (running ? 3 : 1.6);
      p.lean = running ? 0.18 : 0.07;
      p.legFront[1] = [8 + s, HIP_Y + 18];
      p.legFront[2] = [12 + s * 1.7, -Math.max(0, s) * (running ? 1.5 : 0.8)];
      p.legBack[1] = [-8 - s, HIP_Y + 18];
      p.legBack[2] = [-12 - s * 1.7, -Math.max(0, -s) * (running ? 1.5 : 0.8)];
      p.armFront[1] = [12, CHEST_Y + 10 - s * 0.5];
      p.armFront[2] = [16 + s * 0.5, CHEST_Y + 2 - s * 0.4];
      p.armBack[1] = [-12, CHEST_Y + 10 + s * 0.5];
      p.armBack[2] = [-12 - s * 0.5, CHEST_Y + 3 + s * 0.4];
      break;
    }
    case "jump": {
      p.lean = 0.12;
      p.legFront = [[3, HIP_Y], [14, HIP_Y + 12], [20, HIP_Y + 20]];
      p.legBack = [[-3, HIP_Y], [-10, HIP_Y + 16], [-6, HIP_Y + 26]];
      p.armFront[2] = [16, CHEST_Y - 12];
      p.armBack[2] = [-13, CHEST_Y - 10];
      break;
    }
    case "punch": {
      const t = anim(e, 10);
      const reach = Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5);
      p.lean = 0.16 + reach * 0.1;
      p.armFront[1] = [14 + reach * 12, CHEST_Y + 4];
      p.armFront[2] = [16 + reach * 26, CHEST_Y + 1];
      p.armBack[2] = [-8, CHEST_Y - 8];
      p.legFront[2] = [20 + reach * 4, 0];
      break;
    }
    case "kick": {
      const t = anim(e, 12);
      const ext = Math.sin(Math.min(1, t * 1.5) * Math.PI * 0.5);
      p.lean = -0.14;
      p.bob = 2;
      p.legFront = [
        [3, HIP_Y],
        [10 + ext * 12, HIP_Y + 6 - ext * 8],
        [14 + ext * 26, HIP_Y + 2 - ext * 16],
      ];
      p.legBack[1] = [-10, HIP_Y + 20];
      p.legBack[2] = [-12, 0];
      p.armFront[2] = [10, CHEST_Y - 8];
      p.armBack[2] = [-18, CHEST_Y + 4];
      break;
    }
    case "uppercut": {
      const t = anim(e, 18);
      const rise = Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.7);
      p.bob = -rise * 10;
      p.lean = 0.1;
      p.armFront[1] = [10, CHEST_Y + 2 - rise * 6];
      p.armFront[2] = [12 + rise * 6, CHEST_Y - 12 - rise * 26];
      p.armBack[2] = [-10, CHEST_Y - 2];
      p.legFront[2] = [14, -rise * 8];
      p.legBack[2] = [-14, -rise * 4];
      break;
    }
    case "spinkick": {
      const t = anim(e, 20);
      p.spin = t * Math.PI * 2 * (style === "rush" ? 2.2 : style === "greenCandle" ? 3 : 1.2);
      p.bob = -6;
      p.legFront = [[3, HIP_Y], [16, HIP_Y - 2], [34, HIP_Y - 8]];
      p.legBack = [[-3, HIP_Y], [-10, HIP_Y + 16], [-8, HIP_Y + 26]];
      p.armFront[2] = [10, CHEST_Y + 6];
      p.armBack[2] = [-14, CHEST_Y + 2];
      break;
    }
    case "dashpunch": {
      const t = anim(e, 14);
      p.lean = 0.42;
      p.bob = 3;
      p.armFront[1] = [22, CHEST_Y + 6];
      p.armFront[2] = [34 + t * 8, CHEST_Y + 4];
      p.armBack[1] = [-12, CHEST_Y + 12];
      p.armBack[2] = [-20, CHEST_Y + 14];
      p.legFront = [[3, HIP_Y], [16, HIP_Y + 16], [26, 0]];
      p.legBack = [[-3, HIP_Y], [-14, HIP_Y + 14], [-24, -2]];
      break;
    }
    case "groundpound": {
      const t = anim(e, 22);
      const slam = t > 0.45;
      p.bob = slam ? 4 : -14;
      p.squash = slam ? 0.9 : 1.05;
      p.armFront[2] = slam ? [18, CHEST_Y + 16] : [12, CHEST_Y - 30];
      p.armBack[2] = slam ? [-18, CHEST_Y + 16] : [-12, CHEST_Y - 30];
      p.legFront = slam
        ? [[3, HIP_Y], [18, HIP_Y + 16], [24, 0]]
        : [[3, HIP_Y], [12, HIP_Y + 8], [10, HIP_Y + 20]];
      p.legBack = slam
        ? [[-3, HIP_Y], [-18, HIP_Y + 16], [-24, 0]]
        : [[-3, HIP_Y], [-12, HIP_Y + 8], [-10, HIP_Y + 20]];
      break;
    }
    case "hit": {
      const shake = Math.sin(clock / 30) * 2;
      p.lean = -0.28;
      p.bob = 2;
      p.head = [-4 + shake, HEAD_Y + 3];
      p.armFront[2] = [6, CHEST_Y - 10];
      p.armBack[2] = [-16, CHEST_Y - 6];
      p.legFront[2] = [12, 0];
      p.legBack[2] = [-20, 0];
      break;
    }
    case "dead": {
      p.spin = Math.PI / 2.2;
      p.bob = 14;
      p.armFront[2] = [22, CHEST_Y + 14];
      p.armBack[2] = [-20, CHEST_Y + 12];
      p.legFront[2] = [22, -2];
      p.legBack[2] = [-18, -2];
      break;
    }
    default: {
      // idle — breathing bounce + light guard sway
      const b = Math.sin(clock / 320) * 1.6;
      p.bob = b;
      p.armFront[2] = [17, CHEST_Y + 4 + b];
      p.armBack[2] = [-11, CHEST_Y + 3 - b];
      if (moving) p.lean = 0.05;
      break;
    }
  }

  // Per-style stance flavour (silhouette differentiation, visual only).
  if (style === "rush") p.lean += 0.12;
  else if (style === "muayThai") { p.chest[1] -= 1; p.lean -= 0.04; }
  else if (style === "greenCandle") p.squash *= 1.06;

  return p;
}

// ---------------------------------------------------------------------------
// Drawing primitives — thick cartoon outline + flat shaded fill
// ---------------------------------------------------------------------------

function limb(ctx: CanvasRenderingContext2D, a: P, b: P, c: P, w: number, color: string) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]);
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 3;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

/**
 * Arm as drawn on the reference sheet: red tracksuit sleeve from the
 * shoulder to the elbow, tan Shiba fur forearm, big boxing glove.
 */
function armLimb(
  ctx: CanvasRenderingContext2D,
  a: P,
  b: P,
  c: P,
  w: number,
  sleeve: string,
  fur: string,
) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // fur forearm (elbow -> glove)
  limb(ctx, b, [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], c, w - 1, fur);
  // sleeve (shoulder -> elbow)
  limb(ctx, a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, w, sleeve);
  // white sleeve stripe
  ctx.beginPath();
  ctx.moveTo(a[0], a[1] + 1);
  ctx.lineTo(b[0], b[1] + 1);
  ctx.strokeStyle = TRACK_WHITE;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

function glove(ctx: CanvasRenderingContext2D, at: P, r = 7.5) {
  ctx.beginPath();
  ctx.ellipse(at[0], at[1], r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fillStyle = GLOVE_RED;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(at[0] - r * 0.3, at[1] - r * 0.35, r * 0.3, r * 0.24, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#ff8f8f";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(at[0] - r * 0.8, at[1] + r * 0.55);
  ctx.lineTo(at[0] + r * 0.8, at[1] + r * 0.55);
  ctx.strokeStyle = GLOVE_DARK;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function sneaker(ctx: CanvasRenderingContext2D, at: P, dir: number) {
  ctx.save();
  ctx.translate(at[0], at[1]);
  // chunky high-top silhouette
  ctx.beginPath();
  ctx.moveTo(-6 * dir, -8);
  ctx.quadraticCurveTo(11 * dir, -8, 13 * dir, -1);
  ctx.quadraticCurveTo(14 * dir, 4, 8 * dir, 4);
  ctx.lineTo(-6 * dir, 4);
  ctx.closePath();
  ctx.fillStyle = SHOE_WHITE;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // red laces
  ctx.strokeStyle = TRACK_RED;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo((-2 + i * 3.2) * dir, -6);
    ctx.lineTo((1 + i * 3.2) * dir, -2);
    ctx.stroke();
  }
  // toe cap + sole
  ctx.beginPath();
  ctx.moveTo(8 * dir, -4);
  ctx.quadraticCurveTo(13 * dir, -2, 11 * dir, 2);
  ctx.strokeStyle = TRACK_RED;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6 * dir, 4);
  ctx.lineTo(11 * dir, 4);
  ctx.strokeStyle = TRACK_RED_DARK;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
}

function torso(ctx: CanvasRenderingContext2D, hip: P, chest: P, squash: number) {
  const w = 17 * squash;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(chest[0] - w, chest[1] + 2);
  ctx.quadraticCurveTo(chest[0] - w * 1.1, hip[1] - 6, hip[0] - w * 0.75, hip[1] + 4);
  ctx.lineTo(hip[0] + w * 0.75, hip[1] + 4);
  ctx.quadraticCurveTo(chest[0] + w * 1.1, hip[1] - 6, chest[0] + w, chest[1] + 2);
  ctx.quadraticCurveTo(chest[0], chest[1] - 7, chest[0] - w, chest[1] + 2);
  ctx.closePath();
  ctx.fillStyle = TRACK_RED;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  // Tracksuit side stripes + zip line
  ctx.clip();
  ctx.strokeStyle = TRACK_WHITE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(chest[0] - w + 2, chest[1] + 2);
  ctx.lineTo(hip[0] - w * 0.75 + 2, hip[1] + 6);
  ctx.moveTo(chest[0] + w - 2, chest[1] + 2);
  ctx.lineTo(hip[0] + w * 0.75 - 2, hip[1] + 6);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(chest[0], chest[1] + 2);
  ctx.lineTo(hip[0], hip[1] + 4);
  ctx.stroke();
  ctx.restore();
}

/** Fallback Shiba head drawn when the head sprite has not loaded yet. */
function shibaHead(ctx: CanvasRenderingContext2D, at: P, r: number) {
  ctx.save();
  ctx.translate(at[0], at[1]);
  // ears
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * r * 0.55, -r * 0.6);
    ctx.lineTo(s * r * 0.95, -r * 1.35);
    ctx.lineTo(s * r * 1.05, -r * 0.35);
    ctx.closePath();
    ctx.fillStyle = FUR_DARK;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fillStyle = FUR;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // muzzle
  ctx.beginPath();
  ctx.ellipse(r * 0.4, r * 0.3, r * 0.5, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fillStyle = FUR_CREAM;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(r * 0.75, r * 0.2, r * 0.14, r * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  // pixel shades
  ctx.fillStyle = INK;
  ctx.fillRect(-r * 0.65, -r * 0.25, r * 1.45, r * 0.32);
  // striped beanie (red/white bands) + pom-pom, as in the reference sheet
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -r * 0.55, r * 0.98, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = TRACK_RED;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = TRACK_WHITE;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-r * 1.1, -r * 0.72 - i * r * 0.32, r * 2.2, r * 0.16);
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // brim
  ctx.fillStyle = TRACK_WHITE;
  ctx.fillRect(-r * 1.02, -r * 0.66, r * 2.04, r * 0.24);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-r * 1.02, -r * 0.66, r * 2.04, r * 0.24);
  // pom-pom
  ctx.beginPath();
  ctx.arc(-r * 0.15, -r * 1.68, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = TRACK_WHITE;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function drawWaldogeFighter(
  ctx: CanvasRenderingContext2D,
  e: FighterView,
  camX: number,
  headImg: HTMLImageElement | null,
  style: StyleName = "brawler",
) {
  const sx = e.x - camX;
  const sy = e.y;
  const clock = Date.now();
  const pose = poseFor(e, style, clock);
  const tint = styleTint(style);

  ctx.save();

  // Ground shadow (world-anchored, never trails the camera).
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 20, 5, 0, 0, Math.PI * 2);
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
    ctx.ellipse(sx, sy, 24, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.translate(sx, sy + pose.bob);
  // Head and body always face the same way: one mirror for the whole rig.
  ctx.scale(e.facing, 1);
  if (pose.spin) ctx.rotate(pose.spin);
  if (pose.lean) ctx.transform(1, 0, -pose.lean, 1, 0, 0);
  if (e.state === "hit") ctx.globalAlpha = 0.75;
  if (e.state === "dead") ctx.globalAlpha = 0.55;

  const { hip, chest, head } = pose;

  // --- back limbs -------------------------------------------------------
  limb(ctx, pose.legBack[0], pose.legBack[1], pose.legBack[2], 10, TRACK_RED_DARK);
  sneaker(ctx, pose.legBack[2], -1);
  armLimb(ctx, pose.armBack[0], pose.armBack[1], pose.armBack[2], 8, TRACK_RED_DARK, FUR_DARK);
  glove(ctx, pose.armBack[2], 8.5);

  // --- tail -------------------------------------------------------------
  const wag = Math.sin(clock / 220) * 6;
  limb(
    ctx,
    [hip[0] - 8, hip[1] + 2],
    [hip[0] - 22, hip[1] - 10 + wag],
    [hip[0] - 20, hip[1] - 24 + wag],
    8,
    FUR,
  );

  // --- torso ------------------------------------------------------------
  torso(ctx, hip, chest, pose.squash);

  // --- front limbs ------------------------------------------------------
  limb(ctx, pose.legFront[0], pose.legFront[1], pose.legFront[2], 11, TRACK_RED);
  sneaker(ctx, pose.legFront[2], 1);

  // --- head -------------------------------------------------------------
  if (headImg && headImg.complete && headImg.naturalWidth > 0) {
    const s = 48;
    ctx.drawImage(headImg, head[0] - s / 2, head[1] - s / 2, s, s);
  } else {
    shibaHead(ctx, head, 18);
  }

  // front arm draws over the head for punches so the strike reads clearly
  armLimb(ctx, pose.armFront[0], pose.armFront[1], pose.armFront[2], 8.5, TRACK_RED, FUR);
  glove(ctx, pose.armFront[2], 9.5);

  // Stun stars over the head while in the HIT state (reference sheet).
  if (e.state === "hit") {
    ctx.save();
    ctx.globalAlpha = 1;
    const spin = clock / 300;
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI * 2) / 3;
      const stx = head[0] + Math.cos(a) * 15;
      const sty = head[1] - 26 + Math.sin(a) * 5;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 === 0 ? 5 : 2.2;
        const ang = (k * Math.PI) / 5 - Math.PI / 2;
        const px = stx + Math.cos(ang) * rr;
        const py = sty + Math.sin(ang) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "#f5b731";
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }


  // Motion accents (visual only) -----------------------------------------
  if (e.state === "dashpunch" || (e.state === "punch" && style === "rush")) {
    ctx.strokeStyle = `${tint}88`;
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(pose.armFront[2][0] - i * 12, chest[1] + 2 + i);
      ctx.lineTo(pose.armFront[2][0] - i * 12 - 12, chest[1] + 2 + i);
      ctx.stroke();
    }
  }
  if (e.state === "spinkick") {
    ctx.strokeStyle = `${tint}66`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, hip[1], 36, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  ctx.restore();
}
