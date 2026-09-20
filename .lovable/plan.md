# Fix Level 7 Cat Guard Bugs

## Scope
Level 7 Cat Guards only. Preserve their supplied artwork, combat, difficulty, boss, Candle Minions, world geometry, and all other levels.

## Corrections
- Remove the ladder baked into the Cat Guard climb presentation so guards never carry or spawn a ladder visually.
- Add deterministic ladder occupancy/spacing so multiple guards cannot stack into one merged character at a ladder.
- Keep one authoritative world position per guard and preserve the existing world-to-camera render path.
- Audit every Black and Orange guard state for neighboring-body crop leakage, incorrect pose switching, and unstable feet anchoring.

## Validation
- Add focused tests for climb rendering, ladder spacing, state selection, and frame bounds.
- Run an extended Level 7 encounter on desktop and the current mobile viewport, including simultaneous guards, climbing, attacks, hits, and defeat.
- Visually confirm no phantom ladders, merged bodies, duplicate limbs, teleporting, or floating feet, then check the complete test suite and build status.
