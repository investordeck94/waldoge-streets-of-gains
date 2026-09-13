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
