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

## Current — Waldoge title-screen focus
- [x] Feature Waldoge prominently in the title screen
- [x] Add a looping live boxing animation without changing menu behavior
- [x] Verify desktop/mobile menu flows, tests and build

## Done — Game title screen redesign
- [x] Cinematic WALDOGE: STREETS OF GAINS title screen (Start / Continue / How to play / Settings)
