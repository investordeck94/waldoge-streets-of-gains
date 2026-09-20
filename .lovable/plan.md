# Level 7 strict blueprint correction and enemy sprite fix

## Goal
Correct the existing Level 7 implementation in place. Preserve the approved Cat Guard and Ticker Taker artwork, combat, difficulty, controls, scoring, sound, save flow, and Levels 1–6.

## Audit findings
- The world already uses 9,000 units, five 1,800-unit sections, a continuous flat main floor, 20 collision decks, 24 linked ladders, functional key/cage state, and a gated final boss.
- The Cat Guard renderer is the primary confirmed defect: it divides large labelled sprite-sheet regions into equal-width cells even though the supplied characters occupy irregular rectangles. This can crop adjacent poses, stretch frames, and shift feet between frames.
- Cat Guard AI also changes `x` directly while the generic loop separately applies velocity. The renderer itself correctly uses `screenX = worldX - cameraX`, but movement and frame selection need one explicit contract.
- The current Level 7 scenery is a sparse procedural approximation. Its labels identify the five sections, but its density, platform integration, red vertical structures, ticker district, copy machinery, Inner Citadel, and throne composition do not yet closely match the supplied blueprint.
- Existing geometry is internally valid, but its visual platform system must be made to correspond to the blueprint’s four elevation bands. Engine Y increases downward, so blueprint heights will be mapped to equivalent feet surfaces rather than interpreted as literal screen Y values.

## Phase 1 — Lock the blueprint map
- Add a Level-7-only blueprint specification containing exact section bounds, named deck bands, ladder links, encounter zones, key/cage coordinates, and required landmarks.
- Preserve 9,000 total width and section boundaries at 0, 1800, 3600, 5400, 7200, and 9000.
- Keep the uninterrupted authoritative floor at the engine’s `GROUND_Y`; do not add pits, slopes, or hidden collision.

## Phase 2 — Fix Cat Guard movement and animation
- Replace equal-width sheet slicing with explicit per-frame source rectangles measured from the supplied Black and Orange/White production sheets.
- Give every frame a fixed feet anchor and stable destination scale so walk, run, attacks, Cartwheel, hit, defeat, and climb cannot stretch or shift the collision body.
- Keep one authoritative entity `x/y`; AI updates that position once, and rendering only converts `world x/y → camera → screen` without mutating state.
- Make locomotion transitions derive from actual movement, reset cleanly to idle, preserve the same Y when facing flips, and render each guard exactly once.
- Keep cached/preloaded local PNGs and the existing character designs.

## Phase 3 — Correct Level 7 geometry and validation
- Reconcile current decks and ladders with the blueprint’s main floor plus four elevation bands, retaining only authored reachable surfaces.
- Ensure every ladder visually and mechanically joins its declared lower and upper surfaces in both directions.
- Keep the key on the guarded lower citadel route, the cage on the elevated prison route, and the final arena wide enough for Ticker Taker.
- Add a Level-7 development validator that reports floor continuity, world bounds, section coverage, deck collision, ladder endpoints, route reachability, key/cage reachability, encounter placement, and boss-arena access. Expose a debug overlay only in the existing debug mode.

## Phase 4 — Match the five-section visual composition
- Rebuild only the Level 7 environment renderer from deterministic modular structures aligned to the same world coordinates as collision.
- 7.1: dense taken city, network/acquisition board, red towers, multi-level combat silhouette.
- 7.2: distinct market district with ticker screens, charts, financial data, and dense elevated structures.
- 7.3: distinct analysis/replication machinery, WALDOGE analysis displays, scanner/copy architecture, and industrial decks.
- 7.4: dominant Inner Citadel, visible guarded key route, stacked prison decks, elevated functional Anon cage, and clear rescue state.
- 7.5: expanded throne composition, final-citadel architecture, supplied Ticker Taker presentation, and an unobstructed boss lane through the level boundary.
- Draw scenery, decks, ladders, enemies, foreground details, and HUD in a fixed order so no gameplay object disappears behind unintended layers.

## Phase 5 — Acceptance testing
- Add focused frame tests for exact crop bounds, stable feet anchors, flip invariance, idle/walk/attack transitions, and single render dispatch.
- Extend geometry tests to all blueprint bands, every ladder endpoint, section identity, encounters, key/cage route, final arena, and unchanged Levels 1–6.
- Run the live game from X=0 to X=9000 on desktop and mobile, capturing all five sections and sustained Cat Guard walking, stopping, turning, climbing, combinations, and Cartwheel attacks.
- Complete the real sequence: start → 7.1 → 7.2 → 7.3 → guarded key → elite route → elevated cage → rescue → throne → Ticker Taker defeat → victory.
- Finish only after focused/full tests, typecheck, build, runtime errors, camera bounds, and screenshot comparison against the supplied blueprint pass.

## Technical constraints
- Level-7-only changes except shared test/debug hooks that are inert for other levels.
- No placeholder art, runtime-generated sprites, runtime atlas resizing, duplicate animation loops, CSS sprite transforms, or render-time entity mutation.
- Do not alter combat controls, damage rules, HP, scoring, boss attacks, audio, save/reward logic, or global difficulty.
