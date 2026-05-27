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
      "응급 상황 도움 요청. 누르면 큰 소리로 도움 요청 문구를 3번 반복해요. 다시 누르면 멈춰요.",
    "emergency.banner.heading": "지금 도움이 필요해요",
    "settings.emergency.heading": "응급 메시지",
    "settings.emergency.help":
      "위쪽 빨간 '응급' 단추를 누르면 이 글을 큰 소리로 3번 말해요. 주소를 함께 적어 두면 119가 더 빨리 찾아와요.",
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
      "Emergency. Tap to broadcast the help message loudly three times. Tap again to stop.",
    "emergency.banner.heading": "I need help right now",
    "settings.emergency.heading": "Emergency message",
    "settings.emergency.help":
      "The red SOS button at the top will say this aloud, three times in a row. Include your address so 119 can find you faster.",
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
