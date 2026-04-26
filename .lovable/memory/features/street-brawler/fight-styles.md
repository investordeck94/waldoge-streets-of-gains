---
name: Street Brawler Fight Styles
description: Q-key cycles 3 fight styles affecting speed, damage, and special-energy stamina cost
type: feature
---
Three fight styles, defined in `src/lib/fightStyles.ts`, swapped mid-fight with the **Q** key (or HUD badge):

- **Brawler** (yellow, default): 1× speed / 1× damage / 1× stamina — neutral baseline, no aura
- **Rush** (cyan): 1.5× speed / 0.7× damage / 0.8× stamina — fast attacks, light hits
- **Muay Thai** (red): 0.85× speed / 1.4× damage / 1.2× stamina — slow, heavy

Wiring in `StreetBrawler.tsx`:
- `g.style: StyleName` lives on `gameRef`, mirrored to `styleName` React state for HUD reactivity
- `fightStyle.speed` multiplies `PLAYER_SPEED` and divides punch/kick `stateTimer` (with min floors of 4/5 frames)
- `fightStyle.damage` multiplies the final `dmg` calculation alongside crit/weapon/boost mults
- `fightStyle.staminaCost` multiplies special move + groundpound `energyCost`
- Visual: pulsing colored ground ellipse + halo ring drawn under non-Brawler player
- HUD: clickable badge (top-right of stats row) tinted to current style; reset to brawler on game start
