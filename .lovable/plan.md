# Level 7 — Ticker Taker’s Cat Guards

## Goal

Add the supplied Black and Orange & White Cat Guards as a Level-7-only elite faction. Preserve their exact visual identities, add readable martial-arts combat led by a multi-stage Capoeira Cartwheel Kick, and reuse the established Level 7 movement, grounding, ladder, deck, difficulty, and encounter systems without altering Ticker Taker or Levels 1–6.

## Reference Mapping

- **Orange & White definitive art:** full-body orange/white cat in a white tracksuit with gold stripes, gold branding, gloves, shoes, chain, fur pattern, and striped tail.
- **Black definitive art:** full-body black cat in the black tracksuit with red/gold details, golden eyes, gloves, footwear, branding, and tail. The supplied stance and high-kick images provide high-resolution action poses.
- **Production blueprint:** locked source for relative scale, front/side/back identity, light/heavy punch, front kick, roundhouse, hit/defeat poses, and the staged Cartwheel Kick sequence for both variants.

## Existing Systems Preserved

- Keep Candle Minion spawning, artwork, combat, and global behavior unchanged.
- Keep the shared Level 7 9,000-unit floor, authored decks, 24 ladders, enemy navigation, feet grounding, key/cage/rescue flow, camera, player systems, and global difficulty resolver unchanged.
- Keep Ticker Taker’s AI, moves, health, hitboxes, arena, renderer, compact persistent atlas, preload path, and anti-flicker work unchanged.
- Keep Mr. Marketer’s Raiding Team and Levels 1–6 untouched.

## Implementation

1. **Prepare exact cached artwork**
   - Register the supplied source images through the project asset flow for provenance.
   - Build one optimized, feet-anchored Cat Guard atlas offline from the supplied transparent character art and the blueprint’s authored action/cartwheel frames.
   - Preserve the black/red/gold and white/gold palettes exactly; do not generate or procedurally redraw characters.
   - Load the atlas once into one persistent image reference. No per-frame canvas conversion, image decoding, resizing, or generated art.

2. **Add an isolated Level 7 enemy definition**
   - Extend ordinary enemy entities only with optional Cat Guard fields: variant, active move, combo step, decision timer, and per-attack hit latch.
   - Add pure Level-7-only Cat Guard helpers for variant checks, deterministic roster augmentation, move selection, move timing, and strike resolution.
   - Append Cat Guards to selected Level 7 waves so every existing Candle Minion slot remains intact.

3. **Author encounter placement**
   - Introduce the faction progressively, then concentrate authored guards on the key ascent, prison route/decks, and final approach.
   - Mix Black and Orange & White variants deliberately, preserving a floor fighter and elevated guards where appropriate.
   - Keep the Ticker Taker arena lane uncluttered and preserve the rescue gate before the boss.

4. **Implement combat behavior**
   - Black Guard: faster pursuit/decisions, shorter recoveries, more punch chains, roundhouses, and cartwheel use.
   - Orange & White Guard: slower deliberate pursuit, stronger heavy punches/kicks, sustained pressure, and cartwheel use without HP-sponging.
   - Support light punch, heavy punch, front kick, roundhouse, Punch→Punch→Kick, and occasional Punch→Cartwheel chains.
   - Drive all damage from authored active-frame windows with one-hit latches and the existing AABB strike solver.
   - Implement Cartwheel as a real timeline: stance, drop, hand plant, leg sweep, kick impact, completion, recovery, stance. Its sweeping hitbox is active only during the leg-sweep/impact frames.

5. **Reuse navigation and difficulty**
   - Let Cat Guards pass through the existing enemy ladder/deck pursuit branch and canonical `groundYAt` physics; add no movement or ladder system.
   - Read the existing difficulty modifiers to adjust decision cadence, recovery, pursuit, coordination, and Cartwheel frequency. Do not add a difficulty table or inflate Hard-mode HP.

6. **Render exact state-driven sprites**
   - Add a dedicated Cat Guard sprite renderer selected only for tagged Level 7 enemies.
   - Map idle, walk, run, punch, heavy punch, front kick, roundhouse, Cartwheel stages, hit, defeat, and ladder movement to cached atlas frames.
   - Keep a fixed feet anchor and elite-standard scale on floors and decks; never rotate one static image to fake the Cartwheel.

## Validation

- Add focused tests for both variants, artwork/frame mapping and palette identity, deterministic roster additions, key/prison/final-approach placement, every move, combos, Cartwheel phase/hit timing, recovery, hit/death, difficulty behavior, and no Cat Guards outside Level 7.
- Extend Level 7 regressions for existing Candle Minions, deck/ladder navigation, key/cage flow, arena clearance, and unchanged Ticker Taker identity/stability.
- Add explicit regressions proving the Raiding Team and Levels 1–6 rosters remain unchanged.
- Run the actual game on desktop and mobile: inspect both variants and outfits, exercise every attack, follow guards across floors/decks/ladders, clear key and prison encounters, and complete the Ticker Taker fight while checking continuous sprite visibility.
- Run focused tests, existing Level 7 and Ticker Taker tests, the full suite, TypeScript validation, production build, and runtime error inspection.