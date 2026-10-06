/** Magnifying-glass collectible renderer (supplied artwork, presentation only). */
import f0 from "@/assets/glass/frame0.png";
import f1 from "@/assets/glass/frame1.png";
import f2 from "@/assets/glass/frame2.png";
import f3 from "@/assets/glass/frame3.png";
import f4 from "@/assets/glass/frame4.png";
import f5 from "@/assets/glass/frame5.png";
import type { GlassSpot } from "@/game/collectibles/glasses";

const SRC = [f0, f1, f2, f3, f4, f5];
let frames: HTMLImageElement[] | null = null;

function ensure(): HTMLImageElement[] {
  if (!frames) frames = SRC.map((s) => { const i = new Image(); i.src = s; return i; });
  return frames;
}

/** Spin plays briefly every ~3s; otherwise the front-facing frame with a soft bob. */
export function drawGlass(ctx: CanvasRenderingContext2D, g: GlassSpot, camX: number, frame: number, pop = 0): void {
  const x = g.x - camX;
  if (x < -60 || x > ctx.canvas.width + 60) return;
  const imgs = ensure();
  const cycle = frame % 180;
  const idx = pop > 0 ? Math.floor(frame / 3) % 6 : cycle < 36 ? Math.floor(cycle / 6) % 6 : 0;
  const img = imgs[idx];
  if (!img.complete || !img.naturalWidth) return;
  const h = 48 * (1 + pop * 0.6);
  const w = h * img.naturalWidth / img.naturalHeight;
  const y = g.y + Math.sin(frame * 0.07 + g.x) * 3 - pop * 30;
  ctx.save();
  ctx.globalAlpha = 1 - pop;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, h * 0.7);
  glow.addColorStop(0, "rgba(255,220,90,0.35)");
  glow.addColorStop(1, "rgba(255,220,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - h, y - h, h * 2, h * 2);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}
