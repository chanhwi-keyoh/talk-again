import { createContext, useContext } from "react";
import type { UILang } from "@/types";

/* -----------------------------------------------------------------------------
 * Tiny i18n layer
 *
 * Korean is the default. English exists so a non-Korean-speaking family member
 * or evaluator (e.g. SCAD instructor) can navigate the same app.
 *
 * Copy rules for Korean strings (per CLAUDE.md §4 + research findings):
 *  - No IT jargon. "탭", "메뉴", "토글" → 일상어로 ("누르기", "설정", "바꾸기")
 *  - Plain, polite, one-task-per-screen.
 *  - Sentence-final 해요체 ("말해요", "켤까요?") for warmth without being childish.
 * ---------------------------------------------------------------------------*/

export const messages = {
  ko: {
    "app.title": "다시 말해요",
    "app.tagline": "한 번 누르면 바로 말해요",
    "settings.open": "설정",
    "settings.close": "닫기",
    "settings.title": "설정",
    "settings.language": "언어",
    "settings.language.ko": "한국어",
    "settings.language.en": "English",
    "settings.language.help":
      "글자가 보이는 언어를 바꿔요. 말소리는 누른 말 그대로 나와요.",
    "settings.voice": "목소리",
    "settings.voice.help":
      "어떤 목소리로 말할지 골라요. AI 목소리는 더 따뜻하고 자연스러워요. 인터넷이 약하면 자동으로 기본 목소리로 바꿔요.",
    "settings.voice.ai": "AI 목소리",
    "settings.voice.ai.note": "따뜻하고 자연스러움 · 인터넷 필요",
    "settings.voice.system": "기본 목소리",
    "settings.voice.system.note": "기계 같지만 인터넷 없어도 됨",
    "settings.voiceList.heading": "iPad에 깔린 한국어 목소리",
    "settings.voiceList.empty":
      "지금 iPad 안에 깔린 한국어 목소리가 없어요. 아래 안내대로 받아 주세요.",
    "settings.voiceList.help":
      "남성 목소리(예: Junho)가 없으면, iPad에서 받을 수 있어요:\n설정 → 손쉬운 사용 → 음성 콘텐츠 → 음성 → 한국어 → + 를 눌러 받기.",
    "settings.voiceList.using": "지금 쓰는 목소리",
    "settings.voiceList.default": "기본",
    "panel.heading": "자주 쓰는 말",
    "panel.hint": "단추를 한 번 누르면 바로 말해요",
    "emotion.heading": "지금 기분",
    "emotion.hint": "고른 기분에 맞춰 목소리 톤이 바뀌어요",
    "emotion.neutral": "보통",
    "emotion.happy": "행복",
    "emotion.calm": "평온",
    "emotion.sad": "슬픔",
    "emotion.worried": "걱정",
    "emotion.angry": "화남",
    "emotion.tired": "피곤",
    "voice.ready": "한국어 목소리 준비됨",
    "voice.ready.ai": "AI 목소리 준비됨",
    "voice.notReady": "iPad 설정에서 한국어 목소리를 추가해 주세요",
    "voice.fallback": "AI가 안 돼서 기본 목소리로 말해요",
    "voice.speaking": "말하는 중…",
    "emergency.button": "응급",
    "emergency.stop": "멈추기",
    "emergency.aria":
      "응급 상황 도움 요청. 누르면 큰 소리로 도움 요청 문구를 멈출 때까지 계속 반복해요. 다시 누르면 멈춰요.",
    "emergency.banner.heading": "지금 도움이 필요해요",
    "tab.quick": "자주 쓰는 말",
    "tab.conversation": "대화하기",
    "portrait.hint": "가로로 돌리면 더 편해요 📱↻",
    "portrait.dismiss": "닫기",
    "persona.intro.title": "할아버지에 대해 알려 주세요",
    "persona.intro.body":
      "더 자연스러운 답변을 만들어 드리려고 몇 가지 여쭙는 거예요. 어려운 항목은 건너뛰셔도 돼요. 가족이 같이 답하셔도 좋아요.",
    "persona.intro.start": "시작하기",
    "persona.intro.skipAll": "지금 안 함",
    "persona.skip": "건너뛰기",
    "persona.next": "다음",
    "persona.back": "이전",
    "persona.finish": "다 됐어요",
    "persona.progress": "{current} / {total}",
    "persona.question.name": "성함이 어떻게 되세요?",
    "persona.question.age": "올해 나이는 어떻게 되세요?",
    "persona.question.closestFamily": "가족 중 가장 자주 대화하는 분은 누구신가요?",
    "persona.question.familyTerms":
      "평소에 어떤 호칭으로 가족을 부르세요? (예: 손주는 “우리 강아지”, 아내는 “여보”)",
    "persona.question.favoriteFoods": "좋아하시는 음식 3가지는 무엇인가요?",
    "persona.question.frequentPlaces":
      "평소 자주 가시는 곳은 어디인가요? (집 안 어디, 동네 어디)",
    "persona.question.replyLength":
      "답변할 때 짧게 vs 자세히 어느 쪽을 더 선호하세요?",
    "persona.question.jokes": "농담을 좋아하세요?",
    "persona.question.commonQuestions":
      "자주 듣는 질문 3가지는 무엇인가요?",
    "persona.question.desiredImpression":
      "어떤 분위기의 사람으로 보이고 싶으세요? (예: 자상한 / 단단한 / 다정한 / 유머있는)",
    "settings.persona": "할아버지 정보",
    "settings.persona.help":
      "AI 답변이 더 자연스러워지도록 알려 주신 정보예요. 다시 입력하거나 지울 수 있어요.",
    "settings.persona.reenter": "다시 입력",
    "settings.persona.clear": "지우기",
    "settings.persona.clearConfirm":
      "정말 지울까요? 다음에 다시 입력하실 수 있어요.",
    "conversation.title": "대화하기",
    "conversation.hint":
      "상대가 한 말을 들으면 어울리는 답변 세 가지를 만들어 드려요.",
    "conversation.listen": "듣기 시작",
    "conversation.stopListening": "그만 듣기",
    "conversation.requesting": "답변 만드는 중…",
    "conversation.ask": "답변 받기",
    "conversation.askAgain": "다시 답변 받기",
    "conversation.startOver": "처음부터",
    "conversation.heardLabel": "상대가 한 말",
    "conversation.heardHint": "잘못 들었으면 직접 고쳐도 돼요",
    "conversation.heardPlaceholder":
      "‘듣기 시작’을 누르고 상대가 말씀하시는 걸 들어요.",
    "conversation.questionToggle.add": "❓ 물음표 붙이기",
    "conversation.questionToggle.remove": "❓ 물음표 떼기",
    "conversation.suggestionsLabel": "할아버지가 하실 말",
    "conversation.suggestionsEmpty":
      "여기에 답변 후보 세 가지가 보일 거예요. ‘답변 받기’를 눌러 주세요.",
    "conversation.sttUnsupported":
      "이 브라우저에서는 듣기가 안 돼요. 다른 브라우저를 써 주세요.",
    "conversation.aiUnavailable":
      "AI 답변이 지금은 안 돼요. 잠시 뒤 다시 시도해 주세요.",
    "conversation.noPersona":
      "아직 할아버지 정보가 없어요. 설정에서 한번 입력해 주시면 답변이 더 자연스러워져요.",
    "settings.emergency.heading": "응급 메시지",
    "settings.emergency.help":
      "위쪽 빨간 '응급' 단추를 누르면 이 글을 큰 소리로 멈출 때까지 계속 말해요. 다시 누르면 멈춰요. 주소를 함께 적어 두면 119가 더 빨리 찾아와요.",
    "settings.emergency.label": "응급 상황에서 말할 내용",
    "settings.emergency.preview": "한 번 들어보기",
    "settings.emergency.reset": "기본 글로 되돌리기",
    "settings.emergency.placeholder":
      "예: 도와주세요. 저는 말을 못 합니다. 여기는 OO시 OO동 OO아파트 OO호입니다. 119에 전화해 주세요.",
  },
  en: {
    "app.title": "Talk Again",
    "app.tagline": "One press, one sentence — spoken out loud.",
    "settings.open": "Settings",
    "settings.close": "Close",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.language.ko": "한국어",
    "settings.language.en": "English",
    "settings.language.help":
      "Changes the text you see. The spoken voice follows the phrase itself.",
    "settings.voice": "Voice",
    "settings.voice.help":
      "Pick which voice speaks. The AI voice is warmer and more natural. If the internet is weak, it quietly switches to the standard voice.",
    "settings.voice.ai": "AI voice",
    "settings.voice.ai.note": "Warm and natural · needs internet",
    "settings.voice.system": "Standard voice",
    "settings.voice.system.note": "Robotic but works offline",
    "settings.voiceList.heading": "Korean voices installed on this device",
    "settings.voiceList.empty":
      "No Korean voices are installed on this device. Follow the steps below to add one.",
    "settings.voiceList.help":
      "If there is no male voice (e.g. Junho), you can download one on iPad:\nSettings → Accessibility → Spoken Content → Voices → Korean → tap +.",
    "settings.voiceList.using": "Currently using",
    "settings.voiceList.default": "default",
    "panel.heading": "Everyday phrases",
    "panel.hint": "Press once — it is spoken aloud right away.",
    "emotion.heading": "Current mood",
    "emotion.hint": "Tone of voice shifts with the mood you pick",
    "emotion.neutral": "Neutral",
    "emotion.happy": "Happy",
    "emotion.calm": "Calm",
    "emotion.sad": "Sad",
    "emotion.worried": "Worried",
    "emotion.angry": "Angry",
    "emotion.tired": "Tired",
    "voice.ready": "Korean voice ready",
    "voice.ready.ai": "AI voice ready",
    "voice.notReady": "Please add a Korean voice in your iPad settings.",
    "voice.fallback": "AI voice unavailable — using standard voice",
    "voice.speaking": "Speaking…",
    "emergency.button": "SOS",
    "emergency.stop": "Stop",
    "emergency.aria":
      "Emergency. Tap to broadcast the help message loudly on repeat until stopped. Tap again to stop.",
    "emergency.banner.heading": "I need help right now",
    "tab.quick": "Quick phrases",
    "tab.conversation": "Conversation",
    "portrait.hint": "Rotate sideways for the full experience 📱↻",
    "portrait.dismiss": "Dismiss",
    "persona.intro.title": "Tell us about Grandfather",
    "persona.intro.body":
      "A few quick questions so the AI suggestions sound like him. Skip any you'd rather not answer. Family can fill these in together.",
    "persona.intro.start": "Start",
    "persona.intro.skipAll": "Not now",
    "persona.skip": "Skip",
    "persona.next": "Next",
    "persona.back": "Back",
    "persona.finish": "Done",
    "persona.progress": "{current} / {total}",
    "persona.question.name": "What is his name?",
    "persona.question.age": "How old is he this year?",
    "persona.question.closestFamily":
      "Whom in the family does he talk to most often?",
    "persona.question.familyTerms":
      "What does he call family members? (e.g., grandkids — “my little one”; wife — “dear”)",
    "persona.question.favoriteFoods": "What are three foods he loves?",
    "persona.question.frequentPlaces":
      "Where does he most often spend his time? (parts of the house, places in the neighborhood)",
    "persona.question.replyLength":
      "Does he prefer short replies or longer ones?",
    "persona.question.jokes": "Does he like jokes?",
    "persona.question.commonQuestions":
      "What three questions does he hear most often?",
    "persona.question.desiredImpression":
      "How does he like to come across? (gentle / firm / warm / playful)",
    "settings.persona": "Grandfather profile",
    "settings.persona.help":
      "What you've told the AI so the suggestions sound like him. You can re-enter or clear this.",
    "settings.persona.reenter": "Re-enter",
    "settings.persona.clear": "Clear",
    "settings.persona.clearConfirm":
      "Clear it? You can enter it again later.",
    "conversation.title": "Conversation",
    "conversation.hint":
      "Listen to what the other person said, then we'll suggest three replies he might want to say.",
    "conversation.listen": "Start listening",
    "conversation.stopListening": "Stop listening",
    "conversation.requesting": "Thinking…",
    "conversation.ask": "Get replies",
    "conversation.askAgain": "Try again",
    "conversation.startOver": "Start over",
    "conversation.heardLabel": "What the other person said",
    "conversation.heardHint": "You can fix it if it was misheard",
    "conversation.heardPlaceholder":
      "Press “Start listening” and we'll capture what the other person is saying.",
    "conversation.questionToggle.add": "❓ Mark as a question",
    "conversation.questionToggle.remove": "❓ Not a question",
    "conversation.suggestionsLabel": "What he could say",
    "conversation.suggestionsEmpty":
      "Three reply options will appear here. Tap “Get replies” to start.",
    "conversation.sttUnsupported":
      "This browser can't listen. Please use a different one.",
    "conversation.aiUnavailable":
      "AI suggestions aren't available right now. Please try again in a moment.",
    "conversation.noPersona":
      "We don't have his profile yet. Add it in Settings so suggestions sound more like him.",
    "settings.emergency.heading": "Emergency message",
    "settings.emergency.help":
      "The red SOS button at the top will say this aloud on repeat until you tap Stop. Include your address so 119 can find you faster.",
    "settings.emergency.label": "What to say in an emergency",
    "settings.emergency.preview": "Listen once",
    "settings.emergency.reset": "Restore default text",
    "settings.emergency.placeholder":
      "e.g. Please help. I cannot speak. I am at 123 Main Street, Apartment 4B. Please call 119.",
  },
} as const satisfies Record<UILang, Record<string, string>>;

export type MessageKey = keyof (typeof messages)["ko"];

export interface I18nContextValue {
  lang: UILang;
  setLang: (lang: UILang) => void;
  t: (key: MessageKey) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
