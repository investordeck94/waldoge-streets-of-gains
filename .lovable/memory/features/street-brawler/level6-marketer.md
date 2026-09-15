---
name: Level 6 — Mr. Marketer's Territory
description: Level 6 blueprint layout, key/cage/squirrel quest gate, Raiding Team enemies and local artwork loading
type: feature
---

Level 6 (index 5) is the authored Mr. Marketer blueprint world: width 9000, five 1800-unit sections
(Advertising, Cold Call, Funnel, Manipulation, HQ), flat main floor at GROUND_Y, 17 ladders, 10 authored decks,
encounter zones [0.09, 0.28, 0.5, 0.71, 0.86] with the boss at 0.94.

Story gate (one-way): clear the key-guard wave → key appears on the funnel deck (x 4540, y 108) →
cage at x 8360 → Squirrel rescued → only then does Mr. Marketer spawn. Until rescue, an on-screen hint shows.

Enemies: Candle Minions preserved, plus Raiding Team henchmen (Level 6 only) with MP40-style ranged bursts.
Stragglers more than 1200 units from the player are re-staged 620 units away so waves always clear in the wide world.

Boss and section artwork must load from bundled local copies (`*-local.png/jpg` in src/assets);
CDN `.asset.json` URLs are served as HTML by the dev server and silently fall back to the procedural renderer.
