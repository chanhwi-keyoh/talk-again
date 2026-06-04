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

/** How the elder speaks toward a given conversation partner.
 *  - "casual": 반말 (informal, intimate — e.g. toward grandchildren)
 *  - "polite": 존댓말 (polite — e.g. toward a doctor, a neighbour)            */
export type SpeechLevel = "casual" | "polite";

/** One conversation partner. Lightweight by design (CLAUDE.md scope decision):
 *  just a 호칭 and a speech level. Knowing WHO the elder is talking to does two
 *  things — it scopes the short-term memory so one person's conversation never
 *  bleeds into another's (see recentContext.ts), and it tells the AI whether to
 *  reply in 반말 or 존댓말. Stored in localStorage; never sent anywhere but the
 *  suggestion request. */
export interface Partner {
  id: string;
  /** 호칭 — what this person is to him (e.g. "손녀", "할머니", "의사 선생님"). */
  name: string;
  speechLevel: SpeechLevel;
}

/** One past exchange. Stored internally in IndexedDB to give AI Suggestions
 *  short-term memory of the conversation. NEVER surfaced as a UI viewer
 *  (privacy principle 1.4 in PLAN_v2.md).
 *
 *  `partnerId` scopes the memory: a reply suggestion only ever sees exchanges
 *  tagged with the partner currently selected, so the doctor never inherits the
 *  thread he was just having with his granddaughter. Optional because entries
 *  written before the partner feature existed carry no tag (they're ignored). */
export interface Exchange {
  id?: number;
  timestamp: number;
  theyHeard: string;
  heSaid: string;
  partnerId?: string;
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

/** A page of quick-phrase tiles. The panel shows one page at a time and the
 *  user moves between them with visible arrows / dots (and swipe as a bonus).
 *  Grouping by theme keeps each page to ≤ 10 tiles so the 5×2 grid never gets
 *  crowded, and gives related utterances a predictable home. */
export interface PhrasePage {
  id: string;
  icon: string;
  label: { ko: string; en: string };
  phrases: ReadonlyArray<Phrase>;
}
