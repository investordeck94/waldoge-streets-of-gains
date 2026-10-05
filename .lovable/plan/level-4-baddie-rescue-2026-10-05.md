# Level 4 Baddie rescue

&nbsp;

# LEVEL 4 — BADDIE RESCUE

## Build

Add the supplied Baddie cage, worried, and release artwork as Level-4-only presentation/NPC assets.

### Opening story

Start Level 4 with the existing Fudder reveal story sequence.

Use the existing canonical character assets.

IMPORTANT:

Do NOT invent, generate, or substitute a Fudder character.

If there is no canonical Fudder asset available, present Fudder through the existing approved story treatment without creating a replacement character.

The story should establish:

- Fudder has an agenda against Waldoge and the entire Anonverse.

- Fudder controls his own world and controls the narrative there.

- Jeet and Rugger worked for Fudder.

- Bad Actor was Fudder's right-hand man.

- Baddie is currently being held captive.

- Fudder challenges Waldoge to rescue Baddie.

After the opening story, enter the existing Level 4 gameplay exactly as it currently works.

### Baddie captive state

At the start of Level 4 gameplay:

- Baddie must be visibly locked inside a physical cage.

- Use the supplied canonical Baddie cage/captured artwork.

- Baddie is an NPC/story character only.

- Do NOT add Baddie to enemy, combat, health, damage, or AI systems.

- Do NOT make Baddie playable.

- Do NOT make Baddie a combat companion.

Keep Baddie captive until Waldoge obtains the required key.

### Cage key

Place ONE physical collectible cage key earlier in the existing Level 4 world.

The key must:

- Have a fixed, deliberate location.

- Be reachable using the existing Level 4 route.

- Exist exactly once.

- Be clearly visible/readable as a key.

- Use the existing collectible/interaction conventions where possible.

- Disappear or become collected once picked up.

- Never randomly respawn.

- Never duplicate.

Do NOT redesign the level to accommodate the key.

Do NOT move existing Level 4 geometry, platforms, ladders, enemies, boss areas, or routes unless absolutely necessary.

### Locked cage interaction

Before Waldoge has the key:

If he interacts with Baddie's cage:

- The cage must remain locked.

- Baddie must remain captive.

- Show a brief existing-style message such as:

“THE CAGE IS LOCKED.”

“I NEED THE KEY.”

Do not trigger the rescue.

After Waldoge collects the key:

Allow the existing cage interaction to unlock the cage.

### Baddie rescue

When Waldoge uses the key on Baddie's cage:

1. Unlock/open the cage.

2. Use the supplied Baddie release artwork/state.

3. Trigger the short Baddie rescue story/presentation.

4. Mark Baddie as rescued.

5. Award the established Level 4 rescue score bonus exactly once.

6. Return to normal Level 4 gameplay.

The rescue must be one-time only.

Walking back to the cage after the rescue must NOT trigger the rescue again or award another score bonus.

### Objective

The rescue is OPTIONAL.

The player can complete Level 4 without rescuing Baddie.

If the player does rescue Baddie:

KEY COLLECTED

→ BADDIE RESCUED

→ RESCUE BONUS AWARDED

The established score bonus must be awarded once only.

Do not create a new scoring system.

### Reset / state handling

Ensure the objective behaves correctly on a fresh Level 4 start/reset.

On a new/reset Level 4:

- Key returns to its intended starting state.

- Baddie is captive again.

- Cage is locked again.

- Rescue bonus has not already been awarded.

Within a single Level 4 run:

- Key cannot respawn after collection.

- Baddie cannot be rescued twice.

- Rescue bonus cannot be awarded twice.

## Safety

Do NOT change:

- Level 4 geometry

- Level 4 combat

- Movement

- Camera

- Physics

- Collision

- Enemy AI

- Existing enemies

- Existing boss

- Difficulty

- Weapons

- Health systems

- Existing score architecture

- Levels 1–3

- Levels 5–7

- THE FAT CATS

- Level 7 Hard Mode

- Mobile memory optimisation

- Existing gameplay character sprites

Do not rewrite StreetBrawler.tsx unnecessarily.

Keep all Baddie rescue logic isolated to Level 4.

Reuse existing story, interaction, collectible, objective and score systems wherever possible.

## Validation

Run the existing tests/typecheck/build.

Then actually launch Level 4 and visually play through the complete sequence on both desktop and a phone-sized viewport.

Verify:

1. Fudder opening story appears before Level 4 gameplay.

2. No invented/replacement Fudder character is created.

3. Baddie is visibly inside the cage at Level 4 start.

4. The key exists exactly once.

5. The key is reachable.

6. Attempting the cage before obtaining the key is rejected.

7. Collecting the key works.

8. The cage unlocks after the key is collected.

9. Baddie's supplied release artwork/state appears correctly.

10. The rescue story plays once.

11. The established rescue score bonus is awarded once.

12. Returning to the cage does nothing after rescue.

13. Resetting/restarting Level 4 restores the correct initial state.

14. Level 4 gameplay remains otherwise unchanged.

15. Desktop and phone-sized layouts both work correctly.

Do not declare this complete based only on code inspection.

Actually launch and visually verify:

FUDDER STORY

→ LEVEL 4

→ FIND KEY

→ LOCKED CAGE

→ COLLECT KEY

→ UNLOCK CAGE

→ RESCUE BADDIE

→ RESCUE STORY

→ RETURN TO NORMAL GAMEPLAY

## Build

- Add the supplied Baddie cage, worried, and release artwork as Level 4-only presentation assets.
- Start Level 4 with Baddie visibly locked in a physical cage and place one collectible cage key earlier in the existing world.
- Require the key before the rescue interaction can open the cage; keep the objective optional and award the established rescue score bonus once.
- Add the supplied Level 4 Fudder reveal as an opening story sequence, using existing canonical characters and no invented Fudder replacement.
- Show a short Baddie rescue story after release, then return to unchanged Level 4 play.

## Safety

- Keep Baddie outside enemy/combat systems with no health, damage, collision, or AI.
- Do not change Level 4 geometry, combat, movement, camera, enemies, boss, difficulty, or other levels.

## Validation

- Test key collection, locked-cage rejection, one-time rescue, score bonus, reset behavior, and story data.
- Launch Level 4 and visually verify the opening, key, cage, release, and return to gameplay on desktop and phone-sized views.