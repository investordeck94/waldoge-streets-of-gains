/**
 * Lucky Dip gameplay art — fixed frame strips cut from the four supplied sheets
 * (checkerboard removed only, feet-aligned uniform cells). Presentation only.
 */
import dogIdle from "@/assets/luckydip/dog-idle.png";
import dogRun from "@/assets/luckydip/dog-run.png";
import dogAttack from "@/assets/luckydip/dog-attack.png";
import dogVanish from "@/assets/luckydip/dog-vanish.png";
import blazeIdle from "@/assets/luckydip/blaze-idle.png";
import blazeHand from "@/assets/luckydip/blaze-hand.png";
import blazeVanish from "@/assets/luckydip/blaze-vanish.png";
import edible from "@/assets/luckydip/edible.png";
import gunIcon from "@/assets/luckydip/gun-icon.png";
import gunHold from "@/assets/luckydip/gun-hold.png";
import gauntletIcon from "@/assets/luckydip/gauntlet-icon.png";
import gauntletHold from "@/assets/luckydip/gauntlet-hold.png";
import type { ItemId } from "@/game/inventory/inventory";

const STRIPS = {
  dogIdle: { src: dogIdle, w: 80, h: 79, n: 4 },
  dogRun: { src: dogRun, w: 94, h: 76, n: 8 },
  dogAttack: { src: dogAttack, w: 121, h: 77, n: 2 },
  dogVanish: { src: dogVanish, w: 111, h: 50, n: 9 },
  blazeIdle: { src: blazeIdle, w: 53, h: 72, n: 3 },
  blazeHand: { src: blazeHand, w: 91, h: 70, n: 8 },
  blazeVanish: { src: blazeVanish, w: 99, h: 63, n: 6 },
  gunHold: { src: gunHold, w: 80, h: 43, n: 2 },
  gauntletHold: { src: gauntletHold, w: 72, h: 39, n: 2 },
} as const;
export type StripId = keyof typeof STRIPS;
export const stripFrames = (id: StripId) => STRIPS[id].n;

export const ITEM_ICONS: Record<ItemId, string> = {
  sidearm: gunIcon, gauntlets: gauntletIcon, dobermann: dogIdle, health: edible,
};
export const ITEM_ICON_CROP: Partial<Record<ItemId, number>> = { dobermann: 4 }; // strip → show first cell

const cache = new Map<string, HTMLImageElement>();
function img(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  let i = cache.get(src);
  if (!i) { i = new Image(); i.decoding = "async"; i.src = src; cache.set(src, i); }
  return i.complete && i.naturalWidth ? i : null;
}
export function preloadLuckyDipArt(): void { Object.values(STRIPS).forEach((s) => img(s.src)); }

/** Draw one fixed cell, feet at footY, centred at cx (screen coords). */
export function drawStrip(ctx: CanvasRenderingContext2D, id: StripId, frame: number, cx: number, footY: number, scale: number, flip = false, alpha = 1): void {
  const s = STRIPS[id]; const im = img(s.src); if (!im) return;
  const f = Math.max(0, Math.min(s.n - 1, Math.floor(frame)));
  const w = s.w * scale, h = s.h * scale;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
  ctx.drawImage(im, f * s.w, 0, s.w, s.h, Math.round(cx - w / 2), Math.round(footY - h), Math.round(w), Math.round(h));
  ctx.restore();
}

/** Doxx's Lucky Dip stall: sign + counter drawn as world props around the canonical Doxx frame. */
export function drawLuckyDipSign(ctx: CanvasRenderingContext2D, sx: number, floorY: number, frame: number, prompt: string | null): void {
  ctx.save();
  ctx.fillStyle = "#1a1024"; ctx.fillRect(sx - 46, floorY - 40, 92, 40);
  ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2; ctx.strokeRect(sx - 46, floorY - 40, 92, 40);
  const glow = 0.6 + 0.4 * Math.sin(frame * 0.1);
  ctx.globalAlpha = glow; ctx.fillStyle = "#ff2d55"; ctx.fillRect(sx - 52, floorY - 168, 104, 22);
  ctx.globalAlpha = 1; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
  ctx.fillText("DOXX LUCKY DIP", sx, floorY - 153);
  ctx.fillStyle = "#ffd23f"; ctx.fillText("300 COINS", sx, floorY - 16);
  if (prompt) {
    const w = ctx.measureText(prompt).width + 16; const y = floorY - 196 + Math.sin(frame * 0.12) * 3;
    ctx.fillStyle = "rgba(10,6,16,0.85)"; ctx.fillRect(sx - w / 2, y, w, 20);
    ctx.strokeStyle = "#ffd23f"; ctx.strokeRect(sx - w / 2, y, w, 20);
    ctx.fillStyle = "#fff"; ctx.fillText(prompt, sx, y + 14);
  }
  ctx.restore();
}
