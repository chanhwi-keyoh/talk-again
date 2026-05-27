# Talk Again

> 외할아버지(혀 절제술 후 발화 불가)를 위한 의사소통 보조 PWA.
> SCAD AI 201 Project 3 — "Persons Required" 제출작.

자세한 배경·결정·제약은 [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md), 작업 지침은 [`CLAUDE.md`](./CLAUDE.md) 참고.

---

## Step 1 + 1.5 에서 들어있는 것

**Step 1 — 셸 + 기본 UX**
- Vite + React 18 + TypeScript + Tailwind CSS 셋업
- `vite-plugin-pwa` (iPad Safari에서 홈 화면 설치 가능)
- Pretendard 한국어 폰트, 본문 24px·버튼 라벨 36–44px·행간 1.5+ 의 노년층 친화 타이포 스케일
- `QuickPhrasePanel` — 5×2 그리드, 10개 한국어 1탭 발화 (색 + 아이콘 + 라벨 3중 신호)
- 한국어/영어 UI 전환 (설정 화면)
- 음성 준비 상태 칩 (한국어 음성 없는 기기에 안내 메시지)

**Step 1.5 — 따뜻한 합성 목소리**
- **ElevenLabs Voice Design** 기반 한국어 남성 voice. 기본 시스템 음성(Yuna 등)이 너무 차갑다는 사용자 피드백 반영. cloning 아니고 design — 페르소나 설명만으로 새 voice 생성.
- `api/tts.ts` — Vercel Edge 서버리스 함수. ElevenLabs 키 서버에만, 브라우저 번들 진입 차단 (`VITE_` 접두사 일부러 안 씀).
- IndexedDB Blob 캐시 — 같은 phrase 두 번째 탭부터는 네트워크 0, 무료 크레딧 소모 0.
- `useTTS` silent failover — AI 응답 실패 시 자동으로 Web Speech 폴백, 헤더 칩이 상황만 알림.
- 설정 화면 "목소리" 섹션 — AI 목소리 / 기본 목소리 큰 토글 2개.
- `npm run dev` 만으로 `/api/tts` 동작 (Vercel CLI 불필요 — Vite middleware 가 같은 Edge 핸들러를 mount).

## 개발

```bash
npm install

# .env.local 만들고 ElevenLabs 키 넣기 (.env.example 참조)
cp .env.example .env.local
# → ELEVENLABS_API_KEY=sk_... / ELEVENLABS_VOICE_ID=... 채우기

npm run dev          # http://localhost:5173  + LAN IP (--host)
npm run build        # 타입체크 + 빌드
npm run preview      # 빌드 결과물 로컬 프리뷰
```

> `.env.local` 없이도 앱은 동작함 — AI 목소리 호출이 503을 받으면 즉시 Web Speech 폴백.

같은 Wi‑Fi의 iPad Safari에서 `http://<맥의-LAN-IP>:5173` 으로 접속 → 공유 메뉴에서 "홈 화면에 추가" 하면 PWA 로 깔린다.

> ⚠️ iPad Safari의 `SpeechSynthesis` 는 페이지에 처음 사용자 입력(탭)이 들어온 뒤에만 소리가 난다. 화면에 들어가서 아무 단추나 한 번 눌러보면 그 다음부터 정상 동작.

## 폴더 구조 (Step 1.5 시점)

```
talk-again/
├── index.html
├── vercel.json                       Vercel 빌드/런타임 설정
├── public/                           PWA 아이콘 placeholder
├── api/
│   └── tts.ts                        Edge 서버리스 — ElevenLabs 프록시
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── components/
│   │   ├── I18nProvider.tsx
│   │   ├── VoicePrefProvider.tsx
│   │   ├── QuickPhrasePanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── VoiceStatusChip.tsx
│   ├── hooks/
│   │   └── useTTS.ts                 엔진 무관 + silent failover
│   ├── lib/
│   │   ├── i18n.ts
│   │   ├── voicePref.ts
│   │   ├── phrases.ts
│   │   ├── storage.ts
│   │   ├── voices.ts                 시스템 한국어 voice 선택
│   │   └── tts/
│   │       ├── types.ts              TTSProvider 인터페이스
│   │       ├── cache.ts              IndexedDB Blob 캐시
│   │       ├── webSpeech.ts          폴백 provider
│   │       ├── elevenLabs.ts         AI provider
│   │       └── index.ts
│   └── styles/
│       └── globals.css
├── docs/                             학사 규정상 사용자 본인이 작성하는 문서들
├── CLAUDE.md                         작업 지침 (모든 디자인 결정의 기준)
├── PROJECT_BRIEF.md                  프로젝트 컨텍스트
└── architecture.mmd                  시스템 다이어그램
```

## 다음 단계 (요약)

- **Step 2** EmotionDial — 6감정 picker, TTS prosody 즉시 변조
- **Step 3** PersonaOnboarding — 10문항 → localStorage → 시스템 프롬프트
- **Step 4** AI Suggestions — STT + Vercel Serverless + Claude `claude-sonnet-4-5`
- **Step 5** FreeTextInput + EmergencyButton
- **Step 6** Vercel 배포 + 라이브 URL
