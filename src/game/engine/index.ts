/**
 * Engine Core — barrel.
 *
 * The Engine Core is the deterministic, engine-agnostic foundation of the
 * game. Modules re-exported here MUST:
 *   • have no dependency on React, the DOM, canvas, audio, or any browser API
 *   • have no dependency on the Presentation layer or on gameplay state
 *     ownership (they never call setState, never mutate global stores)
 *   • be pure and deterministic on their inputs
 *
 * Anything imported from `@/game/engine` must be safe to run in a Web Worker,
 * a Node test, or a future 3D renderer without modification.
 *
 * See ./README.md for the full boundary rules.
 */

// Pure math + shared types (world coordinates, AABB, actor shape).
export * from "../core";

// Shared tunables / config (physics constants, level tables, difficulty).
// Config is data-only and safe to expose to any layer.
export * from "../config";

// Vector helpers.
export * from "./vec";
