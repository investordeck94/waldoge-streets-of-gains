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

Before implementing this fix, I want the proposed root cause VERIFIED, not assumed.

The screenshots do support that this is a bitmap-sprite rendering problem because the arena, HUD, candlestick graphics and vector effects continue rendering while the character sprites disappear.

However, WALDOGE + TICKER TAKER + MINIONS are all affected.

Therefore, verify the proposed theory that Ticker Taker's Level 7 runtime-resampled canvas is creating enough graphics-memory pressure to cause bitmap textures to become temporarily unavailable.

Do NOT change gameplay or architecture during this verification.

Confirm:

1. Ticker Taker is uniquely creating a large runtime canvas/resampled bitmap in Level 7.

2. The other levels do not create this same additional canvas-backed texture.

3. The disappearing sprites are still alive and have valid positions/state when they vanish.

4. The disappearance occurs at the rendering/bitmap layer rather than entity lifecycle.

5. The runtime canvas is actually being used as the source for Ticker Taker's sprite rendering.

6. The proposed smaller PNG can replace that runtime canvas while preserving the exact existing destination geometry and animation mapping.

7. Explain why replacing Ticker Taker's runtime canvas can resolve the simultaneous WALDOGE/TICKER TAKER/MINION sprite disappearance.

If the evidence supports this diagnosis, implement the proposed fix:

- replace ONLY Ticker Taker's runtime-resampled canvas with the pre-resized PNG

- remove the Level 7 runtime canvas allocation

- remove the unnecessary full-resolution decode/resampling path

- retain the existing fallback until the smaller PNG has loaded

- preserve the exact destination rectangles

- preserve the exact sprite anchors

- preserve animation frame mapping

- preserve every special move

- preserve AI

- preserve hitboxes

- preserve combat

- preserve all gameplay behaviour

Do NOT change Waldoge's artwork or rendering pipeline.

Do NOT change minion artwork or rendering pipeline.

Do NOT change the global renderer.

Do NOT change the camera.

Do NOT change culling.

Do NOT change Level 7 layout.

Do NOT change Levels 1–6.

After implementation, verify the actual running Level 7 boss fight frame-by-frame.

The required result is:

Waldoge + Ticker Taker + minions remain continuously visible.

There must be no:

VISIBLE → INVISIBLE → VISIBLE

sequence during normal gameplay or while any Ticker Taker special move is active.

Run:

- focused Level 7 sprite tests

- all Ticker Taker special-move paths

- extended boss fight

- camera movement

- jumping

- attacks

- minion attacks

- desktop validation

- mobile-sized viewport validation

- full test suite

- typecheck

- production build

Do not claim this is fixed merely because the new PNG loads successfully.

The actual running Level 7 fight must be tested for the original intermittent disappearing/flickering behaviour.