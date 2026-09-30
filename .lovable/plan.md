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
