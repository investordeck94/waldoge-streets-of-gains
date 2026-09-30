/**
 * THE FAT CATS — attack telegraphs, strike smears and hit feedback.
 * Presentation only: reads move/state timers, never changes gameplay values,
 * hitboxes, artwork or navigation. Drawn around the unchanged sprite.
 */
import { CAT_GUARD_MOVES, type CatGuardMove, type CatGuardVariant } from "@/game/enemy/catGuards";

export interface FatCatFxView {
  x: number; y: number; height: number; facing: number; state: string;
  stateTimer: number; variant: CatGuardVariant; catMove?: CatGuardMove;
  /** Frames of white hit-flash left (set when Waldoge lands a blow). */
  catHitFlash?: number;
}

export type FatCatPhase = "windup" | "active" | "recovery";

/** Per-design accent: black cat strikes in crimson, orange cat in gold. */
export function fatCatAccent(variant: CatGuardVariant): { core: string; glow: string } {
  return variant === "catBlack"
    ? { core: "#ff3b3b", glow: "rgba(255,40,60," }
    : { core: "#ffc23a", glow: "rgba(255,190,50," };
}

export function fatCatPhase(move: CatGuardMove, stateTimer: number): FatCatPhase {
  const spec = CAT_GUARD_MOVES[move];
  if (stateTimer > spec.activeFrom) return "windup";
  if (stateTimer >= spec.activeTo) return "active";
  return "recovery";
}

/** Short shout shown when a Fat Cat strike lands on Waldoge. */
export const FAT_CAT_STRIKE_CALLS: Record<CatGuardMove, string> = {
  lightPunch: "SWIPE!",
  heavyPunch: "FAT PAW!",
  frontKick: "BELLY KICK!",
  roundhouse: "TAIL WHIP!",
  cartwheel: "CAT WHEEL!",
};

/** Screen-space hit shake/squash for the sprite while it reels. */
export function fatCatHitOffset(e: FatCatFxView): { dx: number; squash: number } {
  const flash = e.catHitFlash ?? 0;
  if (flash <= 0) return { dx: 0, squash: 1 };
  return { dx: (flash % 2 === 0 ? 1 : -1) * Math.min(4, flash * 0.5), squash: 1 - Math.min(0.08, flash * 0.008) };
}

/** Behind-sprite layer: wind-up telegraph under the feet. */
export function drawFatCatTelegraph(ctx: CanvasRenderingContext2D, e: FatCatFxView, sx: number): void {
  if (!e.catMove || e.state === "dead" || e.state === "hit") return;
  const spec = CAT_GUARD_MOVES[e.catMove];
  if (fatCatPhase(e.catMove, e.stateTimer) !== "windup") return;
  const charge = 1 - (e.stateTimer - spec.activeFrom) / Math.max(1, spec.duration - spec.activeFrom);
  const { core, glow } = fatCatAccent(e.variant);
  const reach = spec.range * (0.4 + charge * 0.6);
  ctx.save();
  ctx.globalAlpha = 0.25 + charge * 0.45;
  ctx.fillStyle = `${glow}0.35)`;
  ctx.strokeStyle = core;
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Cartwheel telegraphs all around; the rest point where the blow will land.
  if (e.catMove === "cartwheel") ctx.ellipse(sx, e.y + 2, reach, 7, 0, 0, Math.PI * 2);
  else ctx.ellipse(sx + e.facing * reach * 0.55, e.y + 2, reach * 0.6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Heavy moves flash a "!" over the head right before they fire.
  if (charge > 0.6 && (e.catMove === "heavyPunch" || e.catMove === "roundhouse" || e.catMove === "cartwheel")) {
    ctx.globalAlpha = 1;
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = core;
    const y = e.y - e.height * 1.9 - 18;
    ctx.strokeText("!", sx, y);
    ctx.fillText("!", sx, y);
  }
  ctx.restore();
}

/** In-front layer: move-specific strike smear plus white hit flash burst. */
export function drawFatCatStrike(ctx: CanvasRenderingContext2D, e: FatCatFxView, sx: number): void {
  const h = e.height * 1.9;
  if (e.catMove && e.state !== "dead" && e.state !== "hit") {
    const spec = CAT_GUARD_MOVES[e.catMove];
    const phase = fatCatPhase(e.catMove, e.stateTimer);
    if (phase !== "windup") {
      const t = phase === "active"
        ? 1 - (e.stateTimer - spec.activeTo) / Math.max(1, spec.activeFrom - spec.activeTo)
        : 1;
      const fade = phase === "active" ? 1 : Math.max(0, e.stateTimer / Math.max(1, spec.activeTo));
      const { core, glow } = fatCatAccent(e.variant);
      const f = e.facing;
      ctx.save();
      ctx.globalAlpha = 0.9 * fade;
      ctx.lineCap = "round";
      ctx.shadowColor = core;
      ctx.shadowBlur = 10;
      switch (e.catMove) {
        case "lightPunch":
        case "heavyPunch": {
          // Paw jab: straight streaks at shoulder height; heavy adds claw marks.
          const y = e.y - h * 0.62;
          const len = spec.range * (0.5 + t * 0.5);
          ctx.strokeStyle = `${glow}0.85)`;
          ctx.lineWidth = e.catMove === "heavyPunch" ? 7 : 4;
          ctx.beginPath();
          ctx.moveTo(sx + f * 10, y);
          ctx.lineTo(sx + f * (10 + len), y);
          ctx.stroke();
          if (e.catMove === "heavyPunch") {
            ctx.strokeStyle = core;
            ctx.lineWidth = 2.5;
            for (let i = -1; i <= 1; i++) {
              ctx.beginPath();
              ctx.moveTo(sx + f * (len - 4), y + i * 8 - 6);
              ctx.lineTo(sx + f * (len + 12), y + i * 8 + 6);
              ctx.stroke();
            }
          }
          break;
        }
        case "frontKick": {
          // Belly-first shove: a thick horizontal wedge at hip height.
          const y = e.y - h * 0.38;
          const len = spec.range * (0.4 + t * 0.6);
          ctx.fillStyle = `${glow}0.55)`;
          ctx.beginPath();
          ctx.moveTo(sx + f * 8, y - 10);
          ctx.lineTo(sx + f * (8 + len), y);
          ctx.lineTo(sx + f * 8, y + 10);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "roundhouse": {
          // Wide sweeping arc from behind the head to the front.
          const cy = e.y - h * 0.5;
          ctx.strokeStyle = `${glow}0.8)`;
          ctx.lineWidth = 6;
          ctx.beginPath();
          const start = f > 0 ? -Math.PI * 0.9 : -Math.PI * 0.1;
          const sweep = Math.PI * 0.9 * t * (f > 0 ? 1 : -1);
          ctx.arc(sx, cy, spec.range * 0.75, start, start + sweep, f < 0);
          ctx.stroke();
          break;
        }
        case "cartwheel": {
          // Spinning whirl ring with rotating spokes.
          const cy = e.y - h * 0.45;
          const r = spec.range * 0.6;
          ctx.strokeStyle = `${glow}0.75)`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(sx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = core;
          ctx.lineWidth = 2;
          const spin = (spec.duration - e.stateTimer) * 0.45 * f;
          for (let i = 0; i < 4; i++) {
            const a = spin + (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(sx, cy, r, a, a + 0.5);
            ctx.stroke();
          }
          break;
        }
      }
      ctx.restore();
    }
  }

  // Hit feedback: starburst and white slash where Waldoge connected.
  const flash = e.catHitFlash ?? 0;
  if (flash > 0 && e.state !== "dead") {
    const p = flash / 10;
    const cy = e.y - h * 0.55;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p + 0.2);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = fatCatAccent(e.variant).core;
    ctx.lineWidth = 2;
    const r = 10 + (1 - p) * 16;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const px = sx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

/** White silhouette flash over the sprite (drawn into a scratch canvas). */
let scratch: HTMLCanvasElement | null = null;
export function flashCanvas(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width < w) scratch.width = w;
  if (scratch.height < h) scratch.height = h;
  const c = scratch.getContext("2d");
  if (!c) return null;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, scratch.width, scratch.height);
  return c;
}
export function flashScratch(): HTMLCanvasElement | null { return scratch; }
