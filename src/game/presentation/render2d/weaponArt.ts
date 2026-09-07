/**
 * weaponArt.ts — the single source of truth for how the bat, sword and
 * shuriken LOOK in Waldoge: Streets of Gains.
 *
 * PURELY PRESENTATIONAL. Nothing here reads or writes gameplay state: no
 * damage, no ranges, no cooldowns, no ammo. Every function draws in a local
 * coordinate space whose ORIGIN IS THE GRIP POINT (the spot Waldoge's hand
 * closes around) with the blade/barrel pointing along -Y (i.e. "up out of the
 * fist"). Callers translate to the hand anchor and rotate; mirroring is done
 * by the caller's ctx.scale(facing, 1), so the art never needs to know which
 * way the character faces.
 *
 * These replace the old stickman-era inline `ctx.fillRect` weapon shapes that
 * used to live in three separate places (StreetBrawler.drawStickFigure,
 * waldogeFighter.weaponInHand and the pickup/projectile draw loops).
 *
 * Art direction matches the approved Waldoge blueprint: bold cartoon
 * silhouettes, thick dark ink outline, flat fills with one highlight band and
 * one shadow band, slightly exaggerated fighting-game proportions.
 */

import type { WeaponType } from "@/game/config/weapons";

export type WeaponArtType = WeaponType;

/** Blueprint ink colour — identical to the character outline. */
const INK = "#2a1a12";

function outline(ctx: CanvasRenderingContext2D, w = 3) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function roundedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// BAT — chunky taped-grip slugger. Grip at origin, barrel up.
// ---------------------------------------------------------------------------

function drawBat(ctx: CanvasRenderingContext2D) {
  // Knob
  roundedBar(ctx, -6, 2, 12, 8, 3.5);
  ctx.fillStyle = "#e8d7bd";
  ctx.fill();
  outline(ctx, 2.6);

  // Handle (red grip tape, blueprint tracksuit red)
  roundedBar(ctx, -4.5, -22, 9, 26, 4);
  ctx.fillStyle = "#d92b2b";
  ctx.fill();
  outline(ctx, 2.6);
  ctx.strokeStyle = "#f5ece0";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-4.5, -6 - i * 5);
    ctx.lineTo(4.5, -10 - i * 5);
    ctx.stroke();
  }

  // Barrel — tapered wood club
  ctx.beginPath();
  ctx.moveTo(-4.5, -20);
  ctx.quadraticCurveTo(-11, -38, -10, -54);
  ctx.quadraticCurveTo(-9.5, -66, 0, -68);
  ctx.quadraticCurveTo(9.5, -66, 10, -54);
  ctx.quadraticCurveTo(11, -38, 4.5, -20);
  ctx.closePath();
  ctx.fillStyle = "#c98a3f";
  ctx.fill();
  outline(ctx, 3);

  // Highlight band + grain shadow
  ctx.beginPath();
  ctx.moveTo(-4.5, -26);
  ctx.quadraticCurveTo(-8, -44, -6.5, -60);
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = "#e8b672";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5.5, -28);
  ctx.quadraticCurveTo(8.5, -44, 7, -58);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = "#9c6425";
  ctx.stroke();

  // Rivet studs (arcade flavour)
  ctx.fillStyle = "#f5ece0";
  for (const sy of [-58, -48]) {
    ctx.beginPath();
    ctx.arc(0, sy, 2.1, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, 1.4);
  }
}

// ---------------------------------------------------------------------------
// SWORD — cyan-steel arcade katana. Grip at origin, blade up.
// ---------------------------------------------------------------------------

function drawSword(ctx: CanvasRenderingContext2D) {
  // Pommel
  ctx.beginPath();
  ctx.arc(0, 8, 4.6, 0, Math.PI * 2);
  ctx.fillStyle = "#c9922b";
  ctx.fill();
  outline(ctx, 2.4);

  // Wrapped handle
  roundedBar(ctx, -4.2, -12, 8.4, 20, 3);
  ctx.fillStyle = "#3a2b23";
  ctx.fill();
  outline(ctx, 2.4);
  ctx.strokeStyle = "#8a6a4f";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-4.2, 2 - i * 6);
    ctx.lineTo(4.2, -1 - i * 6);
    ctx.stroke();
  }

  // Guard
  roundedBar(ctx, -14, -18, 28, 8, 3.5);
  ctx.fillStyle = "#f0b93c";
  ctx.fill();
  outline(ctx, 2.8);

  // Blade
  ctx.beginPath();
  ctx.moveTo(-6.5, -18);
  ctx.lineTo(-5.5, -58);
  ctx.quadraticCurveTo(-4.5, -72, 0, -80);
  ctx.quadraticCurveTo(4.5, -72, 5.5, -58);
  ctx.lineTo(6.5, -18);
  ctx.closePath();
  ctx.fillStyle = "#dff3ff";
  ctx.fill();
  outline(ctx, 3);

  // Fuller + cyan energy edge
  ctx.beginPath();
  ctx.moveTo(-2, -22);
  ctx.lineTo(-1.4, -66);
  ctx.strokeStyle = "#9fd7f2";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5.2, -22);
  ctx.lineTo(4.4, -60);
  ctx.strokeStyle = "#00ccff";
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// SHURIKEN — four-point violet star. Centre at origin.
// ---------------------------------------------------------------------------

function drawShuriken(ctx: CanvasRenderingContext2D, r = 13) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const tip = [cos * r, sin * r];
    const l = [Math.cos(a - 0.85) * r * 0.42, Math.sin(a - 0.85) * r * 0.42];
    const n = [Math.cos(a + 0.85) * r * 0.42, Math.sin(a + 0.85) * r * 0.42];
    if (i === 0) ctx.moveTo(l[0], l[1]);
    else ctx.lineTo(l[0], l[1]);
    ctx.lineTo(tip[0], tip[1]);
    ctx.lineTo(n[0], n[1]);
  }
  ctx.closePath();
  ctx.fillStyle = "#b455ff";
  ctx.fill();
  outline(ctx, 2.6);

  // Highlight wedge
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.18, -r * 0.9);
  ctx.lineTo(r * 0.18, -r * 0.62);
  ctx.closePath();
  ctx.fillStyle = "#e2b7ff";
  ctx.fill();

  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = "#f5ece0";
  ctx.fill();
  outline(ctx, 2);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Draw a weapon in local space with the grip at (0,0).
 * `scale` keeps the art proportional to whatever character scale is active.
 */
export function drawWeaponArt(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponArtType,
  scale = 1,
) {
  ctx.save();
  ctx.scale(scale, scale);
  if (weapon === "bat") drawBat(ctx);
  else if (weapon === "sword") drawSword(ctx);
  else drawShuriken(ctx);
  ctx.restore();
}

/** Free-flying shuriken projectile (spins on its own centre). */
export function drawShurikenProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  clock: number = Date.now(),
) {
  ctx.save();
  ctx.translate(x, y);
  // Motion trail behind the travel direction.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#cc44ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-dir * 10, 0);
  ctx.lineTo(-dir * 26, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.rotate((dir >= 0 ? 1 : -1) * clock * 0.028);
  drawShuriken(ctx, 11);
  ctx.restore();
}

/** Ground pickup rendering (idle bob/rotation handled by the caller). */
export function drawWeaponPickupArt(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponArtType,
  x: number,
  y: number,
  clock: number = Date.now(),
) {
  ctx.save();
  ctx.translate(x, y);
  if (weapon === "shuriken") {
    ctx.rotate(clock / 320);
    drawShuriken(ctx, 13);
  } else {
    ctx.rotate(-Math.PI / 4);
    ctx.translate(0, 24);
    drawWeaponArt(ctx, weapon, 0.72);
  }
  ctx.restore();
}
