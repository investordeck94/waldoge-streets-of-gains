# Fix Level 7 sprite flicker

## Root cause to address
The screenshots isolate the failure to bitmap sprite drawing: the arena, HUD, boss HP, and vector special effects remain visible while Waldoge and Ticker Taker vanish. Level 7 uniquely converts Ticker Taker’s large PNG into an in-memory canvas, then draws that canvas alongside the other sprite atlases. On mobile, that extra canvas-backed texture can be discarded or temporarily unavailable under graphics-memory pressure, producing visible → invisible → visible frames without changing entity state.

## Implementation
- Replace only Ticker Taker’s runtime-resampled canvas with a pre-resized PNG asset at the same 60% source scale.
- Keep every destination rectangle, anchor, animation mapping, effect, move, AI value, hitbox, and gameplay state unchanged.
- Remove the Level 7 runtime canvas allocation and full-resolution decode path; retain the existing procedural fallback until the smaller image finishes loading.
- Add focused tests covering the Level 7 image source, frame/source scaling, fallback behavior, all special-move pose paths, finite render coordinates, and unchanged destination geometry.

## Validation
- Instrument Level 7 frame-by-frame to confirm the boss/player/minion entities remain alive, in bounds, and drawn while all Ticker Taker special moves run.
- Exercise movement, jumping, attacks, camera movement, minion attacks, and extended boss-arena play on desktop and a mobile-sized viewport.
- Compare Level 6 as the unchanged control.
- Run focused tests, the full test suite, typecheck, production build, and inspect the running result for any visible → invisible → visible sequence.
