/** Legendary candy-cane renderer (one clean frame of the supplied artwork). */
import candySrc from "@/assets/candy/candy.png";
import type { LegendarySpot } from "@/game/collectibles/legendary";

let img: HTMLImageElement | null = null;
function ensure(): HTMLImageElement {
  if (!img) { img = new Image(); img.src = candySrc; }
  return img;
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.25, y + r * 0.25); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.25, y + r * 0.25);
  ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.25, y - r * 0.25); ctx.closePath(); ctx.fill();
}

/** pop 0..1 = legendary pickup burst (rays + rising, growing cane). */
export function drawCandy(ctx: CanvasRenderingContext2D, c: LegendarySpot, camX: number, frame: number, pop = 0): void {
  const x = c.x - camX;
  const im = ensure();
  if (pop === 0) drawBeacon(ctx, x, c.y, frame);
  if (x < -100 || x > ctx.canvas.width + 100) return;
  if (!im.complete || !im.naturalWidth) return;
  const h = 84 * (1 + pop * 0.8);
  const w = h * im.naturalWidth / im.naturalHeight;
  const y = Math.max(h / 2 + 30, c.y + Math.sin(frame * 0.06) * 3 - pop * 20);
  ctx.save();
  // Pulsing gold aura.
  const pulse = 0.45 + Math.sin(frame * 0.1) * 0.15;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, h * 0.9);
  glow.addColorStop(0, `rgba(255,215,70,${pulse * (1 - pop * 0.5)})`);
  glow.addColorStop(1, "rgba(255,215,70,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - h, y - h, h * 2, h * 2);
  if (pop > 0) {
    ctx.globalAlpha = 1 - pop;
    ctx.strokeStyle = "#ffe066";
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + frame * 0.05;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20);
      ctx.lineTo(x + Math.cos(a) * (30 + pop * 90), y + Math.sin(a) * (30 + pop * 90));
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1 - pop;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
  // Glints orbiting the cane.
  ctx.fillStyle = "#fff6c8";
  for (let i = 0; i < 3; i++) {
    const t = frame * 0.05 + i * 2.1;
    const s = Math.max(0, Math.sin(frame * 0.15 + i * 1.7)) * 6 + 1;
    star(ctx, x + Math.cos(t) * w * 0.9, y + Math.sin(t * 1.3) * h * 0.45, s);
  }
  ctx.restore();
}

/** Golden light pillar + off-screen edge arrow so the cane is never missed. */
function drawBeacon(ctx: CanvasRenderingContext2D, x: number, cy: number, frame: number) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const pulse = 0.5 + Math.sin(frame * 0.12) * 0.25;
  ctx.save();
  if (x > -40 && x < W + 40) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(255,224,102,${0.35 * pulse})`);
    g.addColorStop(1, "rgba(255,224,102,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 18, Math.max(0, cy), 36, H);
  } else if (Math.abs(x - W / 2) < W * 2.5) {
    const right = x > W;
    const ax = right ? W - 22 : 22, ay = Math.max(70, Math.min(H - 40, cy + 60));
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.fillStyle = "#ffe066"; ctx.strokeStyle = "#7a1010"; ctx.lineWidth = 3;
    ctx.beginPath();
    const d = right ? 1 : -1;
    ctx.moveTo(ax + d * 14, ay); ctx.lineTo(ax - d * 8, ay - 13); ctx.lineTo(ax - d * 8, ay + 13); ctx.closePath();
    ctx.stroke(); ctx.fill();
  }
  ctx.restore();
}
