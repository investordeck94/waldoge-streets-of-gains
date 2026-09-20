# Level 7 — The Taker’s Citadel Final Blueprint Rebuild

## Goal
Rebuild only the playable Level 7 as the approved 9,000-unit, five-section finale. Preserve the working player physics, controls, combat, difficulty, camera, saves, progression, Ticker Taker AI/moves, and persistent pre-scaled boss sprite path.

## Audit Findings
- **Already correct and preserved:** feet-anchored player rendering; `groundYAt`-based grounding; one-way deck landing; ladder mount/climb/dismount state; exact endpoint grounding; camera world-width clamp; enemy/boss motion sanitizers; Ticker Taker’s full move set; compact persistent PNG preload and frame validation; final-boss victory handling.
- **Missing/inconsistent:** Level 7 still uses the legacy short width, generic chart scenery, no authored decks/ladders, no five-section encounters, and no key/cage/rescue objective.
- **Dangerous to change:** global movement timing, jump physics, shared ladder controls, renderer loop, boss AI/moves, Ticker Taker atlas loading, entity respawning, and Levels 1–6 geometry/presentation.

## Blueprint-to-Game Map
All gameplay coordinates are deterministic world units. The main floor remains `GROUND_Y` from X=0 through X=9000.

| Section | Range | Blueprint landmarks | Gameplay structure |
|---|---:|---|---|
| 7.1 The Taken District | 0–1800 | Ticker Taker Network, six acquired districts, “All Empires Now His”, “Same Community. Stronger Together.” | Three broad deck groups with connected ladders; first staged encounter |
| 7.2 The Ticker District | 1800–3600 | Market Never Sleeps, trading chart, Buy/Obey/Trade/Repeat, Global Control | Alternating lower/middle/upper financial walkways; second encounter |
| 7.3 The Copy Machine | 3600–5400 | Waldoge Analysis chamber, copied-data checklist, Replication 98%, Waldoge Detected | Scanning chamber framed by stacked server decks and ladders; third encounter |
| 7.4 The Inner Citadel | 5400–7200 | One Market/One Truth/One Owner, elevated guarded key, Data Capture 100%, Anon prison tower | Authored ascent at 5850–6500; key deck at X≈6300; further route to a prison tower at X≈6900 with Deck 1 → Deck 2 → cage level and ladders on both sides |
| 7.5 Ticker Taker’s Throne | 7200–9000 | Cryptoverse Is Mine, Waldoge Was Just the Beginning, Let’s See Who’s Better, throne and gold statues | Final approach decks around a broad, uncluttered, flat boss lane; Ticker Taker at X≈8460 |

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
