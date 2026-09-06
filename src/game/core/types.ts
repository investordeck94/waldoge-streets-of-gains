/**
 * Engine-agnostic core types.
 *
 * These mirror the shape of the interfaces currently inlined at the top of
 * `src/components/StreetBrawler.tsx`, but are stripped of any rendering
 * assumptions. They deliberately use *world* coordinates (no `camX` bias,
 * no pixel units baked in) so the same entity can be drawn by:
 *
 *   • the current 2D canvas renderer (StreetBrawler.tsx)
 *   • a future 3D scene (@react-three/fiber) that maps `y` → world-up
 *   • headless tests / bot AI that only care about numbers
 *
 * The 2D pipeline continues to use its own copies of these interfaces to
 * keep the migration risk-free. New systems (quests, save data, 3D scene)
 * should import from here.
 */

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

/** 2D world position. In 3D this becomes the XZ plane; `y` maps to world-up. */
export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

/** Axis-aligned bounding box in world units. */
export interface AABB { x: number; y: number; width: number; height: number; }

/** Facing along the horizontal axis. In 3D this becomes the yaw sign. */
export type Facing = 1 | -1;

// ---------------------------------------------------------------------------
// Actor state (engine-agnostic)
// ---------------------------------------------------------------------------

export type ActorState =
  | "idle" | "walk" | "jump" | "punch" | "kick" | "hit" | "dead"
  | "uppercut" | "spinkick" | "groundpound" | "dashpunch"
  | "boss_charge" | "boss_slam" | "boss_throw";

/** Any moving fighter in the world (player / minion / boss). */
export interface Actor {
  x: number; y: number;         // world position (feet)
  vx: number; vy: number;       // world velocity
  width: number; height: number; // AABB extents
  facing: Facing;
  hp: number; maxHp: number;
  state: ActorState;
  stateTimer: number;            // frames since state change
  attackCooldown: number;
  isPlayer?: boolean;
  isBoss?: boolean;
  bossPhase?: number;
  aiTimer?: number;
  bossName?: string;
}

export interface Projectile {
  x: number; y: number; vx: number; vy: number;
  /** Frames remaining before despawn. */
  timer: number;
  isPlayerProjectile?: boolean;
  damage?: number;
  /** Renders as a BOOST/TRENDING marketing leaflet (MR MARKETER). */
  leaflet?: boolean;
}

export interface PowerUp {
  x: number; y: number; vy: number;
  type: "health" | "speed" | "energy" | "damage";
  /** Frames remaining before despawn. */
  timer: number;
}

/** Rendering-neutral platform description. Renderers decide the visuals. */
export interface Platform {
  x: number; y: number; width: number; height: number;
  /** Whether the platform can be jumped through from below. */
  jumpThrough: boolean;
}
