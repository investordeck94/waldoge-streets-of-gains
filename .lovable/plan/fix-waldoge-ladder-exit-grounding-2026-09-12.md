# Fix Waldoge ladder exit grounding

## Goal
Make every Level 2 ladder exit place Waldoge’s feet on the actual connected collision surface, then enter a grounded idle pose without a floating frame. Preserve all ladder controls, descent behavior, gameplay, artwork, level geometry, camera, and combat.

## Root cause to address
- Ladder motion correctly reaches its authored endpoint, but the player loop treats both endpoint exits alike: it clamps to ladder coordinates and assigns the airborne `jump` state even after an upward dismount.
- The final exit is not explicitly reconciled with `groundYAt(...)`, the collision source of truth for landing decks and lower floors.
- The grounded idle renderer vertically translates the feet anchor for breathing, which can reveal a small gap immediately after a correct physics landing.

## Changes
1. Add a small pure ladder-exit helper that resolves the top or bottom endpoint through the level’s real `groundYAt(...)` collision surface.
2. In the existing player ladder branch only, use that resolved surface on dismount, zero vertical motion, and enter grounded idle after an upward exit instead of retaining the jump pose.
3. Keep idle breathing through anchored squash only; remove vertical translation of the sprite’s feet anchor so grounded feet remain on the collision line.
4. Add focused tests across every Level 2 ladder for upward deck alignment, downward floor alignment, bounded climbing, and unchanged dismount state.

## Validation
- Run focused ladder/world tests, the full test suite, typecheck, and production build.
- Use the running game at 1280×1800 to verify multiple ladder locations: climb up, idle, walk both directions, descend, and confirm the feet remain aligned with each rendered surface.
- Report any interaction that cannot be directly verified rather than inferring success from compilation alone.

## Scope guard
No changes to Level 2 art or geometry, ladder art, Waldoge artwork, combat, enemies, boss logic, controls, camera, movement/jump physics, difficulty, HUD, progression, wallet, or architecture.
