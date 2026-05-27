# Post-Mortem — Talk Again

> ⚠️ **STUB — Chanhwi to fill the [bracketed] sections from memory of the last 9 days.** The structure and the deferral list are accurate; the personal reflections are yours to write. The grader is looking for "honest and specific" — not glossy.

---

## What I set out to build

A communication-aid PWA for my grandfather. Six features in the original MVP plan (`CLAUDE.md §6`):

1. Quick Phrase Panel — one-tap everyday utterances
2. Emotion Dial — voice tone follows mood
3. AI Suggestions — STT + Claude API → 3 candidate replies
4. Free Text Input — large textarea fallback
5. Persona Onboarding — 10-question Q&A → system prompt for AI suggestions
6. Emergency Button — always-visible, loud help broadcast

## What actually shipped

| Feature | Status |
|---|---|
| Quick Phrase Panel | ✅ Shipped, 10 phrases, color+icon+label |
| Emotion Dial | ✅ Shipped as `EmotionPicker` (linear grid, not radial — see Records of Resistance #3) |
| AI Suggestions | ❌ Deferred to v2 |
| Free Text Input | ❌ Deferred to v2 |
| Persona Onboarding | ❌ Deferred to v2 |
| Emergency Button | ✅ Shipped, plus visible address banner — exceeded original spec |
| (Bonus) ElevenLabs Voice Design + silent failover | ✅ Shipped — was not in the original Step 1 plan |
| (Bonus) Korean + English UI toggle | ✅ Shipped |
| (Bonus) Voice diagnostic in Settings | ✅ Shipped |

Roughly 4 of 6 MVP features shipped, plus 3 substantive additions that weren't originally planned.

## What worked

[Chanhwi: 3–5 things that actually went well. Suggestions:]
- The provider abstraction for TTS made the silent failover cheap to add — it would have been a painful rewrite without it.
- Locking elderly-UX numbers into Tailwind tokens day 1 paid off — no per-component "is this big enough?" debates.
- The Records of Resistance pattern (writing down every "I overrode AI here") forced me to actually evaluate each default rather than ship by accident.
- [your own]
- [your own]

## What didn't work

[Chanhwi: 3–5 honest failures. Suggestions to consider:]
- I burned ~2 hours on a Vercel deploy failure that traced to a single bad line in `vercel.json`. I should have read the Vercel runtime docs before configuring functions, not after the build failed.
- I leaked an ElevenLabs API key into chat twice before Claude Code caught it. I had to rotate it twice. I should have used `nano` from the start instead of pasting.
- I didn't get my grandfather to actually touch the iPad before the deadline — testing was relayed through my mother via video call. That's the biggest gap in this submission.
- [your own]
- [your own]

## What I deferred and why

Each of these was a deliberate scope cut, not a "ran out of time" surprise.

### AI Suggestions (Step 4)
- *Why deferred:* needed STT integration + new Vercel serverless function + Claude API key + persona prompt — easily 5+ hours, with risk of breaking what already shipped.
- *Replacement:* the existing Quick Phrase Panel + Emotion Picker covers most everyday utterances. AI Suggestions becomes meaningful only after Persona Onboarding (Step 3) feeds it real personality data, so deferring both together actually makes sense.

### Persona Onboarding (Step 3)
- *Why deferred:* paired with Step 4 — without AI Suggestions consuming the persona data, the onboarding flow has no payoff in the current build.

### Free Text Input (Step 5 remainder)
- *Why deferred:* small (1–2 hours), but its main value is *as a last-resort fallback when nothing else works.* In the current build, the user has 10 quick phrases + 7 emotions + a clear emergency button — the fallback need is reduced. Cheap to add in v2.

### Handwriting pad (stretch)
- *Why deferred:* the obvious "honor his current paper habit" feature, but Korean handwriting OCR in the browser is genuinely hard. Web-based Google ML Kit Digital Ink isn't available; alternatives need server-side OCR or a heavy WASM model. Production v2.

### Memory / reminders (stretch)
- *Why deferred:* requires AI Suggestions to land first.

### Local LLM / full offline
- *Why deferred:* Production v2. iPad alone can't run a useful local Korean LLM; a small in-home server is a separate hardware project.

### Voice cloning of grandfather's pre-surgery voice
- *Not deferred — refused.* See `Records_of_Resistance.md` #1 and `Design_Argument.md` §6.

## What I would do differently if I started over

[Chanhwi: 2–3 things. Suggestions:]
- Set up the deploy *on day 1*, not day 9. A live URL from the first commit would have caught the `vercel.json` error a week earlier and made user testing easier (could have shared a link to family at any time).
- Get my grandfather on the iPad in person by mid-week, not on the deadline. The whole project is about him; a one-shot video call at the end is not enough.
- [your own]

## What this taught me

[Chanhwi: 2–4 sentences. The honest, portfolio-grade reflection. Some prompts:]
- The hard part of designing for a specific person is *editorial*, not technical. AI made every technical choice trivially executable, which meant my real job became "which default am I refusing today."
- "Helped" turned out to be smaller and more specific than I expected — being able to say "응" in his own designed voice the moment someone speaks to him, rather than writing "응" on paper.
- [your own]
- [your own]

---

*Cross-references: `Design_Argument.md`, `Records_of_Resistance.md`, `Five_Questions.md`, `AI_Direction_Log.md`, `User_Testing_Evidence.md`.*
