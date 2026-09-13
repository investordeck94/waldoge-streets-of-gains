# Implement Level 4 — Fudder Territory

## Goal
Turn the approved blueprint into a long, playable Level 4 with five continuous sections: Entrance / Propaganda Street, Media District, Industrial Complex, Propaganda Factory, and the Fudder boss arena. Preserve every existing combat, character, camera, difficulty, progression, save, control, and connected-system behavior.

## Collision blueprint first
- Expand Level 4 from the legacy arena to a dedicated long world.
- Keep one flat authoritative main floor at the existing global floor height from start to finish; Level 4 will define no pits, slopes, blends, or hidden ground profiles.
- Author each elevated deck directly in the shared world configuration with an explicit start, end, and height.
- Author each ladder with an exact X, top deck height, and bottom main-floor height. Every ladder endpoint will resolve through the existing `groundYAt(...)` and ladder-exit path.
- Give Level 4 dedicated encounter positions so both waves and Fudder progress through the new world without changing their combat or AI.

## Visual implementation
- Add a dedicated cached Level 4 renderer, following the existing Level 2/3 viewport-culling and preload patterns rather than embedding the blueprint image.
- Build reusable industrial modules: decayed buildings, pipes, cables, lamps, scaffolds, broadcast equipment, screens, satellite dishes, loading bays, truck silhouettes, tanks, machinery, conveyors, crates, catwalk supports, and factory infrastructure.
- Layer a polluted skyline, distant industrial silhouettes, gameplay-aligned architecture, foreground grime/haze, and restrained animated lights for depth and mobile performance.
- Reproduce the five sections in blueprint order with distinct density and landmarks while maintaining continuous side-scrolling transitions.
- Render the exact approved Fudder atlas poses inside propaganda displays.
- Render only Waldoge’s head inside wanted posters, cropped from the existing approved Waldoge atlas; no full-body Waldoge will appear in scenery.
- Use the approved propaganda wording and dark navy/charcoal, rust, dirty amber, and warning-red visual language.
- Keep the boss arena visually imposing but leave the combat lane clear.

## Integration
- Register Level 4 in the existing district renderer and section-label system.
- Reuse the existing terrain renderer for collision-backed decks and ladders, with a Level 4 industrial treatment where needed.
- Keep decorative machinery, signs, posters, pipes, crates, and foreground objects presentation-only.
- Suppress legacy random platforms and unrelated legacy scenery for Level 4, as already done for redesigned Levels 1–3.

## Validation
- Add focused Level 4 tests for world width, flat floor continuity, absence of pits/hidden surfaces, section order, encounter order, deck definitions, ladder endpoint connectivity, upward/downward exits, and finite coordinates.
- Check that every deck and ladder is represented in both the visual structure and collision blueprint.
- Run focused world/renderer/ladder tests, the full suite, typecheck, and production build.
- Play the entire Level 4 at desktop and mobile sizes, checking walking, jumping, combat, enemy pursuit, every ladder in both directions, every deck, section transitions, camera edges, Fudder’s arena, sprite visibility, and feet alignment.
- Compare captured views from all five sections against the supplied blueprint before completion.

## Scope guard
No changes to Levels 1–3 or 5–7, Waldoge or boss artwork, combat, hitboxes, damage, AI, physics, controls, camera architecture, HUD, difficulty, progression, saves, Free Play, Continue, wallet, blockchain, or backend systems.