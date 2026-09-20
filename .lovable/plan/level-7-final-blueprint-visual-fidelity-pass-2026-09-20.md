# Level 7 Final Blueprint Visual Fidelity Pass

## Scope

Enhance only Level 7 scenery so the live game more closely matches the supplied blueprint. Preserve all accepted geometry, navigation, Cat Guard behavior, combat, quest progression, boss flow, and other levels.

## Implementation

1. Capture the current live views at each section midpoint and compare them directly with the approved blueprint.
2. Expand the Level 7 renderer with deterministic, section-specific architectural layers:
  - 7.1 conquered district towers, empire/acquisition displays, infrastructure, and section identity.
  - 7.2 market hall, ticker walls, charts, trading screens, pipes, and structural framing.
  - 7.3 analysis/copy-machine complex, replicated modules, scanners, data displays, and supports.
  - 7.4 dense inner-citadel walls, guarded key stronghold, upper prison architecture, and cage framing.
  - 7.5 throne hall, Cryptoverse centerpiece, statues, monumental framing, and arena atmosphere.
3. Render platform fascia/supports from the existing Level 7 collision decks and ladder presentation from the existing ladder data, preventing fake traversable geometry.
4. Keep all added scenery behind or clear of fighters, ladders, the key, cage, and boss.

## Validation

- Compare all five updated live sections side-by-side with the blueprint on desktop and mobile.
- Re-run the complete test suite, TypeScript checks, and build validation.
- Replay Level 7 through key pickup, rescue, Ticker Taker defeat, and victory.
- Recheck Cat Guard visibility, sprite integrity, grounding, spacing, and real-ladder-only movement.

## Technical Constraints

- Modify Level 7 presentation code and presentation-focused tests only unless a direct visual defect requires an existing geometry reference.
- Use authoritative world coordinates and the current world-to-camera transform.
- Do not add decorative playable-looking decks or ladders without matching collision/navigation data.
- ## NON-REGRESSION RULE
  The previous Level 7 implementation pass has already corrected and validated the gameplay geometry.
  Treat the following as LOCKED and DO NOT redesign, relocate, remove, or restructure them during this visual pass:
  - 9,000-unit Level 7 world
  - five 1,800-unit sections
  - continuous main floor
  - 20 collision-backed decks
  - 23 connected ladders
  - existing deck elevations
  - existing ladder connections
  - existing enemy placement unless a purely visual presentation issue requires adjustment
  - key location and key interaction
  - Anon Waldoge cage location and rescue interaction
  - Ticker Taker arena
  - Cat Guard navigation/state system
  - real-ladder-only movement
  - Cat Guard spacing/occupancy
  - Cat Guard sprite/frame corrections
  - combat systems
  - quest progression
  - victory state
  The purpose of this pass is to make the EXISTING CORRECT GAMEPLAY GEOMETRY visually resemble the supplied blueprint more closely.
  Do NOT rebuild the geometry to make the scenery look correct.
  Instead, build the scenery around the already-correct geometry.
  If a visual element from the blueprint appears to conflict with the locked gameplay geometry, preserve the gameplay geometry and adapt the visual treatment around it.
  ==================================================
  BLUEPRINT COMPARISON RULE
  ==================================================
  The supplied blueprint remains the canonical visual reference.
  Do not use AI-generated interpretation or invented geometry.
  Compare the actual live Level 7 against the supplied blueprint section by section.
  The goal is not merely to make each section look "cool" or thematically appropriate.
  The goal is to reproduce the blueprint's visual composition and density as closely as reasonably possible while preserving the already-validated gameplay geometry.
  Specifically compare:
  - deck visibility
  - vertical layering
  - ladder visibility
  - architectural density
  - background structures
  - foreground structures
  - section-specific props
  - signage
  - screens/displays
  - major landmarks
  - key presentation
  - cage presentation
  - final throne presentation
  - empty/unused visual areas
  If the blueprint contains a recognizable major structure, reproduce that structure rather than substituting a generic decorative object.
  ==================================================
  MIDPOINT REVIEW REQUIREMENT
  ==================================================
  Capture the live Level 7 view around the midpoint of each section:
  7.1 → approximately X=900
  7.2 → approximately X=2700
  7.3 → approximately X=4500
  7.4 → approximately X=6300
  7.5 → approximately X=8100
  Use these views for the blueprint comparison.
  Do NOT change gameplay coordinates simply to make the midpoint screenshots look better.
  The midpoint captures are for visual validation only.
  ==================================================
  IMPORTANT VISUAL RULE
  ==================================================
  Do not make the scenery so dense that it obscures:
  - player
  - enemies
  - Cat Guards
  - ladders
  - key
  - cage
  - boss
  - combat effects
  - collision-critical surfaces
  Maintain clear gameplay readability.
  ==================================================
  FINAL ACCEPTANCE
  ==================================================
  Do not report "exact visual fidelity" unless the five section comparisons have actually been performed.
  Report any remaining differences explicitly.
  The correct result is:
  LOCKED GAMEPLAY GEOMETRY
  +
  LOCKED CAT GUARD BEHAVIOUR
  +
  BLUEPRINT-MATCHED SCENERY
  +
  NO REGRESSIONS.
  &nbsp;