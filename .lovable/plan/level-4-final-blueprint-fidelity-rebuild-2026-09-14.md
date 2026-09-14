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

FINAL ACCEPTANCE LOCK — LEVEL 4 BLUEPRINT MUST WIN

Proceed with the visual rebuild, but change the acceptance standard from “closely recreates” to the following:

The attached Level 4 blueprint is the FINAL APPROVED VISUAL DESIGN.

The running Level 4 must reproduce the blueprint as closely and faithfully as practically possible.

Do NOT treat “closely recreates” as permission to make a loose interpretation.

The current screenshots have already demonstrated that the existing graphics are too simplified compared with the blueprint.

Therefore, the task is NOT complete if the result merely:

- uses the same theme

- contains the same objects

- contains the same signs

- has similar colours

- has similar scaffolding

- has similar buildings

- has the same five sections

The actual visual composition must be rebuilt to match the blueprint.

This includes:

- architecture

- building silhouettes

- environmental silhouettes

- landmark placement

- landmark scale

- density

- foreground dressing

- background dressing

- vertical composition

- platforms/decks visually integrated into structures

- ladders visually integrated into structures

- industrial machinery

- propaganda machinery

- Fudder displays

- wanted posters

- lighting

- atmosphere

- materials

- overall visual balance

## SECTION-BY-SECTION REQUIREMENT

When comparing the live game to the blueprint:

### 4.1 ENTRANCE

Must visually read as the same rundown propaganda street shown in the blueprint.

### 4.2 MEDIA DISTRICT

Must visually read as the same dense Fudder-controlled media/broadcast district shown in the blueprint.

### 4.3 INDUSTRIAL COMPLEX

Must visually read as the same loading/manufacturing complex shown in the blueprint, including the substantial loading bays, Fudder truck and large Fudder tanks.

### 4.4 PROPAGANDA FACTORY

Must visually read as the same dense propaganda-production factory shown in the blueprint, including the long production line and machinery.

### 4.5 BOSS ARENA

Must visually read as the same final Fudder propaganda/industrial boss environment shown in the blueprint, with the large central Fudder presentation and surrounding architecture.

## SCALE IS CRITICAL

Do not technically include a blueprint landmark while making it too small to matter.

If the blueprint makes something visually dominant, the running game must make it visually dominant.

## DENSITY IS CRITICAL

The blueprint is dense.

Do not leave large areas that look like generic empty scaffolding.

Do not solve density by randomly scattering props.

Use deliberately authored structures matching the blueprint.

## MOST IMPORTANT RULE

If an existing Level 4 visual module conflicts with the blueprint, replace/rebuild its PRESENTATION.

Do NOT change its gameplay collision or gameplay behaviour unless absolutely necessary.

Separate:

VISUAL PRESENTATION

from

GAMEPLAY GEOMETRY.

The blueprint controls the visual presentation.

The existing gameplay systems control the gameplay.

## FINAL COMPARISON

After implementation, actually run Level 4 and capture representative views around:

X ≈ 900

X ≈ 2,700

X ≈ 4,500

X ≈ 6,300

X ≈ 8,100

Compare each live-game view directly with the corresponding area of the attached blueprint.

Do not simply inspect the code.

Do not rely on tests.

Do not rely on landmark metadata.

Inspect the ACTUAL RENDERED GAME.

If any section still looks substantially more generic, sparse, simplified or industrial than the blueprint, continue refining it.

## DO NOT MODIFY GAMEPLAY

Absolutely preserve:

- 9,000-unit Level 4 world

- flat main floor

- existing decks

- existing ladders

- grounding

- encounters

- enemy behaviour

- Fudder AI

- Fudder attacks

- combat

- hitboxes

- controls

- camera

- progression

- saves

- rewards

- HUD

- Levels 1–3

- Level 5

- Level 6

- Level 7

No unrelated refactors.

No global renderer rewrite.

No gameplay redesign.

No removal of existing gameplay structures.

## FINAL DEFINITION OF DONE

Level 4 is complete ONLY when BOTH conditions are satisfied:

1. All existing gameplay functionality remains intact.

2. The actual running Level 4 visually matches the approved blueprint closely enough that each section is immediately recognizable as the same environment.

FINAL RULE:

THE ATTACHED BLUEPRINT IS NOT AN INSPIRATION.

IT IS THE DESIGN.

THE RUNNING GAME MUST BE THAT DESIGN RECREATED AS PLAYABLE 2D GAME ART.

THE BLUEPRINT ALWAYS WINS.