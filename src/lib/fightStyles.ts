// Fight styles for Street Brawler. Each style trades speed for damage / stamina.
// Toggled mid-fight with the Q key.

export type StyleName = "brawler" | "rush" | "muayThai";

export interface FightStyle {
  speed: number;       // movement + attack frame multiplier
  damage: number;      // outgoing damage multiplier (regular + special)
  staminaCost: number; // special-energy cost multiplier
  label: string;       // shown in HUD
  tint: string;        // HSL color for player aura/outline
}

export const STYLES: Record<StyleName, FightStyle> = {
  brawler: {
    speed: 1,
    damage: 1,
    staminaCost: 1,
    label: "BRAWLER",
    tint: "hsl(45 100% 55%)", // yellow — neutral default
  },
  rush: {
    speed: 1.5,
    damage: 0.7,
    staminaCost: 0.8,
    label: "RUSH",
    tint: "hsl(200 100% 60%)", // cyan/blue — fast & light
  },
  muayThai: {
    speed: 0.85,
    damage: 1.4,
    staminaCost: 1.2,
    label: "MUAY THAI",
    tint: "hsl(0 85% 55%)", // red — slow & heavy
  },
  greenCandle: {
    speed: 1.15,
    damage: 1.55,
    staminaCost: 1.4,
    label: "GREEN CANDLE",
    tint: "hsl(120 100% 50%)", // green — pump rage
  },
};

export const STYLE_ORDER: StyleName[] = ["brawler", "rush", "muayThai", "greenCandle"];

export function nextStyle(s: StyleName): StyleName {
  const i = STYLE_ORDER.indexOf(s);
  return STYLE_ORDER[(i + 1) % STYLE_ORDER.length];
}
