import { StoryPanel } from "@/components/game/StoryPanel";
import { LEVEL7_ANON_RESCUE } from "@/game/story/level7AnonRescue";
export default function TmpStory() { return <div style={{position:"relative",width:"100vw",height:"100vh"}}><StoryPanel scene={LEVEL7_ANON_RESCUE} onDone={() => {}} /></div>; }
