import { StoryPanel } from "@/components/game/StoryPanel";
import { LEVEL7_FINAL_EPILOGUE } from "@/game/story/level7Epilogue";
export default function TmpStory() { return <div style={{position:"relative",width:"100vw",height:"100vh"}}><StoryPanel scene={LEVEL7_FINAL_EPILOGUE} onDone={() => {}} /></div>; }
