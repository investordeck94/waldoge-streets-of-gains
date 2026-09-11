/**
 * LEVEL 1 — JEET'S FAST FOOD DISTRICT (painted street artwork).
 * ---------------------------------------------------------------------------
 * Replaces the procedural stickman-era storefronts with hand-painted street
 * panels that match the full-body character art. Four unique 1920x640 panels
 * are tiled across the world in a fixed, deterministic order, with Jeet's
 * Palace reserved for the boss end of the level.
 *
 * PERFORMANCE
 *   • Images preloaded once at module import, never per frame.
 *   • Panel layout is a static table — no allocation while drawing.
 *   • Only panels intersecting the viewport are drawn.
 *
 * GAMEPLAY: purely visual. No collision, spawning, AI or combat here.
 */

import { GROUND_Y } from "@/game/config";
import { getLevelWidth } from "@/game/config/world";
import panelA from "@/assets/jeet-street-a.png.asset.json";
import panelB from "@/assets/jeet-street-b.jpg.asset.json";
import panelC from "@/assets/jeet-street-c.jpg.asset.json";
import panelD from "@/assets/jeet-street-d.jpg.asset.json";

export const JEET_LEVEL = 0;

/** World units covered by one painted panel. */
const PANEL_W = 1240;
/** Source art aspect (1920x640) → drawn height for PANEL_W. */
const PANEL_H = (PANEL_W * 640) / 1920;
/** Where the pavement line sits inside the artwork (fraction of height). */
const PAVEMENT = 0.89;
/** Screen Y of the artwork's top edge so its pavement lands on GROUND_Y. */
const TOP_Y = GROUND_Y - PANEL_H * PAVEMENT;
/** Road colour painted below the artwork so a raised camera shows no gap. */
const ROAD = "#22222a";

function preload(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const i = new Image();
  i.src = src;
  return i;
}

const IMGS = [panelA.url, panelB.url, panelC.url, panelD.url].map(preload);

function ready(img: HTMLImageElement | null): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

/** True once every panel has decoded — until then the caller keeps the fallback. */
export function jeetStreetReady(): boolean {
  return IMGS.every(ready);
}

export function hasJeetStreet(level: number): boolean {
  return level === JEET_LEVEL && jeetStreetReady();
}

/** Panel index for a given slot: A B C A B, Palace for the boss end. */
function panelAt(slot: number, slots: number): number {
  if (slot >= slots - 1) return 3; // JEET'S PALACE closes the street
  return [0, 1, 2, 0, 2, 1][slot % 6];
}

export function drawJeetStreet(
  ctx: CanvasRenderingContext2D,
  level: number,
  camX: number,
  canvasW: number,
): void {
  const w = getLevelWidth(level);
  const slots = Math.max(2, Math.ceil(w / PANEL_W));

  const first = Math.max(0, Math.floor(camX / PANEL_W));
  const last = Math.min(slots - 1, Math.floor((camX + canvasW) / PANEL_W));

  // Sky-toned backdrop in case a panel is still one frame behind the camera.
  ctx.fillStyle = "#2a1a3a";
  ctx.fillRect(0, TOP_Y - 400, canvasW, 400 + PANEL_H);

  for (let s = first; s <= last; s++) {
    const img = IMGS[panelAt(s, slots)];
    if (!ready(img)) continue;
    const x = Math.round(s * PANEL_W - camX);
    // +1px overlap kills seams from sub-pixel rounding between panels.
    ctx.drawImage(img, x, TOP_Y, PANEL_W + 1, PANEL_H);
  }

  // Road continues below the artwork for raised-camera / tall-canvas cases.
  const bottom = TOP_Y + PANEL_H;
  ctx.fillStyle = ROAD;
  ctx.fillRect(0, bottom - 1, canvasW, GROUND_Y + 400 - bottom);
}

/** Section label for the HUD/debug overlay. */
export function jeetSectionLabelAt(level: number, x: number): string | null {
  const w = getLevelWidth(level);
  const t = w > 0 ? x / w : 0;
  if (t < 0.2) return "JEET'S DISTRICT";
  if (t < 0.42) return "TAKEAWAY ROW";
  if (t < 0.62) return "HIGH STREET";
  if (t < 0.8) return "BACK OF THE STRIP";
  return "JEET'S PALACE";
}

export const __jeetStreetTest = { PANEL_W, PANEL_H, TOP_Y, panelAt };
