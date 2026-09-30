/** Cached, state-driven renderer for the supplied Cat Guard production sheets. */
import blackSheet from "@/assets/cat-guard-black-production.png.asset.json";
import orangeSheet from "@/assets/cat-guard-orange-production.png.asset.json";
import blackRuntimeSheet from "@/assets/cat-guard-black-clean.png";
import orangeRuntimeSheet from "@/assets/cat-guard-orange-clean.png";
import { renderNow } from "./clock";
import { CAT_GUARD_MOVES, type CatGuardMove, type CatGuardVariant } from "@/game/enemy/catGuards";

export const CAT_GUARD_ASSETS = {
  catBlack: blackSheet.url,
  catOrange: orangeSheet.url,
} as const;

const CAT_GUARD_RUNTIME_ASSETS: Record<CatGuardVariant, string> = {
  catBlack: blackRuntimeSheet,
  catOrange: orangeRuntimeSheet,
};

export const CAT_GUARD_OUTFITS = {
  catBlack: "BLACK TRACKSUIT + RED/GOLD DETAILS",
  catOrange: "WHITE TRACKSUIT + GOLD STRIPES",
} as const;

export interface CatGuardFrame {
  x: number; y: number; w: number; h: number;
  /** Feet location inside this source rectangle. */
  anchorX: number; anchorY: number;
  /** Authored destination scale relative to the variant's reference row. */
  scale: number;
}
interface Group { frames: readonly CatGuardFrame[]; count: number }
interface Frame extends CatGuardFrame { index: number; count: number }
type Pose = "idle" | "walk" | "run" | CatGuardMove | "hit" | "defeat" | "climb";

/**
 * Explicit source cells measured from the supplied 1536×1024 sheets. The
 * artwork has irregular horizontal spacing, so no region/count division is
 * permitted here. Anchors are source-space feet positions and remain fixed at
 * the entity's authoritative world x/y regardless of crop size or facing.
 */
const group = (sourceFrames: readonly CatGuardFrame[]): Group => ({ frames: sourceFrames, count: sourceFrames.length });

export const CAT_GUARD_SHEET_SIZE: Record<CatGuardVariant, { width: number; height: number }> = {
  catBlack: { width: 1350, height: 1609 },
  catOrange: { width: 1092, height: 1623 },
};

/** Clean per-pose atlases extracted from the two original production sheets. */
export const CAT_GUARD_GROUPS: Record<CatGuardVariant, Record<Pose, Group>> = {
  catBlack: {
    idle: group([{ x: 0, y: 0, w: 102, h: 179, anchorX: 56.1, anchorY: 179, scale: 1 }, { x: 106, y: 0, w: 88, h: 179, anchorX: 44.2, anchorY: 179, scale: 1 }, { x: 198, y: 0, w: 102, h: 179, anchorX: 56.3, anchorY: 179, scale: 1 }, { x: 304, y: 0, w: 106, h: 179, anchorX: 59.4, anchorY: 179, scale: 1 }]),
    walk: group([{ x: 0, y: 183, w: 94, h: 177, anchorX: 53.5, anchorY: 177, scale: 1 }, { x: 98, y: 183, w: 104, h: 177, anchorX: 63.8, anchorY: 177, scale: 1 }, { x: 206, y: 183, w: 120, h: 177, anchorX: 73.7, anchorY: 177, scale: 1 }, { x: 330, y: 183, w: 103, h: 178, anchorX: 63.9, anchorY: 178, scale: 1 }, { x: 437, y: 183, w: 100, h: 177, anchorX: 60.3, anchorY: 177, scale: 1 }, { x: 541, y: 183, w: 107, h: 180, anchorX: 63.0, anchorY: 180, scale: 1 }]),
    run: group([{ x: 0, y: 367, w: 94, h: 177, anchorX: 29.2, anchorY: 177, scale: 1 }, { x: 98, y: 367, w: 101, h: 173, anchorX: 25.5, anchorY: 173, scale: 1 }, { x: 203, y: 367, w: 108, h: 171, anchorX: 26.4, anchorY: 171, scale: 1 }, { x: 315, y: 367, w: 121, h: 167, anchorX: 22.2, anchorY: 167, scale: 1 }, { x: 440, y: 367, w: 120, h: 170, anchorX: 21.9, anchorY: 170, scale: 1 }, { x: 564, y: 367, w: 120, h: 172, anchorX: 23.2, anchorY: 172, scale: 1 }]),
    lightPunch: group([{ x: 0, y: 548, w: 98, h: 166, anchorX: 40.6, anchorY: 166, scale: 1 }, { x: 102, y: 548, w: 111, h: 166, anchorX: 46.9, anchorY: 166, scale: 1 }, { x: 217, y: 548, w: 113, h: 163, anchorX: 56.7, anchorY: 163, scale: 1 }, { x: 334, y: 548, w: 106, h: 163, anchorX: 55.6, anchorY: 163, scale: 1 }]),
    heavyPunch: group([{ x: 0, y: 718, w: 95, h: 163, anchorX: 46.2, anchorY: 163, scale: 1 }, { x: 99, y: 718, w: 114, h: 166, anchorX: 52.2, anchorY: 166, scale: 1 }, { x: 217, y: 718, w: 112, h: 164, anchorX: 56.1, anchorY: 164, scale: 1 }, { x: 333, y: 718, w: 100, h: 163, anchorX: 51.4, anchorY: 163, scale: 1 }]),
    frontKick: group([{ x: 0, y: 888, w: 91, h: 166, anchorX: 51.9, anchorY: 166, scale: 1 }, { x: 95, y: 888, w: 131, h: 163, anchorX: 59.7, anchorY: 163, scale: 1 }, { x: 230, y: 888, w: 91, h: 166, anchorX: 38.6, anchorY: 166, scale: 1 }, { x: 325, y: 888, w: 88, h: 166, anchorX: 52.1, anchorY: 166, scale: 1 }]),
    roundhouse: group([{ x: 0, y: 1058, w: 100, h: 166, anchorX: 44.2, anchorY: 166, scale: 1 }, { x: 104, y: 1058, w: 119, h: 166, anchorX: 61.7, anchorY: 166, scale: 1 }, { x: 227, y: 1058, w: 119, h: 166, anchorX: 58.3, anchorY: 166, scale: 1 }, { x: 350, y: 1058, w: 104, h: 165, anchorX: 28.1, anchorY: 165, scale: 1 }]),
    cartwheel: group([{ x: 0, y: 1228, w: 148, h: 149, anchorX: 75.9, anchorY: 149, scale: 1 }, { x: 152, y: 1228, w: 171, h: 150, anchorX: 94.6, anchorY: 150, scale: 1 }, { x: 327, y: 1228, w: 208, h: 147, anchorX: 80.8, anchorY: 147, scale: 1 }, { x: 539, y: 1228, w: 171, h: 159, anchorX: 42.1, anchorY: 159, scale: 1 }, { x: 714, y: 1228, w: 142, h: 158, anchorX: 71.7, anchorY: 158, scale: 1 }, { x: 860, y: 1228, w: 220, h: 159, anchorX: 151.4, anchorY: 159, scale: 1 }, { x: 1084, y: 1228, w: 138, h: 148, anchorX: 87.7, anchorY: 148, scale: 1 }, { x: 1226, y: 1228, w: 120, h: 145, anchorX: 60.5, anchorY: 145, scale: 1 }]),
    hit: group([{ x: 0, y: 1391, w: 101, h: 146, anchorX: 39.7, anchorY: 146, scale: 1 }, { x: 105, y: 1391, w: 109, h: 146, anchorX: 61.4, anchorY: 146, scale: 1 }, { x: 218, y: 1391, w: 122, h: 126, anchorX: 69.4, anchorY: 126, scale: 1 }, { x: 344, y: 1391, w: 117, h: 110, anchorX: 61.7, anchorY: 110, scale: 1 }]),
    defeat: group([{ x: 0, y: 1541, w: 132, h: 64, anchorX: 62.4, anchorY: 64, scale: 1 }, { x: 136, y: 1541, w: 145, h: 62, anchorX: 58.2, anchorY: 62, scale: 1 }, { x: 285, y: 1541, w: 130, h: 57, anchorX: 57.7, anchorY: 57, scale: 1 }, { x: 419, y: 1541, w: 143, h: 56, anchorX: 61.7, anchorY: 56, scale: 1 }]),
    climb: group([{ x: 0, y: 183, w: 94, h: 177, anchorX: 53.5, anchorY: 177, scale: 1 }, { x: 98, y: 183, w: 104, h: 177, anchorX: 63.8, anchorY: 177, scale: 1 }, { x: 206, y: 183, w: 120, h: 177, anchorX: 73.7, anchorY: 177, scale: 1 }, { x: 330, y: 183, w: 103, h: 178, anchorX: 63.9, anchorY: 178, scale: 1 }, { x: 437, y: 183, w: 100, h: 177, anchorX: 60.3, anchorY: 177, scale: 1 }, { x: 541, y: 183, w: 107, h: 180, anchorX: 63.0, anchorY: 180, scale: 1 }]),
  },
  catOrange: {
    idle: group([{ x: 0, y: 0, w: 116, h: 156, anchorX: 69.4, anchorY: 156, scale: 1 }, { x: 120, y: 0, w: 88, h: 160, anchorX: 42.7, anchorY: 160, scale: 1 }, { x: 212, y: 0, w: 85, h: 160, anchorX: 39.0, anchorY: 160, scale: 1 }, { x: 301, y: 0, w: 98, h: 157, anchorX: 50.3, anchorY: 157, scale: 1 }]),
    walk: group([{ x: 0, y: 164, w: 113, h: 163, anchorX: 66.6, anchorY: 163, scale: 1 }, { x: 117, y: 164, w: 124, h: 163, anchorX: 72.3, anchorY: 163, scale: 1 }, { x: 245, y: 164, w: 119, h: 160, anchorX: 75.6, anchorY: 160, scale: 1 }, { x: 368, y: 164, w: 105, h: 160, anchorX: 61.9, anchorY: 160, scale: 1 }, { x: 477, y: 164, w: 102, h: 161, anchorX: 65.0, anchorY: 161, scale: 1 }, { x: 583, y: 164, w: 108, h: 160, anchorX: 66.7, anchorY: 160, scale: 1 }]),
    run: group([{ x: 0, y: 331, w: 144, h: 157, anchorX: 62.3, anchorY: 157, scale: 1 }, { x: 148, y: 331, w: 120, h: 155, anchorX: 26.6, anchorY: 155, scale: 1 }, { x: 272, y: 331, w: 131, h: 158, anchorX: 42.9, anchorY: 158, scale: 1 }, { x: 407, y: 331, w: 134, h: 157, anchorX: 38.0, anchorY: 157, scale: 1 }]),
    lightPunch: group([{ x: 0, y: 493, w: 115, h: 162, anchorX: 63.2, anchorY: 162, scale: 1 }, { x: 119, y: 493, w: 107, h: 159, anchorX: 58.7, anchorY: 159, scale: 1 }, { x: 230, y: 493, w: 110, h: 159, anchorX: 58.7, anchorY: 159, scale: 1 }, { x: 344, y: 493, w: 146, h: 157, anchorX: 85.9, anchorY: 157, scale: 1 }]),
    heavyPunch: group([{ x: 0, y: 659, w: 142, h: 158, anchorX: 61.7, anchorY: 158, scale: 1 }, { x: 146, y: 659, w: 138, h: 150, anchorX: 55.1, anchorY: 150, scale: 1 }, { x: 288, y: 659, w: 111, h: 160, anchorX: 59.8, anchorY: 160, scale: 1 }, { x: 403, y: 659, w: 138, h: 152, anchorX: 64.8, anchorY: 152, scale: 1 }, { x: 545, y: 659, w: 124, h: 146, anchorX: 70.5, anchorY: 146, scale: 1 }]),
    frontKick: group([{ x: 0, y: 823, w: 126, h: 166, anchorX: 72.6, anchorY: 166, scale: 1 }, { x: 130, y: 823, w: 131, h: 167, anchorX: 86.0, anchorY: 167, scale: 1 }, { x: 265, y: 823, w: 136, h: 162, anchorX: 67.6, anchorY: 162, scale: 1 }, { x: 405, y: 823, w: 122, h: 165, anchorX: 67.1, anchorY: 165, scale: 1 }]),
    roundhouse: group([{ x: 0, y: 994, w: 119, h: 167, anchorX: 59.2, anchorY: 167, scale: 1 }, { x: 123, y: 994, w: 142, h: 168, anchorX: 72.7, anchorY: 168, scale: 1 }, { x: 269, y: 994, w: 144, h: 168, anchorX: 84.5, anchorY: 168, scale: 1 }, { x: 417, y: 994, w: 157, h: 166, anchorX: 66.7, anchorY: 166, scale: 1 }]),
    cartwheel: group([{ x: 0, y: 1166, w: 144, h: 118, anchorX: 53.6, anchorY: 118, scale: 1 }, { x: 148, y: 1166, w: 170, h: 142, anchorX: 93.0, anchorY: 142, scale: 1 }, { x: 322, y: 1166, w: 118, h: 174, anchorX: 31.2, anchorY: 174, scale: 1 }, { x: 444, y: 1166, w: 161, h: 157, anchorX: 64.6, anchorY: 157, scale: 1 }, { x: 609, y: 1166, w: 183, h: 160, anchorX: 54.2, anchorY: 160, scale: 1 }, { x: 796, y: 1166, w: 156, h: 150, anchorX: 90.8, anchorY: 150, scale: 1 }, { x: 956, y: 1166, w: 132, h: 181, anchorX: 66.3, anchorY: 181, scale: 1 }]),
    hit: group([{ x: 0, y: 1351, w: 114, h: 148, anchorX: 67.6, anchorY: 148, scale: 1 }, { x: 118, y: 1351, w: 113, h: 146, anchorX: 68.5, anchorY: 146, scale: 1 }, { x: 235, y: 1351, w: 106, h: 130, anchorX: 57.9, anchorY: 130, scale: 1 }, { x: 345, y: 1351, w: 113, h: 139, anchorX: 71.9, anchorY: 139, scale: 1 }]),
    defeat: group([{ x: 0, y: 1503, w: 144, h: 116, anchorX: 57.8, anchorY: 116, scale: 1 }, { x: 148, y: 1503, w: 141, h: 88, anchorX: 81.3, anchorY: 88, scale: 1 }, { x: 293, y: 1503, w: 154, h: 81, anchorX: 79.4, anchorY: 81, scale: 1 }, { x: 451, y: 1503, w: 163, h: 67, anchorX: 77.1, anchorY: 67, scale: 1 }]),
    climb: group([{ x: 0, y: 164, w: 113, h: 163, anchorX: 66.6, anchorY: 163, scale: 1 }, { x: 117, y: 164, w: 124, h: 163, anchorX: 72.3, anchorY: 163, scale: 1 }, { x: 245, y: 164, w: 119, h: 160, anchorX: 75.6, anchorY: 160, scale: 1 }, { x: 368, y: 164, w: 105, h: 160, anchorX: 61.9, anchorY: 160, scale: 1 }, { x: 477, y: 164, w: 102, h: 161, anchorX: 65.0, anchorY: 161, scale: 1 }, { x: 583, y: 164, w: 108, h: 160, anchorX: 66.7, anchorY: 160, scale: 1 }]),
  },
};

const images: Partial<Record<CatGuardVariant, HTMLImageElement>> = {};
const ready: Partial<Record<CatGuardVariant, boolean>> = {};
const retries: Partial<Record<CatGuardVariant, number>> = {};


export function validateCatGuardFrames(): readonly string[] {
  const issues: string[] = [];
  for (const variant of Object.keys(CAT_GUARD_GROUPS) as CatGuardVariant[]) {
    for (const [pose, authored] of Object.entries(CAT_GUARD_GROUPS[variant])) {
      if (authored.count !== authored.frames.length || authored.count === 0) {
        issues.push(`${variant}.${pose}: invalid frame count`);
      }
      authored.frames.forEach((frame, index) => {
        if (frame.x < 0 || frame.y < 0 || frame.w <= 0 || frame.h <= 0
          || frame.x + frame.w > CAT_GUARD_SHEET_SIZE[variant].width
          || frame.y + frame.h > CAT_GUARD_SHEET_SIZE[variant].height) {
          issues.push(`${variant}.${pose}[${index}]: source rectangle out of bounds`);
        }
        if (!Number.isFinite(frame.anchorX) || !Number.isFinite(frame.anchorY)
          || frame.anchorX < 0 || frame.anchorX > frame.w || frame.anchorY !== frame.h) {
          issues.push(`${variant}.${pose}[${index}]: invalid feet anchor`);
        }
      });
    }
  }
  return issues;
}

function imageFor(variant: CatGuardVariant): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!images[variant]) {
    const image = new Image();
    image.decoding = "sync";
    image.onload = () => {
      const size = CAT_GUARD_SHEET_SIZE[variant];
      ready[variant] = image.naturalWidth === size.width && image.naturalHeight === size.height;
      if (ready[variant]) retries[variant] = 0;
    };
    image.onerror = () => {
      ready[variant] = false;
      if ((retries[variant] ?? 0) >= 2) return;
      retries[variant] = (retries[variant] ?? 0) + 1;
      images[variant] = undefined;
      window.setTimeout(() => imageFor(variant), 80 * (retries[variant] ?? 1));
    };
    // Local bundled copies are the persistent runtime source. The CDN pointers
    // above retain immutable provenance for the exact user-supplied sheets.
    image.src = CAT_GUARD_RUNTIME_ASSETS[variant];
    images[variant] = image;
  }
  const image = images[variant];
  return image && ready[variant] && image.complete && image.naturalWidth > 0 ? image : null;
}

export function preloadCatGuardSprites(): void {
  imageFor("catBlack");
  imageFor("catOrange");
}

export interface CatGuardSpriteView {
  x: number; y: number; height: number; facing: number; state: string;
  stateTimer: number; hp: number; maxHp: number; vx?: number; climbing?: boolean;
  variant: CatGuardVariant; catMove?: CatGuardMove; catRunning?: boolean;
}

export function catGuardPoseFor(e: CatGuardSpriteView): Pose {
  if (e.state === "dead") return "defeat";
  if (e.state === "hit") return "hit";
  if (e.climbing) return "climb";
  if (e.catMove) return e.catMove;
  if (e.state === "walk") return e.catRunning ? "run" : "walk";
  return "idle";
}

export function catGuardFrameFor(e: CatGuardSpriteView, clock = renderNow()): Frame {
  const pose = catGuardPoseFor(e);
  const group = CAT_GUARD_GROUPS[e.variant][pose];
  let index: number;
  if (e.catMove) {
    const duration = CAT_GUARD_MOVES[e.catMove].duration;
    const elapsed = Math.max(0, duration - e.stateTimer);
    index = Math.min(group.count - 1, Math.floor(elapsed / (duration / group.count)));
  } else if (pose === "defeat" || pose === "hit") {
    index = Math.min(group.count - 1, Math.floor(Math.max(0, 60 - e.stateTimer) / Math.max(1, 60 / group.count)));
  } else {
    index = Math.floor(clock / (pose === "run" ? 75 : 115)) % group.count;
  }
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.min(group.count - 1, index)) : 0;
  const source = group.frames[safeIndex];
  if (!source) throw new Error(`Missing Cat Guard frame: ${e.variant}.${pose}[${safeIndex}]`);
  return { ...source, index: safeIndex, count: group.count };
}

export function drawCatGuardSprite(
  ctx: CanvasRenderingContext2D,
  e: CatGuardSpriteView,
  camX: number,
): boolean {
  const image = imageFor(e.variant);
  if (!image) return false;
  const frame = catGuardFrameFor(e);
  const sx = e.x - camX;
  const feetY = e.y;
  const referenceHeight = e.variant === "catBlack" ? 177 : 163;
  const visualHeight = e.height * 1.9;
  const scale = visualHeight / referenceHeight * frame.scale;
  const drawWidth = frame.w * scale;
  const drawHeight = frame.h * scale;

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(sx, feetY + 2, 21, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(sx, feetY);
  ctx.scale(e.facing, 1);
  if (e.state === "hit") ctx.globalAlpha = 0.88;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    image, frame.x, frame.y, frame.w, frame.h,
    -frame.anchorX * scale, -frame.anchorY * scale, drawWidth, drawHeight,
  );
  ctx.restore();

  if (e.state !== "dead") {
    const barW = 32;
    const y = feetY - visualHeight - 8;
    ctx.fillStyle = "#050505";
    ctx.fillRect(sx - barW / 2 - 1, y - 1, barW + 2, 5);
    ctx.fillStyle = e.variant === "catBlack" ? "#d31f2e" : "#d9a514";
    ctx.fillRect(sx - barW / 2, y, barW * Math.max(0, e.hp / e.maxHp), 3);
  }
  return true;
}