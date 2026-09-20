/** Cached, state-driven renderer for the supplied Cat Guard production sheets. */
import blackSheet from "@/assets/cat-guard-black-production.png.asset.json";
import orangeSheet from "@/assets/cat-guard-orange-production.png.asset.json";
import { renderNow } from "./clock";
import { CAT_GUARD_MOVES, type CatGuardMove, type CatGuardVariant } from "@/game/enemy/catGuards";

export const CAT_GUARD_ASSETS = {
  catBlack: blackSheet.url,
  catOrange: orangeSheet.url,
} as const;

interface Group { x: number; y: number; w: number; h: number; count: number }
interface Frame { x: number; y: number; w: number; h: number; index: number; count: number }
type Pose = "idle" | "walk" | "run" | CatGuardMove | "hit" | "defeat" | "climb";

export const CAT_GUARD_GROUPS: Record<CatGuardVariant, Record<Pose, Group>> = {
  catBlack: {
    idle: { x: 0, y: 34, w: 286, h: 177, count: 4 },
    walk: { x: 290, y: 34, w: 420, h: 177, count: 6 },
    run: { x: 710, y: 34, w: 826, h: 177, count: 6 },
    lightPunch: { x: 0, y: 260, w: 290, h: 163, count: 4 },
    heavyPunch: { x: 290, y: 260, w: 295, h: 163, count: 4 },
    frontKick: { x: 585, y: 260, w: 280, h: 163, count: 4 },
    roundhouse: { x: 865, y: 260, w: 671, h: 163, count: 4 },
    cartwheel: { x: 0, y: 467, w: 1536, h: 153, count: 8 },
    hit: { x: 0, y: 661, w: 335, h: 147, count: 4 },
    defeat: { x: 335, y: 661, w: 415, h: 147, count: 4 },
    climb: { x: 750, y: 661, w: 786, h: 147, count: 6 },
  },
  catOrange: {
    idle: { x: 0, y: 128, w: 395, h: 163, count: 4 },
    walk: { x: 395, y: 128, w: 640, h: 163, count: 6 },
    run: { x: 1035, y: 128, w: 501, h: 163, count: 6 },
    lightPunch: { x: 0, y: 345, w: 470, h: 167, count: 4 },
    heavyPunch: { x: 470, y: 345, w: 570, h: 167, count: 5 },
    frontKick: { x: 1040, y: 345, w: 496, h: 167, count: 4 },
    roundhouse: { x: 0, y: 558, w: 390, h: 179, count: 5 },
    cartwheel: { x: 390, y: 558, w: 1146, h: 179, count: 8 },
    hit: { x: 0, y: 775, w: 470, h: 187, count: 4 },
    defeat: { x: 470, y: 775, w: 670, h: 187, count: 6 },
    climb: { x: 1140, y: 775, w: 396, h: 236, count: 6 },
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
    image.src = CAT_GUARD_ASSETS[variant];
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
  variant: CatGuardVariant; catMove?: CatGuardMove;
}

export function catGuardPoseFor(e: CatGuardSpriteView): Pose {
  if (e.state === "dead") return "defeat";
  if (e.state === "hit") return "hit";
  if (e.climbing) return "climb";
  if (e.catMove) return e.catMove;
  if (e.state === "walk") return Math.abs(e.vx ?? 0) > 2.5 ? "run" : "walk";
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
  const width = group.w / group.count;
  return { x: group.x + width * index, y: group.y, w: width, h: group.h, index, count: group.count };
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
  const visualHeight = e.height * 1.9;
  const scale = visualHeight / frame.h;
  const drawWidth = frame.w * scale;

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
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, -drawWidth / 2, -visualHeight, drawWidth, visualHeight);
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