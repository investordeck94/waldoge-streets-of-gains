# Waldoge: Streets of Gains — combat pass

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

