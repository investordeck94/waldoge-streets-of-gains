// Bark Zero Voice Pack v1.3 — central config.
// Adding a new voice line requires: (1) drop an MP3 into public/audio/bark-zero/,
// (2) add one entry below. No other code changes.

export type BarkVoiceCategory =
  | "startup"
  | "thinking"
  | "launchlab"
  | "xstudio"
  | "memory"
  | "monitoring"
  | "general"
  | "closing";

export type BarkVoiceId =
  // startup
  | "bark-intro"
  | "boot-complete"
  | "welcome-back"
  | "good-morning"
  // thinking
  | "analyzing-data"
  | "narrative-analysis"
  | "scanning-timeline"
  | "sentiment-shift"
  | "pattern-detected"
  | "signal-confirmed"
  | "no-alpha"
  // launch lab
  | "concept-ready"
  | "proposal-approved"
  | "launch-armed"
  | "awaiting-confirmation"
  // x studio
  | "draft-prepared"
  | "reply-generated"
  | "thread-complete"
  | "ready-to-publish"
  // memory
  | "memory-updated"
  // monitoring
  | "monitoring-continues"
  // general
  | "processing-complete"
  | "task-complete"
  | "requires-approval"
  | "connection-interrupted"
  | "request-failed"
  | "ready-when-you-are"
  // closing
  | "stay-curious"
  | "signing-off"
  | "until-next-time";

export interface BarkVoiceEntry {
  id: BarkVoiceId;
  file: string;                // path under public/
  phrase: string;              // exact spoken phrase
  category: BarkVoiceCategory;
  description: string;         // when to trigger
  cooldownMs?: number;         // minimum gap between plays of this ID
  onceKey?: string;            // if set, only plays when this localStorage flag is false
  timeWindow?: { startHour: number; endHour: number }; // inclusive-start, exclusive-end
  oncePerDay?: boolean;
}

const BASE = "/audio/bark-zero";

export const BARK_VOICE_CONFIG: BarkVoiceEntry[] = [
  // ————— Startup —————
  {
    id: "bark-intro",
    file: `${BASE}/bark-intro.mp3`,
    phrase: "Bark intro",
    category: "startup",
    description: "First launch only. Replayable from Settings.",
    onceKey: "bark_voice_intro_played",
  },
  {
    id: "boot-complete",
    file: `${BASE}/boot-complete.mp3`,
    phrase: "Boot sequence complete. Bark Zero online.",
    category: "startup",
    description: "Every Bark Zero startup.",
  },
  {
    id: "welcome-back",
    file: `${BASE}/welcome-back.mp3`,
    phrase: "Welcome back.",
    category: "startup",
    description: "Returning user. Max once every 4 hours.",
    cooldownMs: 4 * 60 * 60 * 1000,
  },
  {
    id: "good-morning",
    file: `${BASE}/good-morning.mp3`,
    phrase: "Good morning.",
    category: "startup",
    description: "05:00–11:59 local. Once per day.",
    timeWindow: { startHour: 5, endHour: 12 },
    oncePerDay: true,
  },

  // ————— Thinking —————
  { id: "analyzing-data", file: `${BASE}/analyzing-data.mp3`, phrase: "Analyzing the data.", category: "thinking", description: "General loading." },
  { id: "narrative-analysis", file: `${BASE}/narrative-analysis.mp3`, phrase: "Running narrative analysis.", category: "thinking", description: "AI reasoning." },
  { id: "scanning-timeline", file: `${BASE}/scanning-timeline.mp3`, phrase: "Scanning the timeline for meaningful signals.", category: "thinking", description: "Searching X." },
  { id: "sentiment-shift", file: `${BASE}/sentiment-shift.mp3`, phrase: "Community sentiment shifting.", category: "thinking", description: "Sentiment engine movement." },
  { id: "pattern-detected", file: `${BASE}/pattern-detected.mp3`, phrase: "Pattern detected.", category: "thinking", description: "Interesting trend." },
  { id: "signal-confirmed", file: `${BASE}/signal-confirmed.mp3`, phrase: "Signal confirmed.", category: "thinking", description: "High-confidence signal." },
  { id: "no-alpha", file: `${BASE}/no-alpha.mp3`, phrase: "No meaningful alpha found.", category: "thinking", description: "Nothing valuable found." },

  // ————— Launch Lab —————
  { id: "concept-ready", file: `${BASE}/concept-ready.mp3`, phrase: "Token concept ready for review.", category: "launchlab", description: "Proposal generated." },
  { id: "proposal-approved", file: `${BASE}/proposal-approved.mp3`, phrase: "Proposal approved.", category: "launchlab", description: "User approved." },
  { id: "launch-armed", file: `${BASE}/launch-armed.mp3`, phrase: "Launch sequence armed.", category: "launchlab", description: "Ready to launch." },
  { id: "awaiting-confirmation", file: `${BASE}/awaiting-confirmation.mp3`, phrase: "Waiting for operator confirmation.", category: "launchlab", description: "Awaiting manual approval." },

  // ————— X Studio —————
  { id: "draft-prepared", file: `${BASE}/draft-prepared.mp3`, phrase: "Draft prepared.", category: "xstudio", description: "Draft generated." },
  { id: "reply-generated", file: `${BASE}/reply-generated.mp3`, phrase: "Reply generated.", category: "xstudio", description: "Reply created." },
  { id: "thread-complete", file: `${BASE}/thread-complete.mp3`, phrase: "Thread complete.", category: "xstudio", description: "Thread finished." },
  { id: "ready-to-publish", file: `${BASE}/ready-to-publish.mp3`, phrase: "Ready to publish.", category: "xstudio", description: "Approved to post." },

  // ————— Memory —————
  { id: "memory-updated", file: `${BASE}/memory-updated.mp3`, phrase: "Memory updated.", category: "memory", description: "Long-term memory saved." },

  // ————— Monitoring —————
  { id: "monitoring-continues", file: `${BASE}/monitoring-continues.mp3`, phrase: "Monitoring continues.", category: "monitoring", description: "Background monitoring resumes." },

  // ————— General —————
  { id: "processing-complete", file: `${BASE}/processing-complete.mp3`, phrase: "Processing complete.", category: "general", description: "Generic completion." },
  { id: "task-complete", file: `${BASE}/task-complete.mp3`, phrase: "Task complete.", category: "general", description: "Long-running task complete." },
  { id: "requires-approval", file: `${BASE}/requires-approval.mp3`, phrase: "That action requires your approval.", category: "general", description: "Sensitive op." },
  { id: "connection-interrupted", file: `${BASE}/connection-interrupted.mp3`, phrase: "Connection interrupted. Please try again.", category: "general", description: "Network/API failure." },
  { id: "request-failed", file: `${BASE}/request-failed.mp3`, phrase: "I couldn't complete that request.", category: "general", description: "Unexpected failure." },
  { id: "ready-when-you-are", file: `${BASE}/ready-when-you-are.mp3`, phrase: "Ready when you are.", category: "general", description: "Idle state." },

  // ————— Closing —————
  {
    id: "stay-curious",
    file: `${BASE}/stay-curious.mp3`,
    phrase: "Stay curious. Stay early.",
    category: "closing",
    description: "Rare sign-off. Max once per 24h.",
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  { id: "signing-off", file: `${BASE}/signing-off.mp3`, phrase: "Bark Zero signing off.", category: "closing", description: "User closes Bark Zero." },
  { id: "until-next-time", file: `${BASE}/until-next-time.mp3`, phrase: "Until next time.", category: "closing", description: "End of longer conversation." },
];

export const BARK_VOICE_MAP: Record<BarkVoiceId, BarkVoiceEntry> = Object.fromEntries(
  BARK_VOICE_CONFIG.map((e) => [e.id, e]),
) as Record<BarkVoiceId, BarkVoiceEntry>;
