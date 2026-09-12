# Fix Waldoge cross-level grounding

## Goal
Eliminate Waldoge’s visible levitation by keeping the rendered feet aligned with the same feet-anchored collision surface used by player physics, across every level and platform.

## Changes
1. Trace the active Waldoge sprite renderer against the physics `y` coordinate and correct only the shared feet-anchor calculation causing the visual gap.
2. Preserve the current player position, gravity, jump force, platform collisions, ladders, camera movement, combat hitboxes, animations, art, controls, difficulty, and level geometry.
3. Add focused regression coverage for grounded, moving, attacking, hit, jumping, landing, and varying floor/platform heights so visual grounding cannot drift from collision grounding.
4. Keep existing airborne pose composition unchanged unless its feet-anchor contract is the proven cause.

## Validation
- Run focused grounding/world tests and the complete test suite.
- Run typecheck and production build.
- Use the running game at 1280×1800 to check Levels 1, 2, and 3, including both wave encounter regions, standing, walking, jumping, landing, attacks, damage, platforms, and vertical camera movement.
- Regress Level 7’s shared flat-ground path.
- Report any runtime scenario that cannot be directly verified.

## Scope guard
No art redesign, level changes, combat balance, enemy AI, movement/jump tuning, controls, UI, difficulty, waves, scoring, progression, wallet, or unrelated refactor.
