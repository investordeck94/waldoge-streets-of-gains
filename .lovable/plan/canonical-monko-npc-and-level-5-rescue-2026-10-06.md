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

**Before I approve this plan, make sure the implementation plan explicitly includes the following visual requirements:**

- The seven Level 5 opening panels must follow the supplied Level 5 story exactly.
- **Exit Liquidity is the speaker of all Exit Liquidity dialogue.** His dialogue bubbles must be visually anchored to Exit Liquidity.
- Monko must **never appear to be saying Exit Liquidity’s dialogue**. Monko only speaks lines explicitly assigned to Monko.
- Use the canonical supplied Monko artwork, replacing the retired pink Monko everywhere.
- Show Exit Liquidity fully seated on his throne and Monko fully visible inside his cage. **Never crop either character.**
- Sprite sheets must never be displayed as sheets. Select one complete frame at a time and use contain/fit rather than cropping.
- Level 5 gameplay must contain the fixed banana stash → banana recovery → Monko cage → Monko rescue → Exit Liquidity boss flow.
- The banana stash is a **finite, one-time objective** with no respawning or duplication.
- Monko remains a standalone NPC permanently outside combat: no health, damage, attacks, weapons, hitboxes, player controls, enemy membership, companion AI or combat AI.
- Preserve existing Level 5 geometry, gameplay, physics, encounters, movement, camera, difficulty and boss logic.
- Validate the finished panels and gameplay on both desktop and phone-sized views.

**Do not approve a plan that omits these requirements.**