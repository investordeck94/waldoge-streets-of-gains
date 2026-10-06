/** Level 5 Monko quest presentation. Monko remains outside combat state. */
import idleSrc from "@/assets/monko/idle.png";
import cagedSrc from "@/assets/monko/caged.png";
import cageSrc from "@/assets/monko/cage-empty.png";
import happySrc from "@/assets/monko/rescue-happy.png";
import bananasSrc from "@/assets/monko/banana-stash.png";
import { residentImage } from "./imageResidency";
import { MONKO_BANANA_X, MONKO_CAGE_X, MONKO_OPEN_FRAMES, type MonkoRescueState } from "@/game/story/monkoRescue";

const sources = { idle: idleSrc, caged: cagedSrc, cage: cageSrc, happy: happySrc, bananas: bananasSrc } as const;
type ArtId = keyof typeof sources;
const images: Partial<Record<ArtId, HTMLImageElement>> = {};

function image(id: ArtId): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!images[id]) {
    const next = new Image();
    residentImage(next, sources[id], [4]);
    images[id] = next;
  }
  const current = images[id];
  return current?.complete && current.naturalWidth > 0 ? current : null;
}

function drawAt(ctx: CanvasRenderingContext2D, id: ArtId, cx: number, footY: number, height: number, alpha = 1): boolean {
  const art = image(id);
  if (!art) return false;
  const width = height * art.naturalWidth / art.naturalHeight;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, Math.round(cx - width / 2), Math.round(footY - height), Math.round(width), Math.round(height));
  ctx.restore();
  return true;
}

function prompt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, frame: number): void {
  const bob = Math.sin(frame * 0.12) * 3;
  ctx.save(); ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  const width = ctx.measureText(text).width + 16;
  ctx.fillStyle = "rgba(7,15,12,.9)"; ctx.fillRect(x - width / 2, y + bob, width, 22);
  ctx.strokeStyle = "#e6d34b"; ctx.strokeRect(x - width / 2, y + bob, width, 22);
  ctx.fillStyle = "#fff"; ctx.fillText(text, x, y + 16 + bob); ctx.restore();
}

export function drawMonkoQuest(
  ctx: CanvasRenderingContext2D,
  state: MonkoRescueState,
  camX: number,
  bananaFloorY: number,
  cageFloorY: number,
  frame: number,
  promptVisible: boolean,
): void {
  const bananaX = MONKO_BANANA_X - camX;
  if (!state.bananasRecovered && bananaX > -220 && bananaX < ctx.canvas.width + 220) {
    const bob = Math.sin(frame * 0.08) * 2;
    drawAt(ctx, "bananas", bananaX, bananaFloorY + bob, 118);
    prompt(ctx, "▼ MONKO'S STOLEN BANANAS", bananaX, bananaFloorY - 150, frame);
  }

  const x = MONKO_CAGE_X - camX;
  if (x < -260 || x > ctx.canvas.width + 260) return;
  ctx.save(); ctx.globalAlpha = 0.38; ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(x, cageFloorY + 2, 58, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  if (state.phase === "caged") {
    drawAt(ctx, "caged", x, cageFloorY, 154);
  } else if (state.phase === "opening") {
    const t = state.timer / MONKO_OPEN_FRAMES;
    if (t < 0.45) drawAt(ctx, "caged", x + Math.sin(state.timer * 1.7) * 3, cageFloorY, 154);
    else {
      const release = Math.min(1, (t - 0.45) / 0.4);
      drawAt(ctx, "cage", x, cageFloorY, 158, 1 - release);
      drawAt(ctx, "happy", x, cageFloorY, 138, release);
    }
  } else {
    drawAt(ctx, frame % 120 < 60 ? "happy" : "idle", x, cageFloorY, 138);
  }

  if (promptVisible) {
    prompt(ctx, state.bananasRecovered ? "▼ RESCUE MONKO [E]" : "▼ LOCKED — RECOVER MONKO'S BANANAS", x, cageFloorY - 186, frame);
  }
}
