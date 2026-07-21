/**
 * Pure camera math. No canvas, no DOM, no React.
 *
 * The 2D game uses a scalar `camX` that scrolls with the player and biases
 * every world-to-screen transform (`sx = worldX - camX`). A future 3D scene
 * will use a `THREE.PerspectiveCamera` position instead — but the *targeting*
 * rules (predictive look-ahead, dead-zone follow, clamp to level bounds)
 * are identical. Keep the math here so both renderers share behaviour.
 *
 * Design notes for the future 3D migration:
 *   • Treat the returned scalar as `camera.position.x` in the 3D scene.
 *   • Predictive look-ahead becomes yaw or position offset along XZ.
 *   • The clamp to `levelWidth` maps to a `Box3` constraint on the rig.
 */

/** Configuration mirrors the two presets currently in StreetBrawler. */
export interface CameraPreset {
  /** 0..1 — how aggressively the camera chases the target each frame. */
  followLerp: number;
  /** World units of predictive look-ahead in the player's facing direction. */
  lookAhead: number;
  /** Half-width of the dead-zone (no movement while player stays inside). */
  deadZone: number;
}

export const CAMERA_PRESETS = {
  snappy:  { followLerp: 0.18, lookAhead: 120, deadZone: 40 },
  buttery: { followLerp: 0.08, lookAhead: 180, deadZone: 90 },
} as const satisfies Record<string, CameraPreset>;

export type CameraPresetName = keyof typeof CAMERA_PRESETS;

export interface CameraTargetInput {
  playerX: number;
  playerFacing: 1 | -1;
  /** Current camera scalar (world X of the left edge of the viewport). */
  currentCamX: number;
  /** Viewport width in world units. */
  viewportWidth: number;
  /** Total level width in world units. */
  levelWidth: number;
  preset: CameraPreset;
}

/** Compute the ideal target camera X, then lerp toward it, then clamp. */
export function computeCameraX(input: CameraTargetInput): number {
  const { playerX, playerFacing, currentCamX, viewportWidth, levelWidth, preset } = input;
  // Predict where we want to look: player centre + look-ahead in facing dir.
  const desiredCentre = playerX + playerFacing * preset.lookAhead;
  const desiredLeft = desiredCentre - viewportWidth / 2;
  // Dead-zone: only pull toward the desired position when outside the band.
  const delta = desiredLeft - currentCamX;
  const withinDeadZone = Math.abs(delta) <= preset.deadZone;
  const targeted = withinDeadZone
    ? currentCamX
    : currentCamX + delta * preset.followLerp;
  // Clamp to level bounds.
  const maxCamX = Math.max(0, levelWidth - viewportWidth);
  return Math.min(Math.max(targeted, 0), maxCamX);
}

/** World-to-screen scalar transform. In 3D this collapses to identity when
 *  the camera itself moves in world space; kept for the 2D renderer. */
export function worldToScreenX(worldX: number, camX: number): number {
  return worldX - camX;
}
