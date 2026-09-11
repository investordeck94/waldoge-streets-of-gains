# Waldoge Punch-Combo Title Screen

## Goal
Rebuild the existing game menu to closely match the supplied portrait reference: a neon financial-city scene, oversized brush-style WALDOGE branding, a dominant full-body Waldoge fighter, and four heavy arcade menu buttons.

## Implementation
- Create original portrait environmental artwork inspired by the reference, without copying or embedding the uploaded image.
- Keep Waldoge as a live canvas character using the existing game atlas, enlarged and staged centrally.
- Replace the simple shadowboxing loop with a readable repeating combo: guard, jab, cross, uppercut, recovery.
- Recompose the title and menu for the same vertical hierarchy as the reference while adapting cleanly to desktop and small mobile screens.
- Preserve Start, Continue, How to Play, Settings, difficulty selection, saved progress, and all gameplay systems.

## Technical details
- Use the existing `drawWaldogeSprite` renderer with presentation-only synthetic states; no game-loop or combat mutation.
- Store the new original background through the project asset flow and load it from the title screen.
- Keep semantic theme colors and existing menu callbacks.

## Validation
- Verify the title, fighter, and all four controls at 320×573 and 1280×1800.
- Confirm the complete punch sequence visually.
- Verify Start opens difficulty selection, Continue state remains correct, and both modals open.
- Run the full test suite and confirm the production build.
