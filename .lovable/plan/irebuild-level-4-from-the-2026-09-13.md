# IRebuild Level 4 from the

&nbsp;

#  approved blueprint

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

# 🚨 FINAL IMPLEMENTATION LOCK — DO NOT SUBSTITUTE THE BLUEPRINT

The audit result is accepted.

The current Level 4 implementation is NOT considered a partial success. It must now be REBUILT to match the supplied blueprint.

Do not take the current sparse/generic Level 4 and merely add a few extra props.

The CURRENT LEVEL 4 VISUAL LAYOUT IS NOT THE REFERENCE.

THE APPROVED BLUEPRINT IS THE REFERENCE.

Use the blueprint-to-game map above as the exact structural specification.

---

# REQUIRED IMPLEMENTATION BEHAVIOUR

For each 1,800-unit section, build the listed landmarks in the listed LEFT-TO-RIGHT ORDER.

Do not move major landmarks to different X positions just because the current implementation already has something there.

Do not preserve incorrect existing landmark placement merely to avoid rebuilding it.

The correct order and composition from the approved blueprint takes priority over the current Level 4 implementation.

---

# DO NOT FAKE BLUEPRINT FIDELITY

Adding random extra buildings, signs, pipes, crates or posters around the existing level does NOT satisfy this task.

The level must be structurally rebuilt around the blueprint.

The following must all be visibly recognisable in the running game:

SECTION 4.1:

- entrance framing

- FUDDER CONTROLS THE NARRATIVE display

- head-only wanted poster

- dense building/scaffold block

- decks

- ladders

- INFORMATION CONTROLS EVERYTHING billboard

- second building block

- wanted poster

- Fudder display

- final wanted poster

SECTION 4.2:

- FUDDER NEWS

- broadcast/utility building

- elevated walkway

- wanted poster

- FUDDER NEWS ALWAYS RIGHT display

- newsroom/scaffold block

- wanted poster

- SAME STORY DIFFERENT DAY billboard

- broadcast building

- aerial/screen equipment

- wanted poster

SECTION 4.3:

- MANUFACTURED OPINIONS DISTRIBUTED WORLDWIDE

- wanted poster

- scaffold/pipe/loading complex

- loading bays 01 and 02

- Fudder freight truck

- wanted poster

- four Fudder storage tanks

SECTION 4.4:

- FEED THE FUD display

- machinery bank

- long production conveyor

- repeated production stations

- central wanted poster

- red fabrication cells

- control machines

- right-side production line

- CONSUME OBEY REPEAT board

SECTION 4.5:

- FUDDER MAKES THE TRUTH billboard

- workshop/scaffold block

- wanted poster

- red structural gateway

- large central Fudder presentation chamber

- wanted poster

- second workshop/scaffold block

- INFORMATION IS A PRODUCT billboard

- terminal industrial structure

These are REQUIRED LANDMARKS, not optional decoration.

---

# SCALE REQUIREMENT

Do not make major blueprint landmarks tiny.

Their relative visual importance must correspond to the blueprint.

For example:

- dominant billboards must actually dominate their section

- major buildings must occupy substantial space

- scaffold networks must visibly read as scaffold networks

- broadcast structures must be recognisable

- loading bays must be substantial

- the truck must be clearly visible

- storage tanks must be large enough to read

- the conveyor system must visibly span its intended area

- the boss arena must have the large central Fudder presentation structure shown in the blueprint

Do not satisfy a landmark by placing a tiny icon somewhere in the background.

---

# DENSITY REQUIREMENT

The current level was rejected because it is too sparse.

Do not create five mostly empty sections with isolated props.

Each section must have the same general environmental density and layering shown in the blueprint.

Use:

- dense building silhouettes

- structural beams

- scaffolding

- pipes

- cables

- machinery

- screens

- signs

- foreground objects

- background infrastructure

- skyline silhouettes

- atmospheric layering

But keep the major landmarks deterministic.

---

# EXACT SIGNAGE

Use the wording specified in the blueprint-to-game map.

Do not replace the approved wording with generic Fudder slogans.

For example:

`FUDDER CONTROLS THE NARRATIVE`

must remain exactly that.

`INFORMATION CONTROLS EVERYTHING`

must remain exactly that.

`FUDDER NEWS ALWAYS RIGHT`

must remain exactly that.

`SAME STORY DIFFERENT DAY`

must remain exactly that.

`MANUFACTURED OPINIONS DISTRIBUTED WORLDWIDE`

must remain exactly that.

`FEED THE FUD`

must remain exactly that.

`CONSUME OBEY REPEAT`

must remain exactly that.

`FUDDER MAKES THE TRUTH`

must remain exactly that.

`INFORMATION IS A PRODUCT`

must remain exactly that.

Wanted posters:

`WANTED BY FUDDER`

`DON'T BUY`

must remain exactly that.

---

# IMPORTANT — VISUAL REFERENCE HIERARCHY

When making decisions, use this priority:

1. ATTACHED APPROVED BLUEPRINT

2. BLUEPRINT-TO-GAME MAP ABOVE

3. EXISTING GAME ARCHITECTURE

4. EXISTING LEVEL 4 SYSTEMS

Do NOT reverse this order.

The existing Level 4 is NOT the visual authority because the audit has already established that it is incorrect.

---

# NO GENERIC PLACEHOLDERS

Do not implement major structures as:

- coloured rectangles

- text floating over empty space

- tiny icons

- generic boxes

- generic buildings

- placeholder scaffolding

Build proper modular 2D game assets that visually represent the objects shown in the blueprint.

---

# COLLISION REMAINS SEPARATE

Do not sacrifice blueprint fidelity to simplify collision.

The environment can be visually dense while collision remains simple.

Only:

- flat main floor

- explicit decks

- explicit ladders

- intentional gameplay obstacles

should affect gameplay collision.

Decorative machinery, pipes, buildings, posters, signs and background structures remain presentation-only unless explicitly designated.

---

# DO NOT DESTROY EXISTING WORK

If an existing Level 4 component is already correct, preserve it.

If it conflicts with the approved blueprint, replace or reposition only the conflicting component.

Do not perform broad destructive cleanup.

Do not delete unrelated systems.

Do not modify other levels.

---

# GROUNDING ABSOLUTE

The main Level 4 floor remains completely flat.

NO DIPS.

NO SLOPES.

NO HIDDEN FLOOR PROFILES.

NO RANDOM FLOOR HEIGHTS.

Every elevated deck must be explicit.

Every ladder must connect to an actual deck/floor.

Waldoge's feet must align exactly with the authoritative gameplay surface.

Do not solve grounding by changing sprite artwork or adding arbitrary offsets.

---

# BEFORE FINAL COMPLETION

Do NOT tell me:

"Level 4 has been implemented."

until you have actually compared the running game against the blueprint.

Capture five representative running-game views:

X ≈ 900

X ≈ 2,700

X ≈ 4,500

X ≈ 6,300

X ≈ 8,100

These correspond to the centres of the five sections.

Compare each running-game view against the corresponding blueprint section.

If a section is visibly sparse, generic, missing major landmarks, incorrectly ordered, incorrectly scaled, or structurally different:

CONTINUE IMPLEMENTATION.

Do not declare completion.

---

# FINAL ACCEPTANCE CRITERIA

Level 4 is complete ONLY when:

✓ The five sections follow the blueprint.

✓ Major landmarks are present.

✓ Major landmarks are in the correct left-to-right order.

✓ Major landmarks have comparable visual scale.

✓ Environmental density is comparable.

✓ The silhouette/composition is recognisably the blueprint.

✓ Fudder artwork uses the approved atlas.

✓ Wanted posters contain Waldoge's HEAD ONLY.

✓ Wanted poster wording is exact.

✓ Main floor is completely flat.

✓ Decks correspond to visible structures.

✓ Ladders correspond to visible structures.

✓ Every ladder works in both directions.

✓ Waldoge never levitates.

✓ Enemies never float.

✓ No hidden collision surfaces exist.

✓ Boss arena matches the blueprint structure.

✓ Level remains performant on mobile.

✓ Levels 1–3 and 5–7 remain unchanged.

MOST IMPORTANT:

Do not produce another "Fudder-themed industrial level."

Produce the APPROVED LEVEL 4 BLUEPRINT as a playable game level.