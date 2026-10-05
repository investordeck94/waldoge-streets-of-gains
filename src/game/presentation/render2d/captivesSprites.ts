/**
 * Level 3 captives drawing (presentation only). SUS Dog uses the supplied
 * captive sheet (checker removed only) + the canonical SUS Dog cut-out once
 * freed. FILF reuses her Level 1 atlas via drawFilf at her own cage.
 */
import susCagedStand from "@/assets/story/cutouts/sus-caged-stand.webp";
import susCagedSit from "@/assets/story/cutouts/sus-caged-sit.webp";
import susFree from "@/assets/story/cutouts/sus-dog.webp";
import { drawSource, isResident, residentImage } from "./imageResidency";
import { drawFilf } from "./filfSprites";
import { drawFilfKey } from "./filfKey";
import { CAPTIVES, CAPTIVE_OPEN_FRAMES, type CaptivesState } from "@/game/story/level3Captives";

const imgs: Record<string, HTMLImageElement> = {};
function img(url: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!imgs[url]) { imgs[url] = new Image(); residentImage(imgs[url], url, [2]); }
  const i = imgs[url];
  return i.complete && i.naturalWidth && isResident(i) ? i : null;
}
if (typeof window !== "undefined") { img(susCagedStand); img(susCagedSit); img(susFree); }

function blitH(ctx: CanvasRenderingContext2D, url: string, cx: number, footY: number, h: number, alpha = 1) {
  const i = img(url);
  if (!i) return;
  const w = (i.naturalWidth / i.naturalHeight) * h;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.drawImage(drawSource(i), Math.round(cx - w / 2), Math.round(footY - h), Math.round(w), Math.round(h));
  ctx.restore();
}

function prompt(ctx: CanvasRenderingContext2D, sx: number, y: number, label: string, frame: number) {
  const bob = Math.sin(frame * 0.12) * 3;
  ctx.save();
  ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  const w = ctx.measureText(label).width + 16;
  ctx.fillStyle = "rgba(10,6,16,0.85)"; ctx.fillRect(sx - w / 2, y + bob, w, 22);
  ctx.strokeStyle = "#ff2d55"; ctx.strokeRect(sx - w / 2, y + bob, w, 22);
  ctx.fillStyle = "#fff"; ctx.fillText(label, sx, y + 16 + bob);
  ctx.restore();
}

export function drawCaptives(
  ctx: CanvasRenderingContext2D, s: CaptivesState, camX: number, floorAt: (x: number) => number,
  playerX: number, frame: number, promptFor: "sus" | "filf" | null,
) {
  for (const id of ["sus", "filf"] as const) {
    if (!s[id].keyCollected) drawFilfKey(ctx, CAPTIVES[id].keyX, floorAt(CAPTIVES[id].keyX), camX, frame);
  }
  // SUS Dog
  const sd = CAPTIVES.sus, ss = s.sus, fy = floorAt(sd.cageX), sx = sd.cageX - camX;
  if (sx > -250 && sx < ctx.canvas.width + 250) {
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(sx, fy + 2, 60, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const near = Math.abs(playerX - sd.cageX) < 420;
    if (ss.phase === "caged") blitH(ctx, near ? susCagedStand : susCagedSit, sx, fy, 150);
    else if (ss.phase === "opening") {
      const t = ss.timer / CAPTIVE_OPEN_FRAMES;
      blitH(ctx, susCagedStand, sx + Math.sin(ss.timer * 1.7) * 3, fy, 150, 1 - Math.max(0, t - 0.5) * 2);
      if (t > 0.5) blitH(ctx, susFree, sx + 30 + (t - 0.5) * 120, fy, 130, (t - 0.5) * 2);
    } else blitH(ctx, susFree, sx + 90, fy, 130);
    if (promptFor === "sus") prompt(ctx, sx, fy - 190, ss.keyCollected ? "▼ RESCUE SUS DOG [E]" : "▼ LOCKED — FIND SUS DOG'S KEY", frame);
  }
  // FILF — her own separate cage, same canonical atlas as Level 1.
  const fd = CAPTIVES.filf;
  drawFilf(ctx, s.filf, camX, floorAt(fd.cageX), playerX, frame, false, fd.cageX);
  if (promptFor === "filf") prompt(ctx, fd.cageX - camX, floorAt(fd.cageX) - 170, s.filf.keyCollected ? "▼ RESCUE FILF [E]" : "▼ LOCKED — FIND FILF'S KEY", frame);
}
