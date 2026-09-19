---
name: Street Brawler Difficulty Framework
description: Single global Easy/Medium/Hard framework in src/game/config/difficulty.ts driving all 7 levels, grunts, raiders and bosses
type: feature
---
One authoritative framework: `difficultyModifiers(diff, levelIndex)` in `src/game/config/difficulty.ts` (memoized, frozen) is the only source every system reads — spawnEnemies (Enemy.ts), scaleBossForDifficulty (Enemy.ts), boss cooldown/damage, grunt speed/damage/cooldown, raider ranged cooldown, boss projectile damage (StreetBrawler.tsx).

Tiers: easy "NEW TO CRYPTO", normal "HALF A DEGEN" (untouched reference balance, every modifier = 1 apart from the legacy count/boss tables), blackMonday "FULL TRENCH MODE".

Rules:
- Hard is never an HP sponge: enemyHp and bossHp are never above 1.0 on any tier.
- Easy uses a per-level EASY_TAPER (index 0→6) so later levels get progressively more relief; no level may define private difficulty rules. `easyRelief` is a deprecated shim over the taper.
- Level 1→7 progression comes from LEVELS[] baselines + BOSS_PROFILES identities, not from tier scaling.
- Difficulty never changes geometry, artwork, story content, boss identities or movesets; all 7 levels, both Level 6 enemy categories (Candle Minions + Raiding Team) and Ticker Taker's special moves exist on every tier.
- Free Play, Continue and Retry all resolve through the same tier + level pair; only Hard restarts the run on defeat.

Tests: `src/game/config/__tests__/difficulty.test.ts`.
