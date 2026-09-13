# Fix Level 3 projector-area grounding

## Root cause
The supplied running-game screenshot is in Level 3's Stage 2 section (world X 8,400–9,600). That section currently has an invisible collision deck spanning X 8,500–9,500 at Y=182, while the painted lower studio floor is Y=320. Waldoge's feet and sprite anchor are behaving correctly, but they are grounded to the wrong authored surface, placing his body across the billboard, wiring, and lights.

## Changes
- Remove only the incorrect Stage 2 Y=182 walkable collision deck.
- Keep the painted environment, projector/headlights, billboard, characters, wiring, ladders, Waldoge artwork, size, hitbox, physics, camera, combat, and every other level unchanged.
- Add focused regression coverage proving the Stage 2 range resolves to the lower studio floor at Y=320, while the neighboring authored elevated areas remain unchanged.

## Validation
- Inspect exact world coordinates and live player feet values beneath the billboard and lights.
- Test entry/re-entry, idle, walking left/right, combat, jump, and landing.
- Visually inspect desktop and mobile screenshots from the running game.
- Run focused Level 3 tests, the full test suite, typecheck, and production build.
