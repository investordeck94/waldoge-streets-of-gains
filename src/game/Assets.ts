/**
 * @deprecated Import from `@/game/assets` instead. This module is a thin
 * re-export shim kept for backwards compatibility during the Phase 5
 * refactor. It will be removed once `StreetBrawler.tsx` migrates its
 * import site (Phase 6+). See `docs/DEPRECATIONS.md`.
 *
 * Behavioural note: because ES module re-exports are evaluated eagerly on
 * first import, the boss-head `new Image()` preloader in
 * `@/game/assets` fires at exactly the same tick whether callers import
 * from this shim or from the canonical path.
 */
export * from "@/game/assets";
