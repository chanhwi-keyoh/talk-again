# User Testing Evidence — Talk Again

> ⚠️ **STUB — Chanhwi to fill in.** Drop your KakaoTalk screenshots and any other artifacts into [`docs/evidence/`](./evidence/) and reference them here with brief captions. The grader is looking for "documented evidence of the real person using the prototype" plus "specific observations: what worked, what failed, what surprised."

---

## Who was tested with

- **Primary user:** my grandfather (the person this tool was built for).
- **Supporting family:** my mother and grandmother (they relayed reactions, helped operate the iPad on his side of the call, and provided context on his daily routine).
- **Test setup:** video call (KakaoTalk) — direct in-person visit not possible before the deadline.

## What I tested

- [ ] **First-tap latency on AI voice** — does the first quick phrase feel responsive?
- [ ] **Voice naturalness** — does the ElevenLabs voice feel warm enough that he is willing to "speak through" it?
- [ ] **Tile recognition** — can he find a phrase without reading every label?
- [ ] **Emotion picker** — does he understand it modifies the voice, or does it confuse?
- [ ] **Emergency button** — is the SOS visually distinct enough that he doesn't tap it by mistake on a normal day, and obvious enough that he can find it in a panic?
- [ ] **Emergency banner readability** — can grandmother (next to him) read the address on screen during a broadcast?
- [ ] **Standard-voice fallback** — what happens if the rural Wi-Fi drops mid-tap?

## Evidence

> Add screenshots / quotes here. Suggested format:

### KakaoTalk — Mom — [date]
- Screenshot: `evidence/katalk_mom_2026-MM-DD_X.png`
- What it shows:
- What I learned:

### KakaoTalk — Grandmother — [date]
- Screenshot: `evidence/katalk_grandma_2026-MM-DD_X.png`
- What it shows:
- What I learned:

### Video call — grandfather using prototype — [date]
- Recording / photos: `evidence/videocall_2026-MM-DD_X.{mp4,png}`
- Specific observations (what worked, what failed, what surprised):

## What changed because of testing

> List concrete iterations driven by feedback. Cross-reference `AI_Direction_Log.md` entries when possible.

- [ ] e.g. Voice swapped from `eleven_multilingual_v2` to `eleven_turbo_v2_5` after grandmother reported "좋아" coming out as "요아" — see AI_Direction_Log Entry 3.
- [ ] e.g. SOS changed to loop indefinitely after [name] pointed out that 3 repeats wouldn't be enough if [scenario] — see AI_Direction_Log Entry 6.
- [ ] …

## What we still don't know

> Honest gaps. The grader values honesty here more than completeness.

- I have not yet observed my grandfather using the iPad in person — only via video call. The handwriting flow (Apple Pencil, stretch goal) is therefore untested.
- …
