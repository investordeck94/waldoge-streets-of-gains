/**
 * Melee strike resolution — pure geometry, no rendering, no gameplay mutation.
 *
 * WHY THIS EXISTS
 * The original close-range miss came from a *point* test:
 *
 *   dx = target.x - attacker.x
 *   hit = dx * facing > 0 && Math.abs(dx) < range
 *
 * That compares body CENTRES and requires the target centre to be strictly in
 * front of the attacker's centre. At very close range — and always when the two
 * fighters partially overlap — the target's centre can sit level with or a
 * fraction *behind* the attacker's centre while the fist is still buried in the
 * target's torso. `dx * facing > 0` then evaluates false and the visually
 * connecting punch registers nothing.
 *
 * THE FIX
 * Model the punch as the swept volume travelling from the attacker's shoulder
 * out to the fist tip, and test that box against the target's hurtbox as a real
 * AABB (so both bodies' widths participate). This is exactly the region the
 * glove passes through during the active frames — no inflation, no minimum
 * distance, no second phantom hitbox.
 */

/** Axis-aligned box in world units (x/y are the top-left corner). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A fighter as the strike solver sees it. `x` is the body centre, `y` the feet. */
export interface StrikeActor {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: 1 | -1;
}

/** Hurtbox of a fighter: centred on `x`, rising from the feet at `y`. */
export function hurtbox(a: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}): Box {
  const w = a.width ?? 30;
  const h = a.height ?? 70;
  return { x: a.x - w / 2, y: a.y - h, w, h };
}

/**
 * Swept box for the punching hand during the active frames.
 *
 * Horizontally it runs from the attacker's shoulder (their own centre) to the
 * fist tip at `reach` in the facing direction — the path the glove actually
 * travels. Vertically it covers the strike band around the torso.
 *
 * `verticalReach` matches the tolerance the previous distance check used, so
 * airborne / grounded pairings behave exactly as before.
 */
export function strikeBox(
  a: StrikeActor,
  reach: number,
  verticalReach = 50,
): Box {
  const tip = a.x + a.facing * reach;
  const left = Math.min(a.x, tip);
  const right = Math.max(a.x, tip);
  return {
    x: left,
    y: a.y - a.height - verticalReach * 0.2,
    w: right - left,
    h: a.height + verticalReach * 0.2,
  };
}

/** Omni-directional strike (ground pound) — a circle approximated as a box. */
export function radialStrikeBox(
  a: StrikeActor,
  reach: number,
  verticalReach = 60,
): Box {
  return {
    x: a.x - reach,
    y: a.y - a.height - verticalReach * 0.2,
    w: reach * 2,
    h: a.height + verticalReach * 0.2,
  };
}

/** Standard AABB overlap (touching edges do not count). */
export function boxesOverlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/**
 * Does the attacker's active strike connect with the target?
 *
 * `omni` = ground pound and other radial attacks.
 * `verticalTolerance` keeps parity with the previous feet-height check: targets
 * whose feet are further apart than this vertically are out of the plane.
 */
export function strikeConnects(
  attacker: StrikeActor,
  target: { x: number; y: number; width?: number; height?: number },
  reach: number,
  omni: boolean,
  verticalTolerance: number,
): boolean {
  if (Math.abs(target.y - attacker.y) >= verticalTolerance) return false;
  const box = omni
    ? radialStrikeBox(attacker, reach, verticalTolerance)
    : strikeBox(attacker, reach, verticalTolerance);
  return boxesOverlap(box, hurtbox(target));
}
