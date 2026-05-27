import type { Phrase } from "@/types";

/* -----------------------------------------------------------------------------
 * Quick-phrase catalogue
 *
 * Ten high-frequency utterances for the elder's daily life, per CLAUDE.md §6.
 * Each tile carries THREE redundant signals — color, icon, and label — because
 * elderly UX research forbids color-only differentiation.
 *
 * Translation policy: `speech.ko` is what the elder needs spoken. `speech.en`
 * exists only so an English-speaking evaluator can hear the equivalent meaning
 * when the UI is in English mode; the iPad's Korean voice will still try to
 * read it, which is fine — this is a demo affordance, not a production flow.
 * ---------------------------------------------------------------------------*/

export const QUICK_PHRASES: ReadonlyArray<Phrase> = [
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
