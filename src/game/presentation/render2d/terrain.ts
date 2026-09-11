/**
 * TERRAIN RENDERER — lower streets (pits) and ladders.
 *
 * Draws the vertical traversal geometry that `src/game/config/world.ts`
 * defines. Purely presentational: collision comes from `groundYAt` /
 * `clampToPitWalls`, never from these draw calls.
 *
 * Viewport-culled, zero per-frame allocation, deterministic (render clock).
 */

import { GROUND_Y } from "@/game/config";
import { laddersFor, pitsFor, type Ladder, type GroundPit } from "@/game/config/world";
import { flicker } from "./clock";

const WALL_DARK = "#0b0c11";

export function drawPits(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const pits = pitsFor(level);
  if (pits.length === 0) return;
  for (const pit of pits) {
    const sx = pit.x0 - camX;
    const ex = pit.x1 - camX;
    if (ex < -80 || sx > canvasW + 80) continue;
    drawPit(ctx, pit, sx, ex);
  }
}

function drawPit(ctx: CanvasRenderingContext2D, pit: GroundPit, sx: number, ex: number) {
  const w = ex - sx;
  // Cut the shaft out of the street
  const shaft = ctx.createLinearGradient(0, GROUND_Y, 0, pit.y);
  shaft.addColorStop(0, "#05060a");
  shaft.addColorStop(1, "#12141c");
  ctx.fillStyle = shaft;
  ctx.fillRect(sx, GROUND_Y, w, pit.y - GROUND_Y + 60);

  // Side walls with brick/tile courses
  ctx.fillStyle = "#1b1e28";
  ctx.fillRect(sx - 10, GROUND_Y, 12, pit.y - GROUND_Y + 60);
  ctx.fillRect(ex - 2, GROUND_Y, 12, pit.y - GROUND_Y + 60);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let y = GROUND_Y + 10; y < pit.y; y += 14) {
    ctx.beginPath(); ctx.moveTo(sx - 10, y); ctx.lineTo(sx + 2, y);
    ctx.moveTo(ex - 2, y); ctx.lineTo(ex + 10, y); ctx.stroke();
  }

  // Lower floor
  const floor = ctx.createLinearGradient(0, pit.y, 0, pit.y + 60);
  floor.addColorStop(0, pit.kind === "underpass" ? "#2a2c38" : "#26282f");
  floor.addColorStop(1, "#101219");
  ctx.fillStyle = floor;
  ctx.fillRect(sx, pit.y, w, 60);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(sx, pit.y, w, 3);

  // Kerb lips at street level
  ctx.fillStyle = "#585c68";
  ctx.fillRect(sx - 14, GROUND_Y - 6, 18, 7);
  ctx.fillRect(ex - 4, GROUND_Y - 6, 18, 7);
  // Hazard stripes on the lips
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#e8c342" : "#1b1b22";
    ctx.fillRect(sx - 14 + i * 6, GROUND_Y - 6, 6, 3);
    ctx.fillRect(ex - 4 + i * 6, GROUND_Y - 6, 6, 3);
  }

  // Service lighting along the lower street (deterministic flicker)
  for (let lx = sx + 70; lx < ex - 40; lx += 190) {
    const a = 0.5 + flicker(lx, 0.004) * 0.5;
    ctx.fillStyle = `rgba(120,190,255,${0.16 * a})`;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y + 24);
    ctx.lineTo(lx - 40, pit.y + 4);
    ctx.lineTo(lx + 40, pit.y + 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(190,225,255,${a})`;
    ctx.fillRect(lx - 8, GROUND_Y + 18, 16, 4);
  }

  // Pipework along the back wall
  ctx.strokeStyle = "#2f3440"; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sx + 4, GROUND_Y + 40); ctx.lineTo(ex - 4, GROUND_Y + 40);
  ctx.stroke();
}

export function drawLadders(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const ladders = laddersFor(level);
  if (ladders.length === 0) return;
  for (const l of ladders) {
    const sx = l.x - camX;
    if (sx < -60 || sx > canvasW + 60) continue;
    drawLadder(ctx, l, sx);
  }
}

function drawLadder(ctx: CanvasRenderingContext2D, l: Ladder, sx: number) {
  const halfW = l.style === "construction" ? 11 : 9;
  const rail = l.style === "casinoService" ? "#c8a44a"
    : l.style === "construction" ? "#e8a33d"
    : l.style === "underground" ? "#6f7684"
    : l.style === "fireEscape" ? "#3f4450"
    : "#8a8f9c";
  const rung = l.style === "casinoService" ? "#e8d18a" : "#b9bec9";

  // Back plate so the rungs read against the dark shaft
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(sx - halfW - 4, l.top - 6, halfW * 2 + 8, l.bottom - l.top + 12);

  ctx.strokeStyle = rail;
  ctx.lineWidth = l.style === "construction" ? 5 : 4;
  ctx.beginPath();
  ctx.moveTo(sx - halfW, l.top - 22); ctx.lineTo(sx - halfW, l.bottom + 2);
  ctx.moveTo(sx + halfW, l.top - 22); ctx.lineTo(sx + halfW, l.bottom + 2);
  ctx.stroke();

  ctx.strokeStyle = rung;
  ctx.lineWidth = 3;
  for (let y = l.top - 18; y <= l.bottom; y += 14) {
    ctx.beginPath(); ctx.moveTo(sx - halfW, y); ctx.lineTo(sx + halfW, y); ctx.stroke();
  }

  // Top hoop / grab handle so the mount point is obvious
  ctx.strokeStyle = rail; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(sx, l.top - 24, halfW + 2, Math.PI, 0); ctx.stroke();

  if (l.style === "casinoService") {
    ctx.fillStyle = "rgba(255,62,165,0.5)";
    ctx.fillRect(sx - halfW - 4, l.top - 30, halfW * 2 + 8, 3);
  }
}

/** Faint "you can climb here" marker while a fighter stands next to a ladder. */
export function drawLadderHint(
  ctx: CanvasRenderingContext2D,
  ladder: Ladder,
  camX: number,
  atY: number,
): void {
  const sx = ladder.x - camX;
  const a = 0.45 + flicker(ladder.x, 0.02) * 0.4;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#ffe9a8";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("↕ CLIMB", sx, atY - 92);
  ctx.restore();
  ctx.textAlign = "left";
}
