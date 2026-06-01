// Talk Again — shared types

/** Supported UI languages. The TTS engine still speaks the phrase's own language. */
export type UILang = "ko" | "en";

/** Which TTS engine the user has chosen.
 *  - "ai":     ElevenLabs Voice Design through /api/tts (warm, designed voice)
 *  - "system": Web Speech API (offline-capable fallback, robotic)            */
export type VoiceEngine = "ai" | "system";

/** Emotion state — wired up fully in Step 2 (EmotionDial). Defined here so
 *  the TTS hook can already shape prosody based on it from Step 1 onwards. */
export type Emotion =
  | "neutral"
  | "happy"
  | "calm"
  | "sad"
  | "worried"
  | "angry"
  | "tired";

/** Persona data — captured from the 10-question onboarding flow.
 *  Used as the system-prompt material for AI Suggestions (Sprint 1).
 *  Every field is optional so a partial / skipped onboarding still works. */
export interface Persona {
  name?: string;
  age?: string;
  closestFamily?: string;
  familyTerms?: string;
  favoriteFoods?: string;
  frequentPlaces?: string;
  replyLength?: "short" | "detailed";
  jokes?: "yes" | "sometimes" | "no";
  commonQuestions?: string;
  desiredImpression?: string;
  completedAt?: number;
}

/** One past exchange. Stored internally in IndexedDB to give AI Suggestions
 *  short-term memory of the conversation. NEVER surfaced as a UI viewer
 *  (privacy principle 1.4 in PLAN_v2.md). */
export interface Exchange {
  id?: number;
  timestamp: number;
  theyHeard: string;
  heSaid: string;
}

/** One quick-phrase tile. `speech` is the actual string sent to TTS in each
 *  language; `label` is the visible button text (kept short, ≤ ~4 letters/syllables). */
export interface Phrase {
  id: string;
  icon: string; // emoji or short glyph — paired with color + label per UX research
  bgClass: string; // Tailwind background class from the `phrase` palette
  label: { ko: string; en: string };
  speech: { ko: string; en: string };
}
