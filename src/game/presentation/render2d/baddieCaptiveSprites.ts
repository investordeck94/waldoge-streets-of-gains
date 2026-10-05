/** Level 4 Baddie captive presentation. Baddie remains outside combat state. */
import atlasAsset from "@/assets/baddie-captive-atlas.png.asset.json";
import { drawSource, isResident, residentImage } from "./imageResidency";
import { BADDIE_CAGE_X, BADDIE_OPEN_FRAMES, type BaddieState } from "@/game/story/level4Baddie";

const ATLAS = {
  caged: { x: 0, y: 0, w: 115, h: 145 },
  empty: { x: 120, y: 0, w: 258, h: 258 },
  thankful: { x: 400, y: 0, w: 114, h: 256 },
} as const;

let atlas: HTMLImageElement | null = null;
function getAtlas(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!atlas) {
    atlas = new Image();
    residentImage(atlas, atlasAsset.url, [3]);
  }
  return atlas.complete && atlas.naturalWidth > 0 && isResident(atlas) ? atlas : null;
}
if (typeof window !== "undefined") getAtlas();

function blit(ctx: CanvasRenderingContext2D, id: keyof typeof ATLAS, cx: number, footY: number, height: number, alpha = 1): boolean {
  const image = getAtlas();
  if (!image) return false;
  const frame = ATLAS[id];
  const scale = height / frame.h;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(drawSource(image), frame.x, frame.y, frame.w, frame.h, Math.round(cx - frame.w * scale / 2), Math.round(footY - height), Math.round(frame.w * scale), Math.round(height));
  ctx.restore();
  return true;
}

function fallbackCage(ctx: CanvasRenderingContext2D, x: number, floorY: number): void {
  ctx.save();
  ctx.strokeStyle = "#3a3f4a"; ctx.lineWidth = 4;
  ctx.strokeRect(x - 38, floorY - 145, 76, 145);
  for (let dx = -27; dx <= 27; dx += 13.5) {
    ctx.beginPath(); ctx.moveTo(x + dx, floorY - 145); ctx.lineTo(x + dx, floorY); ctx.stroke();
  }
  ctx.restore();
}

export function drawBaddieCaptive(
  ctx: CanvasRenderingContext2D,
  state: BaddieState,
  camX: number,
  floorY: number,
  frame: number,
  promptVisible: boolean,
): void {
  const x = BADDIE_CAGE_X - camX;
  if (x < -260 || x > ctx.canvas.width + 260) return;
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(x, floorY + 2, 58, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  if (state.phase === "caged") {
    if (!blit(ctx, "caged", x, floorY, 145)) fallbackCage(ctx, x, floorY);
  } else if (state.phase === "opening") {
    const t = state.timer / BADDIE_OPEN_FRAMES;
    if (t < 0.45) blit(ctx, "caged", x + Math.sin(state.timer * 1.7) * 3, floorY, 145);
    else {
      blit(ctx, "empty", x - 15, floorY + 2, 145);
      const release = Math.min(1, (t - 0.45) / 0.4);
      blit(ctx, "thankful", x + 25 + release * 64, floorY, 132, release);
    }
  } else {
    blit(ctx, "empty", x - 15, floorY + 2, 145);
    blit(ctx, "thankful", x + 92, floorY, 132);
  }

  if (!promptVisible) return;
  const label = state.keyCollected ? "▼ RESCUE BADDIE [E]" : "▼ LOCKED — FIND BADDIE'S KEY";
  const bob = Math.sin(frame * 0.12) * 3;
  ctx.save(); ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  const width = ctx.measureText(label).width + 16;
  ctx.fillStyle = "rgba(10,6,16,0.85)"; ctx.fillRect(x - width / 2, floorY - 180 + bob, width, 22);
  ctx.strokeStyle = "#ff2d55"; ctx.strokeRect(x - width / 2, floorY - 180 + bob, width, 22);
  ctx.fillStyle = "#fff"; ctx.fillText(label, x, floorY - 164 + bob); ctx.restore();
}