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
