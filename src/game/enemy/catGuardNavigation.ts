/** Level-7-only Cat Guard ladder routing over authored collision objects. */
import {
  LADDER_GRAB_X, laddersFor, landingDecksFor, type Ladder,
} from "@/game/config/world";
import { GROUND_Y } from "@/game/config";
import type { CatGuardState } from "./catGuards";

const LEVEL = 6;
const SURFACE_TOLERANCE = 8;
export const CAT_LADDER_SPACING = 34;

export interface CatGuardClimbState extends CatGuardState {
  climbLadderId?: string;
  catClimbIntent?: "up" | "down";
}

export function catSurfaceIdAt(x: number, y: number): string | null {
  if (Math.abs(y - GROUND_Y) <= SURFACE_TOLERANCE) return "main";
  const deck = landingDecksFor(LEVEL).find((candidate) =>
    candidate.id && x >= candidate.x0 && x <= candidate.x1
      && Math.abs(y - candidate.y) <= SURFACE_TOLERANCE,
  );
  return deck?.id ?? null;
}

/** Breadth-first first hop through real deck/ladder connectivity. */
export function nextCatGuardLadder(fromSurface: string, toSurface: string, fromX = 0): Ladder | null {
  if (fromSurface === toSurface) return null;
  const ladders = laddersFor(LEVEL).filter((ladder) =>
    ladder.id && ladder.bottomSurfaceId && ladder.topSurfaceId,
  );
  const queue: Array<{ surface: string; first: Ladder | null; cost: number }> = [{ surface: fromSurface, first: null, cost: 0 }];
  const bestCost = new Map([[fromSurface, 0]]);
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (!current) break;
    if (current.surface === toSurface) return current.first;
    for (const ladder of ladders) {
      const next = ladder.bottomSurfaceId === current.surface ? ladder.topSurfaceId
        : ladder.topSurfaceId === current.surface ? ladder.bottomSurfaceId
        : null;
      if (!next) continue;
      const first = current.first ?? ladder;
      const cost = current.cost + 1 + (current.first ? 0 : Math.abs(ladder.x - fromX));
      if (cost >= (bestCost.get(next) ?? Infinity)) continue;
      bestCost.set(next, cost);
      queue.push({ surface: next, first, cost });
    }
  }
  return null;
}

export function validCatGuardMount(
  guard: CatGuardClimbState,
  ladder: Ladder,
  fromSurface: string,
  occupiedLadderIds: ReadonlySet<string>,
): boolean {
  if (guard.state === "dead" || guard.state === "hit" || guard.state === "punch" || guard.state === "kick" || guard.catMove) return false;
  if (!ladder.id || occupiedLadderIds.has(ladder.id)) return false;
  if (Math.abs(guard.x - ladder.x) > LADDER_GRAB_X) return false;
  const atBottom = ladder.bottomSurfaceId === fromSurface
    && Math.abs(guard.y - ladder.bottom) <= SURFACE_TOLERANCE;
  const atTop = ladder.topSurfaceId === fromSurface
    && Math.abs(guard.y - ladder.top) <= SURFACE_TOLERANCE;
  return atBottom || atTop;
}

export function occupyCatGuardLadder(guard: CatGuardClimbState, ladder: Ladder, fromSurface: string): void {
  guard.climbLadderId = ladder.id;
  guard.catClimbIntent = ladder.bottomSurfaceId === fromSurface ? "up" : "down";
}

export function clearCatGuardLadder(guard: CatGuardClimbState): void {
  guard.climbLadderId = undefined;
  guard.catClimbIntent = undefined;
}

/** Stable waiting point prevents two guards from visually merging at a ladder. */
export function catGuardWaitingX(ladder: Ladder, guardX: number): number {
  return ladder.x + (guardX <= ladder.x ? -CAT_LADDER_SPACING : CAT_LADDER_SPACING);
}

/** Deterministic same-surface separation; climbing guards retain ladder x. */
export function resolveCatGuardSpacing(guards: CatGuardClimbState[]): void {
  const ordered = guards
    .filter((guard) => guard.hp > 0
      && guard.state !== "dead"
      && guard.state !== "hit"
      && guard.state !== "punch"
      && guard.state !== "kick"
      && !guard.catMove
      && !guard.climbing)
    .sort((a, b) => a.x - b.x || (a.variant === "catBlack" ? -1 : 1));
  for (let index = 1; index < ordered.length; index++) {
    const left = ordered[index - 1];
    const right = ordered[index];
    if (catSurfaceIdAt(left.x, left.y) !== catSurfaceIdAt(right.x, right.y)) continue;
    const gap = right.x - left.x;
    if (gap >= CAT_LADDER_SPACING) continue;
    right.x += CAT_LADDER_SPACING - gap;
    right.vx = Math.max(0, right.vx);
  }
}
/** Minimal crowd member used for Level-7 mixed-faction separation. */
export interface CrowdMember {
  x: number; y: number; vx: number; hp: number; state: string;
  isBoss?: boolean; climbing?: boolean; catMove?: unknown;
}

const CROWD_SPACING = 30;

/**
 * Root-cause fix for merged sprites: Cat Guards and Candle Minions all converge
 * on the player's x and previously only Cat-vs-Cat pairs were separated, so a
 * guard and a minion could share the exact same pixels. Every living, grounded,
 * non-boss enemy on the same surface now keeps a body-width gap. Attacking,
 * staggered or climbing enemies are immovable anchors (never displaced), so
 * strikes, hit reactions and ladder occupancy are untouched.
 */
export function resolveCitadelCrowdSpacing(members: CrowdMember[]): void {
  const alive = members.filter((m) => !m.isBoss && m.hp > 0 && m.state !== "dead" && !m.climbing);
  const movable = (m: CrowdMember) => m.state !== "hit" && m.state !== "punch" && m.state !== "kick" && !m.catMove;
  const bySurface = new Map<string, CrowdMember[]>();
  for (const m of alive) {
    const id = catSurfaceIdAt(m.x, m.y) ?? `air:${Math.round(m.y)}`;
    if (id.startsWith("air:")) continue; // airborne bodies resolve after landing
    const list = bySurface.get(id) ?? [];
    list.push(m);
    bySurface.set(id, list);
  }
  for (const list of bySurface.values()) {
    list.sort((a, b) => a.x - b.x);
    for (let i = 1; i < list.length; i++) {
      const left = list[i - 1];
      const right = list[i];
      const deficit = CROWD_SPACING - (right.x - left.x);
      if (deficit <= 0) continue;
      if (movable(right)) { right.x += deficit; right.vx = Math.max(0, right.vx); }
      else if (movable(left)) { left.x -= deficit; left.vx = Math.min(0, left.vx); }
    }
  }
}
