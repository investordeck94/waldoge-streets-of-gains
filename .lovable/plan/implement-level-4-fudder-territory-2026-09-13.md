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

# 🚨 CRITICAL — BLUEPRINT IS THE SOURCE OF TRUTH

I am attaching the APPROVED LEVEL 4 BLUEPRINT.

This blueprint is NOT an inspiration image.

It is NOT a loose concept.

It is NOT a suggestion.

It is the EXACT DESIGN SPECIFICATION for Level 4.

The implementation MUST reproduce the blueprint's:

- overall composition

- section order

- environment identity

- major landmarks

- building placement

- platform/deck placement

- ladder placement

- propaganda machinery

- signs

- wanted posters

- Fudder imagery

- boss arena

- visual progression

- environmental density

- overall atmosphere

Do NOT create a different interpretation of the blueprint.

Do NOT redesign Level 4 based on your own ideas.

Do NOT replace blueprint elements with generic alternatives.

Do NOT simplify the blueprint into a generic industrial level.

The objective is:

ATTACHED BLUEPRINT → ACTUAL PLAYABLE GAME LEVEL

NOT:

ATTACHED BLUEPRINT → NEW LEVEL INSPIRED BY BLUEPRINT.

---

# BEFORE WRITING CODE — STUDY THE BLUEPRINT

Before making ANY code or asset changes:

1. Inspect the entire attached blueprint.

2. Identify every major section.

3. Identify every major landmark.

4. Identify every deck/platform.

5. Identify every ladder.

6. Identify every major propaganda structure.

7. Identify every major sign/poster.

8. Identify where Fudder imagery appears.

9. Identify where the wanted posters appear.

10. Identify the boss arena structure.

11. Identify the intended left-to-right progression.

Create an internal implementation map from the blueprint before coding.

DO NOT start by inventing environment assets and then trying to make them resemble the blueprint.

The blueprint must determine what gets built.

---

# BLUEPRINT FIDELITY REQUIREMENT

Every major visual element shown in the blueprint must have a corresponding implementation in the actual game.

For example:

If the blueprint shows a particular:

- building

- billboard

- propaganda machine

- broadcast tower

- screen

- deck

- ladder

- factory structure

- machinery cluster

- wanted-poster area

- boss-arena structure

then implement that specific element or a faithful modular reconstruction of that element.

Do not replace it with an unrelated object simply because it serves the same gameplay purpose.

---

# DO NOT "IMPROVE" THE BLUEPRINT

DO NOT make creative changes such as:

"this would look better if..."

"this section would work better as..."

"we can simplify this..."

"we can use a different industrial design..."

"we can replace this with..."

Do not make those decisions.

The visual and structural decisions have already been made.

Your job is to IMPLEMENT the approved blueprint.

---

# EXACT LEFT-TO-RIGHT ORDER

The level must preserve the blueprint's left-to-right progression.

The player should encounter the same major visual story as shown in the blueprint.

Do not reorder sections.

Do not move the boss arena.

Do not move major landmarks into different sections.

Do not randomly distribute blueprint elements throughout the level.

The progression must remain:

ENTRANCE / PROPAGANDA STREET

→

MEDIA DISTRICT

→

INDUSTRIAL COMPLEX

→

PROPAGANDA FACTORY

→

FUDDER BOSS ARENA

---

# BLUEPRINT LANDMARK CHECKLIST

Before declaring the implementation complete, create a checklist internally containing EVERY major landmark visible in the supplied blueprint.

For each landmark:

BLUEPRINT ELEMENT

→

IMPLEMENTED GAME ELEMENT

→

CORRECT SECTION

→

CORRECT RELATIVE POSITION

→

CORRECT VISUAL ROLE

Do not mark Level 4 complete until every major blueprint landmark has been accounted for.

---

# IMPORTANT — DO NOT USE THE BLUEPRINT IMAGE AS THE GAME BACKGROUND

Do NOT simply place the blueprint image behind the gameplay.

The blueprint must be REBUILT as proper game assets.

Use:

- modular buildings

- modular pipes

- modular machinery

- modular signs

- modular posters

- modular screens

- modular decks

- modular ladders

- modular industrial structures

- parallax layers

- foreground elements

The final result should look like a professionally constructed game level that was built FROM the blueprint.

It should NOT look like a blueprint image pasted into the game.

---

# MATCH THE BLUEPRINT'S VISUAL LANGUAGE

Preserve the blueprint's intended:

- colour relationships

- lighting

- industrial decay

- propaganda aesthetic

- environmental density

- signage density

- silhouette language

- foreground/background layering

- architectural proportions

- visual hierarchy

Do not replace the approved aesthetic with a generic colour palette.

Do not make the level clean, modern, bright, or polished in a way that removes the rundown propaganda-machine identity.

---

# FUDDER MUST MATCH THE ATTACHED ARTWORK

The attached `fudder-atlas.png` is the definitive Fudder artwork.

Use the actual Fudder atlas poses.

Do NOT create replacement Fudder artwork.

Do NOT redesign his appearance.

Do NOT generate alternate versions of him for the environment.

When Fudder appears in propaganda screens, posters, signs, or displays, it must remain recognisably the same Fudder from the supplied atlas.

---

# WALDOGE WANTED POSTERS — EXACT RULE

Waldoge may appear in environmental propaganda ONLY through the wanted posters.

The posters must show:

WALDOGE'S HEAD ONLY

with the propaganda message:

WANTED BY FUDDER

DON'T BUY

Do NOT place full-body Waldoge into the background.

Do NOT use Waldoge's full body on the posters.

Do NOT create a different Waldoge design.

The playable Waldoge remains a separate gameplay character.

---

# VISUAL BLUEPRINT ≠ COLLISION BLUEPRINT

This is extremely important.

The attached blueprint controls the visual/structural design.

The collision system must be constructed separately and explicitly.

DO NOT allow the rendering system to automatically turn visual objects into collision.

A pipe is decoration.

A crate is decoration unless explicitly designated as gameplay collision.

A machine is decoration unless explicitly designated as gameplay collision.

A billboard is decoration.

A poster is decoration.

A building is decoration.

Only explicitly authored:

- main floor

- elevated decks

- ladders

- intentional gameplay obstacles

may affect gameplay collision/grounding.

---

# NON-DESTRUCTIVE IMPLEMENTATION RULE

Before modifying existing Level 4 code, inspect what is currently there.

Do NOT blindly delete existing Level 4 structures.

Do NOT delete platforms simply because they need to be repositioned.

Do NOT delete ladders simply because their endpoints need correction.

Do NOT delete environment structures to solve grounding.

Do NOT remove an existing collision surface unless it has been explicitly identified as obsolete or conflicting with the approved Level 4 collision blueprint.

If something needs correcting:

CORRECT IT.

Do not destroy surrounding work.

If an existing legacy structure conflicts with the new blueprint:

1. identify the conflict

2. replace only the conflicting element

3. preserve surrounding structures

4. preserve gameplay architecture

5. verify the result against the blueprint

---

# NO DIPS — ABSOLUTE RULE

Level 4's main ground is FLAT.

There are NO dips.

There are NO slopes.

There are NO hidden floor transitions.

There are NO decorative floor-height changes.

There are NO invisible grounding surfaces.

The only intentional changes in vertical gameplay height are the explicitly authored elevated decks shown in the blueprint.

This rule is absolute.

---

# GROUNDING MUST BE DESIGNED BEFORE ART POLISH

Do not build the visual environment first and guess where the player should stand afterward.

Build in this order:

1. Level 4 world bounds

2. five section boundaries

3. flat main floor

4. elevated deck collision

5. ladder collision

6. ladder endpoints

7. grounding tests

8. encounter positions

9. visual environment

10. parallax

11. foreground dressing

12. final runtime validation

This prevents the visual floor and gameplay floor from becoming misaligned.

---

# EVERY LADDER MUST BE VALIDATED

For EVERY ladder in the blueprint:

- exact X position

- exact bottom Y

- exact top Y

- bottom connects to main floor

- top connects to an actual deck

- deck exists at the same Y

- upward climbing works

- downward climbing works

- upward exit is grounded

- downward exit is grounded

Never create a ladder that terminates in empty space.

Never create a deck that does not have matching collision.

Never create a collision deck that has no corresponding visual deck.

---

# WALDOGE FEET ARE THE FINAL GROUNDING TEST

Do not judge grounding by the centre of Waldoge's sprite.

Judge it by his actual gameplay feet anchor.

When standing on:

MAIN FLOOR

his feet must touch the main floor.

When standing on:

ELEVATED DECK

his feet must touch that deck.

There must be no visible gap.

There must be no sinking.

There must be no one-frame floating animation.

There must be no arbitrary sprite Y-offset.

Use the existing authoritative grounding system and `groundYAt(...)`.

---

# DO NOT MODIFY OTHER LEVELS

This implementation is Level 4 only.

Do NOT modify Levels 1, 2, 3, 5, 6, or 7.

Do NOT "standardise" other levels.

Do NOT refactor global systems unless absolutely required.

If shared code must be touched, make the smallest backwards-compatible change possible and prove that existing levels remain unchanged.

---

# STOP CONDITION — DO NOT IMPLEMENT A DIFFERENT LEVEL

If the supplied blueprint cannot be represented exactly using the current architecture, DO NOT silently improvise.

Instead:

- preserve the blueprint's design

- use modular assets

- adapt the implementation architecture only where necessary

- keep the visual result faithful to the blueprint

Do not substitute a different environment.

---

# FINAL BLUEPRINT AUDIT

Before declaring completion, compare the actual running Level 4 against the supplied blueprint section-by-section.

Check:

### SECTION 1

Does it visually match the blueprint?

### SECTION 2

Does it visually match the blueprint?

### SECTION 3

Does it visually match the blueprint?

### SECTION 4

Does it visually match the blueprint?

### SECTION 5

Does the Fudder boss arena visually match the blueprint?

Then verify:

✓ Major landmarks present

✓ Correct left-to-right order

✓ Correct environmental identity

✓ Correct Fudder artwork

✓ Waldoge head-only wanted posters

✓ Correct propaganda messaging

✓ Correct decks

✓ Correct ladders

✓ Flat main floor

✓ No dips

✓ No hidden collision

✓ No levitating Waldoge

✓ No floating enemies

✓ No missing major blueprint structures

✓ No generic replacement environment

✓ No unrelated redesign

Only after this audit passes should Level 4 be considered implemented.

---

# ABSOLUTE FINAL RULE

DO NOT GIVE ME:

"A Level 4 inspired by the blueprint."

I WANT:

"THE BLUEPRINT IMPLEMENTED AS A PLAYABLE LEVEL."

The supplied blueprint is the design authority.

When there is a choice between your own creative interpretation and the blueprint:

THE BLUEPRINT ALWAYS WINS.

&nbsp;