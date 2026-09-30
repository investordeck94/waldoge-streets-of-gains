# Fix Level 7 Hard Mode encounter management

## Goal

Keep FULL TRENCH MODE difficult while replacing the all-at-once enemy wall with finite, readable encounters that reliably advance through all five waves.

## Changes

- Add a Level-7-Hard-only encounter queue with a deterministic simultaneous-enemy cap; dead enemies never consume active capacity.
- Treat each authored wave as a finite roster. Spawn queued fighters in controlled batches and never replenish beyond that roster.
- Preserve each wave's authored Cat Guards and Candle Minions, but schedule them so the two Cat Guard designs, artwork, navigation, and memory handling remain untouched.
- Complete a wave only when both its active living enemies and queued remainder are empty, then initialize the next wave exactly once.
- Keep Normal Mode, all other levels, combat values, boss logic, geometry, camera, scenery, quest flow, and image residency unchanged.

## Validation

- Reproduce the recording's opening Hard wave and inspect enemy count, spacing, kills, queue depletion, and HUD progression.
- Run Level 7 Hard through W1→W2→W3→W4→W5→boss in a phone-sized live session, then repeat the progression check on desktop.
- Confirm Normal Level 7 still uses its existing encounter behavior.
- Add focused tests for finite totals, active caps, dead-enemy exclusion, no reseeding, and all five transitions; run the full suite and verify the preview build.

## Technical detail

The current Hard multiplier creates up to 32 Candle Minions in a single Level 7 wave before Cat Guards are appended, and the entire roster is instantiated simultaneously. The existing wave-completion check only understands that single active array. A small encounter-state helper will separate the finite wave roster from its active slice and expose one completion rule: `living active + queued remaining === 0`.

&nbsp;

LEVEL 7 HARD MODE — FINITE ENCOUNTER QUEUE + CONTROLLED WAVE PROGRESSION

GOAL

Fix Level 7 FULL TRENCH MODE / HARD MODE encounter management.

Hard Mode must remain genuinely difficult, but it must stop creating the huge simultaneous enemy wall seen in the recording.

Replace the current all-at-once roster instantiation with finite, readable encounters that reliably progress:

W1 → W2 → W3 → W4 → W5 → BOSS

IMPORTANT SCOPE

This is a Level-7-Hard-only encounter-management fix.

DO NOT modify:

- Normal Mode encounter behaviour

- Other levels

- Combat damage/health values

- Boss logic

- Level 7 geometry

- Camera

- Controls

- Scenery

- Quest flow

- Cat Guard artwork

- Cat Guard sprite sheets

- Cat Guard navigation

- Cat Guard memory handling

- Waldoge/Ticker Taker rendering

- Recent mobile image-memory optimisations

Preserve all existing authored enemy types and wave composition.

ROOT CAUSE TO ADDRESS

The current Hard multiplier can create up to approximately 32 Candle Minions in a single Level 7 wave before Cat Guards are appended, and the entire finite roster is currently instantiated simultaneously.

The current wave-completion logic only understands the active enemy array.

This produces the observed behaviour:

- enormous simultaneous enemy population

- enemies forming a wall

- heavy visual stacking/overlap

- poor spacing/readability

- kills occurring without reliable wave progression

- W1/5 remaining stuck

- excessive simultaneous image/enemy load

Do NOT solve this by simply lowering the Hard multiplier.

Instead, preserve the authored Hard roster and introduce proper finite encounter management.

IMPLEMENTATION

Create a small Level-7-Hard-only encounter-state helper/manager.

Each authored Hard wave must have:

1. FINITE AUTHORED ROSTER

- Build the complete wave roster once.

- The roster is finite.

- Never generate additional enemies after the authored roster has been exhausted.

- Never reseed or regenerate the roster because the active enemy count falls.

- The Hard multiplier must not cause endless replenishment.

2. QUEUED ENEMIES

Keep enemies that have not yet spawned in a queue/remainder.

Only spawn a controlled batch at a time.

3. DETERMINISTIC SIMULTANEOUS-ENEMY CAP

Introduce a deterministic maximum number of simultaneously living active enemies for Level 7 Hard.

The cap must be enforced by the encounter manager.

If the cap is reached:

- DO NOT spawn another enemy.

- DO NOT duplicate an enemy.

- DO NOT reseed the wave.

- Wait until active living capacity becomes available.

4. DEAD ENEMIES MUST RELEASE CAPACITY

An enemy that is dead must no longer consume active capacity.

Do not count dead/dead-marked enemies as active simply because their object remains temporarily in an array.

Use living active enemies for capacity calculations.

5. CONTROLLED SPAWNING

Spawn queued fighters in readable batches.

Do not instantiate the entire wave simultaneously.

The two authored Cat Guard designs and Candle Minions must remain exactly the existing authored enemy types.

Do not alter:

- their artwork

- colours

- clothing

- animation sheets

- sprite selection

- navigation

- ladder behaviour

- memory optimisation

- collision behaviour

Only control WHEN they enter the active encounter.

6. NO RESEEDING

Audit every Hard Mode spawn path.

There must be exactly one finite roster for each authored wave.

After an enemy has been:

- queued

- spawned

- killed

it must never be recreated unless that enemy was explicitly part of the original finite roster and is still waiting in the queue.

Do not allow:

- per-frame respawning

- respawning after kills

- respawning whenever active count drops

- duplicate wave initialization

- duplicate queue population

- multiplier reapplication that expands the roster repeatedly

WAVE COMPLETION

Use one authoritative completion rule:

living active enemies + queued remaining enemies === 0

Only when BOTH are empty may the current wave complete.

When the rule becomes true:

- complete the current wave exactly once

- advance the wave index exactly once

- initialise the next authored wave exactly once

- populate its finite queue exactly once

Prevent duplicate transition calls caused by multiple frames observing completion.

HUD

The existing Hard Mode HUD must progress correctly:

W1/5

W2/5

W3/5

W4/5

W5/5

BOSS

The HUD must not remain stuck on W1/5 while enemies continue spawning.

Do not fake HUD progression. Fix the underlying encounter state.

DIFFICULTY

Hard Mode must remain HARD.

Do not simply reduce the authored enemy totals or make enemies weaker.

Difficulty should come from:

- finite enemy composition

- controlled batches

- enemy behaviour

- encounter pressure

- authored Cat Guard/Candle combinations

- existing combat values

The goal is controlled difficulty, NOT easy mode.

READABILITY

At any moment the player should be able to distinguish:

- Waldoge

- individual enemies

- attacks

- enemy movement

- deaths

- newly spawned enemies

Do not allow an uncontrolled continuous wall of enemies.

LEVEL 7 HARD ONLY

Ensure the new encounter manager is explicitly gated to Level 7 Hard/Full Trench Mode.

Normal Level 7 must continue using its existing encounter behaviour unchanged.

Do not refactor the shared encounter system unless absolutely necessary.

VALIDATION — MUST BE LIVE, NOT JUST STATIC TESTS

First reproduce the opening Hard Mode wave from the supplied recording and inspect:

- total finite roster size

- queued remainder

- living active enemy count

- simultaneous cap

- enemy spacing

- kills

- queue depletion

- wave completion

- HUD progression

Specifically verify that the opening wave no longer creates the huge simultaneous enemy wall.

Then run the complete Level 7 Hard sequence in a phone-sized live session:

W1 → W2 → W3 → W4 → W5 → BOSS

Verify:

- every wave advances

- no wave stalls

- no uncontrolled respawning occurs

- active enemy count never exceeds the cap

- dead enemies release capacity

- queued enemies eventually spawn

- the finite roster eventually reaches zero

- the boss transition occurs normally

Repeat the progression check on desktop.

Then verify Normal Level 7 still behaves exactly as before.

TESTS

Add focused tests covering:

1. finite roster total

2. queue population occurs exactly once

3. active simultaneous cap

4. dead enemies do not consume active capacity

5. queued enemies spawn only when capacity exists

6. no reseeding after kills

7. no duplicate wave initialisation

8. wave completion requires:

   living active + queued remaining === 0

9. W1 → W2 transition

10. W2 → W3 transition

11. W3 → W4 transition

12. W4 → W5 transition

13. W5 → boss transition

14. Normal Level 7 regression

Run the full test suite and verify the production/preview build.

ACCEPTANCE CRITERIA

Do NOT report this as fixed merely because tests compile or pass.

It is fixed only when live gameplay confirms:

- Hard Mode is still difficult

- No giant simultaneous enemy wall appears

- Enemy count remains controlled

- Enemies remain visually readable

- Kills reduce the active population

- queued enemies replace defeated enemies in controlled batches

- each wave has a finite endpoint

- W1/5 advances through W2/5, W3/5, W4/5 and W5/5

- boss transition occurs

- no duplicate/reseeded enemies appear

- Normal Level 7 remains unchanged

- Cat Guard designs/artwork/navigation/memory handling remain unchanged

- mobile behaviour remains stable

FINAL REPORT

After implementation, report:

1. Exact root cause(s) found

2. Files changed

3. New encounter-state/queue structure

4. Exact simultaneous-enemy cap

5. How dead enemies release capacity

6. How duplicate/reseed spawning was prevented

7. Confirmation of W1→W5→boss progression

8. Hard Mode mobile validation result

9. Hard Mode desktop validation result

10. Normal Mode regression result

11. Test-suite result

Do not make unrelated changes.

Do not redesign Level 7.

Do not replace or regenerate Cat Guard artwork.

Do not alter the recent mobile image-memory fix.