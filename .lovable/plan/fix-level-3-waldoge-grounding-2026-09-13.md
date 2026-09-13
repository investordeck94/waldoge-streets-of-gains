# Fix Level 3 Waldoge grounding

## Goal

Align Waldoge’s existing feet anchor with the visible Level 3 floor, without changing artwork, sprites, combat, controls, camera, enemies, or UI.

## Changes

- Replace the single projector-only floor exception with one canonical Level 3 floor profile covering the production-office tyre-contact plane and the existing high-to-low-to-high dip.
- Make player grounding continue to read that shared profile at Waldoge’s current horizontal position; keep the existing feet anchor, jump physics, pits, ladders, and authored platforms.
- Remove conflicting floor/deck results only where they contradict the same Level 3 profile; do not create duplicate geometry or visual offsets.
- Add focused tests for office grounding, descent, dip floor contact, ascent, reverse traversal, finite values, and untouched levels.

## Validation

- Run focused and full tests, typecheck, and production build.
- Play the running Level 3 at 1280×1800 and verify movement through the office and both directions across the complete dip, including jump and landing.

One additional requirement:

Use the attached Level 3 screenshot as the visual acceptance reference, not just the code geometry.

The final rendered result must visually satisfy these exact conditions:

1. In the production-office section, the bottom of Waldoge's shoes must sit on the same apparent ground plane as the golf cart tyre contact points. He must not appear to float.

2. When Waldoge enters the dip beside the Bad Actor District billboard, his feet must visibly descend with the lower floor. He must not remain at the Y-height of the upper platform.

3. While standing/walking across the bottom of the dip, his shoes must remain directly on the lower floor.

4. When exiting the dip, his feet must rise back to the upper floor height.

5. Check this visually at the actual 1280×1800 game viewport, because a mathematically correct world/collision Y coordinate is not sufficient if the rendered sprite still appears visually airborne.

Do not consider the task complete until both the code tests AND the rendered visual result satisfy these conditions.