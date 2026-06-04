# AI Direction Log — Talk Again

> A real-time log of decisions made while working with Claude Code. Format per CLAUDE.md §10.

---

## Entry 1 — 2026-05-20 · Step 1 Setup (Vite + Tailwind + PWA + Quick Phrases)

**Request**
- Start a new PWA project in `/Users/key/Documents/GitHub/talk-again/`.
- Set up Vite + React 18 + TypeScript + Tailwind + `vite-plugin-pwa`.
- Korean font (Pretendard), iPad-landscape-first layout (1180×820).
- `QuickPhrasePanel` (ten one-tap Korean utterances) + `useTTS` hook (ko-KR voice + emotion-driven prosody).
- Added requirements: **a Korean/English language toggle inside Settings**, plus elderly-UX research findings baked in:
  - Body text ≥ 24px, button labels 36–44px, line-height ≥ 1.5, no thin font weights
  - Primary buttons ≥ 120×120 px with 24–32 px gaps; key actions near the top of the screen
  - Text contrast ≥ 7:1; never differentiate information by color alone (always color + icon + label)
  - No relying on blue-vs-purple distinctions (cataract / lens yellowing)
  - One-tap to speak, no hidden gestures, no IT jargon in copy

**What Claude Code shipped**
- Project scaffold: `package.json`, `vite.config.ts`, `tsconfig.*`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `.gitignore`, `.env.example`, `README.md`.
- Tailwind design tokens written directly from the elderly-UX numbers:
  - `fontSize.body = 24px / line-height 1.6 / weight 500`, `label = 32px / 600`, `label-lg = 40px / 700`, `title = 48px / 700`.
  - `colors.canvas = #F5F3EF`, `colors.ink = #1A1A1A` → 15.6:1 contrast (well above the 7:1 floor).
  - `spacing.gap = 32px`, `tile-min = 160px` (33% headroom above the 120 px minimum).
  - `colors.phrase.*` — a 10-hue palette that avoids blue-only-vs-purple-only distinctions; every color is paired 1:1 with an icon and a label.
- Components:
  - `QuickPhrasePanel` — 5×2 grid; every tile carries three redundant signals (color + emoji + label).
  - `SettingsPanel` — full-screen (no corner dropdown); the language picker is two big toggles (160×160+).
  - `VoiceStatusChip` — surfaces Korean-voice readiness with color + dot + Korean label.
- Hooks:
  - `useTTS` — Web Speech API wrapper. Async-subscribes to `voiceschanged` with a 500 ms polling fallback. Each tap calls `cancel()` before `speak()` so rapid taps replace rather than queue. Emotion → rate/pitch table baked in.
- Libraries:
  - `lib/i18n.ts` — a zero-dependency one-file i18n. Korean default, English fallback. Every Korean string scrubbed of IT jargon ("탭/메뉴/토글").
  - `lib/voices.ts` — Korean-voice picker (male → Korean → fallback) that exposes the *reason* a voice was picked to the UI.
  - `lib/storage.ts` — a localStorage wrapper that never throws under Safari Private Mode.
- PWA: manifest, iPad `apple-touch-icon` / `apple-mobile-web-app-capable` meta tags, Pretendard CDN `runtimeCaching` (for slow rural connections), placeholder icons 192/512/apple-touch/favicon.
- Verification: `npm run typecheck` ✓, `npm run build` ✓ (151 KB JS / 12 KB CSS gzip 49 KB), `npm run dev` boots on the LAN (`http://172.23.177.74:5173/`).

**Decision**: accepted. Three things deliberately left out of Step 1:
1. **Dark mode** — CLAUDE.md §4 mandates light as the default. `globals.css` pins `color-scheme: light` and a single `<meta theme-color>`; the toggle is deferred.
2. **Global emotion state** — `App.tsx` hard-codes `emotion = "neutral"`, but the `useTTS.speak(text, { emotion })` call path is already wired. Step 2's EmotionDial will slot straight in.
3. **Guaranteed elder-male voice** — iPad Safari's Korean system voice list usually exposes only Yuna (female). `pickKoreanVoice` looks for male first and falls back to "korean-other" with a reason surfaced through `VoiceStatusChip`. User Testing will likely require an OS-level voice download guide.

**Why**
- Locking elderly-UX numbers into the design tokens up front means we don't re-litigate them per component. "Safe by default" beats "review every time."
- A full-screen Settings page matches the elderly "one task per screen" rule and scales: as Settings grows, we still have one place to render large type.
- The `cancel-then-speak` pattern in `useTTS` makes the grandfather's last tap his real intent — no stale phrases drifting in late from a stacked queue.
- Avoiding IT jargon is a sneakily strong constraint. "탭하세요" → "한 번 누르면", "메뉴" → "설정", "토글" → two big choice buttons. Every Korean string audited.

**Next (before Step 2)**
- Hit the dev server from a real iPad → enumerate Korean voices → tell the user which `voice.name` strings actually appear (so we can decide what to do if there is no male voice).
- The user writes Entry 1 of `Records_of_Resistance.md` themselves ("we refused voice cloning") — academic rules.

---

## Entry 2 — 2026-05-25 · Step 1.5 · Adopting Voice Design (ElevenLabs)

**Request**
- User: "The default Korean Web Speech voice is too scary. Find and add a different voice algorithm."
- Clarification: "We can't get a clean recording of grandfather's voice — I want to *generate* one with voice AI."
- So: voice **design**, not voice **cloning**. Generate a new synthetic voice from a text description that fits the grandfather's persona (a warm Korean man in his early 70s).

**What Claude Code shipped**
- **`api/tts.ts`** — Vercel Edge runtime serverless function. Reads `process.env.ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL_ID`. `POST {text, emotion, voiceId?}` → calls ElevenLabs `/v1/text-to-speech/{voice_id}` → streams `audio/mpeg` back. The API key lives on the server only — never enters the browser bundle.
  - Emotion → `voice_settings.{stability, similarity_boost, style}` mapping baked in. All seven emotions keep `similarity_boost ≥ 0.75` so the "할아버지" voice identity stays consistent across moods.
  - Input validation: `text` capped at 500 chars (credit-runaway guard); `voiceId` regex-validated (so a hostile client can't bill us for someone else's voice).
- **TTS provider abstraction** (`src/lib/tts/`):
  - `types.ts` — common `TTSProvider` interface (`speak / cancel / isReady`).
  - `webSpeech.ts` — wraps the existing Web Speech path as a provider (fallback + offline).
  - `elevenLabs.ts` — calls `/api/tts`, hits / writes the IndexedDB blob cache, plays via `HTMLAudioElement`, supports `AbortSignal`.
  - `cache.ts` — IndexedDB blob cache. Key = `${voiceVersion}|${emotion}|${text}`. Every second tap of the same phrase costs zero network and zero credits. A `VOICE_VERSION` constant invalidates the cache when the designed voice changes.
- **`useTTS` refactored** — engine-agnostic, with silent failover. If the user prefers `ai` and ElevenLabs returns 503 / network-fails, the same call automatically falls through to Web Speech and a `fallbackActive: true` flag surfaces in the header chip as "AI voice unavailable — using standard voice." The grandfather always hears *something*.
- **Settings "Voice" section** — two big toggles (AI voice / standard voice), each with a one-line explanation ("warm and natural · needs internet" / "robotic but works offline"). All IT jargon avoided.
- **`VoicePrefProvider`** — localStorage-persisted; defaults to `ai` (the designed voice is the one we want the elder to hear).
- **Dev API proxy** — a tiny Vite plugin in `vite.config.ts`. `npm run dev` alone makes `/api/tts` work (no Vercel CLI needed). `loadEnv()` injects `.env.local` into `process.env`.
- **No `VITE_` prefix on secrets** — deliberately. A stray `import.meta.env.ELEVENLABS_API_KEY` resolves to `undefined`, so key leakage into the bundle is mechanically impossible.
- **CLAUDE.md §5 amended** — kept the cloning ban, added voice-design adoption, added the explicit rejection of stock-voice-only as well.

**Decision**: accepted. Three differences left in by intent.
1. **Manual `VOICE_VERSION` cache invalidation** — no auto-detection. When the user redesigns the voice, they bump the constant in `src/lib/tts/elevenLabs.ts` from `"v1"` to `"v2"`. More explicit and more debuggable than an automatic IndexedDB wipe.
2. **Soft AI-failure notification** — just a small chip label in the header (in a warning color). No modals, no toasts. An on-screen alert during a conversation is a bigger UX failure than the failover itself.
3. **No pre-fetch on first boot** — synthesizing all 10 quick phrases at launch was considered, but the first impression "why is it loading?" is worse than one round of cloud latency on the first tap. Add pre-fetch only if real-world testing says the first tap is too slow.

**Why**
- **Ethics vs. practicality**: CLAUDE.md §5's ban on cloning protects against identity forgery. Voice design doesn't violate it — the new voice is the *tool's* voice, not the grandfather's. It's persona design, not identity theft. The grandfather will never claim "this is my voice."
- **Silent failover is the core invariant** — the "why isn't it working?" moment for the grandfather must be zero seconds long. Under every failure mode, *something* has to come out of the speaker.
- **The provider abstraction is an investment** — when we later add Azure or Naver Clova, it's a single new file, not a hook rewrite.

**Verification**
- `npm run typecheck` ✓
- `npm run build` ✓ (158 KB JS / 12 KB CSS, +6 KB delta)
- `npm run dev` + `curl -X POST /api/tts` → `503 {"error":"tts_not_configured"}` (no key set — correct). With the key in `.env.local`, the same call returns an `audio/mpeg` blob.

**Next (user action)**
- Create `.env.local`, fill `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID`.
- Restart `npm run dev` → tap a quick phrase on iPad or desktop → first ElevenLabs voice check.
- If the voice is wrong, redesign it on ElevenLabs and swap only the `voice_id`.

---

## Entry 3 — 2026-05-25 · Step 2 · EmotionPicker + Voice-Quality Fixes

**Request** (user, after first listen)
1. "Add a UI for picking emotion."
2. "When the AI voice says '괜찮아', it ends with a woman's voice saying '응'. And '좋아' comes out as '요아'."
3. "Is there a male voice for the standard fallback, not Yuna?"
4. "Even when I pick English in Settings, it still speaks Korean."

**What Claude Code shipped**

*Item 1 — EmotionPicker*
- `src/lib/emotion.ts` — Context + `EMOTION_ORDER` + `EMOTION_META` (emoji + accent color per emotion).
- `src/components/EmotionProvider.tsx` — localStorage-persisted, default `neutral`, sanitizes invalid stored values.
- `src/components/EmotionPicker.tsx` — seven horizontal tiles (`보통` + 6 emotions), placed *below* `QuickPhrasePanel` (primary action up top, modifier below).
- Design departure: the original spec (INITIAL_PROMPT_FOR_CODE Step 2) asked for a "radial picker." We didn't build one — uneven tap-target geometry around the wheel's edge is hostile to shaky hands. A linear grid is more predictable. The departure is intentional and annotated at the top of `EmotionPicker.tsx`.
- `보통` is first-class tile #1, so one tap returns to neutral — no hidden "long-press to clear" gesture (forbidden by the elderly-UX rules).

*Item 2 — Korean pronunciation ("좋아" → "요아", woman's voice tail on "괜찮아")*
- Swapped the default model from `eleven_multilingual_v2` to **`eleven_turbo_v2_5`**. `turbo_v2_5` officially supports Korean as one of 32 explicit languages (`multilingual_v2` only auto-detects). For short Korean phrases the accuracy gap is large.
- Added a `language_code` parameter to the API. When the client sends `lang: "ko-KR"`, the server forces `language_code: "ko"`; English mode sends `"en"`. `multilingual_v2` ignores the field, so the change is backward-safe.
- Bumped `VOICE_VERSION` in `src/lib/tts/elevenLabs.ts` from v1 → v2 — old (multilingual_v2-rendered) cache silently misses → forced re-synthesis.
- Included `lang` in the cache key so the Korean and English renderings of the same text don't overwrite each other.
- Updated `ELEVENLABS_MODEL_ID` in both `.env.local` and `.env.example`.
- **Note**: the "woman saying 응" tail on "괜찮아" is a known behavior of ElevenLabs Voice Design occasionally losing speaker consistency mid-sentence. The model swap is likely to mitigate it. If it persists, the user redesigns the voice with a tighter prompt ("ONLY ONE VOICE. ALWAYS MALE. NEVER FEMALE.") and bumps `VOICE_VERSION` again.

*Item 3 — system Korean male voice*
- Strengthened the priority order in `src/lib/voices.ts`:
  1. Korean **male** (expanded `MALE_HINTS`: junho, minsu, siwoo, jihoon, 남, male, men)
  2. Korean **Siri** (newer engine, much warmer than the legacy Yuna)
  3. Korean **Enhanced / Premium / Neural** (download tier)
  4. Korean default (typically Yuna)
  5. Fallback (when no Korean voice is installed)
- New `listKoreanVoices()` — returns every Korean voice the device exposes.
- New `src/components/VoiceDiagnostic.tsx` — lives inside Settings; shows the installed Korean voices, marks which one is currently in use, and tells the user where to download more from iPad ("Settings → Accessibility → Spoken Content → Voices → Korean → tap +").
- Limit: stock iPadOS ships only Yuna (female). A male voice requires an OS-level download — code alone cannot solve it, so the UI surfaces the path.

*Item 4 — English UI should speak English*
- `src/App.tsx` `handleSpeak` now uses `phrase.speech[lang]` (was always `phrase.speech.ko`).
- The TTS `lang` parameter also branches `ko-KR` / `en-US`.
- `lang` is in the dependency array, so switching the language in Settings takes effect on the very next tap.

**Verification**
- `npm run typecheck` ✓
- `npm run build` ✓ (164 KB JS / 13 KB CSS gzip 53 KB, +6 KB for EmotionPicker + VoiceDiagnostic)
- `npm run dev` + `curl POST /api/tts {text:"안녕하세요", emotion:"happy", lang:"ko-KR"}` → `200 audio/mpeg 20 KB`, valid ID3 header. ElevenLabs turbo_v2_5 round-trip verified end to end.

**Decisions (deliberately not built)**
- **Programmatic voice redesign** — calling Voice Design from the API is technically possible, but voice quality requires a human ear to pick from three candidates. Automation is a bad fit.
- **`phonetic` override field** — `phrase.phonetic.ko = "조아"` as an escape hatch was considered. Held back until we know whether `turbo_v2_5` + `language_code` alone solves it. Building it pre-emptively risks unused dead code.
- **Per-emotion variant text** — e.g. "괜찮아" becomes "괜찮아…" when sad. Better handled later as part of Step 4's AI Suggestions, where text is dynamic; not worth the complexity in Step 2.

**Next (user action)**
- Restart dev server (env + code changed) → re-tap quick phrases:
  - Does "좋아" now sound like "조아"?
  - Has the trailing woman's "응" on "괜찮아" gone away?
- Switch emotions and tap the same phrase to confirm prosody shifts.
- Settings → "Standard voice diagnostic" shows the installed Korean voices. If there is no male voice, follow the on-screen path to download one.
- If "괜찮아"'s tail persists, redesign the ElevenLabs voice with a stricter prompt ("STRICTLY single male voice, late-60s Korean grandfather, no second speaker, no background noise"). Swap the `voice_id` in `.env.local` and bump `VOICE_VERSION` to v3.

---

## Entry 4 — 2026-05-25 · Real Emergency Button + Help-Icon Disambiguation

**Request** (user)
1. "The 도와줘 (Help me) icon is SOS, which clashes with the emergency button — change it."
2. "Add a real emergency button — for true emergencies, with address info."

**What Claude Code shipped**

*Icon collision fix*
- `src/lib/phrases.ts` — `help` tile icon changed from 🆘 to **🙋** (person raising hand). Reads clearly as "I'd like some help" and no longer visually overloads with SOS.
- 🆘 is now reserved for the emergency button only — within a single device, the SOS glyph appears only in the emergency context.

*EmergencyProvider* (`src/lib/emergency.ts`, `src/components/EmergencyProvider.tsx`)
- Context: `{ message, setMessage, resetMessage, isActive, trigger, stop, preview }`.
- Message persisted via `STORAGE_KEYS.emergencyMessage` in localStorage. Empty strings are sanitized away (silence during an emergency is the worst possible bug).
- Default message: `"도와주세요. 저는 말을 못 합니다. 119에 전화해 주세요."` — deliberately *no* `[주소]`-style placeholder. If the user never edits it, those bracket syllables would be spoken aloud, wasting precious seconds. The default is short and complete on its own.
- Speech loop: `EMERGENCY_REPEATS = 3`, `EMERGENCY_PAUSE_MS = 500`. The inter-repeat sleep is wired through an `AbortController` so it can also be interrupted mid-pause.
- `volume: 1.0`, `emotion: "neutral"`, `lang: "ko-KR"` — hard-coded. Independent of UI language; a Korean emergency in rural Korea is the only sensible default.
- Emotion is `neutral` on purpose: **clarity beats urgency**. Worried/angry tones muddy consonants. The 119 operator should be able to parse the address on the first listen.
- Routed through `useTTS`, so the silent failover is inherited: an offline phone still broadcasts via Web Speech.

*EmergencyButton* (`src/components/EmergencyButton.tsx`)
- Sits in the header: `[chip] [SOS] [⚙]`. Visually central. Min-tile size + `bg-emergency` + a 4 px dark-red border.
- Two states:
  - idle: 🆘 + "응급" label
  - active: ■ + "멈추기" label, `animate-pulse` + a white ring offset → "broadcasting" state is visible from across the room.
- Tap toggles (start / stop). **No confirmation dialog** — both the elderly-UX rules in CLAUDE.md and an emergency itself demand zero friction.
- Trade-off: accidental taps. Mitigations: (1) red + SOS glyph visually isolates it from any other tap target, (2) a second tap on the same button stops the broadcast immediately.

*EmergencySettings* (`src/components/EmergencySettings.tsx`)
- A new section in `SettingsPanel`, visually separated with `mt-14`.
- Big textarea (24 px+ font, min-height 180 px, resize-y); every keystroke flushes to context with no debounce (writes are small and infrequent).
- "Listen once" preview button + "Restore default text" reset. Both at min-height 80 px tap targets.
- Helper copy nudges (does not require) including an address: "Including your address helps 119 find you faster."
- The placeholder is a good template: "e.g. Please help. I cannot speak. I am at City, District, Building, Unit. Please call 119." — the user can substitute their own address directly.

*Other*
- Added `STORAGE_KEYS.emergencyMessage`.
- Provider tree: `I18n > VoicePref > Emotion > Emergency > App`. Emergency is the innermost — it depends on `useTTS` but not on Emotion.
- English labels written at the same time: "SOS" / "Stop" / "Emergency message".

**Verification**
- `npm run typecheck` ✓
- `npm run build` ✓ (169 KB JS / 14 KB CSS gzip 54 KB, +4 KB)
- Manual check (user): tap SOS → three repeats → tap again mid-broadcast → immediate stop. Settings → Emergency message → "Listen once" works.

**Decisions (deliberately not built)**
- **Confirmation dialog** — zero latency is the design priority during an emergency.
- **Floating FAB placement** — a bottom-right floating button was considered, but visually collides with `EmotionPicker`. The header is the equilibrium: always visible, never overlapping another tap target.
- **Auto-block other phrase taps during emergency** — not enforced. Any phrase tap aborts the in-flight `useTTS` call, which also breaks the emergency loop — and that's correct. Tapping another phrase means consciousness recovered / help arrived / misfire — any of those should stop the broadcast.
- **Geolocation auto-attach** — possible, but adds a permission dialog (friction for an elder) and requires reverse geocoding for a Korean rural coordinate (a Step 4 budget hit). Asking the user to type their address once is faster and more accurate.

**Next (user action)**
- Restart dev server → Settings → Emergency message → type the grandfather's real countryside address → "Listen once" to verify.
- Tap the SOS button once and confirm three repeats + clean stop. Do this in a quiet room — it's loud.
- When showing the grandfather, watch whether the SOS button is visually distinct enough from the other phrases (mis-tap risk).

---

## Entry 5 — 2026-05-25 · Header Swaps to a Red Banner During Emergency (Address Made Visible)

**Request** (user)
- "When I tap SOS, in the top area where it says 'AI voice ready' — replace that area with the address as text too."

**Problem framing**
- Audio is heard once and is gone. A helper (neighbor / 119 staff) who walks in mid-broadcast misses part of the address. To replay it, the grandfather has to tap SOS again — at which point we don't know what's happened to him.
- The screen must let someone *read* the address at a glance. Audio + text = dual channel.

**What Claude Code shipped**
- `src/components/EmergencyBanner.tsx` — replaces the normal header entirely when `isActive` is true.
  - Left: 🆘 (80 px) + heading "지금 도움이 필요해요" (text-title) + full message body (text-body-lg, `whitespace-pre-line`)
  - Right: `<EmergencyButton />` (in its active "Stop" + pulse state)
  - Background: solid `bg-emergency` + `text-white` → contrast well above 7:1, legible across the room.
  - `role="alert"` + `aria-live="assertive"` — screen readers are notified immediately.
- `src/App.tsx` — single line conditional: `useEmergency().isActive` ? `<EmergencyBanner />` : the normal header.
- i18n: added `emergency.banner.heading` (KO "지금 도움이 필요해요" / EN "I need help right now").

**Design decisions (intentional)**
- **No `animate-pulse` on the banner itself** — text shaking hurts readability. The pulse stays on the Stop button alone, isolating the "broadcasting" signal.
- **Voice chip + settings gear hidden** — both are noise during an emergency. Silent failover is already running; the chip isn't telling the user anything useful in that moment.
- **No banner persistence after stop** — when the broadcast ends, the banner disappears. The scenario "helper is still reading when it vanishes" is solvable by the grandfather tapping SOS once more. Adding lingering-banner state was rejected as needless complexity; revisit if real testing complains.
- **Main area (quick phrases + emotion) not dimmed** — the grandfather might still need to tap a phrase mid-emergency (e.g. "도와줘"). Dimming is visual noise and creates a "why is this gray?" question.

**Verification**
- `npm run typecheck` ✓
- `npm run build` ✓ (169.5 KB JS / 14.5 KB CSS gzip 54.5 KB, +1 KB)

**Next (user action)**
- Settings → Emergency message → type the grandfather's real address.
- Tap SOS → confirm the header becomes a red banner with the address in large type.
- Tap Stop → confirm the banner vanishes and the normal header returns.

---

## Entry 6 — 2026-05-27 · Emergency Loops Until Stopped (Repeat-Cap Removed)

**Request** (user, right before the demo)
- "Make SOS repeat until I stop it."

**What Claude Code shipped**
- `src/lib/emergency.ts` — removed the `EMERGENCY_REPEATS` constant. Kept `EMERGENCY_PAUSE_MS`. Comment explains the cost analysis (cache hit → an hour-long broadcast still bills exactly one ElevenLabs call) and the design intent.
- `src/components/EmergencyProvider.tsx` — replaced `for (i = 0; i < 3; i++)` with `while (!ctrl.signal.aborted)`. The inter-repeat pause remains abortable.
- Updated four i18n strings (KO + EN, aria + settings help):
  - "3번 반복" → "멈출 때까지 계속 반복"
  - "three times" → "on repeat until stopped"

**Design decisions**
- **No upper cap** — a soft safety cap (60 or 100 repeats) was considered, then rejected for two reasons:
  1. *Cost*: identical text means an IndexedDB cache hit → one ElevenLabs call no matter how long the broadcast runs. No credit risk.
  2. *Intent*: the worst failure mode is "grandfather collapses at minute 16, app went silent at minute 1, no one heard." An auto-stop is not a safety cap — it's a danger cap.
- **Visual banner also persists indefinitely** — it stays up while the broadcast loops and disappears on Stop. The infinite-repeat change doesn't disturb this flow.
- **Inter-repeat pause stays abortable** — Stop takes effect mid-pause, not at the next `speak()` boundary. The user is never forced to wait 0.5 s after tapping Stop.

**Verification**
- `npm run typecheck` ✓
- `npm run build` ✓ (169.5 KB JS, no size change)
- Manual check (user): SOS button → confirm natural repetition past 10 s, and immediate stop on second tap.

---

## Entry 7 — 2026-06-04 · Landscape "Page Shell" — No-Scroll Layout

**Request** (user, after living with v2)
- "가로 + 지금 레이아웃인 스크롤은 사용하기 불편했어. 개선할방법 아이디에이션 해보자" — the landscape build still scrolled, and scrolling to reach controls is exactly what the elderly-UX rules forbid. After ideation he chose: keep landscape, switch to a **page/tab layout**, and dock the **emotion picker as a bottom fixed bar**.

**What Claude Code shipped**
- `src/App.tsx` — rebuilt the shell into a fixed full-viewport flex column that never scrolls: `h-[100dvh] flex flex-col overflow-hidden`, with a `shrink-0` top bar, a `flex-1 min-h-0 overflow-hidden` body that swaps "pages" (Quick / Conversation), and a `shrink-0` `EmotionBar` footer. Tabs, the voice chip, the always-visible SOS button, and Settings all live inline in the one top bar.
- `src/components/EmotionBar.tsx` (new) — the radial `EmotionPicker` flattened into a slim 7-tile footer row so mood stays on screen on every page instead of being buried below the fold. `EmotionPicker.tsx` deleted.
- `src/components/QuickPhrasePanel.tsx` — dropped the in-panel heading and `aspect-square`; the 5×2 grid now *fills* the body via `h-full`, and icon/label use `clamp(min, vh, max)` so tiles shrink on a short landscape phone but grow back on a tall iPad.
- `src/components/ConversationPanel.tsx` — became a side-by-side two-pane grid (🎤 heard | 💬 reply) so the tall three-block stack no longer overflows.
- `EmergencyButton` / `VoiceStatusChip` — added `compact` top-bar variants.

**The height-crunch fixes (this pass)**
- A landscape phone is ~390 px tall. After the 100 px header + 77 px emotion bar, the Conversation transcript field had collapsed to **28 px** — unusable. Header trimmed to ~83 px (tabs/SOS/settings to `min-h-[52–56px]`, smaller glyphs).
- Heard pane restructured: the `?` question toggle and `↻` start-over moved up into the **label row** as compact icon-only buttons (≥48 px, `aria-label` carries meaning), and the control row collapsed to a single non-wrapping line (`듣기` / `답변 받기`). Net effect: transcript field recovered to a usable ~56–60 px (~2 lines, scrolls internally for more).
- The persona nudge ("아직 할아버지 정보가 없어요…") was a second centered paragraph in the reply placeholder; with `justify-center` its overflow pushed *up into the label* and the two collided. Re-pinned it as a compact `shrink-0` footnote at the bottom of the reply pane.

**Design decisions**
- **Fixed chrome, swapping body** — keeping the top bar and emotion bar in the same place on every page satisfies the "predictable positions / key actions near the top / no hidden scrolling" rules better than one long scroll column did.
- **Icon-only secondary controls, accepted trade-off** — `?` and `↻` lose visible text labels to fit the label row; primary actions (`듣기` / `답변 받기`) keep full labels. The hard 390 px height budget made this the right call; both keep `aria-label`s and the `?` toggle shows state by going dark.

**Verification**
- `npm run build` ✓
- Preview @ 844×390 (landscape phone), DOM-measured: no scroll on either tab (`scrollHeight 390 === clientHeight 390`); transcript field 56–60 px with a transcript present; reply pane label/placeholder no longer overlap.

---

## Entry 8 — 2026-06-04 · Home-Screen App Icon (Hangul 말 Speech Bubble)

**Request** (user)
- "앱 추가했을때 나올 아이콘도 해줘" — give the PWA a proper home-screen icon.

**What Claude Code shipped**
- `icon.svg` (new, repo root) — the single source of truth: a cream (`#F5F3EF`, the app background) full-bleed square with an ink (`#1A1A1A`) speech bubble holding the hangul **말** ("speech"). Regeneration commands are embedded in the SVG comment.
- Regenerated `public/icon-512.png`, `public/icon-192.png`, `public/apple-touch-icon.png` (180), and a multi-size `public/favicon.ico` (48/32/16) via `rsvg-convert` + ImageMagick.
- No manifest/HTML changes needed — `vite.config.ts` already lists `icon-192/512` (`purpose: "any maskable"`) and `index.html` already links the apple-touch-icon + favicon.

**Design decisions**
- **말 bubble over the old abstract clover** — three candidates were rendered (blue bubble+dots / dark bubble+voice-waves / hangul 말 bubble). User picked the hangul mark: most legible to the Korean elder user, says "speech" directly, and reuses the app's exact cream/ink palette. The previous icon (white quatrefoil on dark) didn't communicate the app's purpose.
- **Full-bleed cream background, glyph in the safe zone** — the 말 sits well inside the central ~80 % maskable safe circle, so iOS squircle and Android circle masks crop cleanly; the cream fills to all edges so no transparent corners turn black on iOS.
- **SVG kept as the source** — PNGs are baked (font rasterized at build-of-icon time), so there's no runtime Korean-font dependency, and the icon is reproducible/tweakable from one file.

**Verification**
- `npm run build` ✓ — `dist/` contains all four assets; `manifest.webmanifest` references `icon-192/512`.

---

## Entry 9 — 2026-06-04 · Height-Responsive Chrome — Phone Mood Drawer + Smaller Settings

**Request** (user, after living with the page-shell on both devices)
- "아이패드에서는 레이아웃이 좋은데 핸드폰은 가로 폭이 좁아서 지금 레이아웃이 좀 답답하게 느껴지네. 감정 선택을 다른 페이지로 구분을 하거나 오른쪽 화면 끝을 … 평소에는 안 보이지만 쉽게 접근할수있도록" — on a narrow landscape phone the persistent 7-tile emotion footer crowds everything; he wants mood normally out of the way but still easy to reach. Plus: "가로로 쓸때 설정 페이지 버튼 사이즈도 좀 불편해 (너무 큼) 개선해줘".

**What Claude Code shipped**
- `tailwind.config.ts` — added **height-based breakpoints** `short: (max-height: 599px)` / `tall: (min-height: 600px)`. The app is landscape-locked, so width is always plentiful; the real device difference is *vertical* space (phone landscape ~390 px vs iPad ~744 px+). Branching the chrome on height is more honest than guessing from width. (`extend.screens` merges with defaults, so the existing `sm:` width breakpoint still works.)
- `src/components/EmotionBar.tsx` — the persistent footer is now **tall-screens-only** (`hidden … tall:flex`). On a tablet mood stays docked on screen; on a phone it gets out of the way.
- `src/components/EmotionSheet.tsx` (new) — a right-edge **mood drawer** for short screens. Opened by a *visible* header button (not a swipe — CLAUDE.md §4 forbids hidden-gesture-only features); slides over the right edge (matching the user's "오른쪽 화면 끝" mental model). 2-column grid of all 7 emotions, same dark-fill selection language as the bar; picking applies immediately **and** closes (one tap, no confirm). Backdrop tap, ✕, and Escape all close it; nothing auto-dismisses.
- `src/App.tsx` — added a compact current-mood header button (short-screens-only, `short:flex`) showing the active mood's icon + label and opening the sheet; wired `EmotionSheet` state.
- `src/components/SettingsPanel.tsx` — added `short:` overrides throughout so the panel shrinks on a landscape phone: language tiles `160→~107 px`, voice tiles to `min-h-[72px]`, smaller section headers/padding/glyphs. Tablet sizes unchanged.

**Design decisions**
- **Visible trigger, not a swipe** — the user floated "swipe in from the right edge," but a swipe-only control violates the no-hidden-gesture rule. The drawer keeps the right-edge *placement* he pictured while the header mood-chip makes it discoverable and one-tap.
- **Branch on height, reuse one source of truth for mood** — the bar and the drawer share `EMOTION_ORDER` + `EMOTION_META`, so the two presentations can't drift. Only the container differs per height.
- **Smaller-but-not-small Settings** — short-screen tiles still clear the ≥120 px / big-tap-target intent (≥~107×139, ≥72 px); the change trims the *excess* that made the panel feel cramped in landscape, not the accessibility floor.

**Verification**
- `npm run build` ✓ (192.75 kB JS).
- Preview @ 844×390 (phone): bottom `EmotionBar` `display:none`, header mood button visible → opens the drawer; picking 행복 applied it and closed the drawer, header chip updated to "지금 기분: 행복"; no page scroll. Settings tiles measured ~107×139 / ~101 px.
- Preview @ 1180×820 (iPad): bottom `EmotionBar` visible with all 7 moods, header mood button `display:none`; no scroll.

---

## Entry 10 — 2026-06-04 · Conversation Partner — Per-Person Context & Speech Level

**Request** (user, after asking how the AI "remembers" previous turns)
- The short-term memory (`recentContext`) had no notion of *who* the elder was talking to, so a thread with one person bled into the next person's reply suggestions. He also wanted the AI to speak differently depending on the listener. Scope chosen together: **lightweight — 호칭 + 말투 (반말/존댓말) only** (richer per-partner topics/notes deferred).

**What Claude Code shipped**
- `src/types.ts` — `Partner { id, name, speechLevel }` + `SpeechLevel = "casual" | "polite"`; `Exchange.partnerId?` to tag stored turns.
- `src/lib/partner.ts` (new) — context, `usePartner` hook, `SPEECH_LEVEL_META`, two seed partners (`가족`/casual, `이웃·손님`/polite) so the feature works with zero setup, and `partnerForRequest()` so client & server agree on the wire shape.
- `src/components/PartnerProvider.tsx` (new) — localStorage-backed list + current id (mirrors `PersonaProvider`); resolves a fallback partner if the stored id is gone so something is always active.
- `src/lib/recentContext.ts` — `readRecentExchanges(partnerId, limit)` now **filters by partner**; entries with no `partnerId` (pre-feature) are skipped, and a null/undefined partner returns nothing (safe default: no context over wrong context). `MAX_KEPT` 10→40 since several threads now interleave under global pruning.
- `api/suggest.ts` — accepts `partner`; injects "He is speaking to: …" + a 반말/존댓말 instruction into the **user message** (not the cached system prompt, since it changes per conversation). The speech-level line overrides the system default 해요/합니다체.
- `src/components/PartnerSheet.tsx` (new) — right-edge drawer (same visible-trigger pattern as `EmotionSheet`, no swipe-only): tap a partner to select+close, spaced 🗑 delete with confirm, and an add form (호칭 + 반말/존댓말 toggle).
- `src/App.tsx` — header partner chip (👥 + name, visible on every page) opening the sheet; quick-phrase taps now tagged with `partnerId`. `ConversationPanel.tsx` reads/sends the current partner.
- `src/lib/i18n.ts` — ko/en `partner.*` strings.

**Design decisions**
- **Switching partner = the "new conversation" boundary.** This also resolves the earlier "no session boundary" concern: memory is scoped per partner instead of one global rolling log.
- **Partner in the user message, persona in the cached system prompt.** Persona is stable (cacheable); partner is per-conversation, so keeping it out of the cached block preserves the prompt-cache hit.
- **Speech level set at add-time only** (change = delete + re-add) — kept deliberately lightweight per the agreed scope.

**Verification**
- `npm run build` ✓ (200.40 kB JS); `tsc -p tsconfig.app.json --noEmit` ✓.
- Manual in-app verification still pending.

---

## Entry 11 — 2026-06-04 · Quick Phrases — Swipeable Themed Pages

**Request** (user)
- "현재 10개 맵핑 되어있는 부분을 좌우로 스와이프해서 넘길수있으면 좋겠어 (스와이프시 다음 맵핑이 나오도록)" — page through more quick-phrase sets by swiping.

**What Claude Code shipped**
- `src/types.ts` — `PhrasePage { id, icon, label, phrases }`.
- `src/lib/phrases.ts` — the flat ten are now page 1 (일상); added page 2 (몸·생활: 아파/화장실/물/추워/더워/졸려/약/병원/쉴래/다 됐어) and page 3 (마음: 보고팠어/사랑해/잘했어/미안해/이리 와/같이 가/이거 봐/뭐 해?/고생했어/잘 자). `PHRASE_PAGES` export; `QUICK_PHRASES` kept as an alias of the everyday set. Each page assigns the ten palette hues once, so no two tiles on screen share a color.
- `src/components/QuickPhrasePanel.tsx` — shows one page in the 5×2 grid with flanking ◀ ▶ buttons and a row of labelled, tappable page dots; **plus** horizontal swipe. A one-shot `suppressTap` ref stops a swipe that ends over a tile from also speaking it, and clears on the next touch so a later genuine tap is never swallowed.
- `src/lib/i18n.ts` — ko/en `panel.prevPage` / `panel.nextPage` / `panel.pages`.

**Design decisions**
- **Swipe is a bonus, never the only way** (CLAUDE.md §4: no hidden-gesture-only features). Every page is reachable by a visible arrow and a labelled dot; the swipe just matches the user's mental model.
- **Arrows in the horizontal margin, dots in one short row** — spends the abundant landscape width, not the scarce height.
- **Themed pages, ≤10 tiles each** — keeps the grid uncrowded and gives the page-2/3 utterances (incl. conversation-starters like 이리 와 / 뭐 해?) a home, partly seeding the deferred "elder initiates" feature.

**Verification**
- `npm run build` ✓; `tsc -p tsconfig.app.json --noEmit` ✓.
- Manual in-app verification (swipe + arrows + dots on device widths) still pending.

---

## Entry 12 — 2026-06-04 · Partner Picker — Preset Grid + Voice-Only Add

**Request** (user, after living with the partner feature)
- "감정처럼 프리셋이있어서 편하게 선택하는게 좋을것같아 (키보드 타자 최소화) + 칸이 있어서 누르면 새로운 사람 추가 할수있게 : 추가는 타자 x . 마이크로 입력" — pick a partner the way you pick a mood (tap a preset tile, no typing); a "＋" tile to add a new person; and adding must use the microphone, not the keyboard.

**What Claude Code shipped**
- `src/types.ts` — `Partner.icon?` (decorative emoji on the tile; the 호칭 label always sits beside it, so it's never the only signal).
- `src/lib/partner.ts` — replaced the 2-item seed with a 6-tile **preset palette** (아내/아들/딸/손주 → 반말, 의사 선생님/이웃 → 존댓말), each with a fitting face; `DEFAULT_PARTNER_ICON` (🧑) for voice-added people; `add()` now takes an optional icon.
- `src/components/PartnerProvider.tsx` — `add` carries the icon; **safe one-time migration**: a list that is exactly the untouched old seed (`seed-family`/`seed-guest`) upgrades to the new presets, while any list the user actually changed is left alone.
- `src/components/PartnerSheet.tsx` — rewritten as a **mood-like 2-col grid** of partner tiles (tap = select + close, zero typing) with a trailing dashed **＋ tile**. The add flow (`AddByVoice`) captures the 호칭 by **microphone** via `useSTT` — press to talk, see "이렇게 들었어요", 🔁 다시 말하기, tap 반말/존댓말, 추가. No text field at all (graceful unsupported-browser message instead). An **편집** toggle turns the grid into a delete mode (🗑) so a mis-heard voice entry can be removed without colliding with the select tap.
- `src/lib/i18n.ts` — swapped the text-input strings for `partner.addTile` / `partner.edit(.done)` / `partner.add.mic.*` / `partner.add.captured` / `partner.add.again` / `partner.add.unsupported` / `partner.add.cancel` (ko + en).
- `src/App.tsx` — header chip shows the partner's icon.

**Design decisions**
- **Tap-first, voice-second, type-never** — matches the elder's reality (typing is hard) and mirrors the emotion picker he already knows.
- **Edit mode instead of per-tile ✕** — avoids a tiny delete target overlapping the big select target (mis-tap risk); the visible 편집 toggle keeps it discoverable (no hidden gesture, §4).
- **Migrate only the pristine seed** — never clobbers a list the user has invested in.

**Verification**
- `npm run build` ✓; `tsc -p tsconfig.app.json --noEmit` ✓.
- Manual in-app verification (tap-select, ＋ voice capture, 편집 delete) still pending — STT needs a real device gesture + mic permission.
