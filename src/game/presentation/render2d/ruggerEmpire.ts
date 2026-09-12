/**
 * LEVEL 2 — RUGGER'S EMPIRE.
 * Painted, panel-based finance/casino district with cached parallax dressing.
 * Presentation only: collision, encounters and combat remain in world/gameplay.
 */
import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
import panelA from "@/assets/rugger-empire-a.jpg.asset.json";
import panelB from "@/assets/rugger-empire-b.jpg.asset.json";
import panelC from "@/assets/rugger-empire-c.jpg.asset.json";
import panelD from "@/assets/rugger-empire-d.jpg.asset.json";
import { flicker } from "./clock";

export const RUGGER_LEVEL = 1;
const PANEL_W = 1350;
const PANEL_H = PANEL_W / 3;
const PAVEMENT = 0.84;
// Per-panel standing plane, measured from the artwork. Panel C (the service
// level interior) paints its floor lower than the open street panels, which
// made Waldoge read as levitating in that stretch.
export const PANEL_PAVEMENT = [0.84, 0.84, 0.88, 0.84] as const;
const TOP_Y = GROUND_Y - PANEL_H * PAVEMENT;
const PANEL_ORDER = [0, 0, 1, 1, 2, 2, 3, 3] as const;

export const RUGGER_SECTIONS = [
  "FINANCIAL DISTRICT ENTRANCE",
  "CRYPTO OFFICES",
  "RUGGER EXCHANGE",
  "LUXURY FINANCIAL DISTRICT",
  "RUGGER TOWERS",
  "UNDERGROUND TRADING INFRASTRUCTURE",
  "CASINO DISTRICT",
  "RUGGER'S GAMBLING DEN",
  "RUGGER'S PRIVATE EMPIRE",
  "RUGGER BOSS ARENA",
] as const;

export const RUGGER_LANDMARKS = [
  "RUGGER CAPITAL", "RUGGER FINANCE", "DIGITAL ASSETS", "RUGGER EXCHANGE",
  "GOLDEN BULL", "RUGGER CAPITAL MARKETS", "RUGGER TOWERS",
  "RUGGER'S GAMBLING DEN", "RUGGER'S PRIVATE EMPIRE",
] as const;

function preload(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const image = new Image();
  image.src = src;
  return image;
}

const IMAGES = [panelA.url, panelB.url, panelC.url, panelD.url].map(preload);

function ready(image: HTMLImageElement | null): image is HTMLImageElement {
  return !!image && image.complete && image.naturalWidth > 0;
}

export function ruggerEmpireReady(): boolean {
  return IMAGES.every(ready);
}

export function hasRuggerEmpire(level: number): boolean {
  return level === RUGGER_LEVEL && ruggerEmpireReady();
}

interface SkylineBlock { x: number; w: number; h: number; lit: number }
interface RuggerWorld { width: number; skyline: SkylineBlock[] }
let cachedWorld: RuggerWorld | null = null;

export function ruggerWorldFor(level: number): RuggerWorld | null {
  if (level !== RUGGER_LEVEL) return null;
  const width = getLevelWidth(level);
  if (cachedWorld?.width === width) return cachedWorld;
  const skyline: SkylineBlock[] = [];
  for (let x = -240, i = 0; x < width + 500; i++) {
    const w = 72 + ((i * 47) % 92);
    skyline.push({ x, w, h: 130 + ((i * 83) % 210), lit: (i * 37) % 100 });
    x += w + 18 + ((i * 19) % 34);
  }
  cachedWorld = { width, skyline };
  return cachedWorld;
}

function drawParallaxSkyline(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, world: RuggerWorld) {
  const sky = ctx.createLinearGradient(0, -220, 0, GROUND_Y);
  sky.addColorStop(0, "#030713");
  sky.addColorStop(0.62, "#0a1830");
  sky.addColorStop(1, "#24132d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, -260, canvasW, GROUND_Y + 520);
  const offset = camX * 0.14;
  for (const b of world.skyline) {
    const x = b.x - offset;
    if (x + b.w < -20 || x > canvasW + 20) continue;
    ctx.fillStyle = b.lit > 50 ? "#101b30" : "#0b1427";
    ctx.fillRect(x, GROUND_Y - b.h - 70, b.w, b.h);
    ctx.fillStyle = b.lit % 3 ? "rgba(83,211,255,0.34)" : "rgba(255,195,83,0.35)";
    for (let wx = x + 10; wx < x + b.w - 6; wx += 18) {
      for (let wy = GROUND_Y - b.h - 56; wy < GROUND_Y - 92; wy += 24) {
        if ((Math.round(wx + wy + b.lit) % 5) !== 0) ctx.fillRect(wx, wy, 7, 9);
      }
    }
  }
}

export function drawRuggerEmpire(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const world = ruggerWorldFor(level);
  if (!world) return;
  drawParallaxSkyline(ctx, camX, canvasW, world);

  const slots = Math.ceil(world.width / PANEL_W);
  const first = Math.max(0, Math.floor(camX / PANEL_W));
  const last = Math.min(slots - 1, Math.floor((camX + canvasW) / PANEL_W));
  for (let slot = first; slot <= last; slot++) {
    const panel = PANEL_ORDER[Math.min(slot, PANEL_ORDER.length - 1)];
    const image = IMAGES[panel];
    if (!ready(image)) continue;
    const x = Math.round(slot * PANEL_W - camX);
    // Each painting places its standing plane at a different height, so the
    // panel is anchored by its own pavement line instead of a shared one.
    ctx.drawImage(image, x, GROUND_Y - PANEL_H * PANEL_PAVEMENT[panel], PANEL_W + 1, PANEL_H);
  }

  // Architectural seams become dark alleys rather than visible panel cuts.
  for (let slot = first; slot <= last + 1; slot++) {
    const x = Math.round(slot * PANEL_W - camX);
    if (x < -22 || x > canvasW + 22) continue;
    const seam = ctx.createLinearGradient(x - 22, 0, x + 22, 0);
    seam.addColorStop(0, "rgba(2,5,12,0)");
    seam.addColorStop(0.5, "rgba(2,5,12,0.62)");
    seam.addColorStop(1, "rgba(2,5,12,0)");
    ctx.fillStyle = seam;
    ctx.fillRect(x - 22, TOP_Y, 44, PANEL_H * PAVEMENT);
  }

  // Moving foreground market light gives the static paintings subtle depth.
  const pulse = 0.035 + flicker(camX, 0.002) * 0.035;
  ctx.fillStyle = `rgba(42,205,255,${pulse})`;
  ctx.fillRect(0, GROUND_Y - 2, canvasW, 2);
  // Start the understructure at the highest panel bottom so a deeper-anchored
  // panel never leaves a gap above the fill.
  const deepest = Math.max(...PANEL_PAVEMENT);
  const fillTop = GROUND_Y - PANEL_H * deepest + PANEL_H - 1;
  ctx.fillStyle = "#080b13";
  ctx.fillRect(0, fillTop, canvasW, GROUND_Y + 400 - fillTop);
}

export function ruggerSectionLabelAt(level: number, x: number): string | null {
  if (level !== RUGGER_LEVEL) return null;
  const width = getLevelWidth(level);
  const index = Math.max(0, Math.min(RUGGER_SECTIONS.length - 1, Math.floor((x / width) * RUGGER_SECTIONS.length)));
  return RUGGER_SECTIONS[index];
}

export const __ruggerTest = { PANEL_W, PANEL_H, TOP_Y, PANEL_ORDER };