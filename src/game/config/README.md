# Game configuration

Central, strongly-typed configuration for **Waldoge: Streets of Gains**.

All gameplay tunables live here. `src/components/StreetBrawler.tsx` re-imports
these values — it does not define its own copies. Change a number here and the
game picks it up on the next reload; the runtime behavior is unchanged versus
the previous inline definitions (values are byte-identical to the pre-refactor
source).

## Layout

| File               | Owns                                                        |
| ------------------ | ----------------------------------------------------------- |
| `types.ts`         | Shared types: `SceneTheme`, `LevelConfig`, `Difficulty`     |
| `player.ts`        | Canvas size, ground, gravity, player speed, jump, energy    |
| `combat.ts`        | Combo timings, `SPECIAL_ATTACKS` table                      |
| `weapons.ts`       | `WeaponType`, `WEAPON_STATS`, ammo & drop chance            |
| `powerups.ts`      | Powerup drop chance, colors, icons                          |
| `environment.ts`   | Rain count, puddle X positions                              |
| `levels.ts`        | `LEVELS`, `WAVES_PER_LEVEL`, `TOTAL_LEVELS`                 |
| `difficulty.ts`    | Enemy/boss multipliers, boss-wave minion counts             |
| `index.ts`         | Barrel re-export                                            |

## Rules for edits

1. **No behavior changes.** This refactor moved values without altering them.
   Only edit numbers when you deliberately want to rebalance.
2. Types are the source of truth. Widen a type only when a new field is
   genuinely optional at runtime.
3. Inline magic numbers still exist inside `StreetBrawler.tsx`'s game loop
   (hit-frame timing, boss AI distance thresholds, camera lerp math, etc.).
   Those were intentionally left in place this pass because pulling them out
   safely requires system-by-system extraction with playtesting. See
   `ARCHITECTURE.md` for the phased plan.
