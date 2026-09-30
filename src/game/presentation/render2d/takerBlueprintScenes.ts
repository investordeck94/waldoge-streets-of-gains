/**
 * LEVEL 7 blueprint compositions (visual only, no collision).
 * Each section's focal landmark is centred on the world position the gameplay
 * camera frames when the player stands at the section's blueprint midpoint,
 * so the live view reproduces the reference image's hierarchy:
 * sky → distant skyline → monumental landmark → flanking structures → decks.
 */
import { GROUND_Y } from "@/game/config";
import { renderNow } from "./clock";

type Ctx = CanvasRenderingContext2D;
const RED = "#ff2848";
const GOLD = "#f4c542";
const BLUE = "#2fb6ff";
const PURPLE = "#b851ff";

/** Deterministic pseudo-random for stable window patterns. */
const hash = (n: number) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };

/* ---------------------------------------------------------------- sky */
export function blueprintSky(ctx: Ctx, start: number, width: number, index: number): void {
  const sky = ctx.createLinearGradient(0, -60, 0, GROUND_Y);
  if (index === 3) { sky.addColorStop(0, "#0d0b2c"); sky.addColorStop(.55, "#0a0a1f"); sky.addColorStop(1, "#05050d"); }
  else if (index === 4) { sky.addColorStop(0, "#0e0a26"); sky.addColorStop(.5, "#0a0818"); sky.addColorStop(1, "#040308"); }
  else { sky.addColorStop(0, "#15306a"); sky.addColorStop(.35, "#1b2458"); sky.addColorStop(.7, "#0b0f26"); sky.addColorStop(1, "#05060d"); }
  ctx.fillStyle = sky; ctx.fillRect(start, -80, width, GROUND_Y + 80);
  // Soft clouds behind skyline (blueprint 7.1/7.2 night haze).
  if (index < 3) {
    ctx.fillStyle = "rgba(120,140,220,.10)";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.ellipse(start + 150 + i * 300, 70 + (i % 2) * 18, 150, 22, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Distant skyscraper layer — tall slim towers with spires and lit windows.
  for (let i = 0; i < 30; i++) {
    const x = start + i * 62 - 20;
    const w = 34 + hash(i + index * 31) * 30;
    const top = 40 + hash(i * 3 + index) * 90;
    ctx.fillStyle = index >= 3 ? "#0f1430" : "#1d2a58";
    ctx.fillRect(x, top, w, GROUND_Y - top);
    if (hash(i * 7) > .55) { ctx.fillRect(x + w / 2 - 2, top - 26, 4, 26); }
    ctx.fillStyle = index >= 3 ? "rgba(184,81,255,.35)" : "rgba(170,200,255,.35)";
    for (let wy = top + 8; wy < GROUND_Y - 60; wy += 11) for (let wx = x + 5; wx < x + w - 5; wx += 8) {
      if (hash(wx * .37 + wy * 1.3) > .72) ctx.fillRect(wx, wy, 3, 4);
    }
  }
}

/* ---------------------------------------------------------- primitives */
function glowText(ctx: Ctx, lines: readonly string[], cx: number, y0: number, lineH: number, size: number, color: string, maxW: number, align: CanvasTextAlign = "center"): void {
  ctx.save();
  ctx.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
  lines.forEach((line, i) => ctx.fillText(line, cx, y0 + i * lineH, maxW));
  ctx.restore();
}

function signFrame(ctx: Ctx, x: number, y: number, w: number, h: number, edge: string, fill = "#0a0d1c"): void {
  ctx.save();
  ctx.fillStyle = "#1a2238"; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.shadowColor = edge; ctx.shadowBlur = 12; ctx.strokeStyle = edge; ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.restore();
}

function litWindows(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, palette = [GOLD, RED, BLUE]): void {
  for (let wy = y + 6; wy < y + h - 8; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 12) {
    const r = hash(seed + wx * .13 + wy * .71);
    if (r < .45) continue;
    ctx.fillStyle = palette[Math.floor(r * 97) % palette.length];
    ctx.globalAlpha = .45 + (r - .45);
    ctx.fillRect(wx, wy, 6, 7);
  }
  ctx.globalAlpha = 1;
}

/** Stepped mid-ground building block with parapet, windows and red lamps. */
function block(ctx: Ctx, x: number, top: number, w: number, seed: number, accent = RED, bottom = GROUND_Y): void {
  ctx.fillStyle = "#0c1328"; ctx.fillRect(x, top, w, bottom - top);
  ctx.fillStyle = "#18244a"; ctx.fillRect(x, top, w, 5);
  ctx.strokeStyle = "#233461"; ctx.lineWidth = 2; ctx.strokeRect(x, top, w, bottom - top);
  litWindows(ctx, x, top + 6, w, bottom - top - 6, seed);
  ctx.fillStyle = accent; ctx.fillRect(x + 4, top - 4, 5, 4); ctx.fillRect(x + w - 9, top - 4, 5, 4);
}

/** Rooftop chimney/water-tank silhouettes (blueprint roofline). */
function roofline(ctx: Ctx, x0: number, x1: number, y: number, seed: number): void {
  for (let x = x0; x < x1; x += 46) {
    const r = hash(seed + x);
    ctx.fillStyle = "#0a1022";
    if (r > .6) { ctx.fillRect(x, y - 34, 22, 34); ctx.fillStyle = RED; ctx.fillRect(x + 6, y - 28, 10, 14); }
    else if (r > .3) { ctx.beginPath(); ctx.ellipse(x + 12, y - 18, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 2, y - 18, 20, 18); }
  }
}

/** Blueprint searchlight tower: saucer lamp head + red downward beam. */
function searchlight(ctx: Ctx, x: number, y: number, scale = 1): void {
  const beam = ctx.createLinearGradient(0, y, 0, y + 180 * scale);
  beam.addColorStop(0, "rgba(255,50,80,.75)"); beam.addColorStop(1, "rgba(255,50,80,0)");
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(x - 14 * scale, y + 10 * scale); ctx.lineTo(x - 55 * scale, y + 180 * scale);
  ctx.lineTo(x + 55 * scale, y + 180 * scale); ctx.lineTo(x + 14 * scale, y + 10 * scale); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#0b1022"; ctx.fillRect(x - 5 * scale, y + 10 * scale, 10 * scale, GROUND_Y - y);
  ctx.fillStyle = "#1b2440";
  ctx.beginPath(); ctx.ellipse(x, y + 4 * scale, 34 * scale, 11 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 16 * scale, y - 16 * scale, 32 * scale, 18 * scale);
  ctx.beginPath(); ctx.arc(x, y - 16 * scale, 13 * scale, Math.PI, 0); ctx.fill();
  ctx.fillStyle = RED; ctx.shadowColor = RED; ctx.shadowBlur = 16;
  ctx.fillRect(x - 20 * scale, y + 8 * scale, 40 * scale, 5 * scale);
  ctx.shadowBlur = 0;
  ctx.fillStyle = GOLD; ctx.fillRect(x - 24 * scale, y + 1, 4, 3); ctx.fillRect(x + 20 * scale, y + 1, 4, 3);
}

/** Red "V" Taker emblem lantern used on blueprint towers. */
function vLantern(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = "#1a0710"; ctx.fillRect(x, y, w, h);
  ctx.shadowColor = RED; ctx.shadowBlur = 14; ctx.fillStyle = "rgba(255,40,72,.55)"; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = "#ffd0d8"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + w * .22, y + h * .28); ctx.lineTo(x + w * .78, y + h * .28); ctx.lineTo(x + w / 2, y + h * .78); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

/** Spire tower with lantern — 7.2 skyline landmark. */
function spire(ctx: Ctx, x: number, top: number, w: number): void {
  ctx.fillStyle = "#0b1126"; ctx.fillRect(x - w / 2, top + 30, w, GROUND_Y - top - 30);
  ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, top + 34); ctx.lineTo(x, top - 10); ctx.lineTo(x + w / 2 + 6, top + 34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#1c2748"; ctx.fillRect(x - w / 2 - 6, top + 30, w + 12, 6);
  vLantern(ctx, x - w / 2 + 6, top + 44, w - 12, 46);
  ctx.fillStyle = RED; ctx.fillRect(x - 2, top - 20, 4, 12);
}

function stair(ctx: Ctx, x: number, y: number, dir: 1 | -1, steps: number): void {
  ctx.strokeStyle = "#2f4a86"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let i = 0; i < steps; i++) { ctx.lineTo(x + dir * (i * 10 + 10), y + i * 8); ctx.lineTo(x + dir * (i * 10 + 10), y + i * 8 + 8); }
  ctx.stroke();
}

function doorway(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.save(); ctx.fillStyle = "#07091a"; ctx.fillRect(x - 3, y - 3, w + 6, h + 3);
  ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fillStyle = color; ctx.globalAlpha = .55; ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.restore();
}

/* =============================================================== 7.1 */
export function sceneTaken(ctx: Ctx, start: number): void {
  // Background stepped city mass across the full section.
  for (let i = 0; i < 9; i++) {
    const x = start + i * 205;
    const top = 120 + hash(i + 3) * 60;
    block(ctx, x, top, 170, i * 17);
    roofline(ctx, x, x + 170, top, i);
  }
  const c = start + 820;
  // Searchlight towers flank the acquisition complex (blueprint top corners).
  searchlight(ctx, c - 340, 52); searchlight(ctx, c + 340, 52);
  searchlight(ctx, start + 1560, 64, .8); searchlight(ctx, start + 120, 64, .8);
  // Dominant central acquisition complex.
  ctx.fillStyle = "#0a1026"; ctx.fillRect(c - 250, 72, 500, GROUND_Y - 72);
  ctx.fillStyle = "#15204a"; ctx.fillRect(c - 262, 64, 524, 12);
  roofline(ctx, c - 250, c + 250, 64, 99);
  for (const dx of [-150, -40, 60, 170]) { ctx.fillStyle = "#101a3b"; ctx.fillRect(c + dx, 20, 30, 46); vLantern(ctx, c + dx + 4, 28, 22, 30); }
  // Stepped wings.
  block(ctx, c - 420, 140, 170, 41); block(ctx, c + 250, 130, 180, 43);
  stair(ctx, c - 250, 196, -1, 8); stair(ctx, c + 250, 196, 1, 8);
  // Headline sign + acquired board integrated into the façade.
  signFrame(ctx, c - 190, 84, 380, 46, RED, "#1d0710");
  glowText(ctx, ["TICKER TAKER NETWORK"], c, 107, 0, 26, "#ff4a64", 360);
  signFrame(ctx, c - 190, 136, 380, 110, RED, "#070a18");
  glowText(ctx, [
    "JEET DISTRICT - ACQUIRED", "RUGGER EXCHANGE - ACQUIRED", "BAD ACTORS STUDIOS - ACQUIRED",
    "FUDDER MEDIA - ACQUIRED", "EXIT LIQUIDITY - ACQUIRED", "MR. MARKETER - ACQUIRED",
  ], c - 172, 150, 16, 13, "#e8ecff", 350, "left");
  // "ALL EMPIRES NOW HIS" billboard bolted to the left wing.
  signFrame(ctx, c - 405, 150, 130, 100, RED, "#1a0610");
  glowText(ctx, ["ALL", "EMPIRES", "NOW HIS"], c - 340, 174, 26, 22, RED, 120);
  // Emblem + lit red rooms on the right wing.
  vLantern(ctx, c + 280, 150, 40, 44);
  doorway(ctx, c + 340, 228, 60, 60, RED);
  doorway(ctx, c - 380, 262, 52, 50, "#ff5a3a");
  doorway(ctx, c + 60, 262, 48, 50, RED);
  // Repeat supporting architecture further along the section.
  signFrame(ctx, start + 1380, 150, 200, 70, RED, "#1a0610");
  glowText(ctx, ["CONQUERED", "EMPIRES"], start + 1480, 173, 26, 20, RED, 180);
  signFrame(ctx, start + 150, 150, 170, 64, RED, "#1a0610");
  glowText(ctx, ["EVERYTHING", "IS MINE"], start + 235, 170, 24, 18, RED, 150);
}

/* =============================================================== 7.2 */
export function sceneTicker(ctx: Ctx, start: number): void {
  for (let i = 0; i < 9; i++) {
    const x = start + i * 205; const top = 150 + hash(i + 11) * 40;
    block(ctx, x, top, 175, i * 23 + 5); roofline(ctx, x, x + 175, top, i + 20);
  }
  const c = start + 820;
  searchlight(ctx, c - 380, 50); searchlight(ctx, c + 390, 50);
  // Spire towers with red V lanterns across the skyline.
  for (const dx of [-250, -60, 120, 250]) spire(ctx, c + dx, 26 + Math.abs(dx) * .08, 44);
  // Integrated market hall.
  ctx.fillStyle = "#0a1026"; ctx.fillRect(c - 290, 110, 560, GROUND_Y - 110);
  ctx.fillStyle = "#18244a"; ctx.fillRect(c - 300, 102, 580, 10);
  signFrame(ctx, c - 260, 116, 500, 34, RED, "#1a0610");
  glowText(ctx, ["THE MARKET NEVER SLEEPS"], c - 10, 133, 0, 22, "#ff4a64", 480);
  // Candlestick wall.
  signFrame(ctx, c - 260, 158, 300, 98, BLUE, "#060d1d");
  ctx.strokeStyle = "rgba(47,182,255,.18)"; ctx.lineWidth = 1;
  for (let gx = c - 250; gx < c + 34; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 162); ctx.lineTo(gx, 252); ctx.stroke(); }
  const vals = [40, 55, 38, 62, 48, 70, 52, 66, 44, 58, 74, 60, 80, 68, 88, 76, 92];
  vals.forEach((v, i) => {
    const px = c - 248 + i * 16.5; const up = i % 3 !== 1;
    const col = up ? "#46f0a0" : RED; ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px + 3, 250 - v - 10); ctx.lineTo(px + 3, 250 - v + 22); ctx.stroke();
    ctx.fillRect(px, 250 - v, 7, 14);
  });
  // BUY / OBEY / TRADE / REPEAT built into the hall.
  signFrame(ctx, c + 50, 158, 190, 98, RED, "#0a0d1c");
  glowText(ctx, ["BUY", "OBEY", "TRADE", "REPEAT"], c + 145, 172, 23, 21, RED, 170);
  // Global Control tower on the right.
  block(ctx, c + 270, 120, 150, 77, BLUE);
  signFrame(ctx, c + 280, 150, 130, 78, "#b8c6e0", "#070b18");
  glowText(ctx, ["GLOBAL", "CONTROL", "REAL TIME", "MANIPULATION"], c + 345, 163, 17, 13, "#e8ecff", 118);
  // Left V tower wall.
  block(ctx, c - 440, 130, 150, 88, RED);
  vLantern(ctx, c - 400, 150, 44, 50); vLantern(ctx, c - 400, 220, 44, 50);
  doorway(ctx, c - 30, 262, 44, 54, RED); doorway(ctx, c + 200, 262, 40, 54, BLUE);
  // Ticker strip under the hall.
  ctx.fillStyle = "#05070f"; ctx.fillRect(c - 290, 256, 560, 8);
  ctx.save(); ctx.font = "700 7px monospace"; ctx.fillStyle = "#46f0a0";
  const off = (renderNow() / 40) % 120;
  for (let tx = c - 290 - off; tx < c + 270; tx += 120) ctx.fillText("WDG +9.8%  TKR -4.1%", tx, 262);
  ctx.restore();
  // Supporting repeats.
  spire(ctx, start + 1560, 60, 40); vLantern(ctx, start + 1480, 190, 40, 46);
  spire(ctx, start + 140, 60, 40);
}

/* =============================================================== 7.3 */
export function sceneCopy(ctx: Ctx, start: number): void {
  for (let i = 0; i < 9; i++) {
    const x = start + i * 205; const top = 110 + hash(i + 29) * 50;
    block(ctx, x, top, 180, i * 29 + 7, i % 2 ? BLUE : RED);
  }
  const c = start + 820;
  // Overhead cable crown.
  ctx.strokeStyle = "#141c33"; ctx.lineWidth = 6;
  for (const dx of [-420, -300, -200, 200, 300, 420]) {
    ctx.beginPath(); ctx.moveTo(c + dx, 0); ctx.bezierCurveTo(c + dx * .6, 40, c + dx * .3, 30, c + Math.sign(dx) * 120, 58); ctx.stroke();
  }
  // Symmetrical server towers with red V capsules.
  for (const dx of [-400, 330]) {
    ctx.fillStyle = "#0b1126"; ctx.fillRect(c + dx, 40, 90, GROUND_Y - 40);
    ctx.strokeStyle = "#233461"; ctx.lineWidth = 2; ctx.strokeRect(c + dx, 40, 90, GROUND_Y - 40);
    vLantern(ctx, c + dx + 22, 56, 46, 70);
    vLantern(ctx, c + dx + 26, 150, 38, 50);
    for (let y = 214; y < GROUND_Y - 10; y += 14) { ctx.fillStyle = y % 28 ? BLUE : GOLD; ctx.fillRect(c + dx + 12, y, 6, 4); ctx.fillRect(c + dx + 70, y, 6, 4); }
  }
  // Cylindrical WALDOGE analysis chamber.
  ctx.fillStyle = "#0c1024"; ctx.fillRect(c - 170, 44, 340, GROUND_Y - 44);
  ctx.fillStyle = "#1a2242";
  ctx.beginPath(); ctx.ellipse(c, 50, 175, 18, 0, 0, Math.PI * 2); ctx.fill();
  signFrame(ctx, c - 150, 64, 300, 38, RED, "#1d0710");
  glowText(ctx, ["WALDOGE ANALYSIS"], c, 84, 0, 24, "#ff4a64", 280);
  const glass = ctx.createLinearGradient(c - 110, 0, c + 110, 0);
  glass.addColorStop(0, "rgba(160,10,30,.85)"); glass.addColorStop(.5, "rgba(255,60,80,.92)"); glass.addColorStop(1, "rgba(160,10,30,.85)");
  ctx.save(); ctx.shadowColor = RED; ctx.shadowBlur = 26;
  ctx.fillStyle = glass; ctx.fillRect(c - 110, 108, 220, 118);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,190,200,.45)"; ctx.lineWidth = 2;
  for (let gx = c - 90; gx < c + 110; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 110); ctx.lineTo(gx, 224); ctx.stroke(); }
  // Specimen silhouette inside (dark on red, like the blueprint).
  ctx.save(); ctx.translate(c, 226); ctx.fillStyle = "rgba(60,0,12,.78)";
  ctx.beginPath(); ctx.arc(0, -86, 20, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-22, -96); ctx.lineTo(0, -124); ctx.lineTo(22, -96); ctx.closePath(); ctx.fill();
  ctx.fillRect(-24, -66, 48, 44); ctx.fillRect(-40, -62, 14, 38); ctx.fillRect(26, -62, 14, 38);
  ctx.fillRect(-20, -24, 16, 24); ctx.fillRect(4, -24, 16, 24);
  ctx.restore();
  ctx.fillStyle = "#1a2242"; ctx.fillRect(c - 124, 102, 248, 8); ctx.fillRect(c - 124, 224, 248, 8);
  signFrame(ctx, c - 140, 236, 280, 22, RED, "#1d0710");
  glowText(ctx, ["WALDOGE DETECTED"], c, 247, 0, 17, "#ff4a64", 260);
  // Replication status wall on the right.
  signFrame(ctx, c + 120, 120, 200, 116, "#6d7fa8", "#070a18");
  glowText(ctx, ["MOVESET COPIED ✓", "COMBAT DATA ✓", "COMMUNITY PATTERNS ✓", "BEHAVIOUR MODEL ✓"], c + 130, 136, 18, 12, "#e8ecff", 180, "left");
  glowText(ctx, ["REPLICATION: 98%"], c + 220, 219, 0, 16, RED, 180);
  // Three repeated lower copy bays under the chamber.
  for (const dx of [-120, -30, 60]) doorway(ctx, c + dx, 266, 60, 50, BLUE);
  for (const dx of [-110, -50, 10, 70, 110]) { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(c + dx, 262, 3, 0, Math.PI * 2); ctx.fill(); }
  // Supporting copy bays elsewhere in the section.
  for (const x of [start + 1400, start + 1520]) doorway(ctx, x, 250, 70, 66, BLUE);
  vLantern(ctx, start + 150, 120, 50, 70);
}

/* =============================================================== 7.4 */
function pennant(ctx: Ctx, x: number, y: number, w: number, h: number, lines: readonly string[], size: number): void {
  ctx.save();
  ctx.fillStyle = "#1a2238"; ctx.fillRect(x - 10, y - 8, w + 20, 10);
  ctx.fillStyle = "#4a0a18";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w / 2, y + h + 34); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#8a1a30"; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  glowText(ctx, lines, x + w / 2, y + 30, size + 6, size, RED, w - 14);
}

export function sceneCitadelBack(ctx: Ctx, start: number): void {
  // Fortress mass fills the whole section.
  ctx.fillStyle = "#0a0f22"; ctx.fillRect(start, 20, 1800, GROUND_Y - 20);
  for (let i = 0; i < 12; i++) {
    const x = start + i * 150;
    ctx.fillStyle = "#0d1430"; ctx.fillRect(x + 8, 10, 60, GROUND_Y - 10);
    ctx.strokeStyle = "#1c2a55"; ctx.lineWidth = 2; ctx.strokeRect(x + 8, 10, 60, GROUND_Y - 10);
    for (let y = 30; y < GROUND_Y - 20; y += 36) { ctx.fillStyle = hash(i * 9 + y) > .5 ? RED : "#401020"; ctx.fillRect(x + 34, y, 6, 8); }
  }
  // 5400–5600 fortified entrance.
  ctx.fillStyle = "#0c1330"; ctx.fillRect(start + 20, 90, 180, GROUND_Y - 90);
  ctx.fillStyle = "#1c2a55"; for (let bx = start + 20; bx < start + 200; bx += 30) ctx.fillRect(bx, 76, 18, 16);
  doorway(ctx, start + 70, 220, 80, 100, RED);
  vLantern(ctx, start + 90, 120, 40, 48);
  // Left banner (camera-visible from the key deck): ONE MARKET ONE TRUTH ONE OWNER.
  pennant(ctx, start + 470, 40, 150, 150, ["ONE", "MARKET", "ONE TRUTH", "ONE OWNER"], 20);
  // Guarded key chamber around the fixed key (6360, 262).
  const kx = 6360;
  ctx.fillStyle = "#070b1a"; ctx.fillRect(kx - 150, 60, 300, 202);
  ctx.strokeStyle = "#233461"; ctx.lineWidth = 4; ctx.strokeRect(kx - 150, 60, 300, 202);
  signFrame(ctx, kx - 70, 150, 140, 50, GOLD, "#0a0d14");
  glowText(ctx, ["KEY STRONGHOLD"], kx, 175, 0, 16, GOLD, 130);
  for (const dx of [-130, 110]) { ctx.fillStyle = "#101a3b"; ctx.fillRect(kx + dx, 70, 20, 192); }
  // Right banner beside the prison approach.
  pennant(ctx, start + 1170, 40, 140, 140, ["DATA", "CAPTURE", "COMMUNITY", "ACQUISITION", "100%"], 15);
  // Upper prison façade (6750–7050) wrapping the fixed cage at (6900, 88).
  const px = 6900;
  ctx.fillStyle = "#12082a"; ctx.fillRect(px - 190, -20, 380, 110);
  ctx.save(); ctx.shadowColor = PURPLE; ctx.shadowBlur = 18; ctx.strokeStyle = PURPLE; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(px - 180, 90); ctx.lineTo(px - 180, 10); ctx.quadraticCurveTo(px, -40, px + 180, 10); ctx.lineTo(px + 180, 90); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(184,81,255,.45)"; ctx.lineWidth = 2;
  for (let bx = px - 170; bx <= px + 170; bx += 20) { ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, 88); ctx.stroke(); }
  for (const dx of [-160, 160]) { ctx.fillStyle = GOLD; ctx.fillRect(px + dx - 4, 70, 8, 16); }
  // Vertical framing pillars along the ladder network and red emblem door.
  for (const x of [5870, 6060, 6520, 6720, 7080]) {
    ctx.fillStyle = "#0e1633"; ctx.fillRect(x - 12, 60, 24, GROUND_Y - 60);
    ctx.fillStyle = RED; ctx.fillRect(x - 3, 70, 6, 6);
  }
  doorway(ctx, start + 1650, 200, 90, 120, RED); vLantern(ctx, start + 1672, 216, 46, 60);
}

/* =============================================================== 7.5 */
function goldStatue(ctx: Ctx, x: number, base: number, h: number, kind: "cat" | "dog"): void {
  ctx.save();
  const g = ctx.createLinearGradient(x - h * .25, 0, x + h * .25, 0);
  g.addColorStop(0, "#7a5a18"); g.addColorStop(.5, "#f0cc5a"); g.addColorStop(1, "#8a6a1e");
  ctx.fillStyle = "#2a2230"; ctx.fillRect(x - h * .3, base - h * .1, h * .6, h * .1);
  ctx.fillStyle = g; ctx.shadowColor = "#f5d66d"; ctx.shadowBlur = 10;
  const top = base - h;
  ctx.fillRect(x - h * .17, top + h * .3, h * .34, h * .6);
  ctx.beginPath(); ctx.arc(x, top + h * .2, h * .13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, top + h * .26, h * .07, h * .05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  const e = h * .12;
  if (kind === "cat") { ctx.moveTo(x - e, top + h * .12); ctx.lineTo(x - e * .7, top - e * .2); ctx.lineTo(x - e * .1, top + h * .08); ctx.moveTo(x + e, top + h * .12); ctx.lineTo(x + e * .7, top - e * .2); ctx.lineTo(x + e * .1, top + h * .08); }
  else { ctx.moveTo(x - e, top + h * .14); ctx.lineTo(x - e * 1.1, top + h * .01); ctx.lineTo(x - e * .2, top + h * .09); ctx.moveTo(x + e, top + h * .14); ctx.lineTo(x + e * 1.1, top + h * .01); ctx.lineTo(x + e * .2, top + h * .09); }
  ctx.fill();
  ctx.fillRect(x - h * .25, top + h * .32, h * .08, h * .34); ctx.fillRect(x + h * .17, top + h * .32, h * .08, h * .34);
  ctx.restore();
}

function brazier(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = "#2a2230"; ctx.fillRect(x - 3, y, 6, GROUND_Y - y); ctx.fillRect(x - 10, y - 4, 20, 6);
  const f = 6 + Math.sin(renderNow() / 90 + x) * 2;
  ctx.save(); ctx.shadowColor = "#ff7a2a"; ctx.shadowBlur = 20; ctx.fillStyle = "#ff8a3a";
  ctx.beginPath(); ctx.ellipse(x, y - 10, 7, 10 + f * .4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

export function sceneThrone(ctx: Ctx, start: number): void {
  // Monumental hall walls across the section.
  ctx.fillStyle = "#080b1c"; ctx.fillRect(start, 0, 1800, GROUND_Y);
  for (let i = 0; i < 20; i++) {
    const x = start + i * 92;
    ctx.fillStyle = "#0e1531"; ctx.fillRect(x, 0, 40, GROUND_Y);
    ctx.fillStyle = i % 2 ? "rgba(47,182,255,.35)" : "rgba(255,40,72,.35)";
    for (let y = 20; y < GROUND_Y - 40; y += 22) if (hash(i + y) > .5) ctx.fillRect(x + 16, y, 6, 5);
  }
  const c = start + 820;
  // Overhead arches and cables.
  ctx.strokeStyle = "#5a0e20"; ctx.lineWidth = 6;
  for (const dx of [-380, 380]) { ctx.beginPath(); ctx.arc(c + dx, 20, 90, Math.PI * .05, Math.PI * .95); ctx.stroke(); }
  ctx.strokeStyle = "#141c33"; ctx.lineWidth = 4;
  for (const dx of [-300, -160, 160, 300]) { ctx.beginPath(); ctx.moveTo(c + dx, 0); ctx.quadraticCurveTo(c + dx * .5, 50, c, 40); ctx.stroke(); }
  // Crown spire above the arch sign.
  ctx.save(); ctx.strokeStyle = RED; ctx.shadowColor = RED; ctx.shadowBlur = 16; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(c, -10); ctx.lineTo(c, 34); ctx.moveTo(c - 16, 16); ctx.lineTo(c + 16, 16);
  ctx.moveTo(c - 18, 34); ctx.lineTo(c, 20); ctx.lineTo(c + 18, 34); ctx.stroke(); ctx.restore();
  // Huge Cryptoverse globe.
  const gy = 170, r = 128;
  ctx.save();
  ctx.fillStyle = "rgba(140,10,30,.45)"; ctx.beginPath(); ctx.arc(c, gy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = RED; ctx.shadowBlur = 24; ctx.strokeStyle = RED; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(c, gy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.shadowBlur = 6;
  for (const rx of [.3, .62, .9]) { ctx.beginPath(); ctx.ellipse(c, gy, r * rx, r, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (let k = -3; k <= 3; k++) { const yy = gy + k * r / 4; const half = Math.sqrt(Math.max(0, r * r - (yy - gy) ** 2)); ctx.beginPath(); ctx.moveTo(c - half, yy); ctx.lineTo(c + half, yy); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,60,90,.55)"; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(c - 90, 120); ctx.lineTo(c - 30, 98); ctx.lineTo(c - 10, 130); ctx.lineTo(c - 50, 170); ctx.lineTo(c - 80, 160); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(c + 10, 104); ctx.lineTo(c + 90, 116); ctx.lineTo(c + 100, 160); ctx.lineTo(c + 40, 200); ctx.lineTo(c + 20, 150); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(c - 40, 196); ctx.lineTo(c + 0, 210); ctx.lineTo(c - 20, 256); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Arch sign over the globe.
  ctx.fillStyle = "#0e1531"; ctx.beginPath(); ctx.ellipse(c, 60, 210, 26, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(c - 210, 58, 420, 22);
  ctx.save(); ctx.strokeStyle = RED; ctx.shadowColor = RED; ctx.shadowBlur = 10; ctx.lineWidth = 2; ctx.strokeRect(c - 200, 50, 400, 30); ctx.restore();
  glowText(ctx, ["THE CRYPTOVERSE IS MINE"], c, 66, 0, 22, "#ff4a64", 380);
  // Side banners.
  for (const [dx, lines, size] of [[-380, ["YOU", "TRADE", "I TAKE"], 22], [300, ["WALDOGE", "WAS", "JUST", "THE", "BEGINNING"], 15]] as const) {
    const bx = c + dx;
    ctx.fillStyle = "#1a2238"; ctx.fillRect(bx - 10, 58, 100, 10);
    ctx.fillStyle = "#3a0814"; ctx.beginPath(); ctx.moveTo(bx, 66); ctx.lineTo(bx + 80, 66); ctx.lineTo(bx + 80, 220); ctx.lineTo(bx + 40, 246); ctx.lineTo(bx, 220); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#8a1a30"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.strokeStyle = RED; ctx.shadowColor = RED; ctx.shadowBlur = 10; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx + 18, 84); ctx.lineTo(bx + 62, 84); ctx.lineTo(bx + 40, 116); ctx.closePath(); ctx.stroke(); ctx.restore();
    glowText(ctx, lines, bx + 40, 136, size + 4, size, RED, 72);
  }
  // Throne and dais.
  ctx.fillStyle = "#1a1420"; ctx.fillRect(c - 180, 268, 360, 52);
  ctx.fillStyle = "#2a2230"; ctx.fillRect(c - 190, 262, 380, 8);
  ctx.save(); const tg = ctx.createLinearGradient(c - 80, 0, c + 80, 0);
  tg.addColorStop(0, "#1a1208"); tg.addColorStop(.5, "#3a2a10"); tg.addColorStop(1, "#1a1208");
  ctx.fillStyle = tg; ctx.fillRect(c - 70, 180, 140, 84); ctx.fillRect(c - 90, 222, 180, 42);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.shadowColor = GOLD; ctx.shadowBlur = 10;
  ctx.strokeRect(c - 70, 180, 140, 84); ctx.strokeRect(c - 90, 222, 180, 42);
  ctx.beginPath(); ctx.moveTo(c - 30, 180); ctx.lineTo(c - 20, 160); ctx.lineTo(c - 8, 174); ctx.lineTo(c, 154); ctx.lineTo(c + 8, 174); ctx.lineTo(c + 20, 160); ctx.lineTo(c + 30, 180); ctx.stroke();
  ctx.restore();
  signFrame(ctx, c - 120, 276, 240, 26, RED, "#1a0610");
  glowText(ctx, ["LET'S SEE WHO'S BETTER"], c, 289, 0, 16, "#ff4a64", 220);
  // Four blueprint statues + braziers.
  goldStatue(ctx, c - 210, 262, 150, "cat"); goldStatue(ctx, c + 210, 262, 150, "cat");
  goldStatue(ctx, c - 330, GROUND_Y, 120, "dog"); goldStatue(ctx, c + 330, GROUND_Y, 120, "dog");
  brazier(ctx, c - 130, 222); brazier(ctx, c + 130, 222);
  // Arena-framing columns further along the boss lane.
  for (const x of [start + 150, start + 1350, start + 1600]) {
    ctx.fillStyle = "#121a3a"; ctx.fillRect(x, 30, 50, GROUND_Y - 30);
    ctx.fillStyle = GOLD; ctx.fillRect(x - 6, 30, 62, 6); ctx.fillRect(x - 6, GROUND_Y - 10, 62, 10);
    vLantern(ctx, x + 8, 90, 34, 44);
  }
}
