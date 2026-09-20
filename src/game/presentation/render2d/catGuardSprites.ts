/** Cached, state-driven renderer for the supplied Cat Guard production sheets. */
import blackSheet from "@/assets/cat-guard-black-production.png.asset.json";
import orangeSheet from "@/assets/cat-guard-orange-production.png.asset.json";
import blackRuntimeSheet from "@/assets/cat-guard-black-production-local.png";
import orangeRuntimeSheet from "@/assets/cat-guard-orange-production-local.png";
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
const frames = (y: number, h: number, bounds: readonly number[], scale = 1): readonly CatGuardFrame[] =>
  bounds.slice(0, -1).map((x, index) => {
    const w = bounds[index + 1] - x;
    return { x, y, w, h, anchorX: w / 2, anchorY: h, scale };
  });
const group = (sourceFrames: readonly CatGuardFrame[]): Group => ({ frames: sourceFrames, count: sourceFrames.length });

export const CAT_GUARD_GROUPS: Record<CatGuardVariant, Record<Pose, Group>> = {
  catBlack: {
    idle: group(frames(34, 177, [0, 72, 143, 215, 286])),
    // Locomotion begins after the red divider at x=382. Keeping these cells
    // inside the labelled WALK/RUN regions prevents that divider from looking
    // like a ladder attached to the guard during movement.
    walk: group(frames(34, 177, [386, 479, 572, 665, 758, 851, 944])),
    run: group(frames(34, 177, [947, 1045, 1143, 1241, 1339, 1437, 1536])),
    lightPunch: group(frames(260, 163, [0, 73, 147, 218, 290], 177 / 163)),
    heavyPunch: group(frames(260, 163, [290, 365, 440, 512, 585], 177 / 163)),
    frontKick: group(frames(260, 163, [585, 653, 724, 796, 865], 177 / 163)),
    // The sheet's labelled roundhouse cells overlap adjacent full bodies in
    // source space. Reuse its clean authored kick sequence so this move never
    // renders a second Cat Guard emerging from the attacker.
    roundhouse: group(frames(260, 163, [585, 653, 724, 796, 865], 177 / 163)),
    cartwheel: group(frames(467, 153, [0, 160, 358, 565, 733, 949, 1095, 1404, 1536], 177 / 153)),
    hit: group(frames(661, 147, [0, 84, 168, 251, 335], 177 / 147)),
    defeat: group(frames(661, 147, [335, 437, 577, 681, 750], 177 / 147)),
    climb: group(frames(661, 147, [750, 849, 1001, 1167, 1260, 1431, 1536], 177 / 147)),
  },
  catOrange: {
    idle: group(frames(128, 163, [0, 99, 198, 297, 395])),
    walk: group(frames(128, 163, [395, 503, 611, 720, 827, 933, 1035])),
    run: group(frames(128, 163, [1035, 1121, 1206, 1291, 1375, 1456, 1536])),
    lightPunch: group(frames(345, 167, [0, 117, 235, 352, 470], 163 / 167)),
    heavyPunch: group(frames(345, 167, [470, 584, 698, 812, 926, 1040], 163 / 167)),
    frontKick: group(frames(345, 167, [1040, 1160, 1282, 1408, 1536], 163 / 167)),
    roundhouse: group(frames(558, 179, [0, 105, 128, 251, 284, 390], 163 / 179)),
    cartwheel: group(frames(558, 179, [390, 543, 683, 845, 965, 1063, 1246, 1382, 1536], 163 / 179)),
    hit: group(frames(775, 187, [0, 109, 212, 330, 470], 163 / 187)),
    defeat: group(frames(775, 187, [470, 556, 695, 844, 925, 1013, 1140], 163 / 187)),
    climb: group(frames(775, 236, [1140, 1221, 1281, 1323, 1404, 1480, 1536], 163 / 236)),
  },
};

const images: Partial<Record<CatGuardVariant, HTMLImageElement>> = {};
const ready: Partial<Record<CatGuardVariant, boolean>> = {};

function imageFor(variant: CatGuardVariant): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!images[variant]) {
    const image = new Image();
    image.decoding = "sync";
    image.onload = () => { ready[variant] = true; };
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
  const source = group.frames[index] ?? group.frames[0];
  return { ...source, index, count: group.count };
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