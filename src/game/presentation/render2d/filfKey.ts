/** Draws Level 1's single cage key (presentation only). */
export function drawFilfKey(ctx: CanvasRenderingContext2D, worldX: number, floorY: number, camX: number, frame: number) {
  const x = Math.round(worldX - camX);
  if (x < -60 || x > ctx.canvas.width + 60) return;
  const bob = Math.sin(frame * 0.08) * 4;
  const y = floorY - 34 + bob;
  ctx.save();
  // glow beam
  const g = ctx.createRadialGradient(x, y, 2, x, y, 34);
  g.addColorStop(0, "rgba(255,210,63,0.55)");
  g.addColorStop(1, "rgba(255,210,63,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - 36, y - 36, 72, 72);
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(x, floorY - 2, 12 - bob, 3, 0, 0, Math.PI * 2); ctx.fill();
  // key: ring + shaft + teeth (pixel blocks)
  ctx.fillStyle = "#3a2a00";
  ctx.fillRect(x - 13, y - 9, 12, 12); ctx.fillRect(x - 2, y - 3, 18, 6); ctx.fillRect(x + 9, y + 2, 4, 6); ctx.fillRect(x + 14, y + 2, 3, 5);
  ctx.fillStyle = "#ffd23f";
  ctx.fillRect(x - 11, y - 7, 8, 8); ctx.fillRect(x - 2, y - 1, 16, 2); ctx.fillRect(x + 10, y + 1, 2, 5); ctx.fillRect(x + 14, y + 1, 2, 4);
  ctx.fillStyle = "#3a2a00"; ctx.fillRect(x - 8, y - 4, 2, 2);
  ctx.fillStyle = "#fff6c4"; ctx.fillRect(x - 10, y - 6, 2, 2);
  // sparkle
  if (frame % 40 < 20) { ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 6, y - 12, 2, 6); ctx.fillRect(x + 4, y - 10, 6, 2); }
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd23f";
  ctx.fillText("KEY", x, y - 18);
  ctx.restore();
}
