# Level 2 — Rugger’s Empire Redesign

## Goal
Replace Level 2’s procedural stickman-era financial street with a substantially longer, cinematic Wall Street + crypto + casino world inspired by the attached reference, while preserving all combat values and unrelated levels.

## What will change

### 1. Expand and restructure Level 2
- Increase Level 2 from **6,600** world units to approximately **10,800** units.
- Divide the journey into 10 authored sections:
  1. Financial District Entrance
  2. Crypto Offices
  3. Rugger Exchange
  4. Luxury Financial District
  5. Rugger Towers
  6. Underground Trading Infrastructure
  7. Casino District
  8. Rugger’s Gambling Den
  9. Rugger’s Private Empire
  10. Rugger Boss Arena
- Reposition the two minion encounters and boss arena proportionally within the larger world.

### 2. Build an original modular environment
- Create original painted environment panels based on the reference’s density, scale, night lighting, architectural depth, gold/black finance branding, cyan market screens, and magenta casino lighting.
- Do not embed or copy the uploaded reference, and do not place Waldoge or gameplay enemies into environment artwork.
- Add a dedicated cached Level 2 renderer that sequences the panels across the world and uses viewport culling.
- Layer distant skyline, midground towers/buildings, street-level landmarks, and foreground props at distinct parallax rates.
- Keep a deterministic procedural fallback so gameplay remains visible if artwork is still loading.

### 3. Author recognizable landmarks
- Build distinct, readable landmarks rather than repeated generic blocks:
  - Rugger Capital
  - Rugger Finance / Digital Assets offices
  - Rugger Exchange with market screens and tickers
  - Rugger Towers with dominant gold-and-black skyline branding
  - Golden Bull / Rugger Capital Markets plaza
  - Casino district
  - Rugger’s Gambling Den with casino frontage and VIP entrance
  - Rugger’s private trading-and-casino headquarters for the boss arena
- Integrate fictional market, liquidity, rug-pull, and gambling signage into façades, screens, plazas, and underground infrastructure.

### 4. Expand vertical traversal using the existing system
- Replace the two shallow lower streets with several authored dips of varying safe depth.
- Add clearly readable upper-street, lower-platform, infrastructure, vault, and casino-backroom areas.
- Connect every lower area with functional ladders sized for the current full-body characters.
- Reuse the existing finite ground collision, pit-wall clamping, player climbing, enemy nearest-ladder routing, camera tracking, and automatic dismount behavior.
- Add only the smallest extensions needed for multiple pit depths and additional ladder placements; no combat or broad AI rewrite.

### 5. Preserve gameplay and isolate the change
- Leave player attacks, enemy attacks, damage, HP, hitboxes, hurtboxes, knockback, hitstun, boss AI, difficulty, rewards, progression, and other levels unchanged.
- Keep the Rugger boss arena floor clear and frame combat with environment art only.
- Retain the shared render clock, deterministic animation, cached world data, one-time image preload, and viewport culling.

## Technical details
- Add a dedicated `ruggerEmpire` renderer beside the existing Jeet and film-district renderers.
- Route only zero-indexed Level 2 (`level === 1`) through it.
- Extend Level 2 data in the central world configuration; camera, spawning, pickups, clamping, and boss placement already consume that source of truth.
- Update terrain rendering for deeper authored pits without changing collision semantics.
- Add regression tests for width, 10-section progression, landmark coverage, finite coordinates, pit safety, ladder coverage, enemy cross-level routing, encounters, and untouched Level 7 defaults.

## Validation
- Run TypeScript checks, the complete test suite, and the production build.
- Use Playwright at 1280×1800 against the existing preview to traverse Level 2 from entrance to boss arena.
- Verify each section, artwork continuity, parallax, camera bounds, all dips, player ladder descent/ascent, enemy ladder pursuit, encounter progression, Rugger boss activation/fight, no endless falls, no stuck enemies, no visual gaps, and no browser errors.
- Run a focused Level 7 regression check.
- Report any item that cannot be proven as **NOT VERIFIED**, rather than inferring success.
