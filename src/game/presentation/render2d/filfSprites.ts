/**
 * FILF (Level 1 captured NPC) — drawn from the canonical reference sheet,
 * packed into one small atlas. Presentation only; FILF has no combat data.
 */
import filfAtlasAsset from "@/assets/filf-atlas.png.asset.json";
import { drawSource, isResident, residentImage } from "./imageResidency";
import { FILF_CAGE_X, FILF_OPEN_FRAMES, type FilfState } from "@/game/story/filfRescue";

export const FILF_ATLAS_URL = filfAtlasAsset.url;
export const FILF_ATLAS_SIZE = { w: 1024, h: 431 } as const;

export const FILF_FRAMES = {
  idle: { x: 0, y: 0, w: 99, h: 197 },
  cage: { x: 101, y: 0, w: 110, h: 161 },
  cageSad: { x: 213, y: 0, w: 103, h: 161 },
  cageCall: { x: 318, y: 0, w: 110, h: 161 },
  surprise: { x: 430, y: 0, w: 107, h: 150 },
  thank: { x: 539, y: 0, w: 105, h: 150 },
  wave: { x: 646, y: 0, w: 101, h: 150 },
  portraitNormal: { x: 749, y: 0, w: 218, h: 180 },
  portraitWorried: { x: 0, y: 199, w: 213, h: 180 },
  portraitHappy: { x: 215, y: 199, w: 218, h: 194 },
  portraitThankful: { x: 435, y: 199, w: 213, h: 194 },
  cageEmpty: { x: 650, y: 199, w: 304, h: 232 },
} as const;
type FrameId = keyof typeof FILF_FRAMES;

let atlas: HTMLImageElement | null = null;
function getAtlas(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    residentImage(atlas, FILF_ATLAS_URL, [0]); // Level 1 only
  }
  return atlas;
}
if (typeof window !== "undefined") getAtlas();

const CAGE_H = 132;

function blit(ctx: CanvasRenderingContext2D, id: FrameId, cx: number, footY: number, height: number) {
  const img = getAtlas();
  if (!img || !img.complete || !img.naturalWidth || !isResident(img)) return false;
  const f = FILF_FRAMES[id];
  const s = height / f.h;
  ctx.drawImage(drawSource(img), f.x, f.y, f.w, f.h, Math.round(cx - (f.w * s) / 2), Math.round(footY - f.h * s), Math.round(f.w * s), Math.round(height));
  return true;
}

export function drawFilf(
  ctx: CanvasRenderingContext2D,
  s: FilfState,
  camX: number,
  floorY: number,
  playerX: number,
  frame: number,
  promptVisible: boolean,
) {
  const sx = FILF_CAGE_X - camX;
  if (sx < -200 || sx > ctx.canvas.width + 200) return;
  const near = Math.abs(playerX - FILF_CAGE_X) < 420;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(sx, floorY + 2, 56, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (s.phase === "caged") {
    const id: FrameId = near ? "cageCall" : (Math.floor(frame / 90) % 2 ? "cageSad" : "cage");
    if (!blit(ctx, id, sx, floorY, CAGE_H)) fallbackCage(ctx, sx, floorY);
  } else if (s.phase === "opening") {
    const t = s.timer / FILF_OPEN_FRAMES;
    if (t < 0.45) {
      const j = Math.sin(s.timer * 1.7) * 3;
      blit(ctx, "cageCall", sx + j, floorY, CAGE_H);
    } else {
      blit(ctx, "cageEmpty", sx - 18, floorY + 4, CAGE_H * 0.95);
      const step = Math.min(1, (t - 0.45) / 0.4);
      blit(ctx, "surprise", sx + 24 + step * 58, floorY, 116);
    }
    // Sparkles while the lock gives way
    ctx.save();
    ctx.fillStyle = "#ffd23f";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + s.timer * 0.15;
      const r = 24 + (s.timer % 20);
      ctx.globalAlpha = 1 - (s.timer % 20) / 20;
      ctx.fillRect(sx + 40 + Math.cos(a) * r, floorY - 55 + Math.sin(a) * r, 3, 3);
    }
    ctx.restore();
  } else {
    blit(ctx, "cageEmpty", sx - 18, floorY + 4, CAGE_H * 0.95);
    const id: FrameId = s.timer < 200 ? "thank" : near ? "wave" : "idle";
    blit(ctx, id, sx + 84, floorY, id === "idle" ? 124 : 116);
  }

  if (promptVisible) {
    const bob = Math.sin(frame * 0.12) * 3;
    ctx.save();
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    const label = "▼ RESCUE FILF [E]";
    const w = ctx.measureText(label).width + 16;
    ctx.fillStyle = "rgba(10,6,16,0.85)";
    ctx.fillRect(sx - w / 2, floorY - CAGE_H - 34 + bob, w, 22);
    ctx.strokeStyle = "#ff2d55";
    ctx.strokeRect(sx - w / 2, floorY - CAGE_H - 34 + bob, w, 22);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, sx, floorY - CAGE_H - 18 + bob);
    ctx.restore();
  }
}

function fallbackCage(ctx: CanvasRenderingContext2D, sx: number, floorY: number) {
  ctx.save();
  ctx.strokeStyle = "#3a3f4a";
  ctx.lineWidth = 4;
  ctx.strokeRect(sx - 34, floorY - CAGE_H, 68, CAGE_H);
  for (let x = -24; x <= 24; x += 12) {
    ctx.beginPath(); ctx.moveTo(sx + x, floorY - CAGE_H); ctx.lineTo(sx + x, floorY); ctx.stroke();
  }
  ctx.restore();
}
