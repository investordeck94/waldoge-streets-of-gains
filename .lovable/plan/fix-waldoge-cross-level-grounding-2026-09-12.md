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

&nbsp;

Yes, proceed with this plan.

One important requirement before implementation:

The screenshots show Waldoge's visible feet floating above the actual floor/platform surface. Do not consider the fix successful merely because the physics body is grounded.

The FINAL visual requirement is:

- When Waldoge is standing on a floor or platform, the bottom of his visible shoes/feet must visually contact the top surface of that floor/platform.

- The character must not appear to hover.

- The physics collision position and rendered sprite position must remain synchronized.

- Do not solve this with a Level 2/3-specific Y offset.

- Do not hardcode a different offset for individual levels.

- Use the existing sprite dimensions/anchor/origin and shared grounding calculation so the fix works consistently across the whole game.

After implementation, specifically inspect a screenshot/frame of Waldoge standing still on the affected Level 2/3 surfaces and verify that his feet visibly touch the ground.

Do not change anything else in the game.