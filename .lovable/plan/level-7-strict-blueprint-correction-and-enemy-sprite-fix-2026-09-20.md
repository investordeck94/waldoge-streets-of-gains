# Level 7 strict blueprint correction and enemy sprite fix

## Goal

Correct the existing Level 7 implementation in place. Preserve the approved Cat Guard and Ticker Taker artwork, combat, difficulty, controls, scoring, sound, save flow, and Levels 1–6.

## Audit findings

- The world already uses 9,000 units, five 1,800-unit sections, a continuous flat main floor, 20 collision decks, 24 linked ladders, functional key/cage state, and a gated final boss.
- The Cat Guard renderer is the primary confirmed defect: it divides large labelled sprite-sheet regions into equal-width cells even though the supplied characters occupy irregular rectangles. This can crop adjacent poses, stretch frames, and shift feet between frames.
- Cat Guard AI also changes `x` directly while the generic loop separately applies velocity. The renderer itself correctly uses `screenX = worldX - cameraX`, but movement and frame selection need one explicit contract.
- The current Level 7 scenery is a sparse procedural approximation. Its labels identify the five sections, but its density, platform integration, red vertical structures, ticker district, copy machinery, Inner Citadel, and throne composition do not yet closely match the supplied blueprint.
- Existing geometry is internally valid, but its visual platform system must be made to correspond to the blueprint’s four elevation bands. Engine Y increases downward, so blueprint heights will be mapped to equivalent feet surfaces rather than interpreted as literal screen Y values.

## Phase 1 — Lock the blueprint map

- Add a Level-7-only blueprint specification containing exact section bounds, named deck bands, ladder links, encounter zones, key/cage coordinates, and required landmarks.
- Preserve 9,000 total width and section boundaries at 0, 1800, 3600, 5400, 7200, and 9000.
- Keep the uninterrupted authoritative floor at the engine’s `GROUND_Y`; do not add pits, slopes, or hidden collision.

## Phase 2 — Fix Cat Guard movement and animation

- Replace equal-width sheet slicing with explicit per-frame source rectangles measured from the supplied Black and Orange/White production sheets.
- Give every frame a fixed feet anchor and stable destination scale so walk, run, attacks, Cartwheel, hit, defeat, and climb cannot stretch or shift the collision body.
- Keep one authoritative entity `x/y`; AI updates that position once, and rendering only converts `world x/y → camera → screen` without mutating state.
- Make locomotion transitions derive from actual movement, reset cleanly to idle, preserve the same Y when facing flips, and render each guard exactly once.
- Keep cached/preloaded local PNGs and the existing character designs.

## Phase 3 — Correct Level 7 geometry and validation

- Reconcile current decks and ladders with the blueprint’s main floor plus four elevation bands, retaining only authored reachable surfaces.
- Ensure every ladder visually and mechanically joins its declared lower and upper surfaces in both directions.
- Keep the key on the guarded lower citadel route, the cage on the elevated prison route, and the final arena wide enough for Ticker Taker.
- Add a Level-7 development validator that reports floor continuity, world bounds, section coverage, deck collision, ladder endpoints, route reachability, key/cage reachability, encounter placement, and boss-arena access. Expose a debug overlay only in the existing debug mode.

## Phase 4 — Match the five-section visual composition

- Rebuild only the Level 7 environment renderer from deterministic modular structures aligned to the same world coordinates as collision.
- 7.1: dense taken city, network/acquisition board, red towers, multi-level combat silhouette.
- 7.2: distinct market district with ticker screens, charts, financial data, and dense elevated structures.
- 7.3: distinct analysis/replication machinery, WALDOGE analysis displays, scanner/copy architecture, and industrial decks.
- 7.4: dominant Inner Citadel, visible guarded key route, stacked prison decks, elevated functional Anon cage, and clear rescue state.
- 7.5: expanded throne composition, final-citadel architecture, supplied Ticker Taker presentation, and an unobstructed boss lane through the level boundary.
- Draw scenery, decks, ladders, enemies, foreground details, and HUD in a fixed order so no gameplay object disappears behind unintended layers.

## Phase 5 — Acceptance testing

- Add focused frame tests for exact crop bounds, stable feet anchors, flip invariance, idle/walk/attack transitions, and single render dispatch.
- Extend geometry tests to all blueprint bands, every ladder endpoint, section identity, encounters, key/cage route, final arena, and unchanged Levels 1–6.
- Run the live game from X=0 to X=9000 on desktop and mobile, capturing all five sections and sustained Cat Guard walking, stopping, turning, climbing, combinations, and Cartwheel attacks.
- Complete the real sequence: start → 7.1 → 7.2 → 7.3 → guarded key → elite route → elevated cage → rescue → throne → Ticker Taker defeat → victory.
- Finish only after focused/full tests, typecheck, build, runtime errors, camera bounds, and screenshot comparison against the supplied blueprint pass.

## Technical constraints

- Level-7-only changes except shared test/debug hooks that are inert for other levels.
- No placeholder art, runtime-generated sprites, runtime atlas resizing, duplicate animation loops, CSS sprite transforms, or render-time entity mutation.
- Do not alter combat controls, damage rules, HP, scoring, boss attacks, audio, save/reward logic, or global difficulty.

**LEVEL 7 — STRICT BLUEPRINT CORRECTION + CAT GUARD SPRITE FIX**

**CRITICAL SAFETY / AUDIT RULE**

Before modifying any code, inspect the existing Level 7 implementation and identify the exact files/functions responsible for:

- Cat Guard frame extraction
- Cat Guard movement/AI
- Cat Guard animation/state selection
- Level 7 geometry
- Level 7 collision
- Level 7 ladders
- Level 7 rendering
- Level 7 environment rendering
- Level 7 key/cage state
- Level 7 Ticker Taker arena

Do not make speculative changes.

Preserve all existing working behaviour.

Make changes incrementally and verify after each phase.

If the supplied sprite sheets do not contain enough information to accurately determine the frame rectangles, STOP and report exactly what needs to be measured rather than guessing.

After inspection, report the files/functions identified and the current defect in each area before making modifications.

Do not begin implementation until this audit is complete.

&nbsp;

**CHANGE-SAFETY REQUIREMENT**

If a proposed change could affect a shared/global system, first determine whether the same code is used by Levels 1–6.

If it is shared, prefer a Level-7-only adapter, configuration, renderer, or code path rather than modifying the shared behaviour.

A shared change is permitted only if it is demonstrably behaviour-preserving for Levels 1–6 and is covered by regression checks.

Do not rewrite working systems merely to satisfy this specification.

The goal is a surgical correction of the existing Level 7 implementation, not a rewrite.

&nbsp;

**BASELINE REQUIREMENT**

Before modifying Level 7, establish the current baseline:

- current tests
- current typecheck
- current production build
- current Level 7 geometry
- current Cat Guard behaviour
- current camera behaviour
- current Level 7 key/cage progression
- current Ticker Taker behaviour

Record any existing failures separately from failures introduced by the correction.

After every major phase, verify that Levels 1–6 remain unchanged.

&nbsp;

**SPRITE MEASUREMENT REQUIREMENT**

For Cat Guard animation frames, inspect the actual supplied Black and Orange/White production PNGs.

Determine the real occupied rectangle of every required pose/frame.

Do not assume:

- equal frame widths
- equal frame heights
- uniform spacing
- uniform padding
- identical frame dimensions

If transparent padding exists, account for it through the explicit feet anchor rather than changing the artwork.

The final frame table must contain the measured source rectangles and anchors used by the renderer.

Do not proceed using guessed coordinates.

Do not modify the supplied artwork.

&nbsp;

**IMPLEMENTATION MODE**

Correct the existing Level 7 implementation in place.

Do not redesign, simplify, replace, or rebuild unrelated systems.

Preserve:

- approved Cat Guard artwork
- approved Ticker Taker artwork
- existing combat
- existing combat difficulty
- controls
- damage/HP rules
- scoring
- sound/audio
- save/reward flow
- Levels 1–6
- existing global game architecture
- existing local/preloaded PNG assets

This is a targeted Level-7 correction, not a new game implementation.

&nbsp;

**PHASE 1 — LOCK THE LEVEL 7 BLUEPRINT**

Create a Level-7-only deterministic blueprint specification.

The specification must contain:

- exact world bounds
- exact section bounds
- named elevation bands
- authored deck surfaces
- ladder links
- encounter zones
- enemy placement zones
- key coordinates
- cage coordinates
- required landmarks
- final boss arena bounds
- required route relationships

**WORLD BOUNDS**

Total Level 7 width:

0 → 9000

Section boundaries:

- 7.1: 0 → 1800
- 7.2: 1800 → 3600
- 7.3: 3600 → 5400
- 7.4: 5400 → 7200
- 7.5: 7200 → 9000

These coordinates are authoritative.

Do not move the section boundaries.

**MAIN FLOOR**

Preserve one uninterrupted authoritative main floor using the existing engine GROUND_Y.

Do NOT introduce:

- pits
- gaps
- slopes
- hidden collision gaps
- fake floor segments
- visual-only floor that differs from collision

The main floor must remain continuously reachable from X=0 to X=9000.

&nbsp;

**PHASE 2 — CAT GUARD SPRITE SYSTEM**

**ROOT CAUSE TO FIX**

The current Cat Guard renderer incorrectly divides large labelled sprite-sheet regions into equal-width cells.

The supplied production sheets contain characters/poses occupying irregular rectangles.

Therefore:

DO NOT calculate animation frames using:

regionWidth / frameCount

or any equivalent equal-cell slicing.

This causes:

- adjacent poses being cropped into frames
- stretched frames
- incorrect body proportions
- feet shifting between frames
- unstable collision/body alignment

Replace this with explicit source rectangles measured from the actual supplied PNGs.

&nbsp;

**EXPLICIT FRAME RECTANGLES**

Create a Level-7-only Cat Guard frame definition.

Every frame must explicitly specify:

- source PNG
- source X
- source Y
- source width
- source height
- feet anchor X
- feet anchor Y
- destination scale
- animation/state name
- frame duration where applicable

Do not infer frame dimensions at runtime.

Use measured rectangles from the supplied Black and Orange/White production sheets.

Do not resize the sprite sheet itself.

Do not create a runtime atlas.

Do not create placeholder frames.

Do not substitute generated artwork.

&nbsp;

**CAT GUARD FRAME CONTRACT**

Every rendered frame must use the same logical feet/ground anchor.

The character may have different source rectangle dimensions, but after transformation:

feet position = identical world-space anchor

This must remain true for:

- idle
- walk
- run
- attack
- Cartwheel
- hit
- defeat
- climb

No frame may appear to:

- float
- sink
- jump vertically
- slide its feet
- change collision height unexpectedly
- stretch relative to another frame

The collision/body position must remain independent of the source rectangle dimensions.

&nbsp;

**MOVEMENT CONTRACT**

There must be exactly ONE authoritative entity position.

Use:

entity.x  
entity.y

as the authoritative world position.

AI may determine movement intent.

Physics/movement may apply movement.

But the renderer must NEVER mutate entity position.

The renderer must only perform:

world position → camera position → screen position

For example:

screenX = entity.x - cameraX

and equivalent Y conversion.

Do not write to:

entity.x  
entity.y

inside rendering code.

&nbsp;

**AI/MOVEMENT DUPLICATION FIX**

The current Cat Guard AI can directly modify x while the generic movement loop separately applies velocity.

Remove this double movement.

There must be one authoritative movement application per update.

Prefer:

AI intent → velocity/state → single position update

unless the existing architecture clearly requires direct position updates.

Do NOT allow both:

AI x += ...

and

generic velocity x += ...

to affect the same entity during the same frame.

Preserve existing movement behaviour as closely as possible while eliminating duplicate application.

&nbsp;

**CAMERA CONTRACT**

The renderer must use the entity’s world position and the existing camera.

Never modify world position to compensate for camera movement.

Required relationship:

screenX = worldX - cameraX

Camera movement must not alter entity coordinates.

Camera bounds must remain unchanged unless the existing Level 7 blueprint explicitly requires them.

&nbsp;

**ANIMATION CONTRACT**

Animation state must derive from actual movement/state.

Examples:

- movement speed > threshold → locomotion animation
- no movement → idle
- attack state → attack animation
- hit state → hit animation
- defeat state → defeat animation
- climbing → climb animation

When movement stops:

- transition cleanly to idle
- reset animation according to the existing animation contract
- preserve feet/world Y

When facing direction changes:

- flip the rendered image only
- do not modify world X
- do not modify world Y
- do not change feet anchor
- do not change collision position

&nbsp;

**SINGLE RENDER DISPATCH**

Each Cat Guard must be rendered exactly once per frame.

Audit Level 7 for:

- duplicate render calls
- duplicate animation loops
- secondary Cat Guard drawing paths
- fallback renderers
- multiple components rendering the same guard

There must be one authoritative Cat Guard rendering path.

&nbsp;

**PHASE 3 — LEVEL 7 GEOMETRY**

Reconcile the existing geometry with the blueprint.

The level must contain:

- continuous main floor
- four authored elevation bands
- authored decks only
- authored ladders only
- reachable routes
- no arbitrary procedural collision

Blueprint height values must be mapped into the existing engine coordinate system.

Remember:

engine Y increases downward

Therefore blueprint elevations must be converted into equivalent feet/surface heights, not copied blindly as literal screen Y coordinates.

Do not alter the main-floor continuity.

&nbsp;

**DECK CONTRACT**

Every deck must correspond to an authored blueprint surface.

For every deck verify:

- world X start
- world X end
- world Y/feet height
- collision surface
- visual surface
- section identity
- elevation band
- reachable route

Do not create decorative platforms that accidentally become collision.

&nbsp;

**LADDER CONTRACT**

Every ladder must have:

- declared lower surface
- declared upper surface
- matching X/world location
- functional collision/interaction
- visual connection to both surfaces

Every ladder must work in both directions where the existing ladder mechanics support bidirectional traversal.

No ladder may:

- float
- stop short of a deck
- extend through an unrelated deck
- terminate above/below the actual surface
- visually connect to one surface while mechanically connecting to another

&nbsp;

**KEY/CAGE ROUTE**

The key must remain on the guarded lower citadel route.

The cage must remain on the elevated prison route.

The intended progression must remain:

START  
→ 7.1  
→ 7.2  
→ 7.3  
→ GUARDED KEY  
→ ELITE/GUARDED ROUTE  
→ ELEVATED PRISON ROUTE  
→ CAGE  
→ RESCUE  
→ FINAL CITADEL  
→ TICKER TAKER

Do not place the key or cage in a location that allows the intended route to be bypassed.

Preserve the existing key/cage state logic unless it is directly defective.

&nbsp;

**FINAL ARENA**

The final Ticker Taker arena must be sufficiently wide for:

- player movement
- enemy movement
- boss attacks
- dodge/spacing
- existing combat mechanics

The arena must not be obstructed by scenery.

The final boss lane must remain unobstructed through the end of Level 7.

Do not modify Ticker Taker’s existing combat behaviour.

&nbsp;

**PHASE 4 — LEVEL 7 VISUAL REBUILD**

Rebuild ONLY the Level 7 environment renderer where necessary.

Do not replace gameplay systems.

The renderer must use deterministic modular structures aligned to the same world coordinates as collision.

Visual landmarks must correspond to the blueprint.

Do not use random procedural placement that changes between runs.

The same world coordinates must produce the same environment every run.

&nbsp;

**7.1 — TAKEN CITY**

Create a dense captured/taken-city environment.

Required visual language:

- dense urban structures
- network/acquisition boards
- red vertical towers
- multi-level combat silhouettes
- substantial architectural density
- elevated structures corresponding to authored decks

Do not leave this section looking like sparse procedural placeholder scenery.

&nbsp;

**7.2 — MARKET DISTRICT**

Create a clearly distinct market/ticker district.

Required:

- large ticker screens
- financial charts
- market data
- dense elevated structures
- financial/market visual language
- red architectural elements integrated into the decks

The section must visibly read as a different district from 7.1.

&nbsp;

**7.3 — ANALYSIS / REPLICATION**

Create the analysis/replication machinery district.

Required visual elements:

- WALDOGE analysis displays
- scanner machinery
- copy/replication architecture
- industrial machinery
- industrial decks
- large machinery silhouettes
- dense technical environment

It must visually communicate analysis/replication rather than generic city scenery.

&nbsp;

**7.4 — INNER CITADEL**

This section must be visually dominant.

Required:

- major Inner Citadel architecture
- clearly visible guarded key route
- stacked prison decks
- elevated prison route
- functional Anon cage
- visible rescue state
- substantial vertical composition

The cage must be visually obvious and integrated into the architecture.

The rescue state must be clear after the player completes the rescue.

&nbsp;

**7.5 — FINAL CITADEL / THRONE**

Create an expanded final-citadel composition.

Required:

- large throne composition
- final-citadel architecture
- supplied Ticker Taker presentation
- clear final arena
- unobstructed boss lane
- visual continuity through X=9000

Do not allow scenery to cover the boss or combat lane.

&nbsp;

**RENDER ORDER**

Use one deterministic Level-7 render order.

Recommended conceptual order:

1. background
2. distant structures
3. architectural structures
4. decks/platform visuals
5. ladders
6. interactive landmarks
7. enemies
8. player
9. foreground details
10. HUD/UI

Adjust only where the existing engine requires a different ordering.

The key requirement is:

Gameplay objects must never disappear behind scenery unintentionally.

&nbsp;

**PHASE 5 — LEVEL 7 VALIDATOR**

Create a Level-7 development validator.

It must report:

**WORLD**

- world bounds
- total width
- section boundaries
- floor continuity

**SECTIONS**

- section coverage
- section identity
- missing/overlapping regions

**DECKS**

- authored deck count
- X ranges
- elevation band
- collision validity
- reachability

**LADDERS**

For every ladder:

- lower surface
- upper surface
- lower endpoint
- upper endpoint
- endpoint alignment
- reachability

**ROUTES**

Validate:

- start route
- section transitions
- key route
- elite route
- cage route
- rescue route
- final boss route

**OBJECTIVES**

Validate:

- key placement
- cage placement
- encounter placement
- boss placement
- boss arena access

**FINAL**

Validate:

- X=0 reachable
- X=9000 reachable
- Ticker Taker arena accessible
- victory route accessible

&nbsp;

**DEBUG OVERLAY**

Expose validator output only through the existing debug mode.

Do not show debug information to normal players.

The debug overlay should make it possible to identify:

- section boundaries
- deck IDs
- ladder IDs
- elevation bands
- encounter zones
- key
- cage
- boss arena
- route validation status

Do not add a new player-facing UI system.

&nbsp;

**PHASE 6 — CAT GUARD TESTING**

Add focused tests for Cat Guard rendering.

Test:

- exact crop bounds
- every explicit frame rectangle
- feet-anchor stability
- destination scale
- facing-flip invariance
- idle transition
- walk transition
- attack transition
- hit transition
- defeat transition
- climb transition
- Cartwheel transition
- single render dispatch

Also verify:

- no renderer writes to entity X/Y
- no duplicate movement application
- camera movement does not change world coordinates
- frame changes do not change collision/body position

&nbsp;

**GEOMETRY TESTING**

Test every:

- blueprint elevation band
- section boundary
- deck
- ladder endpoint
- encounter zone
- key route
- cage route
- final arena

Also verify that Levels 1–6 remain unchanged.

&nbsp;

**FULL RUNTIME TEST**

Run Level 7 from:

X = 0

through:

X = 9000

on:

- desktop
- mobile

Verify sustained Cat Guard:

- walking
- stopping
- turning
- facing changes
- climbing
- attacking
- combinations
- Cartwheel
- hit reactions
- defeat

Verify the complete progression:

START  
→ 7.1  
→ 7.2  
→ 7.3  
→ GUARDED KEY  
→ ELITE ROUTE  
→ ELEVATED CAGE  
→ RESCUE  
→ THRONE  
→ TICKER TAKER  
→ DEFEAT  
→ VICTORY

&nbsp;

**VISUAL ACCEPTANCE TEST**

Compare the actual Level 7 runtime against the supplied blueprint/reference images.

Check all five sections independently:

- 7.1 composition
- 7.2 composition
- 7.3 composition
- 7.4 composition
- 7.5 composition

Verify:

- landmark positions
- deck alignment
- ladder alignment
- vertical structure density
- key route visibility
- cage visibility
- throne composition
- final boss lane

Do not accept a merely functional approximation if the required blueprint composition is not represented.

&nbsp;

**FINAL ACCEPTANCE GATE**

Do NOT consider this task complete merely because the code compiles.

Completion requires ALL of the following:

- focused tests pass
- full tests pass
- typecheck passes
- production build passes
- no runtime errors
- camera bounds remain correct
- Cat Guard feet remain stable
- Cat Guard frames are correctly cropped
- no duplicate Cat Guard rendering
- no duplicate Cat Guard movement
- no renderer-side entity mutation
- all five Level 7 sections visually correspond to the blueprint
- decks correspond to the blueprint
- ladders correspond to the blueprint
- key route works
- cage route works
- rescue state works
- final boss arena works
- Ticker Taker presentation remains intact
- screenshot comparison against the supplied blueprint passes
- Levels 1–6 remain unchanged

If any acceptance item fails, continue correcting Level 7.

Do not declare completion based solely on typecheck/build success.

&nbsp;

**HARD CONSTRAINTS**

Level-7-only implementation changes.

Shared test/debug hooks are permitted only when completely inert for Levels 1–6.

DO NOT:

- alter combat controls
- alter damage
- alter HP
- alter scoring
- alter boss attacks
- alter audio
- alter save logic
- alter reward logic
- alter global difficulty
- replace approved artwork
- create placeholder art
- generate sprites at runtime
- resize sprite atlases at runtime
- use equal-width sprite-sheet slicing for Cat Guards
- use CSS sprite transforms
- create duplicate animation loops
- mutate entity position during rendering
- introduce duplicate movement application
- introduce new collision outside the authored blueprint
- replace the existing Level 7 gameplay with a simplified mockup
- make speculative sprite-coordinate guesses
- modify Levels 1–6 unnecessarily
- replace the existing camera system unnecessarily
- alter Ticker Taker’s combat or attacks

The supplied production artwork and blueprint are authoritative.

Fix the implementation around them.

&nbsp;

**FINAL INSTRUCTION**

Do not stop after making code changes.

Inspect the result and verify the actual Level 7 runtime behaviour.

If the Cat Guards are still visually glitchy, do not compensate by changing their artwork, collision, scale globally, or combat behaviour.

Instead, re-check:

- measured source rectangles
- feet anchors
- destination scale
- animation state transitions
- movement ownership
- camera conversion
- render dispatch

If the Level 7 scenery does not match the supplied blueprint, correct the Level-7 environment composition and coordinate mapping rather than weakening the blueprint requirements.

If a test fails, diagnose the actual cause and correct it before proceeding.

If a change unexpectedly affects Levels 1–6, revert that shared change and implement a Level-7-specific solution instead.

The task is complete only when the implementation, tests, and actual runtime all satisfy this specification.