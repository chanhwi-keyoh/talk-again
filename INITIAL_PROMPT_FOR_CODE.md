# Claude Code에 던질 첫 메시지

> 아래 텍스트를 복사해서 Claude Code 첫 메시지로 넣으면 됨.
> 그 전에 터미널에서 `cd "/Users/key/Documents/Claude/Projects/SCAD 2/talk-again"` 하고 Code 실행할 것.

---

```
이 폴더에 새 PWA 프로젝트를 시작할 거야. 프로젝트 이름은 Talk Again.

먼저 `CLAUDE.md`와 `PROJECT_BRIEF.md`를 읽고 작업 컨텍스트를 파악해줘.
특히 아래는 절대 양보 금지 항목이야:
1. 한국어 UI 전체
2. iPad 10.9" 가로 1180×820 우선
3. 음성은 Web Speech API의 한국어 elder male 시스템 음성 (voice cloning 사용 금지)
4. 학사 규정상 docs/ 폴더 내 Design_Argument, Research_Documentation, User_Testing_Evidence, Records_of_Resistance, Five_Questions, Post_Mortem 본문은 내가 직접 써야 함. 너는 구조/문법/형식만 도와줄 수 있어.

마감은 2026-05-27. 오늘 5/18 → 9일.

오늘 작업 목표 (Step 1 셋업):

1. Vite + React 18 + TypeScript + Tailwind CSS 셋업 (`npm create vite@latest` + Tailwind 추가)
2. `vite-plugin-pwa` 설치 + manifest + iPad 홈 화면 설치 가능한 메타 태그
3. `apple-touch-icon` 등 PWA 아이콘 placeholder (디자인은 나중에)
4. 라이트 모드 기본 (오프화이트 배경 #F5F3EF, 텍스트 #1A1A1A), 한국어 폰트 Pretendard CDN. 상세 수치는 ELDERLY_UX_RESEARCH.md 9번 표 기준.
5. 기본 레이아웃: 가로 모드 iPad 기준 grid (위 1/3 = 감정/상태 표시, 중앙 2/3 = 컨트롤)
6. `QuickPhrasePanel` 컴포넌트: 하드코딩된 10개 한국어 표현, 큰 버튼, 탭하면 TTS 발화
7. `useTTS` 훅: Speech Synthesis 한국어 음성 자동 선택 + fallback 처리 + emotion 입력에 따라 rate/pitch 조절
8. iPad Safari에서 `npm run dev` → 같은 Wi-Fi의 iPad에서 IP로 접속 → PWA 설치 가능한 상태까지

작업 시작 전, CLAUDE.md 12번 폴더 구조와 14번 첫 작업 항목 다시 확인하고, 진행하면서 의문 생기면 멈추고 물어봐. 너 혼자 추정해서 진행하지 말고.

작업 끝나면 `docs/AI_Direction_Log.md` 첫 entry 작성해줘 (포맷은 CLAUDE.md 10번에 있음).
```

---

## 이후 작업 단계별 프롬프트 (Step 2~ 참고용)

### Step 2 — Emotion Dial

```
EmotionDial 컴포넌트 만들어줘.
- 방사형 picker, 6개 감정: 행복 / 평온 / 슬픔 / 걱정 / 화남 / 피곤함
- 선택된 감정을 전역 상태(zustand 또는 useContext)에 저장
- useTTS 훅이 현재 감정을 읽고 rate/pitch 조정
  - 행복: rate 1.1, pitch 1.1
  - 평온: rate 1.0, pitch 1.0
  - 슬픔: rate 0.85, pitch 0.9
  - 걱정: rate 1.0, pitch 1.05
  - 화남: rate 1.15, pitch 0.95
  - 피곤함: rate 0.8, pitch 0.85
- iPad 손가락 탭하기 좋게 각 감정 영역 최소 100×100pt
- 시각화: 감정마다 컬러 코드 + 가운데 현재 감정 라벨

기존 QuickPhrasePanel TTS 호출에 현재 감정 반영되는지 확인.
```

### Step 3 — Persona Onboarding

```
첫 실행 시 PersonaOnboarding 컴포넌트 띄우고 답변을 localStorage에 저장.

10문항 (한국어):
1. 성함이 어떻게 되세요?
2. 올해 나이는 어떻게 되세요?
3. 가족 중 가장 자주 대화하는 분은 누구인가요?
4. 평소에 어떤 호칭으로 가족을 부르세요? (예: 손주는 "우리 강아지", 아내는 "여보")
5. 좋아하시는 음식 3가지는?
6. 평소 자주 가시는 곳은? (집 안 어디, 동네 어디)
7. 답변할 때 짧게 vs 자세히 선호하시는 편인가요?
8. 농담을 좋아하세요? (네 / 가끔 / 별로)
9. 자주 듣는 질문 3가지는?
10. 어떤 분위기의 사람으로 보이고 싶으세요? (자상한 / 단단한 / 다정한 / 유머있는)

답변 어려워하시면 가족(예: 사용자)이 대신 입력할 수 있게 안내 메시지.
저장된 페르소나는 시스템 프롬프트에 주입되어 AI 답변 생성에 사용됨.
```

### Step 4 — AI Suggestions (Claude API 연동)

```
주변 대화를 듣고 후보 답변 3개를 생성하는 기능 만들어줘.

1. 화면에 "듣기 시작" 큰 버튼. 누르면 STT(webkitSpeechRecognition, ko-KR) 시작.
2. 5초간 또는 사용자가 다시 누를 때까지 듣고, 인식된 텍스트를 표시.
3. "답변 받기" 누르면:
   - /api/suggest 호출
   - body: { transcript, persona, emotion, recentContext (지난 5개 대화) }
   - Claude API (claude-sonnet-4-5)로 호출
   - 시스템 프롬프트: 페르소나 정보 + "할아버지 입장에서 짧고 자연스러운 답변 3개를 JSON 배열로"
   - 응답 3개를 SuggestionStack에 표시 (1, 2, 3 번호)
4. 1/2/3 탭하면 useTTS로 발화 + 발화한 답변은 conversationLog(IndexedDB)에 저장.

/api/suggest는 Vercel Serverless Function으로 작성. ANTHROPIC_API_KEY는 환경변수.

페르소나 미설정 상태에서도 동작은 하되, 일반적인 답변이 나오도록 fallback 시스템 프롬프트.
```

### Step 5 — Free Text Input + Emergency Button

```
1. FreeTextInput: 큰 textarea, 한국어 IME 안전, 24pt 폰트. "말하기" 버튼 누르면 발화.
2. EmergencyButton: 화면 우상단 고정. 빨간색, 큰 아이콘. 누르면 시스템 볼륨 최대로 "도와주세요! 도와주세요!" 3회 반복 발화.
```

### Step 6 — 배포

```
Vercel에 배포해줘.
- GitHub 리포지토리 생성 (private OK, 다만 README/docs는 공개해도 무방한 내용)
- ANTHROPIC_API_KEY는 Vercel 환경변수
- 빌드/배포 자동화
- 라이브 URL 받아서 README에 명시
- iPad Safari incognito에서 접속 테스트
```

### Step 7+ — Stretch (시간 되면)

- 손글씨 패드 (Canvas + 한국어 OCR/ink — Google ML Kit Digital Ink는 웹에선 어려우니 다른 옵션 검토)
- 메모리/리마인더 (대화에서 시간/사람/장소 추출 → 시간 도래 시 후보 답변에 자연스럽게 포함)
