# Game Logic (`@/game/logic`)

Renderer-agnostic gameplay. This layer decides *what* happens; the
Presentation layer decides *how it looks*.

## Rules

1. **May import from `@/game/engine`.** That is the whole point.
2. **MUST NOT import from `@/game/presentation`** or from
   `@/components/StreetBrawler.tsx`. The dependency arrow points from
   Presentation → Logic → Engine, never the other way.
3. **No canvas, no `Audio`, no `document`.** If a gameplay event needs a
   sound or a particle, return it as data (an event / intent). The
   Presentation layer subscribes and plays it. (During the staged
   migration the loop still calls SFX directly — new code should not.)
4. **State stores are allowed.** `@/game/state` is the authoritative
   progression store. It is renderer-independent by design.
5. **Determinism where possible.** AI, damage calculations, and RNG-driven
   systems should accept a seeded RNG or explicit inputs so they can be
   simulated headlessly and replayed.

## What lives here

- `../player/Player.ts` — player entity factory + pure helpers.
- `../enemy/Enemy.ts` — enemy + boss factories + pure helpers.
- `../state/` — GameState store, save/load, migrations.
- `@/lib/fightMoves.ts`, `@/lib/fightStyles.ts` — move tables (pure data).

## What is *not* here yet, and why

The player update loop, enemy AI state machines, boss phases, projectile
integration, and combat resolution still live inside
`src/components/StreetBrawler.tsx`. They are interleaved with the
requestAnimationFrame closure, shared refs, and hit-pause timing. Moving
them without a staged extraction plan would risk reordering execution and
changing gameplay feel. They will be extracted in later phases behind
parity tests.

## Import shape

```ts
import { createPlayer, spawnBoss, useGameState, MOVE_SETS } from "@/game/logic";
```
