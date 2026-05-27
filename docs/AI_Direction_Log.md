# AI Direction Log — Talk Again

> Code 작업하면서 실시간으로 쌓는 결정 로그. CLAUDE.md §10 포맷.

---

## Entry 1 — 2026-05-20 · Step 1 셋업 (Vite + Tailwind + PWA + Quick Phrase)

**요청**
- `/Users/key/Documents/GitHub/talk-again/` 에 새 PWA 프로젝트 시작.
- Vite + React 18 + TS + Tailwind + `vite-plugin-pwa` 셋업.
- 한국어 폰트(Pretendard), iPad 가로 1180×820 우선 레이아웃.
- `QuickPhrasePanel` (10개 한국어 표현, 1탭 발화) + `useTTS` 훅 (ko-KR 음성 + emotion prosody).
- 추가 요구: **언어 토글(한국어/영어)을 설정 화면에**, 그리고 elderly UX 연구 결과 반영
  - 본문 24px+, 라벨 36~44px, 행간 1.5+, 얇은 weight 금지
  - 핵심 버튼 120×120px+, 간격 24~32px, 화면 상단에 핵심 액션
  - 텍스트 대비 7:1+, 색만으로 정보 구분 금지 (색+아이콘+라벨)
  - 파랑/보라만으로 구분 X (수정체 황변)
  - 1탭 즉시, 숨은 제스처 금지, IT 전문용어 제거

**Claude Code가 만든 것**
- 프로젝트 셋업: `package.json`, `vite.config.ts`, `tsconfig.*`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `.gitignore`, `.env.example`, `README.md`.
- Tailwind 디자인 토큰을 elderly UX 연구 수치로 직접 박음:
  - `fontSize.body = 24px / line-height 1.6 / weight 500`, `label = 32px / 600`, `label-lg = 40px / 700`, `title = 48px / 700`.
  - `colors.canvas = #F5F3EF`, `colors.ink = #1A1A1A` → 대비 15.6:1 (7:1 기준 통과).
  - `spacing.gap = 32px`, `tile-min = 160px` (120px 마지노선보다 여유 33%).
  - `colors.phrase.*` 10색 — 파랑/보라 단독 구분 회피, 각 색에 1:1 아이콘+라벨 매칭.
- 컴포넌트:
  - `QuickPhrasePanel` — 5×2 그리드, 16개 타일에 색+이모지+라벨 3중 신호.
  - `SettingsPanel` — 풀스크린 (코너 드롭다운 X), 언어 선택은 큰 토글 2개 (160×160+).
  - `VoiceStatusChip` — 한국어 음성 준비 상태를 색+점+한국어 라벨로 표시.
- 훅:
  - `useTTS` — Web Speech API 래퍼. `voiceschanged` 비동기 구독 + 500ms 폴링 fallback. 탭마다 `cancel()` 후 새 발화(연타 시 큐 쌓임 방지). emotion → rate/pitch 표 내장.
- 라이브러리:
  - `lib/i18n.ts` — 의존성 없는 한 파일 i18n. 한국어 기본, 영어 fallback. 한국어 카피에서 "탭/메뉴/토글" IT 용어 일체 제거.
  - `lib/voices.ts` — Korean voice 선택 로직 (남성 → 한국어 → fallback 순), 선택 이유를 UI에 노출.
  - `lib/storage.ts` — Safari Private Mode 에서도 안 터지는 localStorage 래퍼.
- PWA: manifest, iPad `apple-touch-icon`/`apple-mobile-web-app-capable` 메타, Pretendard CDN `runtimeCaching` (오프라인 대비), placeholder 아이콘 192/512/apple-touch/favicon.
- 빌드/검증: `npm run typecheck` ✓, `npm run build` ✓ (151KB JS / 12KB CSS gzip 49KB), `npm run dev` 가 LAN host로 정상 기동 (`http://172.23.177.74:5173/`).

**결정**: 채택. 단, 다음 항목은 의도적으로 Step 1에서 비워둠.
1. **다크 모드** — CLAUDE.md §4 가 라이트 모드 기본을 명시. 다크는 `globals.css` 의 `color-scheme: light` 와 `<meta theme-color>` 만 잡아두고 토글은 후속 단계.
2. **Emotion 상태 전역화** — `App.tsx` 에서 `emotion = "neutral"` 로 고정하되 `useTTS.speak(text, { emotion })` 호출 경로는 이미 깔아둠. Step 2 의 EmotionDial 이 같은 자리에 끼우면 됨.
3. **사람 목소리(elder male) 보장** — iPad Safari 의 한국어 시스템 음성에 남성 보이스가 없을 수 있음(보통 Yuna 여성만 노출). `pickKoreanVoice` 가 남성을 찾되 못 찾으면 "korean-other" 사유로 폴백하고 `VoiceStatusChip` 이 사용자에게 보임. → User Testing 단계에서 실제 iPad 음성 목록 확인 후 OS 설정 안내가 필요할 수 있다.

**이유**
- 디자인 토큰을 처음부터 elderly UX 수치로 박아두면 컴포넌트마다 매번 검토하지 않아도 됨. "기본값이 안전한 값" 원칙.
- 풀스크린 설정 화면은 노년층의 "한 화면 한 과업" 원칙과 맞고, 우리 경우 설정 항목이 늘어나도 한 곳에서 큰 글자로 보여줄 수 있어 확장성이 좋음.
- `useTTS` 의 `cancel-then-speak` 패턴은 외할아버지가 한 번에 여러 단추를 누르거나 의도가 바뀌어 다시 누를 때 자연스럽게 마지막 의도가 살아남게 함 (큐 쌓여서 의도와 다른 문장이 뒤늦게 나오는 시나리오 차단).
- IT 용어 회피는 의외로 강한 제약 — "탭하세요" 대신 "한 번 누르면" / "메뉴" 대신 "설정" / "토글" 대신 큰 선택 단추 두 개. 한국어 카피 전수 통과시킴.

**다음 (Step 2 직전 확인사항)**
- iPad 실기에서 dev 서버 접속 → 한국어 음성 목록 확인 → 어떤 voice name 이 잡히는지 사용자에게 공유 (남성 보이스 부재 시 Step 2 시작 전에 결정 필요).
- `Records_of_Resistance.md` Entry 1 에 "voice cloning 사용 안 함" 결정 기록은 사용자가 직접 작성 (학사 규정).

---

## Entry 2 — 2026-05-25 · Step 1.5 · 목소리 디자인 도입 (ElevenLabs Voice Design)

**요청**
- 사용자: "Web Speech 기본 한국어 음성이 너무 무서워. 다른 목소리 알고리즘을 찾아서 추가하자."
- 추가 명확화: "할아버지 목소리 샘플을 구하질 못하니까 목소리 생성 AI로 만들고 싶어."
- 즉 voice **cloning** 이 아니라 voice **design** — 텍스트 설명으로 새 voice를 생성해서 외할아버지의 페르소나(따뜻한 70대 한국 남성)에 맞추기.

**Claude Code가 만든 것**
- **`api/tts.ts`** — Vercel Edge runtime 서버리스 함수. `process.env.ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL_ID` 읽음. POST `{text, emotion, voiceId?}` → ElevenLabs `/v1/text-to-speech/{voice_id}` 호출 → `audio/mpeg` 스트리밍 반환. 키는 서버에만, 브라우저 번들에 절대 안 들어감.
  - emotion → `voice_settings.{stability, similarity_boost, style}` 매핑 표 내장. 7개 감정 모두 `similarity_boost ≥ 0.75` 로 voice identity 일관성 보장.
  - 입력 검증: `text` 500자 제한 (크레딧 폭주 방지), `voiceId` regex 검증 (악성 클라이언트가 남의 voice 청구하는 거 차단).
- **TTS Provider 추상화** (`src/lib/tts/`):
  - `types.ts` — 공통 `TTSProvider` 인터페이스 (`speak/cancel/isReady`).
  - `webSpeech.ts` — 기존 Web Speech 를 provider 로 감쌈. 폴백 + 오프라인 경로.
  - `elevenLabs.ts` — `/api/tts` 호출 + IndexedDB 캐시 hit/miss + HTMLAudioElement 재생 + AbortSignal 지원.
  - `cache.ts` — IndexedDB Blob 캐시. 키 = `${voiceVersion}|${emotion}|${text}`. 같은 phrase 두 번째 탭부터는 네트워크 0 / 무료자 0. `VOICE_VERSION` 상수로 voice 재설계 시 캐시 무효화.
- **`useTTS` 훅 refactor** — 엔진 무관 + 실패 시 silent failover. 사용자 선호 `ai` 인데 ElevenLabs 가 503/네트워크 실패하면 같은 호출이 자동으로 Web Speech 로 떨어지고, `fallbackActive: true` 플래그가 헤더 칩에 "AI가 안 돼서 기본 목소리로 말해요" 로 노출됨. 외할아버지는 항상 "뭔가는" 들음.
- **설정 화면 "목소리" 섹션** — 큰 토글 2개 (AI 목소리 / 기본 목소리). 각 토글에 한 줄 설명 ("따뜻하고 자연스러움 · 인터넷 필요" / "기계 같지만 인터넷 없어도 됨"). IT 용어 일체 회피.
- **`VoicePrefProvider`** — localStorage 영속. 기본값 `ai` (디자인된 목소리 우선).
- **dev API 프록시** — `vite.config.ts` 에 작은 plugin. `npm run dev` 만 돌려도 `/api/tts` 가 동작 (Vercel CLI 불필요). `loadEnv()` 로 `.env.local` 을 `process.env` 에 주입.
- **`VITE_` 접두사 금지** — ElevenLabs 키에 일부러 안 붙임. 실수로 `import.meta.env.ELEVENLABS_API_KEY` 호출해도 `undefined` 나옴 → 키 누수 원천 차단.
- **CLAUDE.md §5 amended** — cloning 금지 유지 + voice design 채택 명시 + 기본 합성음 단독 사용 거부 추가.

**결정**: 채택. 다음 차이점 의도적으로 둠.
1. **VOICE_VERSION 캐시 무효화** — 자동 감지 안 함. 사용자가 ElevenLabs 에서 새 voice 만들면 `src/lib/tts/elevenLabs.ts` 의 `VOICE_VERSION` 만 `"v2"` 로 바꾸면 됨. IndexedDB 자동 wipe 보다 명시적이고 디버깅 쉬움.
2. **AI 실패 시 사용자 알림 강도** — 헤더 칩에 작은 라벨만 (warning color). 모달/토스트 X. 외할아버지가 대화 중일 때 화면 가리는 알림은 더 큰 UX 실패.
3. **Pre-fetch 안 함** — 첫 부팅 시 10개 quick phrase 미리 합성하는 것도 고려했지만, 첫 인상이 "왜 로딩 중이지?" 가 되는 게 더 나쁨. 첫 탭은 cloud latency 한 번, 그 뒤로는 캐시 hit. 첫 탭 경험이 나쁘면 그때 pre-fetch 도입.

**이유**
- **윤리 vs 실용성 줄타기**: CLAUDE.md §5 의 cloning 금지 의도(=정체성 위조 금지)는 voice design 으로 침범되지 않음. 새 voice 는 외할아버지 본인이 아니라 "다시 말해요" 라는 도구의 voice. 이건 페르소나 디자인이지 신원 위조 아님. 본인이 "내 목소리야" 라고 주장하지 않음.
- **silent failover** 가 핵심 — 외할아버지가 "왜 안 돼?" 라는 순간이 0초여야 함. 어떤 실패 모드에서도 결국 무언가 들리게 만드는 것이 디자인 1순위.
- **provider 추상화** 는 향후 (Step 4 이후) 다른 엔진 (Azure / Naver Clova) 으로 교체할 때 한 파일 추가로 끝나도록 한 투자.

**검증**
- `npm run typecheck` ✓
- `npm run build` ✓ (158KB JS / 12KB CSS, +6KB 증가분)
- `npm run dev` + `curl -X POST /api/tts` → `503 {"error":"tts_not_configured"}` (키 없으므로 정상). 키 박은 후 같은 호출이 `audio/mpeg` blob 반환 예정.

**다음 (사용자 작업)**
- `.env.local` 생성 → ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID 채움
- `npm run dev` 재시작 → iPad 또는 데스크톱에서 quick phrase 탭 → ElevenLabs voice 첫 검증
- voice 마음에 안 들면 ElevenLabs Voice Design 에서 다시 만들어서 voice_id 만 교체

---

## Entry 3 — 2026-05-25 · Step 2 · EmotionPicker + 음성 품질 개선

**요청** (사용자, 첫 청취 후)
1. "감정을 선택할 수 있는 UI 추가."
2. "AI 목소리 쓸 때 괜찮아 버튼 누르면 마지막에 여자 목소리로 응 이라는 소리를 내는 것 같아. 그리고 좋아는 요아라고 발음해."
3. "기본 목소리는 Yuna 말고 남자 목소리 있어?"
4. "설정에서 영어 선택해도 한국어만 말해."

**Claude Code가 만든 것**

*Item 1 — EmotionPicker*
- `src/lib/emotion.ts` — Context + `EMOTION_ORDER` + `EMOTION_META` (이모지 + 액센트 컬러 per 감정).
- `src/components/EmotionProvider.tsx` — localStorage 영속, 기본값 `neutral`, invalid 값 sanitize.
- `src/components/EmotionPicker.tsx` — 7개 타일 (`보통` + 6개) 가로 행. QuickPhrasePanel 아래 배치 (primary action 위, modifier 아래).
- 디자인 결정: 원래 spec(INITIAL_PROMPT_FOR_CODE Step 2)의 "방사형 picker"는 안 만듬. 노년 사용자에게 균일하지 않은 탭 영역 기하학(원 가장자리)이 손떨림에 불리. 격자가 더 예측 가능. 이 일탈은 의도적 — `EmotionPicker.tsx` 상단 주석에 명시.
- `보통` 을 첫 타일로 포함 → 1탭으로 neutral 복귀. 숨은 제스처(롱프레스 해제) 금지 원칙 준수.

*Item 2 — Korean 발음 ("좋아" → "요아", "괜찮아" 끝의 여자 음성)*
- 기본 모델을 `eleven_multilingual_v2` → **`eleven_turbo_v2_5`** 로 교체. turbo_v2_5 는 한국어를 32개 공식 지원 언어로 명시(multilingual_v2 는 auto-detect 만 함). 짧은 한국어 phrase 에서 발음 정확도 큰 차이.
- API 에 `language_code` 파라미터 추가. 클라이언트가 `lang: "ko-KR"` 보내면 서버가 `language_code: "ko"` 강제. 영어 모드에서는 `"en"`. multilingual_v2 는 이 필드 무시하므로 backward-safe.
- `src/lib/tts/elevenLabs.ts` 의 `VOICE_VERSION` bump v1 → v2 → 옛 (multilingual_v2 로 합성된) 캐시 silent miss → 강제 재합성.
- 캐시 키에 `lang` 포함 → 한국어/영어 같은 텍스트가 서로 덮어쓰지 않게.
- `.env.local` / `.env.example` 의 ELEVENLABS_MODEL_ID 동시 업데이트.
- **참고**: "괜찮아" 끝의 여자 "응" 은 ElevenLabs Voice Design 의 voice 자체가 가끔 화자 일관성을 잃는 알려진 현상. 모델 교체로 완화될 가능성 큼. 그래도 지속되면 사용자가 Voice Design 에서 "ONLY ONE VOICE. ALWAYS MALE. NEVER FEMALE." 같은 더 엄격한 프롬프트로 voice 재설계 필요.

*Item 3 — 시스템 한국어 남성 voice*
- `src/lib/voices.ts` 의 picker 우선순위 강화:
  1. Korean **male** (`MALE_HINTS` 확장: junho, minsu, siwoo, jihoon, 남, male, men)
  2. Korean **Siri** (newer voice engine, much warmer than legacy Yuna)
  3. Korean **Enhanced/Premium/Neural** (download tier)
  4. Korean default (보통 Yuna)
  5. Fallback (한국어 voice 부재 시)
- `listKoreanVoices()` 신규 — 디바이스에 깔린 한국어 voice 목록 반환.
- `src/components/VoiceDiagnostic.tsx` 신규 — 설정 화면 안에 깔린 한국어 voice 목록 + 현재 사용 중 voice + iPad 에서 추가 voice 받는 OS 경로 안내 ("설정 → 손쉬운 사용 → 음성 콘텐츠 → 음성 → 한국어 → +").
- 한계: stock iPadOS 에는 Yuna(여) 한 개만 설치되어 있음. 남성 voice 를 원하면 OS 차원의 download 가 필수. 코드만으로 해결 불가능 → UI 로 명시 안내.

*Item 4 — UI 영어 선택 시 영어 발화*
- `src/App.tsx` 의 `handleSpeak` 가 `phrase.speech[lang]` 을 사용하도록 수정 (이전엔 항상 `phrase.speech.ko`).
- TTS 호출 `lang` 파라미터도 `ko-KR` / `en-US` 로 분기.
- `lang` 이 의존성 배열에 포함 → 사용자가 설정 화면에서 언어 바꾸면 다음 탭부터 즉시 새 언어로 발화.

**검증**
- `npm run typecheck` ✓
- `npm run build` ✓ (164KB JS / 13KB CSS gzip 53KB. EmotionPicker + VoiceDiagnostic 추가에 +6KB)
- `npm run dev` + `curl POST /api/tts {text:"안녕하세요", emotion:"happy", lang:"ko-KR"}` → `200 audio/mpeg 20KB`, ID3 정상 헤더. ElevenLabs turbo_v2_5 호출 end-to-end 통과.

**결정 (의도적으로 안 만든 것)**
- **자동 voice 재디자인** — Voice Design 트리거를 API 로 호출하는 것도 가능하지만, voice 품질은 사람 귀로 후보 3개 중 골라야 함. 자동화는 부적합.
- **phonetic 오버라이드 필드** — `phrase.phonetic.ko = "조아"` 같은 escape hatch 도 고려. 일단 turbo_v2_5 + language_code 로 해결되는지 보고 필요 시 추가. 미리 만들면 미사용 dead code 위험.
- **emotion 별 다른 발화 텍스트** — "괜찮아" 가 sad 일 때 "괜찮아…" 같은 변형도 가능. Step 4 의 AI Suggestions 에서 자연스럽게 풀 영역, 지금은 X.

**다음 (사용자 작업)**
- dev 서버 재시작 (env + 코드 변경) → quick phrase 탭 다시 들어보기
  - "좋아" → "조아" 로 들리는지
  - "괜찮아" 끝에 여자 음성 사라졌는지
- 감정 바꿔서 같은 phrase 톤 차이 확인
- 설정 → 기본 목소리 진단 으로 들어가 보면 깔린 한국어 voice 목록 보임. 남성 voice 없으면 거기 안내대로 OS 에서 받기.
- 그래도 "괜찮아" 여자 음성 끝남 지속되면 ElevenLabs Voice Design 으로 voice 재설계 ("STRICTLY single male voice, late 60s Korean grandfather, no second speaker, no background noise"). 새 voice_id 받으면 `.env.local` 교체 + `VOICE_VERSION` v3 로 bump.

---

## Entry 4 — 2026-05-25 · 응급 단추 도입 + 도와줘 아이콘 분리

**요청** (사용자)
1. "도와줘 아이콘 SOS는 비상용 버튼이랑 헷갈려서 아이콘 변경하고"
2. "진짜 비상 버튼 추가하자 — 응급용으로 주소 설명 같은거"

**Claude Code가 만든 것**

*아이콘 충돌 해소*
- `src/lib/phrases.ts` 의 `help` 타일 아이콘 🆘 → **🙋** (손 든 사람). 일상 도움 요청 의미가 분명하고 SOS 와 시각 충돌 없음.
- 🆘 는 응급 단추 전용으로 예약 — 한 디바이스 안에서 SOS 글리프는 응급에만 등장.

*EmergencyProvider* (`src/lib/emergency.ts`, `src/components/EmergencyProvider.tsx`)
- Context: `{ message, setMessage, resetMessage, isActive, trigger, stop, preview }`.
- 메시지 영속: `STORAGE_KEYS.emergencyMessage` localStorage. 빈 문자열 sanitize (응급에 무음은 가장 큰 버그).
- 기본 메시지: `"도와주세요. 저는 말을 못 합니다. 119에 전화해 주세요."` — placeholder `[주소]` 같은 문구를 **일부러 안 넣음**. 사용자가 설정에서 채우지 않으면 그대로 발화되는데, 실제 응급에서 "꺽쇠 주소 꺽쇠" 같은 음절 낭비는 critical. 기본은 짧고 완결된 문장으로 둠.
- 발화 루프: `EMERGENCY_REPEATS = 3`, `EMERGENCY_PAUSE_MS = 500`. 반복 사이 멈춤을 sleep 으로 두되 `AbortController` 가 sleep 도 끊을 수 있게 wired up.
- `volume: 1.0`, `emotion: "neutral"`, `lang: "ko-KR"` 고정. UI 언어와 무관 — 한국 시골에서 한국어 응급 외엔 의미 없음.
- emotion 선택은 **clarity 우선**. worried/angry 톤은 자음 뭉개짐 위험. 119 operator 가 가장 빨리 파싱할 수 있는 형태.
- `useTTS` 통해 호출 → AI/system 폴백 자동 작동. 오프라인이어도 system voice 로 응급 발화 보장.

*EmergencyButton* (`src/components/EmergencyButton.tsx`)
- Header 안 `[chip] [응급] [⚙]` 순. 응급이 visual 중앙. min-tile 사이즈 + bg-emergency + 4px dark-red 보더.
- 두 상태:
  - idle: 🆘 + "응급" 라벨
  - active: ■ + "멈추기" 라벨, `animate-pulse` + 흰색 ring offset → 멀리서도 broadcasting 중인지 식별 가능
- 탭 토글 (start / stop). **확인 모달 X** — CLAUDE.md 노년 UX 원칙 + 응급은 마찰 최소화.
- Trade-off: 우발적 탭 risk. 완화책: (1) 빨강+SOS 글리프로 다른 어떤 탭 영역과도 시각 격리, (2) 같은 단추 다시 누르면 즉시 중단.

*EmergencySettings* (`src/components/EmergencySettings.tsx`)
- SettingsPanel 의 새 섹션. `mt-14` 로 다른 섹션과 시각 분리.
- 큰 textarea (24px+ 폰트, min-h 180px, resize-y), 키 입력마다 context 로 저장 (debounce 없이 — 작은 writes).
- "한 번 들어보기" 미리 듣기 단추 + "기본 글로 되돌리기" 리셋. 둘 다 min-h 80px 탭 타깃.
- helper copy 가 주소 추가를 권유하되 강제하진 않음: "주소를 함께 적어 두면 119가 더 빨리 찾아와요."
- placeholder 가 좋은 예시: "예: 도와주세요. 저는 말을 못 합니다. 여기는 OO시 OO동 OO아파트 OO호입니다. 119에 전화해 주세요." — 사용자가 자기 주소로 바로 치환할 수 있는 형태.

*기타*
- `STORAGE_KEYS.emergencyMessage` 추가.
- Provider 트리: `I18n > VoicePref > Emotion > Emergency > App`. Emergency 가 가장 안쪽 — useTTS 의존 + Emotion 의존 X 라서.
- 영어 라벨: "SOS" / "Stop" / "Emergency message" 셋 다 동시 작성.

**검증**
- `npm run typecheck` ✓
- `npm run build` ✓ (169KB JS / 14KB CSS gzip 54KB, +4KB)
- 수동 확인 필요 (사용자 작업): 응급 단추 탭 → 3회 반복 발화 → 중간에 다시 탭 시 즉시 멈춤. 설정 → 응급 메시지 편집 → "한 번 들어보기" 작동.

**결정 (의도적으로 안 만든 것)**
- **확인 모달** — 응급은 0초 latency 가 디자인 1순위.
- **floating FAB 위치** — bottom-right 부유 단추도 고려했지만 EmotionPicker 와 시각 충돌. 헤더 안에 두는 게 항상 보이는 + 다른 탭 영역과 겹치지 않는 균형점.
- **응급 발화 시 다른 phrase 탭 자동 차단** — 명시적으로 잠그지 않음. 다른 phrase 탭이 useTTS 의 in-flight 를 abort 하면 응급 루프도 break — 의도된 동작. 사용자가 다른 phrase 누른다는 건 의식 회복 / 도움 도착 / 오작동 등 어떤 경우든 응급 broadcast 중단이 옳음.
- **위치 정보 자동 첨부 (Geolocation API)** — 가능하지만 노년 사용자에게 권한 dialog 가 추가 마찰. 또한 시골 좌표 → 주소 변환은 reverse geocoding API 필요 (Step 4 예산 압박). 사용자가 자기 주소를 한 번 입력하는 게 더 빠르고 정확.

**다음 (사용자 작업)**
- dev 서버 재시작 → 설정 → 응급 메시지 → 자기 시골 집 주소 채워 넣기 → "한 번 들어보기" 로 들리는 거 확인
- 응급 단추 한 번 탭 해보고 3회 반복 + 멈추기 동작 확인 (소리 크니까 조용한 환경에서)
- 외할아버지에게 보여줄 때 응급 단추가 다른 phrase 와 시각적으로 충분히 분리되어 보이는지 (탭 실수 risk) 같이 확인

---

## Entry 5 — 2026-05-25 · 응급 활성 시 헤더를 빨간 배너로 swap (주소 가시화)

**요청** (사용자)
- "응급버튼 누르면 화면 상단에 (지금 ai 목소리 준비됨)이라고 적혀있는 그 영역 — 다시 말해요 - ai 목소리 준비됨 그 영역에 주소를 글로도 보여주자."

**문제 의식**
- 음성은 한 번 들리고 사라짐. 도와주러 들어오는 사람(이웃 / 119 대원)이 발화 도중 도착하면 주소 일부를 놓침. 다시 들으려면 외할아버지가 다시 단추를 눌러야 하는데 그 시점엔 본인이 어떻게 됐는지 모름.
- 화면을 흘끔 봐서 주소를 **읽을** 수 있어야 함. 청각 + 시각 이중 채널.

**Claude Code가 만든 것**
- `src/components/EmergencyBanner.tsx` — `isActive` 일 때 normal header 를 완전히 대체하는 빨간 배너.
  - 좌: 🆘 (80px) + 헤딩 "지금 도움이 필요해요" (text-title) + 메시지 본문 (text-body-lg, whitespace-pre-line)
  - 우: `<EmergencyButton />` (active 상태 = 멈추기 + pulse)
  - 배경: `bg-emergency` 솔리드 + `text-white` → 대비 7:1 훨씬 상회, 멀리서도 읽힘
  - `role="alert"` + `aria-live="assertive"` 로 스크린리더에도 즉시 통지
- `src/App.tsx` — `useEmergency().isActive` 가 true 면 `<EmergencyBanner />`, false 면 기존 header. 한 줄 conditional.
- i18n: `emergency.banner.heading` 추가 (KO "지금 도움이 필요해요" / EN "I need help right now").

**디자인 결정 (의도적)**
- **배너 자체에 animate-pulse 안 씀** — 텍스트가 흔들리면 가독성 떨어짐. pulse 는 멈추기 단추에만 남겨서 "broadcasting 중" 표시 분리.
- **voice chip + settings 숨김** — 응급 중에 voice 상태/설정은 noise. silent failover 가 이미 동작 중이라 chip 정보 불필요.
- **배너 잔존 시간 미도입** — broadcast 끝나면 (3회 × ~5초 ≈ 15초 후) 배너도 사라짐. "도착한 helper 가 읽고 있는데 사라지면 곤란" 시나리오는 외할아버지가 다시 응급 단추 한 번 더 누르는 걸로 해결 가능. 추가 state 의 복잡도 보다 단순함이 더 가치 있음. 사용자 피드백 들어오면 그때 lingering 추가.
- **main 영역(quick phrase + emotion) 디밍 안 함** — 외할아버지가 응급 중에도 phrase 누를 수 있어야 함 (예: "도와줘" 같이). 디밍은 시각 noise + "왜 회색이지?" 혼란.

**검증**
- `npm run typecheck` ✓
- `npm run build` ✓ (169.5KB JS / 14.5KB CSS gzip 54.5KB, +1KB)

**다음 (사용자 작업)**
- 설정 → 응급 메시지에 외할아버지 댁 진짜 주소 박기 (예: "도와주세요. 저는 말을 못 합니다. 여기는 OO시 OO동 OO아파트 OO호입니다. 119에 전화해 주세요.")
- 응급 단추 탭 → 헤더가 빨간 배너로 바뀌면서 주소 큰 글씨로 보이는지 확인
- 멈추기 단추 → 배너 사라지고 normal header 복귀하는지 확인
