/**
 * Central game configuration — barrel export.
 *
 * Import from here in game code:
 *   import { LEVELS, GRAVITY } from "@/game/config";
 *
 * All values are strongly typed. See ./README.md for the per-file layout.
 */

export * from "./types";
export * from "./player";
export * from "./combat";
export * from "./powerups";
export * from "./environment";
export * from "./levels";
export * from "./difficulty";
