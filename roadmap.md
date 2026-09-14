# Waldoge: Streets of Gains — combat pass

## Current — Level 5 blueprint reconstruction
- [x] Rebuild Level 5 as the approved five-section, 9,000-unit Graveyard of Gains
- [x] Integrate the exact uploaded Monko LOST BANANAS poster at its authored vault landmark
- [x] Add blueprint-matched decks, stacked decks, ladders, encounters, and flat-floor collision
- [x] Validate all five sections, every ladder, full combat/progression, desktop/mobile, tests, and build

## Current — Level 4 blueprint fidelity rebuild
- [ ] Replace the sparse generic Level 4 presentation with the approved five-section composition
- [ ] Re-author deterministic blueprint landmarks, visual decks, and matching ladder/collision records
- [ ] Preserve the flat floor, definitive Fudder atlas, and head-only Waldoge wanted posters
- [ ] Compare all five running sections against the blueprint on desktop and mobile
- [ ] Validate traversal, combat, camera, full tests, typecheck, and production build

## Current — Level 7 sprite continuity
- [x] Verify live entity state and isolate failure to Level 7 bitmap rendering
- [x] Reduce the persistent Ticker Taker PNG texture to the smallest stable mobile size
- [x] Validate every pose, special move, and continuous visibility through an extended fight
- [x] Run focused/full tests, typecheck and production build

## Current — Level 3 split-level grounding
- [x] Preserve the Stage 2 elevated platform, artwork, collision and ladders
- [x] Keep Waldoge on the lower studio floor unless he climbs or lands onto the platform
- [x] Verify lower-floor movement/jumping and elevated traversal on desktop/mobile
- [x] Run focused/full tests, typecheck and production build

## Superseded — Level 3 Stage 2 lower-floor grounding
- [x] Replaced the removed Y=182 collision deck with explicit split-level occupancy
- [x] Verify feet remain on the authoritative Y=320 studio floor through idle, movement, combat and jump/landing
- [x] Validate desktop/mobile gameplay, focused/full tests, typecheck and production build

## Current — Level 3 visible-floor grounding
- [x] Align the Production Office tyre-contact plane and projector dip with shared collision
- [x] Verify Production Office, projector dip, SUS'TER ACT exit, and reverse traversal
- [x] Regression-test untouched levels, jumping, landing, combat, camera and ladders

## Current — Level 3 projector lower-floor grounding
- [x] Remove the conflicting upper-floor collision across the projector area
- [x] Verify idle, walking, jump/landing and entry/exit beneath the projector on desktop and mobile
- [x] Run focused tests, full suite, typecheck and production build

## Current — Cross-level Waldoge grounding
- [x] Trace collision surfaces, camera transforms, and active sprite origin
- [x] Align every atlas pose to its painted shoe sole instead of transparent cell bounds
- [x] Verify Level 1–3 standing, movement, jump/landing, combat, and Level 7 regression

## P1 — Level 7 freeze / disappearing entities
- [ ] Frame-loop crash containment (no permanent rAF death)
- [ ] Player motion sanitizer (NaN/Infinity repair) reusing shared movement module
- [ ] Player world clamp applied AFTER velocity integration; y clamped
- [ ] Camera NaN repair + clamp
- [ ] Boss move-selection / phase / death cannot latch
- [ ] Remove per-frame console.log spam from combat loop

## P2 — Remove pickup weapons (bat / sword / shuriken)
- [ ] config/weapons.ts, weaponArt.ts deleted
- [ ] WeaponPickup type, gameRef fields, spawn, physics, pickup, HUD, render
- [ ] Shuriken throw + isPlayerProjectile branch
- [ ] waldogeSprites / waldogeFighter weapon params

## P3 — Waldoge animation correctness (gloves attached, state-accurate)

## P4 — Enemy AI pressure (approach, spacing, attack selection)

## P5/P6/P7 — Boss curve L1→L7, meaningful phases, smarter selection

## P8 — Damage / HP balance

## P9/P10 — Preserve existing systems; mobile controls intact

## P11 — Playtest in browser (all bosses, L7 phases 1-3)

## Cleanup
- [ ] Remove temporary debug hooks (?lvl / ?wv override, window.__g)

## Current — Ladder descent presentation
- [x] Replace standing-frame ladder pose with a dedicated rung-aligned climbing composition
- [x] Keep Waldoge centered through mount, descent, and bottom dismount
- [x] Verify DOWN + JUMP, repeated descent, normal jumps, enemy ladders, mobile, tests and build

## Done — Ladder exit grounding
- [x] Resolve every ladder endpoint through its actual collision surface
- [x] Enter grounded idle after dismount instead of retaining an airborne pose
- [x] Keep Waldoge's feet anchor fixed during idle breathing
- [x] Cover every Level 2 ladder in upward and downward endpoint tests

## Current — Waldoge title-screen focus
- [x] Feature Waldoge prominently in the title screen
- [x] Add a looping live boxing animation without changing menu behavior
- [x] Verify desktop/mobile menu flows, tests and build

## Done — Game title screen redesign
- [x] Cinematic WALDOGE: STREETS OF GAINS title screen (Start / Continue / How to play / Settings)

## Current — Level 3 Bad Actors Studios
- [x] Rebuild the 13-area studio progression from the supplied blueprint
- [x] Add exact Sus Dog, Bad Actor, and SUS’TER ACT landmark usage
- [x] Add collision-backed platforms and connected ladder routes
- [x] Validate full traversal, combat, mobile/desktop, tests and build

## Current — Level 3 blueprint fidelity rebuild
- [ ] Replace procedural Level 3 scenery with painted panel artwork matching the approved blueprint
- [ ] Reproduce exact landmarks: studio gate, Redacted Hollywood sign, Bad Actor District screen, Sus'ter Act, makeup/prop/backstage rooms, Stage 2, rooftop/backlot, boss arena
- [ ] Keep collision, ladders, combat, HUD and progression unchanged
- [ ] Validate rendering, tests, typecheck and build
## Current — SUS’TER ACT advertisements
- [x] Use the exact uploaded Nun Frog and Nun Sus Dog in every movie advertisement
- [x] Keep REDACTED HOLLYWOOD and BAD ACTOR DISTRICT identity art isolated
- [x] Verify assets, rendering, tests, typecheck and build

## Current — Free Play and difficulty-aware retries
- [x] Add a seven-level Free Play picker using the canonical roster and existing difficulty picker
- [x] Keep campaign Continue progression isolated from Free Play sessions
- [x] Retry the defeated level on Easy/Normal and restart Level 1 on Hard
- [ ] Verify menu navigation, retry rules, mobile/desktop, tests and build


## Level 4 QA pass (2026-09-13)
- [ ] Full Level 4 playthrough audit: grounding, collision, camera, rendering, enemies/combat, ladders/decks, progression, runtime errors
- [ ] Fix root causes found; re-run regression playthrough

## Current — Level 5 visual blueprint fidelity rebuild
- [ ] Map each approved blueprint section to dedicated modular environment artwork
- [ ] Rebuild Level 5 presentation only; preserve all collision, encounters, physics, and progression
- [ ] Compare live views at X 900, 2700, 4500, 6300, and 8100 against the blueprint
- [ ] Verify exact Monko poster, Exit Liquidity art, desktop/mobile rendering, tests, and build
