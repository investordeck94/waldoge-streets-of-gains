Implement the following feature set for WALDOGE: STREETS OF GAINS.

IMPORTANT SCOPE RULE:

This is a MENU / GAME-FLOW / RETRY-SYSTEM change only.

Do NOT modify:

- combat

- enemy AI or balance

- boss AI

- level layouts

- level artwork

- player movement or physics

- controls

- camera

- progression rewards

- wallet/blockchain systems

- weekly competition

- existing Level 1–7 content

- existing save architecture except where required to correctly store the selected starting level

# 1. ADD FREE PLAY

Add a new FREE PLAY option to the main game title menu.

Free Play flow:

FREE PLAY

→ Seven-Level Picker

→ Difficulty Picker

→ Start Selected Level

The seven-level picker must use the existing canonical seven-level roster:

LEVEL 1 — JEET

LEVEL 2 — RUGGER

LEVEL 3 — BAD ACTOR

LEVEL 4 — FUDDER

LEVEL 5 — EXIT LIQUIDITY

LEVEL 6 — MR MARKETER

LEVEL 7 — TICKER TAKER

Show each level's district/boss identity clearly.

Do not create a second hardcoded level roster if one already exists. Reuse the canonical existing roster.

After selecting a level, use the EXISTING difficulty picker.

Do not create a separate difficulty system.

# 2. FREE PLAY STARTING LEVEL

Reuse the existing:

onStart(difficulty, startLevel)

callback.

When Free Play starts:

- selected difficulty is passed normally

- selected level becomes the starting level

- HUD immediately reflects the selected level

- game state immediately reflects the selected starting level

- save state correctly records the selected starting level where appropriate

Do not fake the HUD by changing display text only.

The actual game state and HUD must agree.

# 3. NORMAL START GAME

Keep the existing START GAME flow unchanged:

START GAME

→ Difficulty Picker

→ LEVEL 1

Start Game must always begin at Level 1.

# 4. CONTINUE

Preserve the existing CONTINUE/save integration.

Do not break existing saved progress.

Continue should resume from the existing saved state exactly as it currently does.

Do not make Free Play overwrite the player's normal campaign progress.

# 5. DIFFICULTY-AWARE GAME OVER RETRY

After Waldoge is defeated, determine the retry level using a small pure level-selection rule.

EXACT RULES:

EASY / NEW TO CRYPTO:

→ Restart from the level where Waldoge was defeated.

NORMAL / HALF A DEGEN:

→ Restart from the level where Waldoge was defeated.

HARD / FULL TRENCH MODE:

→ ALWAYS restart from LEVEL 1.

Examples:

If Waldoge dies on Level 3:

Easy → Restart Level 3

Normal → Restart Level 3

Hard → Restart Level 1

If Waldoge dies on Level 7:

Easy → Restart Level 7

Normal → Restart Level 7

Hard → Restart Level 1

# 6. GAME OVER BUTTON TEXT

The Game Over retry button must clearly explain what will happen.

Easy / Normal:

"RETRY LEVEL 3"

or dynamically:

"RETRY LEVEL [CURRENT LEVEL]"

Hard:

"RESTART RUN FROM LEVEL 1"

The text must be generated from the actual retry rule rather than being hardcoded to one level.

The player should understand the consequence BEFORE pressing the button.

# 7. PURE RETRY RULE

Create a small pure function responsible only for deciding the retry level.

Conceptually:

retryLevel(difficulty, defeatedLevel)

Easy → defeatedLevel

Normal → defeatedLevel

Hard → 1

Keep this logic isolated and testable.

Do not duplicate retry logic across multiple UI components.

# 8. FREE PLAY + CAMPAIGN SEPARATION

Free Play must allow the player to directly select any of the seven levels.

However:

Free Play must NOT corrupt normal campaign progression.

Do not accidentally mark future campaign levels as completed simply because they were played through Free Play.

Do not overwrite normal Continue data with a Free Play session unless the existing save architecture explicitly requires it.

Keep campaign progression and Free Play starting-level selection logically separate.

# 9. BACK / RETURN NAVIGATION

Verify all menu navigation:

Main Menu

→ Free Play

→ Level Picker

→ Difficulty Picker

→ Start

and:

Difficulty Picker

→ Back

→ Level Picker

and:

Level Picker

→ Back

→ Main Menu

Also verify existing Start Game, Continue and Settings/How To Play navigation remains intact.

# 10. MOBILE + DESKTOP

The new Free Play and level-selection screens must work properly on both:

- iPhone/mobile

- desktop/browser

No horizontal overflow.

No clipped level cards.

No scrolling required just to access essential buttons where avoidable.

Touch targets must remain comfortable on mobile.

# 11. TESTING

Add focused regression tests covering:

START GAME:

- always starts Level 1

CONTINUE:

- preserves existing save behaviour

FREE PLAY:

- all seven levels selectable

- selected level reaches onStart correctly

- selected difficulty reaches onStart correctly

- HUD immediately matches selected starting level

RETRY:

Easy + defeat Level 1 → Level 1

Easy + defeat Level 3 → Level 3

Easy + defeat Level 7 → Level 7

Normal + defeat Level 1 → Level 1

Normal + defeat Level 3 → Level 3

Normal + defeat Level 7 → Level 7

Hard + defeat Level 1 → Level 1

Hard + defeat Level 3 → Level 1

Hard + defeat Level 7 → Level 1

Also test:

- retry button text

- back navigation

- Free Play does not corrupt campaign save/progression

- existing Start Game flow

- existing Continue flow

Then run:

1. focused tests

2. full test suite

3. typecheck

4. production build

5. desktop browser check

6. mobile browser check

FINAL REQUIREMENT:

Do not redesign existing game systems.

This should be a focused expansion of the existing title/menu/game-over flow.

Preserve the existing architecture wherever possible and reuse existing components, callbacks, difficulty definitions, level roster and save logic rather than creating duplicate systems.