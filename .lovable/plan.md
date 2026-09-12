# Level 3 — Bad Actors Studios

## Goal
Rebuild Level 3 as the blueprint’s long, neon Hollywood studio complex while preserving combat, characters, controls, difficulty, progression, HUD, and the game loop.

## Implementation
- Replace the current randomized Level 3 layout with a deliberate 13-area progression across the existing 7,400-unit world: studio entrance, outdoor lot, Redacted Hollywood landmark, director’s office, main projector stage, SUS’TER ACT set, dressing rooms, prop department, backstage storage, sound stage, Stage 2, rooftop/backlot, and boss arena.
- Make **BAD ACTORS STUDIOS** the unmistakable entrance identity and build the major **BAD ACTOR DISTRICT** projector landmark with the existing exact Bad Actor head artwork.
- Build **REDACTED HOLLYWOOD** as a large hillside billboard using the existing Sus Dog reference, preserving his tan face, droopy eyes, muzzle, expression, and black hoodie; he will not be dressed as a nun there.
- Keep **SUS’TER ACT** strictly as an in-world movie. Reuse the existing poster and widescreen artwork featuring the original dog and frog as nuns across posters, screens, the movie set, and promotional areas.
- Add dense, authored studio dressing: cameras, tripods, boom microphones, lights, cables, speakers, curtains, trucks, trailers, crates, green screens, makeup mirrors, costumes, film reels, projectors, scaffolding, railings, backstage rooms, water towers, palms, skyline, and rooftop structures.
- Preserve the cached, deterministic, viewport-culled renderer and layered parallax. No uploaded blueprint image will be embedded.

## Playable World Structure
- Add Level 3-specific collision-backed production floors and connected ladder routes using the existing world, platform, and ladder systems.
- Make every visible gameplay ladder terminate on a real collision surface; make all authored walkways/platforms traversable and keep decorative scaffolding visually distinct from playable surfaces.
- Keep ground-level combat lanes clear and place the boss arena on a stable, unobstructed surface.
- Reuse current player/enemy grounding, climbing, camera-follow, encounter, and boss systems rather than creating parallel mechanics.

## Technical Details
- Author Level 3 world data and named landmark metadata instead of random placement.
- Extend the existing platform factory only for Level 3 and render those surfaces in film-studio styles.
- Use the existing image preload pattern for Sus Dog, Bad Actor, and SUS’TER ACT assets, with procedural fallbacks if an image is not yet decoded.
- Add regression tests for all 13 sections, required landmark identities, no Waldoge scenery references, finite coordinates, culling/caching, playable surface continuity, and ladder endpoint alignment.

## Validation
- Run focused world/traversal tests, the complete test suite, typecheck, and production build.
- Play Level 3 at 1280×1800 and mobile size, checking entrance, landmark progression, platforms, ladders, lower/upper traversal, enemy pursuit, camera framing, and Bad Actor activation/combat.
- Recheck Level 7 to ensure the environment changes did not affect unrelated levels.
