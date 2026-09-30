&nbsp;

# Level 7 Blueprint Visual-Match Rebuild

## Objective

Make each live gameplay-camera view visibly resemble its corresponding approved blueprint section. Object presence alone is insufficient; composition, scale, density, hierarchy, and landmark placement must match.

## Locked systems

- Preserve the 9,000-unit world, five section bounds, main floor, all collision decks, all real ladders, key, cage, boss arena, encounters, Cat Guard behavior/art, combat, controls, camera, difficulty, quest flow, and victory.
- Keep one world-to-camera transform and do not add fake playable platforms or ladders.

## Implementation

1. **Recompose 7.1 — Taken District**
  - Build the dominant central acquisition complex around the existing deck silhouette.
  - Add stepped side buildings, searchlight towers, layered windows, real-ladder framing, and the compact acquired-empires board at blueprint proportions.
2. **Recompose 7.2 — Ticker District**
  - Make the market hall and candlestick display the dominant center mass.
  - Integrate BUY/OBEY/TRADE/REPEAT and Global Control as flanking towers, with tiered structures aligned to real decks and ladders.
3. **Recompose 7.3 — Copy Machine**
  - Create the blueprint’s large cylindrical WALDOGE analysis chamber as the visual center.
  - Add the status wall, cable crown, symmetrical server towers, repeated lower copy bays, and architecture supporting the existing traversal levels.
4. **Recompose 7.4 — Inner Citadel**
  - Build a fortified vertical enclosure around the fixed key-to-cage route.
  - Give the key chamber, upper prison façade, cage enclosure, walls, banners, and ladder network the same visual hierarchy as the blueprint.
  - Paint key and cage last so they remain unobscured.
5. **Recompose 7.5 — Ticker Taker’s Throne**
  - Enlarge the Cryptoverse globe and throne into the dominant central monument.
  - Frame it with four statues, banners, columns, cables, and a monumental hall while keeping the boss lane clear.

## Technical approach

- Replace the current oversized, screen-like text blocks with blueprint-proportioned architecture in `takerCitadel.ts`.
- Derive playable fascia, supports, and ladder housings from `landingDecksFor(6)` and `laddersFor(6)` only.
- Use layered world-space drawing: distant skyline, monumental architecture, deck-aligned midground, then gameplay-critical objects.
- Preserve the corrected clean Cat Guard atlases and rendering pipeline unchanged.

## Visual acceptance

- Capture live gameplay-camera views near X=900, 2700, 4500, 6300, and 8100 on desktop and mobile.
- Compare each live capture directly against reference images 06–10 for silhouette, focal landmark scale, layering, deck/ladder visibility, and section identity.
- Iterate until every section is immediately recognizable from its blueprint—not merely thematically similar.
- Then replay key pickup, cage rescue, Ticker Taker defeat, and victory; run all tests, typecheck, and preview-build validation.

LEVEL 7 — RESUME UNFINISHED AUDIT + BLUEPRINT VISUAL-MATCH REBUILD

IMPORTANT: RESUME FROM THE CURRENT UNFINISHED STATE.

Your previous Level 7 audit was started, but the implementation and live visual validation were NOT completed because workspace credits ran out.

Your last status was:

“The initial audit found a clean build and no runtime errors, but Cat Guard root-cause fixes, blueprint scenery corrections, and live visual validation remain unfinished because workspace credits ran out.”

Do NOT assume those fixes were completed.

Do NOT restart the project from scratch.

First inspect the CURRENT code and CURRENT live Level 7 state, then continue the unfinished work below.

==================================================

PRIMARY OBJECTIVE

==================================================

Make each LIVE gameplay-camera view of Level 7 visibly resemble its corresponding approved blueprint section.

Object presence alone is NOT sufficient.

The finished level must match the blueprint in:

- composition

- scale

- density

- architectural layering

- visual hierarchy

- landmark placement

- silhouette

- section identity

- relationship between scenery, decks and ladders

The goal is NOT merely to create something thematically similar to the blueprint.

The goal is:

WHEN PLAYING LEVEL 7, THE LIVE GAMEPLAY CAMERA SHOULD LOOK LIKE THE SUPPLIED BLUEPRINT.

If the live screenshot still looks substantially different from the blueprint, the section is NOT finished and must be corrected.

==================================================

CANONICAL REFERENCES

==================================================

The supplied Level 7 blueprint/reference images are the canonical visual reference.

Use the existing project assets and supplied blueprint as the source of truth.

Do NOT invent a different Level 7 design.

Do NOT use generic cyberpunk scenery as a substitute for the blueprint.

Do NOT treat “similar theme” as visual fidelity.

==================================================

LOCKED GAMEPLAY SYSTEMS

==================================================

Preserve all existing gameplay systems and geometry.

DO NOT redesign or break:

- 9,000-unit Level 7 world

- five 1,800-unit sections

- main floor

- all existing collision decks

- all existing real ladders

- existing ladder connections

- key

- cage

- boss arena

- enemy encounters

- Cat Guard behaviour

- Cat Guard artwork

- combat

- controls

- camera

- difficulty

- quest flow

- victory sequence

- player/enemy gameplay positions

Keep ONE authoritative world-to-camera transform.

Do NOT add fake playable platforms.

Do NOT add fake playable ladders.

Do NOT move the actual gameplay route simply to make scenery fit.

Only improve/recompose the visual environment around the existing gameplay geometry.

==================================================

CAT GUARD — PROTECT THE EXISTING ARTWORK

==================================================

There are TWO DISTINCT Cat Guard character designs in the project.

They are NOT recolours of one another.

They have different:

- colours

- clothing

- sprite artwork

- visual identity

The existing project Cat Guard sprite sheets/assets are the canonical Cat Guard artwork.

DO NOT:

- redesign them

- redraw them

- replace them with AI-generated artwork

- recolour one to create the other

- merge their assets

- merge their clothing

- swap their sprite identities

- substitute a generic cat character

Preserve both existing designs exactly.

The AI-generated Cat Guard examples from earlier discussion are NOT canonical replacement artwork.

==================================================

CAT GUARD ROOT-CAUSE AUDIT

==================================================

Before changing the scenery, inspect the current Cat Guard implementation and identify the actual remaining rendering defects.

Check:

- sprite-sheet/frame definitions

- frame extraction

- image loading

- image cache

- retry behaviour

- animation state selection

- world position

- render path

- ladder attachment

- ladder movement

- ladder dismount

- ground anchoring

- feet alignment

- death/defeat rendering

- variant selection

Fix the ROOT CAUSE of the remaining glitches.

Each Cat Guard must have:

- exactly ONE authoritative world position

- exactly ONE intended sprite render per frame

- correct sprite identity

- correct clothing

- correct colour

- correct animation frame

- correct feet grounding

No Cat Guard may:

- disappear/flicker

- duplicate itself

- render twice

- merge with another character

- display another Cat Guard's clothing

- display another Cat Guard's colour

- leak adjacent sprite-sheet frames

- show duplicate limbs

- show cropped neighbouring frames

- float

- sink into the floor

- randomly change scale

- randomly change pose

- randomly swap character variants

Validate every frame rectangle against the actual source sheet dimensions.

If image decoding/loading temporarily fails, do NOT make the guard disappear. Retain the last valid frame and retry deterministically.

==================================================

CAT GUARD LADDER RULES

==================================================

The ladder is a REAL WORLD OBJECT.

The Cat Guard sprite must NOT contain a baked-in ladder.

When climbing:

- render the real Level 7 ladder separately

- render the Cat Guard separately

- attach the Cat Guard to the ladder's actual world coordinates

- use the appropriate clean existing Cat Guard animation frames

- maintain deterministic X alignment

- maintain deterministic Y movement

- snap correctly to the destination deck

- preserve ladder occupancy/spacing rules

A Cat Guard must never appear to:

- climb an invisible ladder

- climb beside the actual ladder

- teleport onto a ladder

- float beside a ladder

- remain attached after dismount

- carry a ladder as part of its sprite

==================================================

BLUEPRINT VISUAL-MATCH REBUILD

==================================================

After the Cat Guard root-cause work is verified, continue the unfinished Level 7 scenery rebuild.

Use the supplied blueprint sections 06–10 as the visual authority.

The environment must be reconstructed around the existing gameplay geometry.

==================================================

7.1 — TAKEN DISTRICT

==================================================

Make the dominant central acquisition complex the main visual focal point.

Match the blueprint's composition with:

- dominant central acquisition complex

- stepped side buildings

- layered city architecture

- searchlight towers

- dense illuminated windows

- industrial supports

- real-ladder framing

- compact acquired-empires board

- deeper background city mass

The architecture must have the same visual hierarchy and approximate proportions as the blueprint.

Do NOT simply add more random signs or neon props.

==================================================

7.2 — TICKER DISTRICT

==================================================

Make the market hall and candlestick display the dominant central mass.

Integrate:

- large market hall

- large ticker/candlestick display

- BUY / OBEY / TRADE / REPEAT

- Global Control tower

- flanking towers

- tiered buildings

- machinery

- ticker strips

- layered surrounding architecture

The landmarks must feel physically integrated into the architecture rather than appearing as oversized floating UI panels.

==================================================

7.3 — COPY MACHINE

==================================================

Create the blueprint's large cylindrical WALDOGE analysis chamber as the visual centre.

Add:

- large cylindrical analysis chamber

- replication/status wall

- overhead cable crown

- symmetrical server towers

- repeated lower copy bays

- industrial supports

- surrounding architecture

- layered background depth

The existing traversal route must remain unchanged.

==================================================

7.4 — INNER CITADEL

==================================================

Build a substantial fortified vertical enclosure around the EXISTING fixed key-to-cage route.

Match the blueprint hierarchy:

5400–5600:

- fortified entrance

5600–5850:

- substantial lower structures

5850–6100:

- strong vertical framing around the existing ladder network

6100–6500:

- dominant guarded key chamber

- KEY DECK architecture

6500–6750:

- strong upper vertical route framing

6750–7000:

- substantial upper prison façade

- substantial cage enclosure

- ANON WALDOGE'S CAGE visually integrated into the architecture

7000–7200:

- fortified transition toward 7.5

Keep the actual key and cage coordinates unchanged.

Paint/render the key and cage AFTER surrounding scenery so they remain clearly visible.

==================================================

7.5 — TICKER TAKER'S THRONE

==================================================

Make the final arena visibly monumental, matching the blueprint.

Create:

- large Cryptoverse globe

- dominant throne

- throne dais

- four blueprint-positioned statues

- side banners

- columns

- overhead cables

- monumental hall

- strong boss-arena framing

The globe and throne should be substantially larger and more visually dominant than generic surrounding scenery.

Keep the boss lane clear.

==================================================

TECHNICAL IMPLEMENTATION

==================================================

Use the existing world-space rendering architecture.

The scenery must remain fixed in WORLD coordinates while the camera moves.

Use layered world-space drawing:

1. distant skyline/background

2. large monumental architecture

3. deck-aligned midground architecture

4. real playable decks/ladders

5. gameplay-critical objects and characters

Derive playable-looking fascia/supports/ladder housings from the existing authoritative:

- landingDecksFor(6)

- laddersFor(6)

ONLY.

Background architecture must remain visual-only and must NOT accidentally become collision geometry.

Replace the current oversized screen-like/text-block scenery with blueprint-proportioned architecture.

Do not simply increase the amount of decoration.

The architecture itself must create the blueprint's visual composition.

==================================================

FILES / EXISTING ARCHITECTURE

==================================================

Inspect and use the existing Level 7 architecture rather than unnecessarily rewriting it.

Relevant areas previously identified include:

src/game/presentation/render2d/catGuardSprites.ts

src/game/enemy/catGuards.ts

src/game/enemy/catGuardNavigation.ts

src/game/world/climb.ts

src/game/config/world.ts

src/game/config/citadelBlueprint.ts

src/game/enemy/citadelForces.ts

src/game/presentation/render2d/takerCitadel.ts

src/game/presentation/render2d/terrain.ts

src/components/StreetBrawler.tsx

Do NOT rewrite StreetBrawler.tsx unnecessarily.

Only make narrow integration changes there if genuinely required.

==================================================

VISUAL ACCEPTANCE TEST

==================================================

After implementation, capture LIVE gameplay-camera views around:

X = 900

X = 2700

X = 4500

X = 6300

X = 8100

Check both desktop AND mobile.

Compare each live view directly against:

06 — SECTION 7.1 TAKEN DISTRICT

07 — SECTION 7.2 TICKER DISTRICT

08 — SECTION 7.3 COPY MACHINE

09 — SECTION 7.4 INNER CITADEL

10 — SECTION 7.5 TICKER TAKER'S THRONE

For every section compare:

- overall silhouette

- focal landmark scale

- architectural density

- layering

- depth

- landmark placement

- deck visibility

- ladder visibility

- playable route

- section identity

- relationship between foreground/midground/background

==================================================

CRITICAL ACCEPTANCE RULE

==================================================

DO NOT declare the level visually fixed merely because:

- the code compiles

- TypeScript passes

- tests pass

- the expected objects exist

- the level technically functions

- the scenery is “cyberpunk”

- the scenery is “thematically similar”

VISUAL MATCH IS THE ACCEPTANCE CRITERION.

If a live screenshot still looks substantially different from its corresponding blueprint, continue iterating.

Each section must be immediately recognizable from its blueprint.

==================================================

CAT GUARD LIVE VALIDATION

==================================================

Test BOTH existing Cat Guard designs independently through:

- idle

- walk

- run

- attack

- hit

- defeat

- ladder mount

- ladder climb

- ladder dismount

Then test BOTH designs together in the same scene.

Verify:

- correct original artwork

- correct original clothing

- correct original colours

- correct sprite identity

- correct frame

- no frame leakage

- no duplicate limbs

- no merging

- no duplicate rendering

- no disappearing

- no flickering

- no floating

- no sinking

- correct feet alignment

- correct scale

- correct ladder interaction

==================================================

FINAL GAMEPLAY VALIDATION

==================================================

After the visual work is complete, replay the entire Level 7 route:

START

→ progress through 7.1

→ 7.2

→ 7.3

→ Inner Citadel

→ key pickup

→ ladder route

→ cage

→ rescue

→ 7.5

→ Ticker Taker defeat

→ victory

Run:

- focused Level 7 tests

- full test suite

- TypeScript/typecheck

- preview build

Confirm that gameplay behaviour remains unchanged.

==================================================

FINAL REPORT

==================================================

When finished, report:

1. What Cat Guard rendering defects were actually found and fixed.

2. Confirmation that BOTH original Cat Guard designs remain distinct with their original colours and clothing.

3. What was changed in each of the five blueprint sections.

4. The live-camera comparison results at X=900, 2700, 4500, 6300 and 8100.

5. Desktop/mobile validation results.

6. Gameplay route validation.

7. Test/typecheck/build results.

8. Any remaining visual differences.

Do NOT claim exact blueprint fidelity unless the live gameplay-camera views were actually inspected against the supplied blueprint references.

The supplied blueprint remains the canonical Level 7 visual reference.

The two existing project Cat Guard sprite sheets remain the canonical Cat Guard artwork.

The objective is not to make Level 7 “better” or merely more detailed.

The objective is to make the LIVE GAMEPLAY CAMERA LOOK LIKE THE APPROVED LEVEL 7 BLUEPRINT WHILE PRESERVING THE EXISTING GAMEPLAY SYSTEMS.

&nbsp;