# Level 7 Blueprint Visual-Match Rebuild

## Objective
Make each live gameplay-camera view visibly resemble its corresponding approved blueprint section. Object presence alone is insufficient; composition, scale, density, hierarchy, and landmark placement must match.

## Locked systems
- Preserve the 9,000-unit world, five section bounds, main floor, all collision decks, all real ladders, key, cage, boss arena, encounters, Cat Guard behavior/art, combat, controls, camera, difficulty, quest flow, and victory.
- Keep one world-to-camera transform and do not add fake playable platforms or ladders.

## Implementation
1. **Recompose 7.1 — Taken District**
   - Build the dominant central acquisition complex around the existing deck silhouette.
   - Add stepped side buildings, searchlight towers, layered windows, real-ladder framing, and the compact acquired-empires board at blueprint proportions.

2. **Recompose 7.2 — Ticker District**
   - Make the market hall and candlestick display the dominant center mass.
   - Integrate BUY/OBEY/TRADE/REPEAT and Global Control as flanking towers, with tiered structures aligned to real decks and ladders.

3. **Recompose 7.3 — Copy Machine**
   - Create the blueprint’s large cylindrical WALDOGE analysis chamber as the visual center.
   - Add the status wall, cable crown, symmetrical server towers, repeated lower copy bays, and architecture supporting the existing traversal levels.

4. **Recompose 7.4 — Inner Citadel**
   - Build a fortified vertical enclosure around the fixed key-to-cage route.
   - Give the key chamber, upper prison façade, cage enclosure, walls, banners, and ladder network the same visual hierarchy as the blueprint.
   - Paint key and cage last so they remain unobscured.

5. **Recompose 7.5 — Ticker Taker’s Throne**
   - Enlarge the Cryptoverse globe and throne into the dominant central monument.
   - Frame it with four statues, banners, columns, cables, and a monumental hall while keeping the boss lane clear.

## Technical approach
- Replace the current oversized, screen-like text blocks with blueprint-proportioned architecture in `takerCitadel.ts`.
- Derive playable fascia, supports, and ladder housings from `landingDecksFor(6)` and `laddersFor(6)` only.
- Use layered world-space drawing: distant skyline, monumental architecture, deck-aligned midground, then gameplay-critical objects.
- Preserve the corrected clean Cat Guard atlases and rendering pipeline unchanged.

## Visual acceptance
- Capture live gameplay-camera views near X=900, 2700, 4500, 6300, and 8100 on desktop and mobile.
- Compare each live capture directly against reference images 06–10 for silhouette, focal landmark scale, layering, deck/ladder visibility, and section identity.
- Iterate until every section is immediately recognizable from its blueprint—not merely thematically similar.
- Then replay key pickup, cage rescue, Ticker Taker defeat, and victory; run all tests, typecheck, and preview-build validation.
