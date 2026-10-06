/**
 * DOXX (Level 2 captured NPC) + DOXX'S BLUEPRINTS — drawn from the supplied
 * canonical sheet / blueprint art, packed into one small atlas (white
 * removed from the blueprint only). Presentation only; no combat data.
 */
import doxxAtlasUrl from "@/assets/doxx-atlas.png";
import { drawSource, isResident, residentImage } from "./imageResidency";
import { DOXX_CAGE_X, DOXX_OPEN_FRAMES, type DoxxState } from "@/game/story/doxxRescue";

export const DOXX_ATLAS_URL = doxxAtlasUrl;
export const DOXX_ATLAS_SIZE = { w: 1024, h: 460 } as const;
export const DOXX_FRAMES = {
  tied: { x: 0, y: 0, w: 156, h: 150 },
  tiedPhone: { x: 158, y: 0, w: 154, h: 150 },
  tiedPhone2: { x: 314, y: 0, w: 174, h: 150 },
  bustCall: { x: 490, y: 0, w: 136, h: 105 },
  bustUrgent: { x: 628, y: 0, w: 152, h: 105 },
  stand: { x: 782, y: 0, w: 118, h: 229 },
  phoneCall: { x: 0, y: 231, w: 129, h: 229 },
  freedSit: { x: 131, y: 243, w: 136, h: 141 },
  phone: { x: 269, y: 231, w: 60, h: 99 },
  blueprint: { x: 331, y: 231, w: 240, h: 182 },
} as const;
type FrameId = keyof typeof DOXX_FRAMES;

let atlas: HTMLImageElement | null = null;
function getAtlas(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    residentImage(atlas, DOXX_ATLAS_URL, [1, 2, 3, 4, 5, 6]); // Level 2 rescue + Lucky Dip stalls (L3–7)
  }
  return atlas;
}

function blit(ctx: CanvasRenderingContext2D, id: FrameId, cx: number, footY: number, height: number, flip = false) {
  const img = getAtlas();
  if (!img || !img.complete || !img.naturalWidth || !isResident(img)) return false;
  const f = DOXX_FRAMES[id];
  const s = height / f.h;
  const w = f.w * s;
  ctx.save();
  if (flip) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
  ctx.drawImage(drawSource(img), f.x, f.y, f.w, f.h, Math.round(cx - w / 2), Math.round(footY - height), Math.round(w), Math.round(height));
  ctx.restore();
  return true;
}

export function drawDoxxBlueprints(ctx: CanvasRenderingContext2D, worldX: number, floorY: number, camX: number, frame: number) {
  const x = Math.round(worldX - camX);
  if (x < -80 || x > ctx.canvas.width + 80) return;
  const bob = Math.sin(frame * 0.08) * 4;
  const foot = floorY - 14 + bob;
  ctx.save();
  const g = ctx.createRadialGradient(x, foot - 18, 2, x, foot - 18, 46);
  g.addColorStop(0, "rgba(120,180,255,0.55)");
  g.addColorStop(1, "rgba(120,180,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - 48, foot - 66, 96, 96);
  ctx.globalAlpha = 0.35; ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(x, floorY - 2, 22 - bob, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (!blit(ctx, "blueprint", x, foot, 36)) {
    ctx.fillStyle = "#6f9ccf"; ctx.fillRect(x - 24, foot - 36, 48, 36);
  }
  if (frame % 40 < 20) { ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 20, foot - 46, 2, 6); ctx.fillRect(x + 18, foot - 44, 6, 2); }
  ctx.save();
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#9cc8ff";
  ctx.fillText("DOXX'S BLUEPRINTS", x, foot - 46);
  ctx.restore();
}

const CAGE_H = 128;
const CAGE_W = 104;

function cageBars(ctx: CanvasRenderingContext2D, sx: number, floorY: number, doorSwing: number) {
  ctx.save();
  ctx.strokeStyle = "#2b2f38"; ctx.lineWidth = 6;
  ctx.strokeRect(sx - CAGE_W / 2, floorY - CAGE_H, CAGE_W, CAGE_H);
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 3;
  const left = sx - CAGE_W / 2;
  for (let x = left + 13; x < sx + CAGE_W / 2 - 4; x += 13) {
    if (doorSwing > 0 && x > sx - 6) continue; // door bars swung away
    ctx.beginPath(); ctx.moveTo(x, floorY - CAGE_H); ctx.lineTo(x, floorY); ctx.stroke();
  }
  ctx.fillStyle = "#3a3f4a";
  ctx.fillRect(left - 4, floorY - CAGE_H - 8, CAGE_W + 8, 10);
  ctx.fillRect(left - 4, floorY - 4, CAGE_W + 8, 6);
  if (doorSwing > 0) {
    // open door as a parallelogram swung outward to the right
    const dx = sx + CAGE_W / 2; const w = (CAGE_W / 2) * (1 - doorSwing * 0.7);
    ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const x = dx + (w * i) / 4;
      ctx.beginPath(); ctx.moveTo(x, floorY - CAGE_H + 6 - i * 3 * doorSwing); ctx.lineTo(x, floorY - 2 + i * 2 * doorSwing); ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#d4a017"; ctx.fillRect(sx + 6, floorY - 66, 12, 14);
    ctx.fillStyle = "#3a2a00"; ctx.fillRect(sx + 11, floorY - 61, 2, 5);
  }
  ctx.restore();
}

export function drawDoxx(
  ctx: CanvasRenderingContext2D, s: DoxxState, camX: number, floorY: number,
  playerX: number, frame: number, promptVisible: boolean, hasBlueprints: boolean,
) {
  const sx = DOXX_CAGE_X - camX;
  if (sx < -220 || sx > ctx.canvas.width + 220) return;
  const near = Math.abs(playerX - DOXX_CAGE_X) < 420;
  ctx.save();
  ctx.globalAlpha = 0.35; ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(sx, floorY + 2, 62, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (s.phase === "caged") {
    const id: FrameId = near ? "tiedPhone2" : (Math.floor(frame / 120) % 2 ? "tiedPhone" : "tied");
    blit(ctx, id, sx, floorY, 92);
    cageBars(ctx, sx, floorY, 0);
  } else if (s.phase === "opening") {
    const t = s.timer / DOXX_OPEN_FRAMES;
    const j = t < 0.4 ? Math.sin(s.timer * 1.7) * 3 : 0;
    blit(ctx, t < 0.5 ? "tied" : "freedSit", sx + j, floorY, t < 0.5 ? 92 : 86);
    cageBars(ctx, sx + j, floorY, Math.min(1, Math.max(0, (t - 0.3) / 0.5)));
    ctx.save(); ctx.fillStyle = "#9cc8ff";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + s.timer * 0.15; const r = 24 + (s.timer % 20);
      ctx.globalAlpha = 1 - (s.timer % 20) / 20;
      ctx.fillRect(sx + 20 + Math.cos(a) * r, floorY - 60 + Math.sin(a) * r, 3, 3);
    }
    ctx.restore();
  } else {
    cageBars(ctx, sx, floorY, 1);
    blit(ctx, s.timer < 200 ? "freedSit" : "stand", sx + 104, floorY, s.timer < 200 ? 86 : 124, playerX < DOXX_CAGE_X + 104);
  }

  if (promptVisible) {
    const bob = Math.sin(frame * 0.12) * 3;
    ctx.save();
    ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
    const label = hasBlueprints ? "▼ RESCUE DOXX [E]" : "▼ LOCKED — FIND THE BLUEPRINTS";
    const w = ctx.measureText(label).width + 16;
    const y = floorY - CAGE_H - 40 + bob;
    ctx.fillStyle = "rgba(10,6,16,0.85)"; ctx.fillRect(sx - w / 2, y, w, 22);
    ctx.strokeStyle = hasBlueprints ? "#9cc8ff" : "#ff2d55"; ctx.strokeRect(sx - w / 2, y, w, 22);
    ctx.fillStyle = "#fff"; ctx.fillText(label, sx, y + 16);
    ctx.restore();
  }
}

/** Doxx standing at his Lucky Dip stall (canonical "stand" frame). */
export function drawDoxxStand(ctx: CanvasRenderingContext2D, sx: number, footY: number, flip: boolean): void {
  blit(ctx, "stand", sx, footY, 112, flip);
}
