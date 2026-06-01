import { createContext, useContext } from "react";
import type { Persona } from "@/types";

/* -----------------------------------------------------------------------------
 * Persona — onboarding questions, context, and AI-prompt formatter.
 *
 * The 10 questions are CLAUDE.md §6.5 verbatim. They are the persona material
 * the AI Suggestions endpoint (api/suggest.ts) uses to make replies sound like
 * grandfather — not like a generic Korean elder.
 *
 * Privacy principle 1.4: persona is read by the server, but the conversation
 * log it generates is never surfaced back to the family. Persona is editable;
 * the conversation log it informs is not viewable.
 * ---------------------------------------------------------------------------*/

export type PersonaFieldKey =
  | "name"
  | "age"
  | "closestFamily"
  | "familyTerms"
  | "favoriteFoods"
  | "frequentPlaces"
  | "replyLength"
  | "jokes"
  | "commonQuestions"
  | "desiredImpression";

/** Each question knows its question prompt (per language), its input kind,
 *  and — for choice questions — the choices it offers. */
export interface PersonaQuestion {
  key: PersonaFieldKey;
  kind: "text" | "choice";
  /** For choice questions only. */
  choices?: ReadonlyArray<{ value: string; ko: string; en: string }>;
}

export const PERSONA_QUESTIONS: ReadonlyArray<PersonaQuestion> = [
  { key: "name", kind: "text" },
  { key: "age", kind: "text" },
  { key: "closestFamily", kind: "text" },
  { key: "familyTerms", kind: "text" },
  { key: "favoriteFoods", kind: "text" },
  { key: "frequentPlaces", kind: "text" },
  {
    key: "replyLength",
    kind: "choice",
    choices: [
      { value: "short", ko: "짧게", en: "Short" },
      { value: "detailed", ko: "자세히", en: "Detailed" },
    ],
  },
  {
    key: "jokes",
    kind: "choice",
    choices: [
      { value: "yes", ko: "네", en: "Yes" },
      { value: "sometimes", ko: "가끔", en: "Sometimes" },
      { value: "no", ko: "별로", en: "Not really" },
    ],
  },
  { key: "commonQuestions", kind: "text" },
  { key: "desiredImpression", kind: "text" },
];

export interface PersonaContextValue {
  persona: Persona;
  /** True once at least one field has been answered (used to gate onboarding). */
  hasBeenSet: boolean;
  setField: <K extends PersonaFieldKey>(key: K, value: Persona[K]) => void;
  /** Mark onboarding complete (writes `completedAt` timestamp). */
  complete: () => void;
  /** Wipe persona so onboarding appears again. */
  reset: () => void;
}

export const PersonaContext = createContext<PersonaContextValue | null>(null);

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used inside <PersonaProvider>");
  }
  return ctx;
}
