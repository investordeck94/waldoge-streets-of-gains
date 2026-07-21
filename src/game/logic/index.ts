/**
 * Game Logic — barrel.
 *
 * The Game Logic layer owns gameplay rules: player, enemies, combat data,
 * progression, save/load. It consumes the Engine Core but MUST NOT know
 * whether the game is drawn by a 2D canvas or a 3D scene.
 *
 * Rules:
 *   • May import from `@/game/engine` freely.
 *   • MUST NOT import from `@/components/StreetBrawler.tsx` or any
 *     `@/game/presentation` module.
 *   • MUST NOT touch canvas, audio, or DOM APIs directly. Trigger effects
 *     by returning intent (events) that the Presentation layer plays.
 *   • May own state stores (see `state/`) because gameplay state is
 *     renderer-independent.
 *
 * See ./README.md for the full boundary rules.
 */

// Entity factories + helpers (currently thin — most update code still lives
// in the Presentation loop; migration is intentionally staged).
export * from "../player/Player";
export * from "../enemy/Enemy";

// Combat rules — move/style tables. Pure data; safe for any renderer.
// `StyleName` is exported by both modules; re-export the fightStyles copy
// explicitly to avoid an ambiguous barrel re-export.
export * from "@/lib/fightMoves";
export { STYLES, type StyleName } from "@/lib/fightStyles";

// Progression, save/load, settings.
export * from "../state";
