# Talk Again — Claude Code 작업 지침

> 외할아버지(혀 절제술 후 발화 불가)를 위한 의사소통 보조 PWA.
> SCAD AI 201 Project 3 — "Persons Required" 제출작. 마감 2026-05-27.

---

## 1. The Person — 모든 디자인 결정의 기준

- 외할아버지(maternal grandfather), 한국 시골 거주
- 수년 전 혀 절제술(tongue removal) 후 발화 불가
- 수어 모름, 타자 미숙
- 현재 의사소통: 단답형 제스처(끄덕임/도리도리) + 종이에 글 써서 보여주기
- 할머니와 동거. 인터넷 환경이 느릴 수 있음.

## 2. "Helped" — 성공 기준

1. 일상적인 짧은 표현을 **1탭**으로 즉시 발화
2. 단답형을 넘어선 맥락 있는 답변을 빠르게 선택 (입력 부담 없이)
3. 본인의 감정 톤을 목소리에 반영할 수 있음 → 정체성 회복감
4. 종이에 쓰는 기존 습관을 버리지 않아도 되도록 손글씨 입력 보존
5. 시골 환경에서도 작동 (단기적으로는 LTE/Wi-Fi 의존 OK)

## 3. 기술 스택

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **PWA**: `vite-plugin-pwa` (Service Worker, offline cache, iPad 홈 화면 설치)
- **TTS**: Web Speech API `SpeechSynthesis` — 한국어 elder male 시스템 음성. `lang: "ko-KR"`. 한국어 음성 미지원 환경에 대비해 fallback 처리 필수.
- **STT**: Web Speech API `SpeechRecognition` (Webkit prefix 필요). `lang: "ko-KR"`. 사용자 활성화 후 시작.
- **AI 답변 생성**: Claude API (Anthropic) — 모델 `claude-sonnet-4-5`. **반드시** Vercel Serverless Function 경유. 클라이언트에 키 노출 금지.
- **저장**: localStorage(페르소나, 세팅), IndexedDB(대화 로그). 마이그레이션 안전하게.
- **손글씨**: Stretch goal. Canvas + Google ML Kit Digital Ink Recognition(ko) 또는 단순 Canvas + 수동 인식.
- **배포**: Vercel. 라이브 URL 필수.
- **저장소**: GitHub. 깔끔한 커밋 히스토리 요구사항(brief 명시).

## 4. UI 원칙 — 절대 양보 금지

- 한국어 UI 전체. 영어 카피 X (코드 식별자만 영어).
- **상세 수치 스펙은 `ELDERLY_UX_RESEARCH.md` 9번 표를 구현 기준으로 사용할 것.**
- 본문 24px 이상, 버튼 라벨 36~44px, Quick Phrase 버튼 120×120px 이상.
- 텍스트 대비 7:1 이상. 색만으로 정보 구분 금지 (색+아이콘+라벨).
- 배경: 라이트 모드 기본 (오프화이트 #F5F3EF, 텍스트 #1A1A1A). 다크 모드는 옵션.
- 자주 쓰는 표현은 **1탭 즉시 발화**. 확인 모달 X.
- iPad 가로 1180×820 우선. 모바일 fallback 허용.
- 핵심 액션은 화면 상단~중앙. 탭 영역 간격 24~32px (떨림·정확도 고려).
- 숨은 제스처 금지(스와이프/롱프레스만으로 되는 기능 X). 타임아웃·자동 사라짐 금지.

## 5. 음성 합성 결정 — 중요한 디자인 결정

수술 전 깨끗한 음성 샘플이 **존재하지 않음**. 수술 후 도레미 노래 샘플만 있음. 그러므로:

- ❌ **음성 클로닝(voice cloning) 사용 금지** — 할아버지 본인 목소리를 복원하려는 시도. 도레미는 발화 음성학과 다르고, 후 수술 음성은 본인의 정체성이 아님. Late-diagnosis 환자에게 voice identity 복원은 엔지니어링 문제가 아니라 연구 문제.
- ❌ **iPad 기본 한국어 TTS(Yuna 등) 단독 사용도 거부** — 1995년대 합성음 톤이 노년 사용자에게 차갑게 들림 ("무서움"). 실사용 차단 요인.
- ✅ **음성 디자인(voice design)** — 외할아버지 페르소나(따뜻한 70대 한국 남성)에 어울리는 새 합성 voice를 ElevenLabs Voice Design 으로 텍스트 설명만으로 **생성**. 본인 목소리 복원이 아닌, "다시 말해요" 라는 도구의 voice identity 를 새로 디자인하는 것. 윤리적으로 cloning 과 구분됨.
- ✅ **Web Speech 폴백 유지** — 오프라인이거나 ElevenLabs 응답 실패 시 기본 한국어 시스템 음성으로 자동 전환. 설정에서 사용자가 항상 기본 음성으로 강제할 수도 있음.
- ✅ Emotion Dial 이 ElevenLabs `voice_settings`(stability, style) 와 Web Speech `rate/pitch` 를 동시에 변조해 같은 voice id 로도 톤 차이 표현.
- 이 결정 진화는 Records of Resistance #1 ("거부했다: voice cloning") + #2 ("거부했다: 기본 합성음의 차가움. 채택했다: voice design") 로 문서화 (사용자 작성).

## 6. MVP — 5/22까지 반드시 작동

1. **Quick Phrase Panel**: 큰 버튼 그리드. 탭 → TTS 즉시 발화. 예: `응`, `아니`, `잠깐만`, `도와줘`, `배고파`, `감사해`, `괜찮아`, `좋아`, `싫어`, `모르겠어`.
2. **Emotion Dial**: 방사형 picker. 선택 감정이 TTS prosody 변조 + 이후 AI 답변에 감정 tag 전달.
3. **AI Suggestions**: 사용자 활성화 시 STT가 주변 대화를 일정 구간 듣고, Claude API가 페르소나 + 감정 + 최근 맥락 기반으로 후보 답변 3개 생성. 1/2/3 버튼 탭 → 발화.
4. **Free Text Input**: 큰 textarea + "말하기" 버튼. 모든 fallback의 fallback.
5. **Persona Onboarding**: 첫 실행 시 10문항 Q&A. 말투, 관심사, 자주 마주치는 상황, 답변 톤 수집 → localStorage 저장 → AI 답변 생성 시 시스템 프롬프트로 전달.
6. **Emergency Button**: 항상 보이는 큰 버튼. 큰 볼륨으로 도움 요청 문구 발화.

## 7. Stretch — 시간 되면 (5/23~24)

- 손글씨 패드 (Apple Pencil): Canvas + 한국어 OCR/ink → 인식된 텍스트 발화.
- 메모리: AI가 대화에서 약속/일정 추출 → 시간 도래 시 답변 추천에 리마인더 자연스럽게 포함 (예: "곧 3시반이니까 산책 갈 준비하자").

## 8. Defer — Production v2 (문서화만, 빌드 X)

- 완전 오프라인 + 로컬 LLM
- 본인 목소리 복원 (가족 voice donation, AI interpolation)
- 네이티브 iOS 앱

## 9. 학사 규정 — 매우 중요

이 수업(SCAD AI 201)의 학사 규정상 다음 문서는 **사용자가 직접 자신의 언어로 작성**해야 함. Claude Code는 문법/형식만 도울 수 있고 본문을 대신 쓸 수 없음:

- `docs/Design_Argument.md` (the thesis — 가장 중요)
- `docs/Research_Documentation.md`
- `docs/User_Testing_Evidence.md`
- `docs/Records_of_Resistance.md`
- `docs/Five_Questions.md`
- `docs/Post_Mortem.md`

코드, 설정, README의 기술 섹션, 아키텍처 설명은 Code가 자유롭게 작성 가능.

## 10. 작업 로그 — Code 책임

의미 있는 결정마다 `docs/AI_Direction_Log.md`에 짧은 항목 추가:

```
### Entry [N] — [날짜] [짧은 제목]
**요청**: 사용자가 무엇을 요청했는가
**Claude Code가 만든 것**: 어떤 결과를 냈는가
**결정**: 채택/수정/거부
**이유**: 왜
```

## 11. 환경 변수 (.env.local 예시)

```
ANTHROPIC_API_KEY=sk-ant-...   # 절대 클라이언트 노출 금지
```

## 12. 폴더 구조 (제안)

```
talk-again/
├── CLAUDE.md                    ← 이 파일
├── PROJECT_BRIEF.md             ← 상세 배경
├── README.md                    ← 제출용
├── architecture.mmd             ← Mermaid 다이어그램
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── manifest.webmanifest
│   ├── icon-192.png, icon-512.png
│   └── apple-touch-icon.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── QuickPhrasePanel.tsx
│   │   ├── EmotionDial.tsx
│   │   ├── SuggestionStack.tsx
│   │   ├── EmergencyButton.tsx
│   │   ├── FreeTextInput.tsx
│   │   ├── HandwritingPad.tsx        (stretch)
│   │   └── PersonaOnboarding.tsx
│   ├── hooks/
│   │   ├── useTTS.ts
│   │   ├── useSTT.ts
│   │   └── usePersona.ts
│   ├── lib/
│   │   ├── prompts.ts                (Claude 시스템 프롬프트 모음)
│   │   ├── storage.ts                (localStorage/IndexedDB 래퍼)
│   │   └── voices.ts                 (Korean voice 선택 로직)
│   ├── styles/
│   │   └── globals.css
│   └── types.ts
├── api/
│   └── suggest.ts                    (Vercel Serverless — Claude API 호출)
└── docs/
    ├── Design_Argument.md            (사용자 작성)
    ├── Research_Documentation.md     (사용자 작성)
    ├── User_Testing_Evidence.md      (사용자 작성)
    ├── Records_of_Resistance.md      (사용자 작성)
    ├── Five_Questions.md             (사용자 작성)
    ├── Post_Mortem.md                (사용자 작성)
    ├── AI_Direction_Log.md           (Code가 채움)
    └── Platform_Rationale.md         (Code + 사용자)
```

## 13. iPad Safari 주의사항

- PWA: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` 메타 태그 필요.
- Speech Synthesis: 페이지 첫 사용자 인터랙션 후에만 작동. 음성 목록은 `voiceschanged` 이벤트에서 비동기 로드.
- Speech Recognition: `webkitSpeechRecognition`. HTTPS 필수.
- 시스템 한국어 음성이 있는지 런타임 체크. 없으면 사용자에게 iPad 설정 안내.
- Service Worker 등록은 `vite-plugin-pwa`의 `registerType: 'autoUpdate'` 사용.

## 14. 첫 작업 (사용자가 던질 첫 프롬프트는 INITIAL_PROMPT_FOR_CODE.md 참고)

1. Vite + React + TS + Tailwind 셋업
2. `vite-plugin-pwa` 설치 및 manifest 작성
3. 기본 라우팅(단일 페이지여도 OK) + 라이트 모드 기본 (오프화이트 배경)
4. `QuickPhrasePanel` 컴포넌트 (하드코딩 10개 표현, 탭하면 TTS)
5. `useTTS` 훅 (Korean voice 선택 + emotion에 따른 prosody 조절)
6. iPad Safari에서 PWA 설치 가능한 상태까지

이후 단계는 사용자가 단계별로 지시함.
