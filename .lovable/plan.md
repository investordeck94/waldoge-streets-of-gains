# Level 4 final blueprint fidelity rebuild

## Scope
Rebuild only Level 4’s presentation so the running five-section level closely recreates the attached approved blueprint. Preserve the existing 9,000-unit world, flat main floor, authored decks and ladders, encounters, combat, Fudder behavior, controls, camera, progression, saves, rewards, and every other level.

## Blueprint-to-game implementation
1. Replace the generic primitive-heavy Level 4 scenery with a deterministic authored visual map. Every major landmark will record its section, world-X range, visual bounds, depth layer, dedicated module, intended scale, and any existing deck/ladder association.
2. Build a cohesive modular industrial-city art kit rather than using the blueprint as a background: rundown facade bays, windows, fire escapes, scaffold towers, catwalks, trusses, pipes, cables, lamps, crates, broadcast hardware, loading infrastructure, factory machinery, conveyors, tanks, and arena structures.
3. Recompose each 1,800-unit section in the blueprint’s exact left-to-right order:
   - **4.1 Entrance:** entrance frame, dominant `FUDDER CONTROLS THE NARRATIVE`, head-only wanted posters, dense facade/scaffold blocks, dominant `INFORMATION CONTROLS EVERYTHING`, and the final Fudder display.
   - **4.2 Media:** `FUDDER NEWS`, broadcast building and aerials, wanted posters, large blue `FUDDER NEWS ALWAYS RIGHT`, newsroom/scaffolds, `SAME STORY DIFFERENT DAY`, and dense broadcast equipment.
   - **4.3 Industrial:** dominant manufactured-opinions board, loading complex, substantial bays `01` and `02`, Fudder freight truck, wanted poster, and four large Fudder tanks.
   - **4.4 Factory:** large `FEED THE FUD`, continuous production line, repeated machinery stations, central wanted poster, red fabrication cells, and `CONSUME OBEY REPEAT`.
   - **4.5 Arena:** `FUDDER MAKES THE TRUTH`, symmetric workshops and red trusses, wanted posters, a large central approved-atlas Fudder presentation, `INFORMATION IS A PRODUCT`, and a broad clear combat lane.
4. Add deliberate depth per view: distant skyline, background buildings, major architecture, propaganda landmarks, gameplay structures, foreground dressing, and atmospheric lighting. Major signs, truck, loading bays, tanks, conveyor, and arena presentation remain visually dominant.
5. Keep the approved Fudder atlas unchanged for every Fudder display and retain the consistent head-only `WANTED BY FUDDER / DON'T BUY` poster design.

## Technical boundaries
- Changes stay within Level 4 presentation assets/renderer and focused Level 4 presentation tests.
- Collision remains authoritative in the existing world configuration; visual structures stay non-collidable.
- Existing decks and ladders are drawn at their current authoritative coordinates and remain mechanically unchanged.
- No blueprint-image paste, random landmark placement, generated substitute Fudder, gameplay changes, or edits to Levels 1–3 and 5–7.

## Validation
- Capture the live game at X≈900, 2,700, 4,500, 6,300, and 8,100 and compare each view against its blueprint row for architecture, silhouette, density, scale, ordering, lighting, signage, Fudder art, posters, decks, and ladders.
- Continue refinement whenever a section still reads as generic industrial scenery rather than its blueprint environment.
- Re-test all Level 4 ladders/decks, flat-floor grounding, camera bounds, rendering continuity, combat, boss completion, and Level 5 transition on desktop and mobile.
- Run focused tests, the full test suite, and the final build before completion.
