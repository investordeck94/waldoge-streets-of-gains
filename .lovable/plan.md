# Rebuild Level 4 from the approved blueprint

## Audit result

The current running Level 4 does **not** pass the blueprint acceptance test. Its screenshots are sparse and generic compared with the approved design: major buildings, scaffold networks, broadcast structures, loading bays, truck, factory lines, arena architecture, layered skyline, and much of the signage/poster rhythm are missing or too small. The current eight decks and ladders are also not visibly integrated with the blueprint architecture. Passing tests from the prior pass therefore does not count as completion.

## Blueprint-to-game map

Level 4 remains 9,000 world units, divided into five authored 1,800-unit sections. The flat gameplay floor stays at the existing global floor height throughout.

### 4.1 Entrance / Propaganda Street — X 0–1,800
- **Left-to-right composition:** entrance framing and pipes → large `FUDDER CONTROLS THE NARRATIVE` screen using the approved Fudder pose → head-only wanted poster → dense old-building/scaffold block with decks and ladders → dominant `INFORMATION CONTROLS EVERYTHING` billboard → second dense building block → wanted poster → large Fudder display → final wanted poster.
- **Environment modules:** narrow tenements, overhead pipes/cables, fire escapes, scaffold towers, roof tanks, lamps, crates, deck supports.
- **Gameplay:** continuous flat floor; blueprint-aligned elevated deck runs and connected ladders only.

### 4.2 Media District — X 1,800–3,600
- **Left-to-right composition:** compact `FUDDER NEWS` sign → broadcast/utility building and elevated walkway → wanted poster → large blue `FUDDER NEWS ALWAYS RIGHT` Fudder screen → newsroom/scaffold block → wanted poster → `SAME STORY DIFFERENT DAY` billboard → dense broadcast building with aerial/screen equipment → wanted poster.
- **Environment modules:** broadcast mast, dishes/aerials, screen housings, cable runs, catwalks, stacked crates and control equipment.
- **Gameplay:** flat floor; authored decks/ladders tied to visible catwalk structures.

### 4.3 Industrial Complex — X 3,600–5,400
- **Left-to-right composition:** `MANUFACTURED OPINIONS DISTRIBUTED WORLDWIDE` board → wanted poster → dense scaffold/pipe/loading complex → two dominant numbered loading bays `01` and `02` → Fudder freight truck with exact Fudder display → wanted poster → four large labelled Fudder storage tanks.
- **Environment modules:** loading-bay doors, truck, forklifts/pallets, tanks, pipe manifolds, scaffold grids, warning lamps and crates.
- **Gameplay:** flat floor and clear combat lane; visible decks/ladders have matching collision.

### 4.4 Propaganda Factory — X 5,400–7,200
- **Left-to-right composition:** large `FEED THE FUD` display with Fudder → machinery bank → long production conveyor with repeated stations → central wanted poster → red-lit fabrication cells and control machines → dense right-side production line → `CONSUME OBEY REPEAT` board.
- **Environment modules:** conveyors, rollers, presses, control cabinets, red warning lamps, ducts, upper service decks, crates and pipe runs.
- **Gameplay:** flat floor; conveyor and machinery remain decorative; only authored decks/ladders collide.

### 4.5 Fudder Boss Arena — X 7,200–9,000
- **Left-to-right composition:** `FUDDER MAKES THE TRUTH` Fudder billboard → workshop/scaffold block → wanted poster → red structural gateway → large central Fudder presentation chamber/arena backdrop using the approved atlas → wanted poster → second workshop/scaffold block → `INFORMATION IS A PRODUCT` Fudder billboard → terminal industrial structure.
- **Arena identity:** symmetric red-lit trusses, tall central Fudder image, overhead lamps, side machinery, pipes and crates; preserve a broad unobstructed combat lane.
- **Gameplay:** boss encounter remains at the far-right authored position; no scenery collision.

## Implementation order

1. Convert the map above into fixed landmark records with exact X ranges, dimensions, and layer assignments; remove broad loops that currently scatter major props uniformly.
2. Keep one Level 4 main floor at the global floor height with no pits, profiles, slopes, or hidden surfaces.
3. Re-author every gameplay deck and ladder from the blueprint architecture. Each ladder endpoint must match a real visual deck and resolve through the existing grounding path in both directions.
4. Rebuild all five sections with deterministic modular industrial structures: buildings, scaffold bays, catwalk supports, pipes, cables, loading bays, truck, tanks, broadcast hardware, conveyor cells, and arena trusses.
5. Use the definitive Fudder atlas for every Fudder display. Use Waldoge’s head only in every `WANTED BY FUDDER / DON'T BUY` poster.
6. Add the blueprint’s fixed background skyline and foreground infrastructure without allowing either layer to affect collision.
7. Preserve Level 4 combat, Fudder AI, enemies, HUD, controls, camera behavior, saves, progression, wallet systems, and Levels 1–3/5–7.

## Technical details

- Keep Level 4 presentation in its dedicated cached renderer and use viewport culling by authored module bounds.
- Major structures use fixed data records; deterministic repetition is allowed only inside a named structure, such as scaffold braces or conveyor rollers.
- Terrain data remains separate from presentation data, but deck/ladder records will be cross-validated against matching visual structure IDs.
- No blueprint-image background, generated substitute environment, random landmark placement, or full-body Waldoge scenery.

## Validation and acceptance

- Add focused tests for flat-floor continuity, zero pits, finite coordinates, section order, every deck, every ladder endpoint, two-way exits, collision/visual structure correspondence, encounter order, exact poster wording, approved Fudder atlas usage, and unchanged neighboring levels.
- Play the entire level on desktop and mobile: main floor, every deck, every ladder up/down, transitions, camera edges, enemy pursuit/grounding, and the full Fudder encounter.
- Capture five running-game views at representative X positions and compare each side-by-side with blueprint sections 4.1–4.5.
- Audit every listed landmark individually. Completion requires comparable density, silhouette, relative order, scale, and composition—not merely a clean test/build result.
