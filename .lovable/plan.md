# Level 5 visual blueprint fidelity rebuild

## Goal
Rebuild only Level 5’s presentation so each live camera view is immediately recognizable as the corresponding approved blueprint section. Preserve every existing gameplay coordinate, collision surface, ladder, encounter, boss behavior, and progression rule.

## Visual build
1. **Create five dedicated section art kits**
   - Author separate distant skyline, monumental architecture, gameplay-facing structure, and foreground dressing for each 1,800-unit section.
   - Use section-specific silhouettes and materials rather than shared boxes, scaffolds, or generic industrial modules.
   - Keep atmosphere and parallax visual-only so the existing gameplay geometry remains authoritative.

2. **Dead Coin Cemetery**
   - Build the moonlit gothic gate, crypt skyline, varied oversized crypto graves, dead trees, stone walls, lamps, candles, terminals, coins, and fog.
   - Integrate existing ladders/decks visually into cemetery masonry and metalwork.

3. **Liquidation Street**
   - Build dense ruined financial towers and a dominant multi-storey `LIQUIDATED` facade with the approved warning copy.
   - Add crashed graph displays, trading desks, abandoned vehicle/equipment, red catwalk lighting, cables, and layered debris.

4. **The Dead Exchange**
   - Build a monumental gothic exchange crypt with arches, columns, a giant `DEAD EXCHANGE` display, stacked trading floors, dead monitors, ticker machinery, integrated server racks, vault doors, lamps, and candles.
   - Preserve the approved three-level deck and ladder geometry exactly.

5. **The Liquidity Vault**
   - Build a dominant ornate circular vault and surrounding underground stone/metal machinery with green-cyan financial lighting.
   - Add extraction pipes, safes, service decks, crates, banana storage, and the exact uploaded Monko poster uncropped and unaltered.

6. **Exit Liquidity’s Domain**
   - Build a symmetrical cathedral-vault arena with towering arches, pillars, chains, red-lit machinery, candles, fog, abandoned financial relics, and elevated side structures.
   - Keep a broad combat lane and use the approved Exit Liquidity character art as the central presentation.

## Technical boundaries
- Replace Level 5’s generic procedural visual modules inside its presentation renderer with dedicated section modules and layered local/CDN art assets.
- Keep `world.ts`, level configuration, physics, combat, AI, hitboxes, controls, saves, rewards, HUD, and all non-Level-5 rendering unchanged.
- Keep visual decoration non-collidable; existing authored decks and ladders remain the only elevated gameplay geometry.
- Retain the exact supplied Monko poster and approved Exit Liquidity atlas without regeneration or alteration.

## Verification
- Capture the running game at X≈900, 2,700, 4,500, 6,300, and 8,100 on desktop and compare each view directly with its blueprint panel for composition, silhouette, landmark scale, density, layers, lighting, ladders/decks, and story elements.
- Rework any section still reading as generic industrial scenery.
- Run a complete Level 5 playthrough through all encounters and Exit Liquidity into Level 6.
- Verify all 13 ladder routes, flat-floor grounding, camera bounds, asset loading, stable rendering, mobile framing, automated tests, and final build.
