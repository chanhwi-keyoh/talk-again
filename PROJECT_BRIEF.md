# Talk Again — Project Brief

> 사용자(Cowork 세션에서 정리한) 배경, 결정, 제약 모음. `CLAUDE.md`는 작업 지침, 이 파일은 컨텍스트.

## 배경

수업: SCAD AI 201 (Spring 2026), 강사 T. Lindsey.
프로젝트 3 "Persons Required" — 학생이 잘 아는 한 명의 실제 인물을 위해 도구를 직접 디자인하고 만들어 손에 쥐어주는 과제.

**사용자가 선택한 사람**: 외할아버지 (maternal grandfather).

## 인터뷰에서 나온 사실

- 수년 전 혀에 암이 늦게 발견되어 혀 절제술을 받음 (말 못함)
- 수어 모름, 타자도 어려움
- 의사소통: 단답형 제스처 + 종이에 글 써서 보여줌
- 시골 거주, 인터넷이 느릴 수 있음
- 가족 중 누구도 그의 일상 "대화"를 회복시키는 도구를 시도해본 적 없음

## 핵심 디자인 아이디어 (사용자 본인 발화 정리)

> "의학적으로는 못하니까 다른 방법으로 할아버지의 목소리를 되찾아주고 싶어. 일상적으로 쓰는 짧은 말은 버튼 한 번에. 좀 더 복잡한 대화는 AI가 주변 대화를 듣고 할아버지 성향에 맞춰 후보를 추천 → 1/2/3 버튼. 종이에 쓰는 습관도 살리고 싶어서 손글씨도 입력으로. 감정 다이얼로 톤 변화. 기억 보조도. 시골이라 오프라인도 고려."

## 결정 사항

| 결정 | 내용 | 이유 |
|---|---|---|
| 플랫폼 | iPad PWA | 큰 화면, 큰 버튼, 휴대성, 빠른 배포 |
| 디바이스 | iPad 10th gen + USB-C Apple Pencil | 클래스 마감 일정 + 비용 + 큰 화면 |
| 음성 | 한국어 elder male TTS (Web Speech API) | 수술 전 음성 샘플 부재. Voice cloning은 Production v2로. |
| AI | Claude API via Vercel Functions | 클래스 마감 일정에 로컬 LLM 불가 |
| 언어 | 한국어 UI 전체 | 사용자(할아버지) 한국어 화자 |
| 테스트 | 화상통화 + 가족 보조 | 직접 방문 불가 |

## 평가 기준 (브리프 100점 만점)

| 영역 | 점수 |
|---|---|
| Design Argument & Research | 20 |
| Shipped Product & Marketing Minute | 25 |
| User Testing & Evidence | 15 |
| Platform Rationale | 5 |
| AI Direction Log | 10 |
| Records of Resistance | 10 |
| Mermaid Diagram | 5 |
| Case Study + Post-Mortem | 10 |

## 일정

오늘 5/18 (Session 17, 9일 남음). 5/22~23 First Contact, 5/25 Marketing Minute + Case Study, 5/27 발표.

## 무엇이 평가 위협인가

1. Design Argument가 일반론으로 빠지면 20점 위험. → 인용·환경·자격을 구체적으로.
2. User Testing 증거 부재 = 15점 위험. → 화상통화 녹화, 인용, 가족 보조자 메모.
3. AI가 thesis를 쓴 흔적 = Five Questions 검사에서 적발. → 사용자가 직접 작성.
4. Records of Resistance가 얕으면 10점 위험. → "큰 프로젝트일수록 거부도 더 substantive해야 한다"(brief).
5. 라이브 URL이 incognito에서 작동 안 하면 25점 위험. → 5/26까지 incognito 체크.
