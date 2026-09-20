# Level 7 Final Bug Fix and Blueprint Reference-Pack Fidelity Pass

## Audit findings

### Exact responsibility map
- **Cat Guard frame extraction, animation, image cache, scaling, and feet anchor:** `src/game/presentation/render2d/catGuardSprites.ts` — `CAT_GUARD_GROUPS`, `imageFor`, `catGuardPoseFor`, `catGuardFrameFor`, `drawCatGuardSprite`.
- **Cat Guard combat movement intent and authored placement:** `src/game/enemy/catGuards.ts` — `AUTHORED_GUARDS`, `stepCatGuard`, `resolveCatGuardStrike`.
- **Cat Guard ladder graph, mount validation, occupancy, and spacing:** `src/game/enemy/catGuardNavigation.ts` — `catSurfaceIdAt`, `nextCatGuardLadder`, `validCatGuardMount`, `occupyCatGuardLadder`, `resolveCatGuardSpacing`.
- **Shared ladder attachment, movement, and endpoint grounding:** `src/game/world/climb.ts` — `mount`, `stepClimb`, `dismount`, `ladderExitSurfaceY`.
- **Level 7 ladder/deck data and collision:** `src/game/config/world.ts` — Level 7 entries in `LEVEL_LADDERS`, `LEVEL_AUTHORED_DECKS`, plus `groundYAt`, `landingDecksFor`, `laddersFor`.
- **Blueprint invariants, section bounds, elevations, and objectives:** `src/game/config/citadelBlueprint.ts` — `CITADEL_SECTION_BOUNDS`, `CITADEL_ELEVATION_BANDS`, `CITADEL_OBJECTIVES`, `validateCitadelBlueprint`.
- **Enemy surface placement:** `src/game/enemy/citadelForces.ts` and `src/game/enemy/catGuards.ts`.
- **Level 7 scenery, key, cage, and world-coordinate drawing:** `src/game/presentation/render2d/takerCitadel.ts`.
- **Visible deck and ladder rendering:** `src/game/presentation/render2d/terrain.ts` — `drawLandingDecks`, `drawLadders`.
- **Integration, render order, enemy ladder transitions, quest updates, and camera use:** `src/components/StreetBrawler.tsx`.

### Confirmed locked baseline
- The implementation still contains the required 9,000-unit world, five 1,800-unit sections, continuous floor, 20 collision-backed decks, 23 connected ladders, key at its authored deck, cage at its authored upper deck, and final arena.
- Cat Guards already use explicit sprite rectangles, persistent local PNG instances, feet-anchored world positions, real named ladder objects, graph-based ladder routing, single-ladder occupancy, and one world-to-camera subtraction.
- The supplied climb cells are deliberately not used because they contain baked-in ladders; clean locomotion bodies are used while the real world ladder is rendered separately.

### Concrete defects and risks found
- Current live scenes reproduce much of the text but not the blueprint's composition: oversized panels crowd the gameplay view while layered city mass, architectural depth, illuminated windows, machinery, and monumental framing remain sparse.
- 7.1 lacks the blueprint's dominant central acquisition complex and stepped city/deck silhouette.
- 7.2 lacks the large integrated market hall, deep ticker-wall framing, and dense tiered surrounding buildings.
- 7.3 lacks the blueprint's full cylindrical analysis chamber, repeated lower copy bays, overhead cable crown, and strong symmetrical framing.
- 7.4 exposes long empty wall fields; the key and cage route is mechanically correct but lacks the blueprint's fortified vertical enclosure and substantial prison façade.
- 7.5 has a globe/throne motif, but the globe, throne, statues, banners, and monumental hall are too small and fragmented compared with the blueprint.
- Cat Guard source groups are bounded, but frame definitions have no runtime invariant check against actual sheet dimensions.
- Image loading can fail silently after retries, producing an invisible guard instead of retaining a last-known-valid image state.
- Invalid/stale ladder identity dismounts without immediately snapping to the nearest valid surface.
- Same-surface spacing directly adjusts world X after movement; it should remain deterministic while avoiding displacement during active attacks.
- Main-floor recognition uses a duplicated `320` literal instead of the shared authoritative ground constant.

## Implementation

1. **Cat Guard hardening only**
   - Add frame-table validation against the loaded sheet dimensions and tests covering every Black/Orange pose and frame.
   - Preserve the clean ladder-free climb presentation and existing supplied artwork.
   - Make image readiness/retry state deterministic so a transient decode failure cannot create intermittent disappearance.
   - Use the shared ground constant for surface detection.
   - Re-ground immediately if a selected ladder becomes invalid, and constrain spacing corrections to grounded, non-attacking guards while retaining ladder queues and occupancy.

2. **Blueprint-matched Level 7 scenery only**
   - Refine `takerCitadel.ts` around the existing geometry; do not move the player, enemies, key, cage, boss, decks, or ladders.
   - Replace oversized foreground-like text blocks with blueprint-proportioned landmarks embedded into deeper architecture.
   - Build deterministic world-space architectural layers for each section:
     - **7.1:** central Ticker Taker Network acquisition complex, stepped district façades, red searchlight towers, windows, supports, and acquired-empire framing.
     - **7.2:** integrated market hall, candlestick wall, BUY/OBEY/TRADE/REPEAT tower, Global Control tower, machinery, ticker strips, and tiered buildings.
     - **7.3:** cylindrical WALDOGE analysis chamber, replication status wall, repeated copy bays, cable crown, server towers, and symmetrical industrial supports.
     - **7.4:** fortified citadel walls, guarded key chamber, stacked real-route framing, upper prison façade, substantial cage enclosure, banners, and transition gate.
     - **7.5:** monumental Cryptoverse hall, enlarged globe, throne dais, four blueprint-positioned statues, side banners, columns, cables, and boss-arena framing.
   - Derive every playable-looking fascia/support and ladder housing from `landingDecksFor(6)` and `laddersFor(6)`; background silhouettes will remain visibly non-playable.
   - Keep fighters, ladder rungs, key, cage, boss, and combat effects unobscured.

3. **Validation**
   - Capture desktop and mobile views near X=900, 2700, 4500, 6300, and 8100 and compare each directly with reference images 06–10.
   - Verify scenery remains fixed to world coordinates while the camera moves.
   - Exercise Black and Orange guards through idle, walk, run, attacks, hit, defeat, and real-ladder traversal; check visibility, crop leakage, limbs, grounding, occupancy, and dismounts.
   - Replay Level 7 from start through key pickup, cage rescue, Ticker Taker defeat, and victory on desktop and mobile.
   - Run focused tests, the complete suite, TypeScript checks, and preview build validation.

## Non-regression constraints
- Keep the 9,000-unit world, five section boundaries, continuous floor, 20 decks, 23 ladders, all current connections/elevations, encounters, quest coordinates, combat, difficulty, boss logic, sound, and other levels unchanged.
- Do not add fake decks or fake ladders.
- Do not rewrite `StreetBrawler.tsx`; make only narrowly scoped integration fixes if validation proves necessary.
- Do not claim exact fidelity unless all five live comparisons are completed; report any remaining differences explicitly.
