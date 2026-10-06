# Canonical Monko NPC and Level 5 rescue

## Goal
Replace the retired pink Monko everywhere in the game with the supplied canonical brown-monkey artwork, while keeping Monko permanently non-playable and outside combat.

## Build
- Extract clean, complete frames from the supplied sheet for story portrait, idle/walk, captured cage, and rescue/release states. Never display sheet labels or neighbouring frames.
- Replace existing Monko story artwork with the new canonical design.
- Add the seven-panel Level 5 opening through the existing story overlay, showing full Exit Liquidity/throne and full Monko/cage without cropping.
- Add a Level 5-only, one-way NPC objective: recover one fixed banana stash, find the captive Monko, open the cage, show the release state, award the established rescue bonus once, then continue to Exit Liquidity.
- Keep Monko in a standalone NPC state object with no health, damage, attacks, weapons, hitboxes, player controls, enemy membership, companion behavior, or combat AI.

## Safety and validation
- Preserve Level 5 geometry, encounters, movement, physics, camera, difficulty, boss logic, and Levels 1–4/6–7.
- Add focused checks for the finite banana/rescue flow and absence of combat fields.
- Launch Level 5 and verify the opening, banana recovery, cage interaction, release, boss handoff, and full-body framing on desktop and phone-sized views.
