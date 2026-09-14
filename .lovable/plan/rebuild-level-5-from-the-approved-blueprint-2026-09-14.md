# Rebuild Level 5 from the approved blueprint

## Audit result

The current Level 5 is still the legacy implementation and does **not** match the approved blueprint:

- It is 3,200 units rather than 9,000.
- It has no dedicated Level 5 environment renderer or five-section world.
- It uses the generic `park` scene and legacy trestle route rather than the cemetery, liquidation district, exchange, vault, and gothic domain.
- It has no authored Level 5 ladders, stacked decks, or Level 5 encounter map.
- It has only two normal waves, so it cannot provide an encounter in every blueprint section.
- The approved Exit Liquidity atlas, animation mapping, preload path, boss moves, and combat scale already exist and will be preserved.
- The exact uploaded Monko poster is not yet an in-world asset.

This requires a Level 5-only reconstruction. The blueprint image will remain a reference and will not be pasted into the game.

## Blueprint-to-game map

Level 5 will be exactly 9,000 world units, split into five authored 1,800-unit sections. The main floor remains at the global floor height from X 0 through X 9,000, with no pits, slopes, profiles, steps, or dips.

### 5.1 Dead Coin Cemetery — X 0–1,800

- **Composition:** cemetery gate and bare trees → large `RIP 99.9%` crypto tombstones and crypt monuments → broken ATM/terminal cluster → candle-lit graves and scattered dead coins → elevated cemetery decks and connected ladders → `PROJECT DEAD` monument → ruined financial equipment transitioning into Liquidation Street.
- **Layers:** moonlit gothic skyline and fog behind; tombs, crypts, scaffolds, and playable decks at gameplay depth; candles, coins, and pipes in front.
- **Gameplay:** flat main lane, two elevated deck runs, connected ladder routes, one authored enemy encounter near the section centre.

### 5.2 Liquidation Street — X 1,800–3,600

- **Composition:** damaged financial buildings → dominant `LIQUIDATED` board carrying `POSITION CLOSED`, `ACCOUNT BALANCE: £0.00`, and `MARGIN CALL` → crashed trading screens and desk banks → abandoned vehicle/equipment cluster → red-lit catwalks and service ladders → transition into the exchange façade.
- **Layers:** dark financial skyline behind; offices, billboards, trading desks, and playable catwalks at gameplay depth; cables, pipes, and warning lights in front.
- **Gameplay:** flat main lane, upper catwalk network, one authored encounter distributed through the section.

### 5.3 The Dead Exchange — X 3,600–5,400

- **Composition:** monumental gothic exchange entrance → large `DEAD EXCHANGE` display → rows of dead monitors and trading desks → server racks and ticker machinery → lower and upper exchange decks → stacked three-level trading structure with deck-to-deck ladders → vault-door transition.
- **Layers:** gothic arches and exchange towers behind; desks, machinery, stacked playable decks, and ladders at gameplay depth; hanging cables and red lamps in front.
- **Gameplay:** strongest vertical route, including independent lower/middle/upper collision surfaces and two-way ladder links; one authored enemy encounter.

### 5.4 The Liquidity Vault — X 5,400–7,200

- **Composition:** `LIQUIDITY IN` extraction machinery → giant central vault door and pipe manifold → `LIQUIDITY OUT` machinery → `NO REFUNDS` and `THANK YOU FOR YOUR CONTRIBUTION` signs → service decks and stacked vault walkways → locked banana display labelled `MONKO'S BANANAS` → the exact uploaded `LOST BANANAS` Monko poster pasted onto the adjacent authored vault wall.
- **Exact poster:** upload the supplied 1024×1536 artwork unchanged, render the complete image without procedural replacement or destructive cropping, retain all wording and Monko artwork, and use one authored placement only.
- **Gameplay:** flat main lane, connected service decks/ladders, one authored encounter; vault machinery and banana storage remain non-colliding scenery.

### 5.5 Exit Liquidity's Domain — X 7,200–9,000

- **Composition:** gothic financial gateway → pre-boss enemy chamber → chains, broken wallets/coins, pipes, fog, and red-lit side machinery → `WELCOME TO YOUR EXIT` / `ALL TRADERS END HERE` messaging → symmetric cathedral-like boss architecture → tall central Exit Liquidity presentation → broad unobstructed arena at the far right.
- **Layers:** cathedral and reaper silhouettes behind; side decks and industrial structures at gameplay depth; chains, fog, and lamps in front without collision.
- **Gameplay:** one normal encounter before the boss, then the existing Exit Liquidity fight at the authored arena position. The central combat lane remains clear.

## Implementation

1. Add a Level 5-specific authored world-data module containing section bounds, landmark records, deck IDs, collision surfaces, ladder records with explicit upper/lower structure IDs, encounter positions, and boss bounds.
2. Add a dedicated cached Level 5 renderer with deterministic modular cemetery, financial, exchange, vault, banana-storage, and gothic-arena structures. Cull by section/module bounds and reuse preloaded image references.
3. Upload the exact Monko poster directly from the supplied file to project asset storage, import its pointer, preload it once, and draw it only at the authored vault-wall placement.
4. Register Level 5 only in the district renderer, section-label path, preload path, world width, deck/ladder data, and encounter map.
5. Expand only Level 5's normal-wave configuration to five staged encounters—one per section—using the existing enemy roster and escalating existing values without changing AI, hitboxes, controls, or global balance.
6. Preserve the current Exit Liquidity atlas, pose mapping, effects, move set, HP, damage, AI, and combat scale. Reuse the approved atlas in the arena presentation without creating a substitute boss.
7. Keep Levels 1–4 and 6–7, global physics, camera, combat, progression, saves, rewards, HUD, and controls unchanged.

## Collision and traversal rules

- `groundYAt(4, x, ..., false)` must equal the global floor for every X from 0–9,000.
- Level 5 has no pit records and no hidden base-ground profile.
- Every visible playable deck has one explicit collision record and stable structure ID.
- Every visible gameplay ladder uses the existing JUMP-based ladder system and connects two named, valid surfaces.
- Stacked decks remain separate collision planes, ordered so the existing feet-anchored grounding path resolves upper, middle, lower, and main-floor surfaces correctly.
- Decorative tombs, desks, vaults, machinery, bananas, signs, chains, pipes, and backgrounds never create collision.

## Verification and acceptance

- Add focused Level 5 tests for 9,000-unit width, five ordered sections, flat floor, zero pits, finite authored coordinates, every deck/ladder endpoint, stacked-deck connectivity, visual/collision ID correspondence, five ordered encounters, boss bounds, exact poster asset and wording metadata, banana landmark, approved boss atlas, culling, and unchanged neighboring levels.
- Run the complete existing test suite and confirm the preview build is clean.
- Run Level 5 from start to boss defeat and confirm Level 6 begins normally.
- Walk and run the full main floor; cross all four section boundaries; climb every ladder in both directions; traverse every deck and stacked-deck connection; inspect Waldoge's feet at every landing.
- Repeat the full traversal on desktop and a phone-sized viewport, including mobile UP/DOWN + JUMP ladder controls.
- Capture running-game views around X 900, 2,700, 4,500, 6,300, and 8,100, plus a close view of the Monko poster, and compare each against its blueprint section for landmark order, scale, density, architecture, signage, and story elements.
- Confirm the exact poster is readable, unchanged, shown once, and integrated into the vault wall; confirm no old/generated poster remains.
- Check console/runtime errors, asset requests, camera bounds, rendering continuity, enemy coverage, boss visibility, and surrounding Level 5 architecture before acceptance.

Completion requires the running Level 5 to visibly correspond section-by-section to the approved blueprint, not merely pass tests.