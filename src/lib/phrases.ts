import type { Phrase, PhrasePage } from "@/types";

/* -----------------------------------------------------------------------------
 * Quick-phrase catalogue
 *
 * High-frequency utterances for the elder's daily life, per CLAUDE.md §6, now
 * grouped into themed PAGES the user swipes (or taps the arrows) between:
 *   1. 일상   — the original ten everyday answers
 *   2. 몸·생활 — body / comfort / care needs
 *   3. 마음   — warmth and small talk toward the people around him
 *
 * Each tile carries THREE redundant signals — color, icon, and label — because
 * elderly UX research forbids color-only differentiation. Within a page the ten
 * hues from the `phrase` palette are each used once, so no two tiles on screen
 * share a color.
 *
 * Translation policy: `speech.ko` is what the elder needs spoken. `speech.en`
 * exists only so an English-speaking evaluator can hear the equivalent meaning
 * when the UI is in English mode; the iPad's Korean voice will still try to
 * read it, which is fine — this is a demo affordance, not a production flow.
 * ---------------------------------------------------------------------------*/

const EVERYDAY: ReadonlyArray<Phrase> = [
  {
    id: "yes",
    icon: "👍",
    bgClass: "bg-phrase-yes",
    label: { ko: "응", en: "Yes" },
    speech: { ko: "응.", en: "Yes." },
  },
  {
    id: "no",
    icon: "🙅",
    bgClass: "bg-phrase-no",
    label: { ko: "아니", en: "No" },
    speech: { ko: "아니.", en: "No." },
  },
  {
    id: "wait",
    icon: "✋",
    bgClass: "bg-phrase-wait",
    label: { ko: "잠깐만", en: "Wait" },
    speech: { ko: "잠깐만.", en: "Wait a moment." },
  },
  {
    id: "help",
    // 🙋 ("person raising hand") — signals "I'd like some help" without
    // colliding with the dedicated SOS button. 🆘 is reserved for the actual
    // emergency button in the header so the two never look the same.
    icon: "🙋",
    bgClass: "bg-phrase-help",
    label: { ko: "도와줘", en: "Help me" },
    speech: { ko: "도와줘.", en: "Please help me." },
  },
  {
    id: "hungry",
    icon: "🍚",
    bgClass: "bg-phrase-hungry",
    label: { ko: "배고파", en: "Hungry" },
    speech: { ko: "배고파.", en: "I'm hungry." },
  },
  {
    id: "thanks",
    icon: "🙏",
    bgClass: "bg-phrase-thanks",
    label: { ko: "고마워", en: "Thanks" },
    speech: { ko: "고마워.", en: "Thank you." },
  },
  {
    id: "okay",
    icon: "👌",
    bgClass: "bg-phrase-okay",
    label: { ko: "괜찮아", en: "Okay" },
    speech: { ko: "괜찮아.", en: "I'm okay." },
  },
  {
    id: "good",
    icon: "😊",
    bgClass: "bg-phrase-good",
    label: { ko: "좋아", en: "Good" },
    speech: { ko: "좋아.", en: "Good." },
  },
  {
    id: "dislike",
    icon: "🙁",
    bgClass: "bg-phrase-dislike",
    label: { ko: "싫어", en: "Dislike" },
    speech: { ko: "싫어.", en: "I don't like it." },
  },
  {
    id: "unsure",
    icon: "🤔",
    bgClass: "bg-phrase-unsure",
    label: { ko: "모르겠어", en: "Unsure" },
    speech: { ko: "모르겠어.", en: "I don't know." },
  },
];

const BODY: ReadonlyArray<Phrase> = [
  {
    id: "pain",
    icon: "😣",
    bgClass: "bg-phrase-no",
    label: { ko: "아파", en: "Hurts" },
    speech: { ko: "아파요.", en: "It hurts." },
  },
  {
    id: "toilet",
    icon: "🚻",
    bgClass: "bg-phrase-wait",
    label: { ko: "화장실", en: "Toilet" },
    speech: { ko: "화장실 갈래요.", en: "I need the toilet." },
  },
  {
    id: "water",
    icon: "💧",
    bgClass: "bg-phrase-okay",
    label: { ko: "물", en: "Water" },
    speech: { ko: "물 주세요.", en: "Water, please." },
  },
  {
    id: "cold",
    icon: "🥶",
    bgClass: "bg-phrase-unsure",
    label: { ko: "추워", en: "Cold" },
    speech: { ko: "추워요.", en: "I'm cold." },
  },
  {
    id: "hot",
    icon: "🥵",
    bgClass: "bg-phrase-hungry",
    label: { ko: "더워", en: "Hot" },
    speech: { ko: "더워요.", en: "I'm hot." },
  },
  {
    id: "sleepy",
    icon: "🥱",
    bgClass: "bg-phrase-dislike",
    label: { ko: "졸려", en: "Sleepy" },
    speech: { ko: "졸려요.", en: "I'm sleepy." },
  },
  {
    id: "medicine",
    icon: "💊",
    bgClass: "bg-phrase-thanks",
    label: { ko: "약", en: "Medicine" },
    speech: { ko: "약 먹을 시간이에요.", en: "It's time for my medicine." },
  },
  {
    id: "hospital",
    icon: "🏥",
    bgClass: "bg-phrase-help",
    label: { ko: "병원", en: "Doctor" },
    speech: { ko: "병원 가고 싶어요.", en: "I'd like to see a doctor." },
  },
  {
    id: "rest",
    icon: "🛌",
    bgClass: "bg-phrase-good",
    label: { ko: "쉴래", en: "Rest" },
    speech: { ko: "좀 쉴래요.", en: "I'd like to rest." },
  },
  {
    id: "done",
    icon: "✅",
    bgClass: "bg-phrase-yes",
    label: { ko: "다 됐어", en: "Done" },
    speech: { ko: "다 됐어요.", en: "All done." },
  },
];

const HEART: ReadonlyArray<Phrase> = [
  {
    id: "missed",
    icon: "🥹",
    bgClass: "bg-phrase-thanks",
    label: { ko: "보고팠어", en: "Missed you" },
    speech: { ko: "보고 싶었어요.", en: "I missed you." },
  },
  {
    id: "love",
    icon: "❤️",
    bgClass: "bg-phrase-no",
    label: { ko: "사랑해", en: "Love you" },
    speech: { ko: "사랑해요.", en: "I love you." },
  },
  {
    id: "welldone",
    icon: "👏",
    bgClass: "bg-phrase-good",
    label: { ko: "잘했어", en: "Well done" },
    speech: { ko: "잘했어요.", en: "Well done." },
  },
  {
    id: "sorry",
    icon: "🙇",
    bgClass: "bg-phrase-help",
    label: { ko: "미안해", en: "Sorry" },
    speech: { ko: "미안해요.", en: "I'm sorry." },
  },
  {
    id: "comehere",
    icon: "🤲",
    bgClass: "bg-phrase-okay",
    label: { ko: "이리 와", en: "Come here" },
    speech: { ko: "이리 와요.", en: "Come here." },
  },
  {
    id: "together",
    icon: "🤝",
    bgClass: "bg-phrase-unsure",
    label: { ko: "같이 가", en: "Together" },
    speech: { ko: "같이 가요.", en: "Let's go together." },
  },
  {
    id: "lookhere",
    icon: "👀",
    bgClass: "bg-phrase-hungry",
    label: { ko: "이거 봐", en: "Look" },
    speech: { ko: "이거 봐요.", en: "Look at this." },
  },
  {
    id: "whatdoing",
    icon: "❓",
    bgClass: "bg-phrase-wait",
    label: { ko: "뭐 해?", en: "What's up?" },
    speech: { ko: "뭐 해요?", en: "What are you doing?" },
  },
  {
    id: "hardwork",
    icon: "💪",
    bgClass: "bg-phrase-yes",
    label: { ko: "고생했어", en: "Good effort" },
    speech: { ko: "고생했어요.", en: "You worked hard." },
  },
  {
    id: "goodnight",
    icon: "🌙",
    bgClass: "bg-phrase-dislike",
    label: { ko: "잘 자", en: "Good night" },
    speech: { ko: "잘 자요.", en: "Good night." },
  },
];

/** The original ten — kept as a named export for anything that wants the
 *  everyday set directly (e.g. tests). The panel consumes PHRASE_PAGES. */
export const QUICK_PHRASES = EVERYDAY;

export const PHRASE_PAGES: ReadonlyArray<PhrasePage> = [
  { id: "everyday", icon: "🗨️", label: { ko: "일상", en: "Everyday" }, phrases: EVERYDAY },
  { id: "body", icon: "🩹", label: { ko: "몸·생활", en: "Body & care" }, phrases: BODY },
  { id: "heart", icon: "💗", label: { ko: "마음", en: "Warmth" }, phrases: HEART },
];
