/**
 * Barrel for the engine-agnostic game core.
 *
 * Import from `@/game/core` — do not deep-import individual files from
 * outside this folder so we can reorganise internals freely.
 */

export * from "./types";
export * from "./aabb";
export * from "./camera";
export * from "./physics";
export * from "./anim";
