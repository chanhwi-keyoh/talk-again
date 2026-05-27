# Five Questions — Talk Again

A reflection on how I used AI on this project — what I asked it to build, what I kept, what I rejected, and what I learned about my own role.

---

## 1. What did I ask Claude Code to do?

I asked it to build the entire shippable surface of Talk Again — front-end (React + TypeScript + Tailwind), the PWA wrapping, the Vercel Edge serverless function that proxies ElevenLabs, the IndexedDB blob cache, the TTS provider abstraction with silent failover, the emotion picker, the emergency button + banner, and the elderly-tuned typography system. I directed it project-by-project with one constraint repeated up front: **the grandfather is the only user that matters, and he is not in the room.** I asked it to act as my pair of hands at the keyboard, not as a designer.

I also asked it for things I deliberately could *not* ask it for: the Design Argument, the Records of Resistance (this is itself a draft I'm editing), the User Testing Evidence. Those have to come from me. The academic rule is in `CLAUDE.md §9` and Claude Code respected it consistently — when I asked it to "just write" Design Argument it pushed back and reformatted my working notes instead.

---

## 2. What did Claude Code do well?

**Locking elderly-UX numbers into the design tokens up front.** Before any component existed, the Tailwind config was already pinned to body ≥ 24 px, labels 36–44 px, line-height ≥ 1.5, 7:1 contrast minimum, tile-min 160 px. That meant every component built afterward inherited the constraints — I never had to re-litigate "is this big enough?" mid-build.

**Silent failover as a load-bearing design principle.** When the ElevenLabs call fails for any reason — bad key, offline, rate limit — the same `useTTS().speak()` call automatically falls through to Web Speech and the header chip explains the downgrade in plain Korean. I asked for this in passing; Claude Code treated it as a first-class invariant and propagated it through the provider abstraction.

**Pushing back on me.** When I pasted my ElevenLabs API key directly into chat, it stopped what it was doing, told me the key was now in chat history, walked me through revocation, and refused to keep the key in any file it wrote until I rotated. When I said "go" without specifying a path, it asked. When I asked it to write a user-authored doc, it refused.

---

## 3. What did Claude Code do poorly (or what did I have to override)?

**It did not catch the SOS-glyph collision on its own.** The "도와줘" quick-phrase tile shipped with 🆘 as its icon. The dedicated emergency button — built later — also used 🆘. I noticed the visual clash; Claude Code did not.

**Default-shape thinking on emergency.** First emergency build had a 3-repeat cap. That looked sensible, but as a UX decision for a real-life collapse-and-call-for-help scenario, it was wrong — silence at minute 1 is the worst failure. I had to specifically ask for `while (!stopped)` and write the rationale.

**Mismatch between language toggle and spoken language.** Early build let the user switch UI to English but still spoke Korean. The default behavior assumed "the grandfather is always the speaker, always in Korean." For demo / instructor flow that assumption broke. I had to point it out.

These are the same kinds of misses an attentive collaborator would have — they are *defensible defaults that don't fit the actual person.* My job was to know the person.

---

## 4. What did I keep and what did I reject?

**Kept** essentially the whole technical architecture: Vite + React + TS + Tailwind + vite-plugin-pwa + Vercel Edge + IndexedDB cache + provider abstraction + i18n design. These were the right choices for the timeline and the surface area.

**Rejected or modified:**
- "Radial picker" for emotions → replaced with a flat grid (uneven tap geometry is hostile to shaky hands).
- 3-repeat emergency cap → infinite loop until stop.
- Default Yuna voice as primary → ElevenLabs Voice Design as primary, Yuna as fallback.
- Voice cloning entirely → voice *design* only (no identity forgery).
- Floating FAB for SOS → header button (the FAB would have visually collided with `EmotionPicker`).
- Pre-fetching all 10 quick phrases at launch → lazy fetch on first tap (first impression "why is it loading?" is worse than one tap of cloud latency).
- Geolocation auto-attach to emergency message → manual address entry (one-time permission dialog is worse than typing an address once).

A full list is in `Records_of_Resistance.md`.

---

## 5. What is the line between my work and the AI's work on this project?

The clearest way I can draw it:
- **Anything that exists in this repo because of a specific tradeoff about my grandfather is mine.** What gets put on the SOS button, how the emergency message is structured, the decision to refuse voice cloning, the choice to use a flat emotion grid over a radial one, the rejection of confirmation modals — all driven by my read of the person and the situation.
- **The mechanics underneath are Claude Code's.** The React render tree, the AbortController plumbing for cancellable speech, the IndexedDB transaction wrapper, the regex that validates a voice ID before billing, the Vite middleware that mounts the Edge function locally — these I directed but did not write.

The "AI shaped the final product" framing in this question is real but limited. AI shaped the *execution velocity* — without it I could not have shipped a working PWA in a week. AI did not shape the *editorial choices.* Every place where the app looks different from a generic communication-aid PWA is a place where I overrode a defensible default because I know my grandfather.

If a grader read this project blind and tried to identify "what only this designer could have done," the answer would be in `Records_of_Resistance.md` and `Design_Argument.md` — not in the code.
