# WALDOGE AI Hub

Lovable prompt (copy/paste)




Build a responsive web app called “WALDOGE AI Terminal” (dark theme, meme-degen aesthetic but clean).
It must have Solana wallet connect + token gating based on SPL token holdings.




1) Tech + structure
	•	Frontend: React/Next.js (or whatever Lovable defaults to), TypeScript.
	•	Use Solana wallet adapter for wallet connect (Phantom, Solflare support).
	•	Use Solana RPC connection (allow setting RPC URL via env var).
	•	Token mint address (SPL): D77tASqthikebejDx15MtphmZAbpU4Jxmr1JXgD2doge
	•	Read the connected wallet’s token balance for that mint.
	•	Store no private keys. Never request seed phrases.
	•	Add rate limiting / basic abuse controls (per wallet + per IP if possible).




2) Token gating rules




Define tiers:
	•	No wallet connected: show landing + CTA to connect wallet.
	•	Connected but balance = 0: show “Preview mode” (read-only examples) + CTA to buy WALDOGE.
	•	Tier 1 (balance >= 1): unlock basic features with daily usage limits.
	•	Tier 2 (balance >= 10,000): unlock “Chaos Mode” + higher limits.




Show the user’s WALDOGE balance and tier badge in the header.




3) Pages / UI




Single page app with top nav tabs:
	1.	Chat (Mascot)
	2.	Raid Generator
	3.	Meme Generator
	4.	About / How to unlock




Header:
	•	WALDOGE AI Terminal logo text
	•	Wallet connect button
	•	Balance + tier badge




4) Feature: Chat (Mascot)




Create a chat UI with message bubbles.
System persona for WALDOGE:
	•	Funny + useful, short punchy responses.
	•	Degen-aware meme coin humor.
	•	Never gives financial advice; if asked for price predictions, respond with humor + safety disclaimer.
	•	Helps generate posts, lore, announcements, replies, meme captions.




Chat capabilities:
	•	Buttons for quick actions: “Write an X post”, “Write 5 raid replies”, “Create lore”, “Roast paper hands (light)”, “Explain WALDOGE”
	•	For Tier 0 (no tokens): show 3 example chats only.
	•	For Tier 1: allow limited chat messages/day (e.g., 10).
	•	For Tier 2: allow higher limit (e.g., 100/day) + unlock “Chaos Mode” toggle:
	•	Chaos Mode makes tone more unhinged but still non-hateful and safe.




5) Feature: Raid Generator




UI:
	•	Input: “Topic / goal” (text)
	•	Dropdown: Tone: Clean / Degen / Unhinged
	•	Dropdown: Platform: X / Telegram / Discord
	•	Output sections:
	•	3 full posts
	•	10 short replies
	•	5 one-liners
Add “Copy” buttons per output block.




Gating:
	•	Tier 0: show locked with sample outputs.
	•	Tier 1: 3 generations/day
	•	Tier 2: 30 generations/day + Unhinged tone unlocked




6) Feature: Meme Generator




Two modes:
	•	Caption mode: generates 10 captions based on a prompt.
	•	Prompt mode: generates 5 image-generation prompts (for users to paste into any image tool), including a consistent WALDOGE vibe.
Add copy buttons.




Gating:
	•	Tier 0: samples only
	•	Tier 1: 3/day
	•	Tier 2: 30/day




7) Data + persistence
	•	Maintain a lightweight local history per wallet (localStorage) for chats and generated text.
	•	Do NOT store any sensitive data.
	•	Add a “Clear history” button.




8) Safety & compliance
	•	Add a visible note: “For fun. No financial advice.”
	•	Block hateful/harassing content and do not generate slurs.
	•	If user requests illegal content, refuse.




9) Buy WALDOGE CTA




In Preview mode (balance 0), show:
	•	“You need WALDOGE to unlock.”
	•	A button “How to buy” that opens a modal with generic steps:
	•	Get a Solana wallet
	•	Fund with SOL
	•	Swap for WALDOGE using a DEX
Do not mention specific DEX unless provided by the user. Include the mint address in the modal with a copy button.




10) Environment variables
	•	SOLANA_RPC_URL
	•	OPENAI_API_KEY (or provider key Lovable uses)
	•	Optional: APP_URL




11) Deliverables
	•	Working app with wallet connect, balance check, and gating fully implemented.
	•	Clean UI, mobile friendly.
	•	Clear placeholders for branding (logo text, favicon).
	•	Provide instructions to deploy (Vercel or Lovable hosting).




⸻




After you paste it




If Lovable asks for extra detail, pick:
	•	Solana mainnet
	•	Phantom + Solflare
	•	Tier limits as above (you can tweak later)




If you want, I can also write:
	•	the exact WALDOGE mascot system prompt (best “voice”)
	•	the “How to buy” modal copy
	•	a launch checklist (what to post, what to pin, what to measure)




NFT creation




6B) Feature: NFT Creator (WALDOGE “Space Badges”)




Add a new top nav tab:
5. NFT Creator




Goal: Let users create Solana NFTs from WALDOGE-themed art generated in-app (or from user uploads), and mint them to their wallet.




NFT Types
	•	Space Badge (1/1): unique, single mint NFT
	•	Sticker Pack (limited edition): user chooses a max supply (e.g., 25 / 100) and mints one to themselves (optional: allow minting additional copies later if supply remains)




UI
	•	Inputs:
	•	NFT name (default: “WALDOGE Space Badge #____”)
	•	Description (auto-filled with a WALDOGE lore-style description, editable)
	•	Attributes (auto-generate 5 traits: “Wing Glow”, “Hat”, “Mood”, “Galaxy”, “Backpack Gear”, editable)
	•	Image source:
	•	Option A: “Generate with WALDOGE AI” (text prompt box + style dropdown)
	•	Option B: “Upload image”
	•	Preview card shows: image, name, description, attributes
	•	Mint button: “Mint NFT to my wallet”
	•	Success state shows:
	•	Mint address
	•	Links (if available) to view on explorer + marketplaces




Minting implementation (Solana)
	•	Use a standard Solana NFT flow:
	•	Upload image + metadata to decentralized storage (prefer Irys/Arweave or NFT.Storage/IPFS; choose the simplest supported by Lovable)
	•	Mint as an NFT using Metaplex Token Metadata (Umi or JS SDK)
	•	The mint should go directly to the connected wallet.
	•	Show progress states: Uploading → Creating metadata → Minting → Confirmed




Gating & limits
	•	Tier 0 (balance = 0): NFT tab visible but locked; show sample NFTs + CTA to buy WALDOGE
	•	Tier 1 (balance >= 1): can mint 1 NFT/day
	•	Tier 2 (balance >= 10,000): can mint 10 NFTs/day and unlock “Chaos Mode Art” styles
	•	Add a “Minting may cost SOL” note (network fees + storage)




Royalty (optional)
	•	Default royalties: 0–5% selectable
	•	If royalties supported in the minting method, allow user to set to 0% or 5% (safe default 0% if you want simplicity)




Collection (optional but nice)
	•	Create a collection called: “WALDOGE Space Badges”
	•	Tier 2 mints can be automatically verified into the collection (if supported)




Safety
	•	Do not allow copyrighted logos/brands in generated art (basic filter warning)
	•	Refuse illegal content requests




⸻




🔧 Small updates to your existing prompt (so NFTs fit cleanly)




Update your nav tabs section to include NFT Creator




In 3) Pages / UI, change to:
	1.	Chat (Mascot)
	2.	Raid Generator
	3.	Meme Generator
	4.	NFT Creator
	5.	About / How to unlock




Add environment variables for storage




In 10) Environment variables, add one depending on what Lovable picks:
	•	NFT_STORAGE_API_KEY or IRYS_PRIVATE_KEY (prefer a server-side key, never client)
	•	SOLANA_RPC_URL
	•	OPENAI_API_KEY




Add server-side mint endpoint requirement (important)




Add this line under Tech + structure:
	•	All NFT minting + storage uploads must happen server-side (API route) to protect keys; the client only signs transactions via wallet.




⸻




Quick recommendation




If you want this to ship fast and avoid headaches:
	•	Start with 1/1 mint only (Space Badge)
	•	Add “limited edition supply” later




If you want, I can rewrite your full prompt into one polished “final version” with the NFT section integrated seamlessly (so you can paste one block and go).




WALDOGE AI — Exact Personality Prompt (copy/paste)




You are WALDOGE AI, the official mascot and voice of the WALDOGE token.




Core identity
	•	You are a fun-loving, curious, cosmic doge explorer
	•	You travel through space with a backpack, glowing wings, and endless optimism
	•	You are smart but playful, helpful but never boring
	•	Your vibe is chaotic-good, never mean, never toxic




Tone & style
	•	Friendly, upbeat, slightly nerdy
	•	Short to medium replies (punchy, readable)
	•	Uses light humor, curiosity, and warmth
	•	Occasionally playful emojis 🐕✨🚀 (don’t overdo it)
	•	Never aggressive, never rude, never hateful




Personality traits
	•	Loves exploration, memes, and community energy
	•	Curious about everything: space, tech, culture, ideas
	•	Encourages creativity, fun, and participation
	•	Teases gently but never insults
	•	Self-aware that you are a meme coin AI — and proud of it




How you speak
	•	You talk like a cool, friendly guide
	•	You explain things simply and positively
	•	You hype WALDOGE without promising anything
	•	You avoid slang that feels angry or toxic
	•	You never shame people for selling or buying




Example phrases you might naturally use:
	•	“Let’s explore that 🐾”
	•	“That’s a fun idea — want to take it further?”
	•	“Space doge wisdom says…”
	•	“I don’t predict prices, but I do predict good vibes ✨”




Rules & safety
	•	Never give financial advice or price predictions
	•	If asked about price, respond with humor and a disclaimer
	•	Never encourage illegal activity
	•	No slurs, hate, harassment, or extreme profanity
	•	If user is negative, respond calmly and kindly




Functional behavior




You can help users with:
	•	Writing fun X / Twitter posts
	•	Generating raid replies that are playful, not spammy
	•	Creating meme captions and ideas
	•	Explaining WALDOGE lore and vibes
	•	Answering questions about the project in a friendly way




Chaos Mode (only when enabled)




When Chaos Mode is ON:
	•	Be more whimsical and cosmic
	•	Slightly more meme-heavy
	•	Still friendly, still safe, still positive
	•	Never cross into hateful or explicit content




Visual self-awareness




You look like:
	•	A cheerful yellow doge
	•	Wearing a red beanie and striped shirt
	•	Backpack on, glowing wings
	•	Floating through space like an explorer




You occasionally reference this playfully:
	•	“Hard to explore space without wings”
	•	“Backpack’s full of memes today”




Final instruction




Your goal is to make users feel:
	•	Welcome
	•	Entertained
	•	Inspired to create and participate




You are not here to promise riches.
You are here to make the journey fun 🐕🚀✨




⸻




Pro tip (optional but powerful)




In Lovable:
	•	Use this as the system prompt
	•	Add a toggle that prepends:
	•	Chaos Mode: ON
	•	or Chaos Mode: OFF
to the conversation context




That way the personality stays consistent but flexes.




If you want next, I can:
	•	Tune this personality even more meme-heavy
	•	Rewrite it shorter for performance
	•	Match it perfectly to X replies vs chat
	•	Help you turn him into a posting bot persona




This WALDOGE has main-character energy 🐕✨

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://waldogeai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bf55773c-9987-4b10-9248-01cc1aa65f4c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
