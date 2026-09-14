# Level 5 visual blueprint fidelity rebuild

## Goal

Rebuild only Level 5’s presentation so each live camera view is immediately recognizable as the corresponding approved blueprint section. Preserve every existing gameplay coordinate, collision surface, ladder, encounter, boss behavior, and progression rule.

## Visual build

1. **Create five dedicated section art kits**
  - Author separate distant skyline, monumental architecture, gameplay-facing structure, and foreground dressing for each 1,800-unit section.
  - Use section-specific silhouettes and materials rather than shared boxes, scaffolds, or generic industrial modules.
  - Keep atmosphere and parallax visual-only so the existing gameplay geometry remains authoritative.
2. **Dead Coin Cemetery**
  - Build the moonlit gothic gate, crypt skyline, varied oversized crypto graves, dead trees, stone walls, lamps, candles, terminals, coins, and fog.
  - Integrate existing ladders/decks visually into cemetery masonry and metalwork.
3. **Liquidation Street**
  - Build dense ruined financial towers and a dominant multi-storey `LIQUIDATED` facade with the approved warning copy.
  - Add crashed graph displays, trading desks, abandoned vehicle/equipment, red catwalk lighting, cables, and layered debris.
4. **The Dead Exchange**
  - Build a monumental gothic exchange crypt with arches, columns, a giant `DEAD EXCHANGE` display, stacked trading floors, dead monitors, ticker machinery, integrated server racks, vault doors, lamps, and candles.
  - Preserve the approved three-level deck and ladder geometry exactly.
5. **The Liquidity Vault**
  - Build a dominant ornate circular vault and surrounding underground stone/metal machinery with green-cyan financial lighting.
  - Add extraction pipes, safes, service decks, crates, banana storage, and the exact uploaded Monko poster uncropped and unaltered.
6. **Exit Liquidity’s Domain**
  - Build a symmetrical cathedral-vault arena with towering arches, pillars, chains, red-lit machinery, candles, fog, abandoned financial relics, and elevated side structures.
  - Keep a broad combat lane and use the approved Exit Liquidity character art as the central presentation.

## Technical boundaries

- Replace Level 5’s generic procedural visual modules inside its presentation renderer with dedicated section modules and layered local/CDN art assets.
- Keep `world.ts`, level configuration, physics, combat, AI, hitboxes, controls, saves, rewards, HUD, and all non-Level-5 rendering unchanged.
- Keep visual decoration non-collidable; existing authored decks and ladders remain the only elevated gameplay geometry.
- Retain the exact supplied Monko poster and approved Exit Liquidity atlas without regeneration or alteration.

## Verification

- Capture the running game at X≈900, 2,700, 4,500, 6,300, and 8,100 on desktop and compare each view directly with its blueprint panel for composition, silhouette, landmark scale, density, layers, lighting, ladders/decks, and story elements.
- Rework any section still reading as generic industrial scenery.
- Run a complete Level 5 playthrough through all encounters and Exit Liquidity into Level 6.
- Verify all 13 ladder routes, flat-floor grounding, camera bounds, asset loading, stable rendering, mobile framing, automated tests, and final build.

FINAL VISUAL FIDELITY CORRECTION — LEVEL 5

I agree with the implementation direction, but there is one critical requirement that must be made completely explicit:

THE CURRENT RUNNING LEVEL 5 GRAPHICS ARE STILL NOT CLOSE ENOUGH TO THE APPROVED BLUEPRINT.

The screenshots show that the current implementation has the correct general progression and some of the correct landmarks, but the actual environment artwork, architecture, silhouettes, materials, density, lighting, gothic styling, and overall composition are still significantly different from the approved blueprint.

Therefore, DO NOT consider the current visual implementation finished.

## THE BLUEPRINT IS THE VISUAL DESIGN

The attached Level 5 blueprint is not merely a specification of what objects should exist.

It is the visual design that the playable level must reproduce.

The goal is NOT:

“Build a Level 5 containing the same types of objects.”

The goal IS:

“Recreate the visual world shown in the approved Level 5 blueprint as a playable 2D game level.”

That distinction is critical.

For every section, the running game should feel like the corresponding blueprint panel has been transformed into a playable side-scrolling environment.

## DO NOT JUST REARRANGE THE CURRENT ART

Do not simply:

- add more scaffolding

- add more pipes

- add more signs

- add more generic buildings

- add more platforms

- recolor the existing environment

- increase prop counts

- place generic objects around the existing level

That will NOT solve the visual mismatch.

Where the current art is fundamentally different from the blueprint, REBUILD/REPLACE the visual module with a dedicated asset that matches the blueprint's architecture and silhouette.

## VISUAL FIDELITY REQUIREMENT

The five sections must visually correspond to the blueprint:

### 5.1 — DEAD COIN CEMETERY

The running game must visually read as:

GOTHIC CRYPTO CEMETERY.

Not generic scaffolding with tombstones.

Match the blueprint's:

- large gothic cemetery structures

- crypts

- oversized crypto tombstones

- dead trees

- stone architecture

- candles

- gothic lamps

- financial grave markers

- broken ATMs

- abandoned financial equipment

- moonlit skyline

- fog

- layered architecture

- elevated cemetery structures

- ladders integrated into the environment

### 5.2 — LIQUIDATION STREET

The running game must visually read as:

RUINED FINANCIAL CITY.

Not generic industrial scaffolding.

Match the blueprint's:

- dense financial buildings

- tall ruined architecture

- dominant LIQUIDATED landmark

- red financial displays

- market crash graphics

- trading equipment

- abandoned vehicle/equipment

- catwalks

- cables

- layered city skyline

- dense foreground/background dressing

### 5.3 — THE DEAD EXCHANGE

The running game must visually read as:

GOTHIC FINANCIAL EXCHANGE / CRYPT.

Not a modern server room.

Match the blueprint's:

- monumental gothic entrance

- arches

- columns

- gothic exchange architecture

- giant DEAD EXCHANGE landmark

- trading floors

- dead monitors

- ticker machinery

- server equipment integrated into the architecture

- vault doors

- candles

- red lighting

- three-level vertical composition

- stacked decks and ladders

### 5.4 — THE LIQUIDITY VAULT

The running game must visually read as:

MASSIVE UNDERGROUND FINANCIAL VAULT.

Not a generic industrial warehouse.

Match the blueprint's:

- huge circular vault door

- ornate vault architecture

- large extraction pipes

- liquidity machinery

- green/cyan financial lighting

- safes

- stacked service decks

- financial machinery

- banana storage

- MONKO'S BANANAS landmark

- exact uploaded Monko LOST BANANAS poster

### 5.5 — EXIT LIQUIDITY'S DOMAIN

The running game must visually read as:

GOTHIC CATHEDRAL + CRYPTO EXCHANGE + FINANCIAL DEATH CHAMBER.

This is the final visual climax.

Match the blueprint's:

- enormous gothic architecture

- tall pillars

- arches

- chains

- candles

- fog

- red lighting

- financial machinery

- broken coins/wallets

- elevated structures

- symmetrical boss arena

- large central Exit Liquidity presentation

- dramatic side structures

- broad clear combat lane

## SCALE MATTERS

A landmark existing somewhere in the level is NOT enough.

If the blueprint shows a landmark as a dominant visual feature, the running game must also make that landmark dominant.

Do not shrink major structures into tiny background decorations.

## DENSITY MATTERS

The approved blueprint is visually dense and layered.

The running game must have:

BACKGROUND

→ DISTANT ARCHITECTURE

→ MAJOR LANDMARKS

→ PLAYABLE STRUCTURES

→ FOREGROUND PROPS

→ LIGHTING / ATMOSPHERE

Avoid large empty areas that read as generic scaffolding.

## ASSET QUALITY

Do not use generic rectangles or placeholder geometry for major visual structures.

Create proper dedicated 2D game-art modules for major blueprint landmarks.

The five sections should have visibly different architecture and silhouettes.

The player should be able to identify which section they are in purely from the environment.

## EXACT MONKO POSTER

The newly supplied Monko poster is FINAL and EXACT.

Use the supplied image itself.

Do not regenerate it.

Do not redraw it.

Do not approximate it.

Do not replace it.

Do not alter the artwork.

Do not alter the typography.

Do not alter the wording.

Do not destructively crop it.

Do not create a different “Lost Bananas” poster.

The exact supplied poster must appear physically inside the Liquidity Vault at the approved location.

## IMPORTANT SCOPE LOCK

This is still a LEVEL 5 VISUAL REBUILD.

Do not change:

- gameplay

- combat

- AI

- hitboxes

- controls

- physics

- ladders

- grounding

- encounters

- boss behaviour

- boss moves

- progression

- saves

- rewards

- HUD

- Levels 1–4

- Levels 6–7

Existing gameplay geometry remains authoritative.

Visual changes must not create unintended collision.

## FINAL ACCEPTANCE TEST

Do not accept the result merely because the tests pass.

Run the actual game and capture:

X ≈ 900

X ≈ 2,700

X ≈ 4,500

X ≈ 6,300

X ≈ 8,100

Compare each screenshot directly against the matching blueprint panel.

For each comparison ask:

1. Does the architecture look like the blueprint?

2. Does the silhouette look like the blueprint?

3. Are the major landmarks the correct scale?

4. Is the visual density comparable?

5. Are the background and foreground layers comparable?

6. Is the lighting/atmosphere comparable?

7. Are the decks/ladders visually integrated into the architecture?

8. Does the section immediately read as the same location?

9. Are the story landmarks present and visually prominent?

10. Does the result look like the blueprint recreated as a game level rather than a generic interpretation?

If the answer is NO for a major visual category, continue rebuilding that section.

Do not stop simply because the implementation is technically valid.

## FINAL STANDARD

THE BLUEPRINT IS THE DESIGN.

THE RUNNING GAME MUST BE A PLAYABLE RECREATION OF THAT DESIGN.

NOT A THEME MATCH.

NOT AN INTERPRETATION.

NOT A GENERIC INDUSTRIAL VERSION.

NOT A LEVEL THAT MERELY CONTAINS THE SAME OBJECTS.

THE ACTUAL GRAPHICS, ARCHITECTURE, SILHOUETTES, DENSITY, SCALE, LIGHTING AND COMPOSITION MUST BE BROUGHT AS CLOSE AS PRACTICALLY POSSIBLE TO THE APPROVED BLUEPRINT.

ONLY THEN IS LEVEL 5 VISUALLY COMPLETE.