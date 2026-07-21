# game/assets — canonical asset registry

Single source of truth for every static asset the game uses. Owns the
seven boss-head `Image()` preloaders and the URL constants for music /
cover art / character sprites.

## Import path

```ts
import { IMAGE_URLS, AUDIO_URLS, jeetHeadImg /* ... */ } from "@/game/assets";
```

The legacy path `@/game/Assets` (capital A) is a deprecated re-export shim
kept until Phase 6 migrates `StreetBrawler.tsx` off it. See
`docs/DEPRECATIONS.md`.

## Preload semantics (do not change)

1. Import fires at module load. ES modules are evaluated once, eagerly.
2. `preload(src)` guards on `typeof window !== "undefined"` so SSR / Vite
   dep-graph traversal never touches `Image`.
3. Each boss-head allocates one `HTMLImageElement`, assigns `.src`
   synchronously, and does **not** await load. First paint may see
   `image.complete === false`; the renderer already handles that.
4. Timing is identical whether callers import from `@/game/assets` or
   from the deprecated `@/game/Assets` shim — the re-export is eager.

## What lives elsewhere

- `waldogeHead` lazy load is inside `StreetBrawler.tsx` because it binds
  its `onload` to a component ref. Do not move it here without a
  Phase-6+ migration.
- The audio `TRACKS` array is built inside the component so React
  re-mounts get fresh `Audio` elements. Only the URL constants live here.
