# Talk Again — v2 Plan

> Post-submission work plan. Target: complete before in-person visit to grandfather's home (≈1 week).
> Live v1: https://talk-again.vercel.app/

---

## 0. What changed since v1

### Hardware reality
- **v1 assumption:** iPad 10th gen at grandfather's home.
- **v2 reality:** grandfather will use his **Android phone**, not an iPad. He is unlikely to buy an iPad.
- Web app is delivered via Vercel — no platform port required. But the **portrait mobile layout currently breaks** (buttons too small, spacing wrong). Landscape on phone is OK.
- Apple Pencil / handwriting features deferred indefinitely (no iPad → no Pencil).

### Usage shift
- v1 was a class deliverable that proved the design argument and shipped a working core.
- v2 is for **real daily use** — the question is no longer "does the thesis hold?" but "will he actually use this every day?"

---

## 1. New non-negotiable design principles (added to v1's CLAUDE.md §4 ruleset)

These join the existing elderly-UX rules and override any AI default:

### 1.1 Button positions are stable. Forever.
- **Quick phrase tiles never auto-reorder.** Position is set when the phrase is added (default 10 or user-added) and stays put.
- Frequency learning is *only* allowed as a separate read-only surface (e.g. a "최근 자주 쓴 말" panel that doesn't touch the main grids).
- Reason: elderly muscle memory >> statistical optimization. If the layout shifts, he has to re-read every button every time he wants to say something, which defeats the one-tap promise.

### 1.2 Phone portrait must work, but never force rotation
- No "please rotate your device" overlays.
- Portrait gets its own optimized layout (smaller grid, stacked controls) — not a shrink of the landscape layout.

### 1.3 Cloud features must degrade, never block
- Every cloud-dependent feature (AI Suggestions, ElevenLabs voice, future SMS/119/GPS) must have a working offline / failure path.
- Failure messaging is informational, never modal.

### 1.4 We do not look through his conversation log
- No "what did grandfather say this week" viewer for family. Privacy peep risk is too high.
- Conversation log exists internally as context material for AI Suggestions only — never as a UI surface.

---

## 2. Goals for the visit

Concrete success signals when I'm sitting next to him:
1. He initiates **one full conversation** (3+ exchanges) using AI Suggestions without prompting.
2. He uses **at least 2 custom phrases** we added together that week.
3. He understands the emergency button (already shipped) and can use it without my help.
4. He uses the app on his Android phone in portrait at least once, and it doesn't feel broken.

---

## 3. Scope decisions

### ✅ IN — v2 build (this week)
| # | Feature | Why |
|---|---|---|
| A | **AI Suggestions** (Step 4 from original plan) | Single biggest unaddressed gap in Design Argument |
| B | **Persona Onboarding** | Required input for AI Suggestions to be personal, not generic |
| C | **Custom phrases + Phrase categories / page switching** | Real vocabulary, organized; no auto-sort |
| D | **Portrait mobile layout** | He's on Android phone, not iPad |
| E | **Emergency: GPS pin auto-attach** | He may not remember exact address under stress |
| F | **Emergency: SMS to family list** | More than one channel for help |
| G | **Emergency: Medical card panel** | Critical info paramedics need on first look |
| H | **Battery + connection indicator** | Big visible status, never miss low battery |
| I | **Offline mode for core features** | Rural wifi reality |

### 🟡 LATER — after this sprint
| Feature | Why deferred |
|---|---|
| Camera input → phrase suggestions | Interesting but lower priority than conversation depth |
| Auto 119 call | Build on top of SMS infrastructure once SMS works |
| Song mode | Discuss with grandfather first before deciding (voice-cloning-line ethics) |

### ❌ OUT — explicitly rejected
| Feature | Reason |
|---|---|
| Free Text Input | He doesn't type. Adds visual clutter for an affordance he won't use |
| Handwriting pad (Apple Pencil) | No iPad → no Pencil. Deferred indefinitely |
| Memory / recall viewer ("what he said this week") | Privacy-peep feel. Conversation log stays internal |
| Local LLM / on-device LLM | Maintenance burden too high. Revisit *only if* token costs spike or rural wifi becomes unworkable |
| Auto-reorder of phrase tiles by frequency | Violates new design principle 1.1 |

---

## 4. Sprint plan (7 days)

> Aggressive — 9–10 days of work compressed into 7. Risk register in §6.

### Sprint 1 — AI Suggestions + Persona (Days 1–3)

**Persona Onboarding (½ day)**
- 10 questions per CLAUDE.md §6.5 — same questions, English/Korean copy
- Single full-screen flow, big inputs, "건너뛰기" (skip) on each question
- Save to `localStorage.persona`
- Re-runnable from Settings → "할아버지 정보 다시 입력"
- Grandmother / family can fill it in initially; he can edit later

**STT hook (½ day)**
- `useSTT` — `webkitSpeechRecognition` wrapper, `lang: "ko-KR"`
- Manual start/stop (no continuous listening — privacy + battery)
- Returns final transcript string

**`/api/suggest` serverless function (1 day)**
- POST `{ transcript, persona, emotion, recentContext }`
- Reads `ANTHROPIC_API_KEY` from env (server-only, same `VITE_`-free pattern)
- Calls Claude `claude-sonnet-4-5` with system prompt that bakes in persona + emotion + recent context
- Returns `{ suggestions: [string, string, string] }` JSON

**`SuggestionStack` UI (1 day)**
- "듣기 시작" big button → STT begins, transcript displayed in big type as it builds
- "답변 받기" → calls `/api/suggest`, shows 3 candidate replies as 1/2/3 tiles
- Tap any → speak via `useTTS` + persist to recent-context IndexedDB store
- Cancel any time

**Recent context store**
- New IndexedDB store `recent_exchanges` (capped at last 10)
- Schema: `{ id, timestamp, theyHeard, heSaid }`
- Used as Claude system prompt context, never surfaced as a UI viewer (principle 1.4)

### Sprint 2 — Vocabulary + Categories (Days 3–4)

**Phrase categories**
- 5–6 default categories: **자주 쓰는 말 / 가족 / 식사 / 산책 / 건강 / 응급 표현**
- Top-of-grid tab switcher (big tabs, current category clearly marked)
- Each category = its own 5×2 grid (or 3×4 on portrait)
- Each phrase belongs to exactly one category
- Tab positions ALSO never auto-reorder (principle 1.1 applies to tabs too)

**Custom phrase editor (Settings → "내 말 추가하기")**
- Add: phrase text (KO/EN) + icon (emoji picker or default) + color (from existing palette) + category
- Edit: change text/icon/color
- Delete: confirmation modal (this one warrants a modal — destructive)
- Order: drag-handle reorder within category (manual only — NEVER automatic)
- Defaults remain editable but resettable
- Save to `localStorage.customPhrases`

### Sprint 3 — Mobile portrait layout (Day 4–5)

**Detection**
- `window.matchMedia("(orientation: portrait)")` + resize listener
- New context `useOrientation()` → `'portrait' | 'landscape'`

**Portrait grid**
- Quick phrases: 3×4 (12 tiles visible) — slightly smaller tiles (~110×110 px floor instead of 160×160)
- Emotion picker: 4×2 stacked layout
- Header: stacked vertically (title + chip on row 1, emergency + settings on row 2)
- Test target: similar-sized Android device to what grandfather will use

**Landscape stays as-is**
- Already proven on iPad/desktop
- No regression test needed beyond a quick visual check

### Sprint 4 — Emergency depth (Days 5–6)

**GPS pin auto-attach (½ day)**
- Permission prompt explained in plain Korean ("위치 정보 한 번 허용해 주시면 응급 시 119에 주소가 자동으로 함께 갑니다")
- On emergency trigger: `navigator.geolocation.getCurrentPosition()` with timeout
- If granted: append `"위치: 위도 OO 경도 OO (https://maps.google.com/?q=lat,lng)"` to spoken + visible message
- If denied or timeout: silently skip — never block the broadcast
- Optional reverse geocoding via Kakao Maps API (more reliable in rural Korea than Google)

**SMS to family (1 day)**
- Provider: **Solapi** or **NCP SENS** (Korean phone numbers; Twilio works but more expensive for KR)
- Settings → "가족 연락처" — 1–3 phone numbers + name labels
- On emergency trigger: `/api/sms` serverless function sends preset message + address + GPS to each family number
- Confirmation in UI: small green checkmark when each SMS succeeds (in banner, not blocking)
- Auto 119 call comes LATER on top of this

**Medical card panel (½ day)**
- Settings → "응급 의료 정보" — name, age, blood type, allergies, current meds, conditions, doctor name + phone
- During emergency: a "의료 정보" button visible in the banner → opens full-screen panel
- Panel designed for paramedic readability: very high contrast, huge text, no decoration
- All fields optional; only filled-in fields render

### Sprint 5 — Reliability (Days 6–7)

**Battery + connection indicator**
- Big visible element, always-on (corner of header)
- Battery: % + visual bar; turns red below 20%
- Connection: dot (green online / yellow weak / red offline)
- Battery API is unreliable cross-browser — use it where available, otherwise show connection only

**Offline mode**
- Service Worker pre-caches the audio Blobs of the 10 default Quick Phrases (plus the user's emergency message) at install time
- All app shell + Tailwind CSS + Pretendard font already cached via existing `runtimeCaching`
- Online detection (`navigator.onLine` + ping) → settings chip shows "오프라인 모드"
- In offline: AI Suggestions disabled with a clear message, everything else works
- Custom phrases auto-cached on first speak

---

## 5. Tech additions

| Capability | API / service | Cost concern |
|---|---|---|
| AI Suggestions | Anthropic Claude `claude-sonnet-4-5` | Cheap at our usage; budget cap in serverless function |
| STT | Web Speech Recognition (browser, free) | None |
| SMS to Korea | Solapi or NCP SENS | ~₩10/메시지 — negligible |
| Reverse geocoding | Kakao Maps API | Free tier sufficient |
| ElevenLabs | already in place | already paid |

New env vars:
```
ANTHROPIC_API_KEY=sk-ant-...
SOLAPI_API_KEY=...       (or NCP equivalent)
SOLAPI_API_SECRET=...
KAKAO_REST_API_KEY=...   (optional, for reverse geocoding)
```

All server-only, no `VITE_` prefix (per existing convention).

---

## 6. Risk register

| Risk | Mitigation |
|---|---|
| AI Suggestions accuracy on rural Korean dialect / family-specific terms | Test early with grandmother. Persona prompt explicitly notes regional vocabulary. Fall back to Quick Phrases gracefully if suggestions are unusable |
| `webkitSpeechRecognition` reliability on Android Chrome (esp. older Android versions) | Detect support on first run, hide STT button + show fallback message if unsupported |
| Solapi / NCP SMS — Korean phone number verification rules | Test with my own phone first; might need business registration depending on volume — for personal use, sender ID rules are looser |
| Battery API removed from iOS Safari | Indicator gracefully shows only connection on iOS; battery shown when API present (Android Chrome, desktop) |
| Geolocation permission denied or imprecise indoors | Document workaround: manual address in emergency message is still the primary signal — GPS is enrichment |
| 7-day timeline is tight for 9 sprints of work | Hard-prioritize Sprints 1 + 4 (AI Suggestions + Emergency depth). Cut Sprint 5 (offline + battery) to "minimum viable" if pinched |

---

## 7. Minimum acceptable v2 (if time pinched)

If by day 5 we are behind, this is the cut order — keep top, drop bottom:

1. ✅ AI Suggestions (mandatory — biggest gap)
2. ✅ Persona Onboarding (dependency on #1)
3. ✅ Portrait mobile layout (he can't use the app otherwise)
4. ✅ Custom phrases (vocabulary that's actually his)
5. ✅ GPS pin + medical card (safety net)
6. 🟡 SMS to family (cuttable — emergency button still works without it)
7. 🟡 Phrase categories beyond 1 default (cuttable — flat list still works for ~20 phrases)
8. 🟡 Battery + connection indicator (cuttable — nice to have)
9. 🟡 Offline pre-cache (cuttable — `runtimeCaching` already gives partial offline)

---

## 8. Open questions to ask grandfather during visit

Bring these. Some answers shape v2.1.

1. **Song mode** — interest level? Comfort with "his designed voice" singing?
2. **Categories** — which 5–6 daily-life categories make most sense to him? (My defaults are a guess)
3. **Portrait vs landscape** — which feels more natural on his phone?
4. **Family SMS list** — which 1–3 people should get emergency texts?
5. **Custom phrases** — sit with him and add 10 of his own that week. Watch what he reaches for in real conversations.
6. **Voice quality on the actual Android speaker** — is the ElevenLabs voice loud enough at his hearing comfort? Does the system fallback voice feel acceptable for offline cases?

---

## 9. After the visit — v2.1 onward (not planned in detail)

Driven by what we observe in person:
- Camera input (sprint 6 candidate)
- Auto 119 call (after SMS proves stable)
- Song mode (only if he wants it)
- Local LLM (only if token cost or wifi becomes a real problem)
- Two-way family-prompts mode (if he wants family to be able to send him prompts)

---

*This plan is a living document. Update as decisions land. Major design pivots also get a corresponding `AI_Direction_Log.md` entry.*
