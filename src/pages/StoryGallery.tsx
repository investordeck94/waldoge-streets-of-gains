import { useState } from "react";
import { StoryPanel } from "@/components/game/StoryPanel";
import type { StoryScene } from "@/game/story/storyTypes";
import * as L1 from "@/game/story/level1Story";
import { LEVEL2_OPENING_CALL, LEVEL2_DOXX_RESCUE } from "@/game/story/level2Story";
import { LEVEL2_ENDING_BAD_ACTOR_CALL } from "@/game/story/level2EndStory";
import { LEVEL3_SUS_RESCUE, LEVEL3_FILF_RESCUE } from "@/game/story/level3Story";
import { LEVEL4_OPENING_FUDDER_REVEAL, LEVEL4_BADDIE_RESCUE } from "@/game/story/level4Story";
import { LEVEL5_OPENING_EXIT_LIQUIDITY, LEVEL5_MONKO_RESCUE } from "@/game/story/level5Story";
import { LEVEL6_OPENING_MARKETING_MACHINE, LEVEL6_SQUIRREL_RESCUE } from "@/game/story/level6Story";
import { LEVEL7_ANON_RESCUE } from "@/game/story/level7AnonRescue";
import { LEVEL7_FINAL_EPILOGUE } from "@/game/story/level7Epilogue";
import { LEVEL7_OPENING_CITADEL } from "@/game/story/level7Story";

/** Preview-only story browser (not linked from the game). */
const GROUPS: { level: string; scenes: [string, StoryScene][] }[] = [
  { level: "Intro (Anonverse)", scenes: [
    ["1 Earth", L1.STORY_PANEL_1_EARTH], ["2 Anonverse", L1.STORY_PANEL_2_ANONVERSE], ["3 Hide & seek", L1.STORY_PANEL_3_HIDE_AND_SEEK],
    ["4 Monko bananas", L1.STORY_PANEL_4_MONKO_BANANAS], ["5 Doxx blackjack", L1.STORY_PANEL_5_DOXX_BLACKJACK], ["6 Blaze chill", L1.STORY_PANEL_6_BLAZE_CHILL],
    ["7 Dobermann", L1.STORY_PANEL_7_DOBERMANN_GUARD], ["8 FILF & Baddie", L1.STORY_PANEL_8_FILF_BADDIE], ["9 Squirrel", L1.STORY_PANEL_9_SQUIRREL_NUTS],
    ["10 Anon mayor", L1.STORY_PANEL_10_ANON_MAYOR], ["11 Peace ends", L1.STORY_PANEL_11_PEACE_ENDS],
  ] },
  { level: "Level 1", scenes: [["Opening", L1.LEVEL1_OPENING], ["FILF rescue", L1.LEVEL1_FILF_RESCUE], ["Level complete", L1.LEVEL1_COMPLETE]] },
  { level: "Level 2", scenes: [["Opening call", LEVEL2_OPENING_CALL], ["Doxx rescue", LEVEL2_DOXX_RESCUE], ["Ending — Bad Actor", LEVEL2_ENDING_BAD_ACTOR_CALL]] },
  { level: "Level 3", scenes: [["SUS Dog rescue", LEVEL3_SUS_RESCUE], ["FILF rescue", LEVEL3_FILF_RESCUE]] },
  { level: "Level 4", scenes: [["Fudder reveal", LEVEL4_OPENING_FUDDER_REVEAL], ["Baddie rescue", LEVEL4_BADDIE_RESCUE]] },
  { level: "Level 5", scenes: [["Exit Liquidity opening", LEVEL5_OPENING_EXIT_LIQUIDITY], ["Monko rescue", LEVEL5_MONKO_RESCUE]] },
  { level: "Level 6", scenes: [["Marketing Machine opening", LEVEL6_OPENING_MARKETING_MACHINE], ["Squirrel rescue", LEVEL6_SQUIRREL_RESCUE]] },
  { level: "Level 7", scenes: [["Citadel opening", LEVEL7_OPENING_CITADEL], ["Anon rescue", LEVEL7_ANON_RESCUE], ["Final epilogue", LEVEL7_FINAL_EPILOGUE]] },
];

export default function StoryGallery() {
  const [scene, setScene] = useState<StoryScene | null>(null);
  return (
    <main className="min-h-[100svh] bg-background p-4 text-foreground">
      <h1 className="font-heading text-2xl font-black text-primary mb-1">Story Gallery</h1>
      <p className="text-sm text-muted-foreground mb-4">Tap any story to play it. Doesn't affect your game or saves.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.level} className="glass-card rounded-lg border border-border p-3">
            <h2 className="font-heading font-bold mb-2">{g.level}</h2>
            <div className="flex flex-wrap gap-2">
              {g.scenes.map(([label, s]) => (
                <button key={s.id} type="button" onClick={() => setScene(s)}
                  className="rounded border border-primary/60 px-3 py-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground">
                  {label} <span className="opacity-60">({s.panels.length})</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {scene && <StoryPanel scene={scene} onDone={() => setScene(null)} />}
    </main>
  );
}
