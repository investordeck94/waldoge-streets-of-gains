# Free Play and difficulty-aware retries

## What will change
- Add **Free Play** to the main game menu.
- Free Play opens a seven-level picker, showing each district and boss, then uses the existing difficulty picker before starting that selected level.
- Keep the normal **Start Game** path beginning at Level 1 and preserve **Continue** save integration.
- After defeat, **Easy** and **Normal** restart from the level where Waldoge was defeated.
- After defeat, **Hard / Full Trench Mode** always restarts from Level 1.
- Make the Game Over button text explain whether it resumes the current level or restarts the full run.

## Technical details
- Extend the title screen's local panel flow only; reuse the existing `onStart(difficulty, startLevel)` callback and canonical seven-level roster.
- Correct the game start state mirror so a selected starting level is immediately reflected in the HUD and save state.
- Route the Game Over retry through a small pure level-selection rule, with focused regression tests for all three difficulties.
- Do not change combat, enemy balance, level layouts, progression rewards, wallet systems, or the weekly competition.

## Verification
- Test Start Game, Continue, Free Play level selection, all three retry rules, and return/back navigation.
- Run focused tests, the full test suite, typecheck, production build, and desktop/mobile browser checks.
