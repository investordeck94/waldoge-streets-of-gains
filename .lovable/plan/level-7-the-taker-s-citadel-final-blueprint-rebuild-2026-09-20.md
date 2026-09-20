# Level 7 — The Taker’s Citadel Final Blueprint Rebuild

## Goal

Rebuild only the playable Level 7 as the approved 9,000-unit, five-section finale. Preserve the working player physics, controls, combat, difficulty, camera, saves, progression, Ticker Taker AI/moves, and persistent pre-scaled boss sprite path.

## Audit Findings

- **Already correct and preserved:** feet-anchored player rendering; `groundYAt`-based grounding; one-way deck landing; ladder mount/climb/dismount state; exact endpoint grounding; camera world-width clamp; enemy/boss motion sanitizers; Ticker Taker’s full move set; compact persistent PNG preload and frame validation; final-boss victory handling.
- **Missing/inconsistent:** Level 7 still uses the legacy short width, generic chart scenery, no authored decks/ladders, no five-section encounters, and no key/cage/rescue objective.
- **Dangerous to change:** global movement timing, jump physics, shared ladder controls, renderer loop, boss AI/moves, Ticker Taker atlas loading, entity respawning, and Levels 1–6 geometry/presentation.

## Blueprint-to-Game Map

All gameplay coordinates are deterministic world units. The main floor remains `GROUND_Y` from X=0 through X=9000.


| Section                   | Range     | Blueprint landmarks                                                                                       | Gameplay structure                                                                                                                                      |
| ------------------------- | --------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 The Taken District    | 0–1800    | Ticker Taker Network, six acquired districts, “All Empires Now His”, “Same Community. Stronger Together.” | Three broad deck groups with connected ladders; first staged encounter                                                                                  |
| 7.2 The Ticker District   | 1800–3600 | Market Never Sleeps, trading chart, Buy/Obey/Trade/Repeat, Global Control                                 | Alternating lower/middle/upper financial walkways; second encounter                                                                                     |
| 7.3 The Copy Machine      | 3600–5400 | Waldoge Analysis chamber, copied-data checklist, Replication 98%, Waldoge Detected                        | Scanning chamber framed by stacked server decks and ladders; third encounter                                                                            |
| 7.4 The Inner Citadel     | 5400–7200 | One Market/One Truth/One Owner, elevated guarded key, Data Capture 100%, Anon prison tower                | Authored ascent at 5850–6500; key deck at X≈6300; further route to a prison tower at X≈6900 with Deck 1 → Deck 2 → cage level and ladders on both sides |
| 7.5 Ticker Taker’s Throne | 7200–9000 | Cryptoverse Is Mine, Waldoge Was Just the Beginning, Let’s See Who’s Better, throne and gold statues      | Final approach decks around a broad, uncluttered, flat boss lane; Ticker Taker at X≈8460                                                                |


## Implementation

1. **Author Level 7 geometry first**
  - Set Level 7 width to 9000 and explicitly define no pits or alternate floor profile.
  - Add Level-7-only deck records with stable IDs/sections and sufficient combat/exit width.
  - Add Level-7-only ladder records whose top and bottom exactly match real authored surfaces.
  - Build the Inner Citadel key ascent and prison tower exactly in the requested authored ranges.
  - Add five encounter anchors and the final arena anchor without changing shared spawn logic.
2. **Validate the graybox before art**
  - Add focused geometry tests for width, section boundaries, flat floor, finite decks, visible/collision parity, ladder endpoint validity, reachability, elevated key, and cage above two playable deck levels.
  - Exercise continuous X=0→9000 walking, every ladder in both directions, repeated mounts, mid-ladder stops, platform exits, camera scrolling, combat-adjacent climbs, and boss-arena access.
  - Correct Level-7 data first; do not delete geometry or alter global physics to mask a bad endpoint.
3. **Add the Level 7 story flow**
  - Add isolated in-run Level 7 quest state: key guarded/available/taken and Anon captured/rescued.
  - Keep the key unavailable until the authored key-guard encounter is cleared; collect it only from the elevated key deck.
  - Require physical ascent to the cage interaction point and possession of the key.
  - Gate Ticker Taker’s boss wave until Anon is rescued, mirroring the proven one-way Level 6 quest pattern without sharing its state.
  - Show a visibly open cage and Anon standing feet-first on the cage deck after rescue.
4. **Use the supplied Anon artwork exactly**
  - Store the uploaded transparent character image through the project asset flow and render it as the full-body captured NPC.
  - Preserve its purple TV head, antenna ears, smile, body, white gloves, shoes, proportions, and silhouette without redesign.
  - Keep one cached image reference; no per-frame resizing canvas or image processing.
5. **Rebuild Level 7 presentation from modular authored art**
  - Create a dedicated Level 7 renderer and deterministic landmark map, separate from collision data.
  - Recreate each blueprint section with layered skyline, towers, server machinery, financial screens, cables, red warning lights, gold details, visible deck slabs, and aligned ladders.
  - Render all exact section titles, messages, acquisition entries, analysis statuses, prison labels, and throne messaging.
  - Keep decoration non-collidable and keep every collidable deck visibly represented.
  - Do not paste the blueprint image into the game and do not alter Levels 1–6 art.
6. **Preserve final-boss stability and identity**
  - Leave Ticker Taker’s AI, damage flow, all eight established move/weapon presentations, size, atlas frames, preload, single persistent image, source scaling, and fallback behavior unchanged.
  - Keep the arena centre clear for melee, jumps, projectiles, scythe, gun, megaphone, flyers, and energy drain.

## Validation and Acceptance

- Capture and compare running views at X≈900, 2700, 4500, 6300, 6900, and 8100 against the blueprint on desktop and mobile.
- Complete a non-teleported desktop run from Level 7 start through all five encounters, key ascent, key collection, prison climb, rescue, Ticker Taker fight, and victory.
- Complete the same central flow with the mobile controls, including Up+Jump and Down+Jump ladder use while preserving ordinary jumping away from ladders.
- Run the full ladder and platform matrices for every Level 7 authored surface, including enemies nearby and post-combat use.
- Verify all active characters remain visible during an extended final fight covering every Ticker Taker special move.
- Run focused Level 7 tests, existing Ticker Taker stability tests, full test suite, TypeScript check, production build, and inspect runtime/console errors.
- Regression-check Levels 1–6 geometry counts and representative starts to prove they were not changed.

WALDOGE: STREETS OF GAINS

LEVEL 7 — THE TAKER'S CITADEL

FINAL BLUEPRINT REBUILD — GAMEPLAY + GEOMETRY + VISUAL FIDELITY

IMPORTANT:

The attached Level 7 blueprint is the FINAL APPROVED SOURCE OF TRUTH.

I want the ACTUAL RUNNING GAME to look and play like the attached blueprint.

This is NOT a moodboard.

This is NOT inspiration.

This is NOT a general theme.

This is NOT permission to create a generic cyberpunk level.

The blueprint is the approved:

- level layout

- environment design

- visual direction

- landmark placement

- architectural composition

- deck/platform structure

- ladder structure

- story progression

- enemy placement concept

- key/cage sequence

- final arena design

Convert the blueprint into a polished, fully playable 2D side-scrolling beat-'em-up level.

DO NOT simply paste the blueprint into the game as a background.

Recreate what is shown using proper modular game assets, authored geometry, lighting, signs, screens, buildings, platforms, ladders, machinery, enemies and background layers.

==================================================

1. ABSOLUTE SCOPE LOCK

==================================================

ONLY modify/rebuild LEVEL 7.

DO NOT modify Levels 1–6.

DO NOT change global:

- player physics

- movement timing

- jump physics

- combat

- strike/hurtbox system

- shared ladder controls

- difficulty

- save system

- Continue

- Free Play

- retry

- progression

- wallet systems

- title/menu systems

- global renderer loop

- global camera architecture

- global enemy architecture

Preserve everything already working.

In particular preserve:

- feet-anchored player rendering

- groundYAt-based grounding

- one-way deck landing

- ladder mount/climb/dismount state

- exact ladder endpoint grounding

- camera world-width clamp

- enemy/boss motion sanitizers

- Ticker Taker's existing AI

- Ticker Taker's complete existing moveset

- persistent pre-scaled Ticker Taker PNG path

- compact PNG preload

- frame validation

- final boss victory handling

Do not replace working systems simply to implement the new level.

==================================================

2. AUDIT FIRST

==================================================

Before implementation, audit the current Level 7.

Confirm:

- current world width

- current player start

- current main floor

- current groundYAt behaviour

- current deck collision

- current ladder system

- current ladder controls

- current camera bounds

- current enemy spawning

- current Ticker Taker AI

- current Ticker Taker rendering

- current sprite stability fix

- current victory handling

Identify what can be reused.

Then rebuild ONLY the missing/inconsistent Level 7 pieces.

Do not rewrite systems that already work.

==================================================

3. FINAL LEVEL SIZE

==================================================

Level 7 must be exactly:

9,000 WORLD UNITS

Five continuous sections:

7.1 THE TAKEN DISTRICT

X = 0–1800

7.2 THE TICKER DISTRICT

X = 1800–3600

7.3 THE COPY MACHINE

X = 3600–5400

7.4 THE INNER CITADEL

X = 5400–7200

7.5 TICKER TAKER'S THRONE

X = 7200–9000

These are ONE continuous playable world.

No loading gaps.

No random teleporting between sections.

No invisible section walls.

No empty voids between sections.

==================================================

4. MAIN FLOOR — COMPLETELY FLAT

==================================================

The primary main floor MUST remain:

GROUND_Y

from:

X = 0

through:

X = 9000

There must be:

NO:

- slopes

- dips

- pits

- holes

- hidden floor profiles

- sudden Y changes

- gaps

- floating floor sections

- decorative objects acting as floor

- arbitrary Y offsets

Waldoge must be able to walk continuously from the beginning of Level 7 to the final arena.

His feet must remain correctly grounded.

Only:

- jumping

- ladder climbing

- intentional deck transitions

should change his vertical position.

==================================================

5. GROUNDING — NON-NEGOTIABLE

==================================================

Use the existing canonical:

groundYAt(...)

and the existing player feet/ground-anchor system.

The collision surface determines the player's position.

The sprite does NOT determine collision.

DO NOT use arbitrary sprite offsets to hide grounding problems.

DO NOT do things equivalent to:

player.y += magicNumber

or:

spriteOffsetY = magicNumber

to solve platform/ladder problems.

When Waldoge lands on:

- main floor

- Deck 1

- Deck 2

- Deck 3

- Deck 4

- key deck

- cage deck

- final arena

his feet must sit exactly on the real collision surface.

==================================================

6. DECKS / PLATFORMS

==================================================

Every playable deck must be explicitly authored.

Each deck must have:

- stable ID

- X start

- X end

- surface Y

- section ID

- collision

- connected ladder IDs

Every visible playable deck must have matching collision.

Every decorative object must remain non-collidable unless explicitly designated as gameplay geometry.

Do NOT create:

- invisible platforms

- floating collision

- visual platforms without collision

- collision platforms that have no visual representation

Every deck must be wide enough for:

- walking

- fighting

- jumping

- ladder entry

- ladder exit

==================================================

7. LADDER SYSTEM

==================================================

Every ladder must connect TWO REAL PLAYABLE SURFACES.

Each ladder must have:

- ladder ID

- X position

- bottom surface ID

- top surface ID

- bottom Y

- top Y

- section ID

Validate:

- bottom surface exists

- top surface exists

- ladder intersects bottom surface

- ladder intersects top surface

- ladder height > 0

- ladder is reachable

- ladder has enough room for player entry

- ladder has enough room for player exit

NO ladder may end:

- in mid-air

- inside a wall

- above a platform

- below a platform

- beside the intended platform

==================================================

8. LADDER CONTROLS

==================================================

Preserve existing controls.

MOBILE:

UP + JUMP = CLIMB UP

DOWN + JUMP = CLIMB DOWN

Do NOT add another ladder button.

Normal JUMP must remain normal JUMP away from ladders.

Do not alter existing desktop controls.

==================================================

9. LADDER ENTRY

==================================================

Make ladder entry reliable and forgiving.

Waldoge should not require pixel-perfect positioning.

When entering a ladder:

- resolve the correct ladder

- align to ladder

- enter ladder state

- suspend gravity

- suspend normal vertical physics

- begin controlled ladder movement

NO:

- teleporting

- violent snapping

- sideways displacement

- sudden Y jumps

- falling through the floor

==================================================

10. LADDER CLIMB

==================================================

During climbing:

- Waldoge remains aligned with ladder

- Y follows ladder

- gravity does not fight climbing

- jump physics do not fight climbing

- no sideways drift

- no jitter

- no falling through decks

- no visual separation between player and ladder

==================================================

11. TOP LADDER EXIT

==================================================

This must be handled using REAL SURFACE RESOLUTION.

When Waldoge reaches the top:

1. Identify connected top surface.

2. Resolve its actual surface Y.

3. Place Waldoge's feet exactly on it.

4. Set vertical velocity = 0.

5. Set grounded = true.

6. Exit ladder state.

7. Resume normal movement.

NO:

- floating

- sinking

- bouncing

- teleporting

- falling through

- stuck ladder state

==================================================

12. BOTTOM LADDER EXIT

==================================================

When descending:

1. Identify connected bottom surface.

2. Resolve its actual Y.

3. Place Waldoge's feet on it.

4. Set vertical velocity = 0.

5. Set grounded = true.

6. Exit ladder state.

7. Resume normal movement.

==================================================

13. NEVER DELETE GEOMETRY TO FIX BUGS

==================================================

If a deck causes a grounding problem:

FIX THE COLLISION.

If a ladder causes an exit problem:

FIX THE LADDER ENDPOINT.

If a player appears to float:

FIX THE SURFACE RESOLUTION.

DO NOT:

- delete the deck

- remove the ladder

- flatten the level

- move a major landmark

- remove vertical gameplay

- create invisible shortcuts

The blueprint geometry is intentional.

==================================================

14. SECTION 7.1 — THE TAKEN DISTRICT

==================================================

X = 0–1800

TITLE:

THE TAKEN DISTRICT

Major visual landmark:

TICKER TAKER NETWORK

The running game must visually reproduce the blueprint's dense futuristic district.

Include:

- giant Ticker Taker Network structure

- six acquired districts

- skyscrapers

- financial buildings

- industrial structures

- scaffolding

- cables

- screens

- red warning lights

- neon

- lower structures

- elevated decks

- ladders

- enemy encounters

Major messaging:

ALL EMPIRES NOW HIS

SAME COMMUNITY.

STRONGER TOGETHER.

Acquisition entries:

JEET DISTRICT — ACQUIRED

RUGGER EXCHANGE — ACQUIRED

BAD ACTORS STUDIOS — ACQUIRED

FUDDER MEDIA — ACQUIRED

EXIT LIQUIDITY — ACQUIRED

MR. MARKETER — ACQUIRED

The environment must be visually dense like the blueprint.

Do NOT replace it with generic cyberpunk scenery.

==================================================

15. SECTION 7.2 — THE TICKER DISTRICT

==================================================

X = 1800–3600

TITLE:

THE TICKER DISTRICT

Major landmark:

THE MARKET NEVER SLEEPS

Recreate the blueprint's:

- trading towers

- financial screens

- ticker boards

- exchange architecture

- giant charts

- cables

- industrial financial machinery

- elevated walkways

- decks

- ladders

- enemies

Signs/messages:

BUY

OBEY

TRADE

REPEAT

GLOBAL CONTROL

REAL TIME

MANIPULATION

Create alternating lower/middle/upper financial walkways.

These must be REAL playable decks.

==================================================

16. SECTION 7.3 — THE COPY MACHINE

==================================================

X = 3600–5400

TITLE:

THE COPY MACHINE

Major landmark:

WALDOGE ANALYSIS

This section must visually communicate that Ticker Taker has been studying Waldoge.

Include:

MOVESET COPIED

COMBAT DATA

COMMUNITY PATTERNS

BEHAVIOUR MODEL

REPLICATION: 98%

and:

WALDOGE DETECTED

Environment:

- giant scanning machinery

- server racks

- data centres

- observation chambers

- red scanning lights

- cables

- screens

- industrial machinery

- stacked decks

- ladders

- enemy encounters

The large machinery is decorative unless explicitly authored as collision.

==================================================

17. SECTION 7.4 — THE INNER CITADEL

==================================================

X = 5400–7200

TITLE:

THE INNER CITADEL

Major messaging:

ONE MARKET

ONE TRUTH

ONE OWNER

DATA CAPTURE

COMMUNITY ACQUISITION

100%

This is the most important vertical gameplay section.

It contains TWO DISTINCT structures:

A. KEY STRONGHOLD

B. ANON PRISON TOWER

DO NOT MERGE THEM.

==================================================

18. KEY STRONGHOLD

==================================================

Approximate X:

5850–6500

The key MUST be on an elevated deck.

It MUST NOT be on the main floor.

Required progression:

MAIN FLOOR

↓

LADDER

↓

DECK 1

↓

LADDER

↓

DECK 2

↓

LADDER

↓

KEY DECK

The key deck must contain:

- key

- multiple Ticker Taker guards

- combat space

- ladder access

- additional decks above/around it as represented by the blueprint

The player must physically fight upward.

Do NOT place one enemy next to a key on the ground.

The key structure should look like a heavily protected Ticker Taker security installation.

==================================================

19. KEY GUARDS

==================================================

Ticker Taker's people guard the key.

Place guards:

- on approach

- on lower deck

- on middle deck

- on key deck

- around upper access routes

Enemies must have valid platform grounding.

No enemy should spawn in mid-air or on invalid geometry.

==================================================

20. KEY STATE

==================================================

The key remains unavailable until the authored guard encounter is cleared.

After the required guards are defeated:

KEY becomes collectible.

Once collected:

key state is permanently true for the current run.

Prevent duplicate collection.

==================================================

21. ANON WALDOGE'S BOSS

==================================================

Use the supplied Anon Waldoge's Boss artwork as the DEFINITIVE character reference.

This is the exact character:

- purple TV/monitor head

- purple antenna ears

- black smiley face

- purple body

- white gloves

- purple footwear

- same proportions

- same silhouette

- same identity

DO NOT redesign him.

DO NOT make him a generic robot.

DO NOT make him an enemy.

DO NOT make him a boss.

He is a captured NPC.

==================================================

22. ANON PRISON TOWER

==================================================

Approximate X:

6750–7050

This is a SEPARATE structure from the key stronghold.

Anon Waldoge's Boss must be imprisoned inside a large cage.

The cage MUST be:

ABOVE TWO PLAYABLE DECK LEVELS.

Required relationship:

                [ ANON CAGE ]

                [ CAGE LEVEL ]

                  ↑     ↑

                LADDER LADDER

        =========================

                DECK 2

                  ↑     ↑

                LADDER LADDER

        =========================

                DECK 1

        =========================

                MAIN FLOOR

The cage must NOT be on Deck 1.

The cage must NOT be on Deck 2.

The cage must be ABOVE BOTH.

This vertical structure is mandatory.

==================================================

23. ANON CAGE

==================================================

The cage must be:

- large

- clearly visible

- visually important

- properly integrated into the blueprint environment

- large enough to clearly see Anon

- surrounded by playable architecture

- accessible by ladders

- protected by Ticker Taker's forces

Before rescue:

ANON WALDOGE'S BOSS

CAPTURED

Anon is visibly inside.

After rescue:

CAGE OPEN

ANON RESCUED

Anon must stand correctly on the cage-level surface.

==================================================

24. ANON RESCUE FLOW

==================================================

Mandatory sequence:

1. Enter Inner Citadel.

2. Fight through lower enemies.

3. Climb first decks.

4. Fight.

5. Reach key deck.

6. Fight key guards.

7. Collect key.

8. Continue right.

9. Reach Anon prison tower.

10. Climb Deck 1.

11. Fight.

12. Climb Deck 2.

13. Fight.

14. Climb to cage level.

15. Reach cage.

16. Verify key.

17. Unlock cage.

18. Open cage.

19. Rescue Anon.

20. Continue toward final section.

Do NOT allow rescue without the key.

Do NOT automatically teleport the player to Anon.

Do NOT skip the vertical route.

==================================================

25. SECTION 7.5 — TICKER TAKER'S THRONE

==================================================

X = 7200–9000

TITLE:

TICKER TAKER'S THRONE

Major messaging:

THE CRYPTOVERSE IS MINE

WALDOGE WAS JUST THE BEGINNING

LET'S SEE WHO'S BETTER

The environment must visually reproduce the blueprint:

- huge headquarters

- throne architecture

- giant screens

- ticker displays

- financial machinery

- giant pillars

- server towers

- red lighting

- gold details

- cables

- elevated structures

- final approach

==================================================

26. FINAL BOSS ARENA

==================================================

The final arena must be visually consistent with the blueprint.

It must have:

- broad flat main combat floor

- symmetrical architecture

- clear boss lane

- surrounding structures

- optional elevated areas

- no clutter in the central combat space

The centre must remain clear enough for:

- melee

- jumps

- projectiles

- scythe

- gun

- megaphone

- flyers

- energy drain

==================================================

27. TICKER TAKER

==================================================

Use the supplied Ticker Taker artwork as the definitive visual reference.

DO NOT redesign him.

Preserve:

- canine appearance

- red/black tracksuit

- PUMP beanie

- red/white eye covering

- established proportions

- established scale relative to Waldoge

Preserve his EXISTING AI and moves.

Do not remove or simplify:

- punch

- kick

- jump

- Tommy Gun

- scythe

- megaphone

- flyers

- energy drain

- existing special attacks

==================================================

28. TICKER TAKER VISIBILITY

==================================================

Do NOT reintroduce the previous Level 7 disappearing/flickering issue.

Ticker Taker must remain visible whenever:

- alive

- active

- within the arena

- within camera/render range

Waldoge must remain visible.

Enemies must remain visible.

Anon must remain visible while captured.

Do not fix visibility by changing gameplay state.

Do not respawn entities.

Do not teleport entities.

Do not rewrite the global renderer.

Keep the persistent pre-scaled PNG path.

Avoid runtime canvas generation and unnecessary per-frame image processing.

==================================================

29. VISUAL FIDELITY — EXTREMELY IMPORTANT

==================================================

The ACTUAL RUNNING GAME must LOOK LIKE THE ATTACHED BLUEPRINT.

Do NOT interpret the blueprint as simply a layout.

Match:

- colour palette

- red/black cyberpunk aesthetic

- blue/purple atmospheric lighting

- neon red signs

- building shapes

- tower silhouettes

- skyline

- financial screens

- ticker displays

- server machinery

- cables

- scaffolding

- deck arrangement

- ladder placement

- enemy density

- foreground/midground/background layering

- landmark scale

- landmark position

- lighting

- visual density

- architectural proportions

- section transitions

If the blueprint shows a particular building, screen, tower, sign, machine, deck or prison structure:

RECREATE THAT VISUAL CONCEPT.

Do NOT substitute:

"some generic cyberpunk building."

The player should be able to look at the running game and recognise the corresponding area of the blueprint.

==================================================

30. BLUEPRINT → GAME

==================================================

Use this process:

BLUEPRINT

↓

IDENTIFY VISUAL COMPONENTS

↓

CREATE MODULAR GAME ASSETS

↓

PLACE THEM AT DETERMINISTIC WORLD COORDINATES

↓

MATCH SCALE

↓

MATCH COLOUR

↓

MATCH LIGHTING

↓

MATCH DENSITY

↓

ALIGN ART WITH VERIFIED COLLISION

↓

TEST RUNNING GAME AGAINST BLUEPRINT

Do NOT paste the blueprint into the game.

Do NOT shrink the entire blueprint into one background.

The five sections must become actual side-scrolling environments.

==================================================

31. VISUAL DENSITY

==================================================

The blueprint is dense.

The running game must also be dense.

Use:

- foreground structures

- midground structures

- background skyline

- signs

- screens

- machinery

- lights

- cables

- decks

- ladders

- enemies

- architectural detail

Do not leave huge generic/empty stretches.

But decorative elements must remain separate from collision.

==================================================

32. CHARACTER SCALE

==================================================

Maintain the relative character scale shown by the blueprint.

Waldoge must not become tiny compared with buildings.

Ticker Taker must remain approximately Waldoge's combat scale.

Anon must be large enough to clearly see inside the cage.

==================================================

33. NO GENERIC SUBSTITUTIONS

==================================================

Do NOT replace blueprint-specific visual elements with generic alternatives.

If the blueprint shows:

- Ticker Taker Network

- acquisition board

- Market Never Sleeps

- Waldoge Analysis

- Copy Machine

- Inner Citadel

- key stronghold

- Anon prison tower

- final throne

- gold statues

- financial screens

- specific signage

those must exist as actual authored landmarks.

==================================================

34. COLLISION / VISUAL SEPARATION

==================================================

Decorative objects are NON-COLLIDABLE unless explicitly authored:

- buildings

- signs

- screens

- cables

- lights

- background machinery

- skyline

- statues

- decorative pipes

Only explicitly authored:

- main floor

- decks

- platforms

- ladders

- intended arena boundaries

may control gameplay.

Every collidable deck must visually exist.

Every playable ladder must visually line up with its collision representation.

==================================================

35. CAMERA

==================================================

Camera must correctly cover:

X = 0 → 9000

Validate views at:

X≈900

X≈2700

X≈4500

X≈6300

X≈6900

X≈8100

At each:

- Waldoge visible

- floor visible

- decks aligned

- ladders aligned

- enemies visible

- landmarks visible

- no void

- no camera snapping

- no active entity culling bug

==================================================

36. FULL WALK TEST

==================================================

Actually PLAY the level.

Do NOT use teleport/debug movement.

Start at Level 7 beginning.

Progress naturally through:

7.1

→ 7.2

→ 7.3

→ 7.4

→ key stronghold

→ key collection

→ Anon prison tower

→ Anon rescue

→ 7.5

→ Ticker Taker

→ victory

Verify:

- walking

- jumping

- combat

- decks

- ladders

- camera

- enemies

- key

- cage

- rescue

- boss

- victory

==================================================

37. LADDER TEST MATRIX

==================================================

EVERY LEVEL 7 LADDER must be tested.

For every ladder:

- left approach

- right approach

- bottom → top

- top → bottom

- stop halfway

- resume

- repeated climb

- repeated descent

- combat nearby

- camera scrolling

- desktop controls

- mobile controls

No ladder is complete until all pass.

==================================================

38. PLATFORM TEST MATRIX

==================================================

For every deck:

- jump onto it

- land on it

- stand

- walk left

- walk right

- fight

- take damage

- approach edges

- use ladder

- leave ladder

- return

No:

- floating

- sinking

- clipping

- teleporting

- jitter

- getting stuck

==================================================

39. KEY TEST

==================================================

Verify:

- key is elevated

- key is NOT on main floor

- key has multiple decks

- key has multiple ladders

- Ticker Taker forces guard it

- player must fight upward

- key cannot be collected early

- key collection works

- key cannot duplicate

==================================================

40. ANON TEST

==================================================

Verify:

- Anon uses supplied artwork

- Anon is an NPC

- Anon is inside cage

- cage is above TWO decks

- multiple ladders lead upward

- guards occupy prison tower

- Anon visible before rescue

- key required

- cage opens

- Anon visibly rescued

- Anon correctly grounded

- player can leave prison tower

==================================================

41. MOBILE TEST

==================================================

Test:

UP + JUMP = ladder up

DOWN + JUMP = ladder down

Normal JUMP away from ladders remains unchanged.

Test the complete key/cage route on mobile.

==================================================

42. REGRESSION PROTECTION

==================================================

After implementation verify Levels 1–6 remain unchanged.

Do not alter:

- Level 1

- Level 2

- Level 3

- Level 4

- Level 5

- Level 6

Also verify Ticker Taker's existing AI/moves and sprite stability remain intact.

==================================================

43. AUTOMATED TESTS

==================================================

Add/fix focused Level 7 tests for:

WORLD:

- width = 9000

- five sections

- correct boundaries

GROUND:

- flat main floor

- no gaps

- valid coordinates

DECKS:

- finite

- valid

- visible/collision parity

LADDERS:

- valid bottom surface

- valid top surface

- valid height

- reachable

- correct endpoints

KEY:

- elevated

- guarded

- collectible

- persistent

ANON:

- captured

- cage exists

- cage above two decks

- key required

- rescue works

BOSS:

- Ticker Taker exists

- moves preserved

- visibility preserved

- defeat works

- victory works

REGRESSION:

- Levels 1–6 unchanged

==================================================

44. IMPLEMENTATION ORDER

==================================================

DO THIS IN ORDER.

PHASE 1:

Audit existing Level 7.

PHASE 2:

Create 9,000-unit world.

PHASE 3:

Create flat main floor.

PHASE 4:

Create every deck.

PHASE 5:

Create every ladder.

PHASE 6:

Validate geometry.

PHASE 7:

Play-test X=0→9000 in graybox.

PHASE 8:

Fix ALL geometry/ladder/grounding issues.

PHASE 9:

Build key stronghold.

PHASE 10:

Test key stronghold.

PHASE 11:

Build Anon prison tower.

PHASE 12:

Test prison tower.

PHASE 13:

Implement key state.

PHASE 14:

Implement cage/rescue state.

PHASE 15:

Test key → cage → rescue.

PHASE 16:

Add enemies.

PHASE 17:

Rebuild visual environment from blueprint.

PHASE 18:

Add exact landmarks/signage.

PHASE 19:

Build final arena.

PHASE 20:

Verify Ticker Taker.

PHASE 21:

Full desktop playthrough.

PHASE 22:

Full mobile playthrough.

PHASE 23:

Run tests.

PHASE 24:

Typecheck.

PHASE 25:

Production build.

PHASE 26:

Final visual comparison against blueprint.

==================================================

45. FINAL VISUAL ACCEPTANCE

==================================================

Compare the ACTUAL RUNNING GAME against the attached blueprint at:

X≈900

X≈2700

X≈4500

X≈6300

X≈6900

X≈8100

Check:

- architecture

- colour

- lighting

- skyline

- signs

- screens

- machinery

- deck arrangement

- ladder arrangement

- enemy density

- landmarks

- character scale

- foreground

- midground

- background

- key structure

- Anon prison tower

- final arena

If the running game looks like a generic cyberpunk environment rather than the attached blueprint:

IT IS NOT FINISHED.

==================================================

46. FINAL ACCEPTANCE CHECKLIST

==================================================

[ ] Level 7 = exactly 9,000 units.

[ ] Five exact sections.

[ ] Main floor completely flat X=0→9000.

[ ] No walking bugs.

[ ] No grounding bugs.

[ ] No floating Waldoge.

[ ] No sinking Waldoge.

[ ] No floor gaps.

[ ] No invisible pits.

[ ] Every deck has real collision.

[ ] Every deck is visually represented.

[ ] Every ladder connects real surfaces.

[ ] Every ladder works upward.

[ ] Every ladder works downward.

[ ] No ladder snapping.

[ ] No ladder teleporting.

[ ] No ladder jitter.

[ ] No floating after ladder exit.

[ ] No sinking after ladder exit.

[ ] Key is elevated.

[ ] Key is guarded.

[ ] Key requires vertical progression.

[ ] Multiple decks surround key.

[ ] Multiple ladders surround key.

[ ] Additional decks exist above/around key.

[ ] Anon prison tower is separate from key structure.

[ ] Anon is above TWO playable decks.

[ ] Multiple ladders reach Anon's cage.

[ ] Ticker Taker forces guard prison tower.

[ ] Anon uses supplied artwork.

[ ] Anon is visibly captured.

[ ] Key required for rescue.

[ ] Cage visibly opens.

[ ] Anon visibly rescued.

[ ] Anon is correctly grounded.

[ ] Ticker Taker uses supplied artwork.

[ ] Ticker Taker existing moves preserved.

[ ] Ticker Taker does not disappear/flicker.

[ ] Waldoge does not disappear/flicker.

[ ] Enemies do not disappear/flicker.

[ ] Camera works X=0→9000.

[ ] Blueprint landmarks recreated.

[ ] Blueprint architecture recreated.

[ ] Blueprint colour palette recreated.

[ ] Blueprint lighting recreated.

[ ] Blueprint visual density recreated.

[ ] Blueprint deck/ladders recreated.

[ ] Blueprint final arena recreated.

[ ] No generic cyberpunk substitutions.

[ ] Blueprint image is NOT pasted into game.

[ ] Actual modular game assets are used.

[ ] Desktop playthrough passes.

[ ] Mobile playthrough passes.

[ ] Key → cage → rescue works.

[ ] Ticker Taker battle works.

[ ] Level 7 victory works.

[ ] Levels 1–6 unchanged.

[ ] Global systems unchanged.

[ ] Tests pass.

[ ] Typecheck passes.

[ ] Production build passes.

[ ] Runtime console is clean.

==================================================

FINAL NON-NEGOTIABLE REQUIREMENT

==================================================

I want the finished Level 7 to look like the attached blueprint has been turned into a REAL PLAYABLE 2D BEAT-'EM-UP.

NOT:

"an environment inspired by the blueprint."

I WANT:

"THE BLUEPRINT RECREATED AS THE GAME."

The visual design and gameplay geometry must agree.

The decks shown in the blueprint must be real decks.

The ladders shown in the blueprint must be real ladders.

The key structure shown in the blueprint must be the actual key structure.

The Anon prison tower shown in the blueprint must be the actual prison tower.

The final Ticker Taker arena shown in the blueprint must be the actual final arena.

Build the geometry first.

Validate it.

Then build the visual environment around the verified geometry.

Do not sacrifice the blueprint to hide a bug.

Fix the bug.

Do not sacrifice the visual design to make implementation easier.

Recreate the design.

The final result must be visually faithful, mechanically reliable, fully playable and stable from Level 7 start all the way through Anon's rescue and Ticker Taker's defeat.