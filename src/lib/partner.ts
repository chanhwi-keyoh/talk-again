import { createContext, useContext } from "react";
import type { Partner, SpeechLevel } from "@/types";

/* -----------------------------------------------------------------------------
 * Conversation partner — context, hook, seed list, and AI-prompt formatter.
 *
 * "Who is he talking to right now?" Two reasons it matters:
 *   1. Memory scope — short-term context (recentContext.ts) is filtered by the
 *      current partner so the granddaughter's thread never bleeds into the
 *      doctor's. Switching partner is the natural "new conversation" boundary.
 *   2. Speech level — the AI replies in 반말 or 존댓말 depending on who this is.
 *
 * Deliberately lightweight (호칭 + 말투 only). Anything richer (topics, notes)
 * was scoped out — see the conversation that introduced this feature.
 * ---------------------------------------------------------------------------*/

export const SPEECH_LEVEL_META: Record<
  SpeechLevel,
  { ko: string; en: string; icon: string }
> = {
  casual: { ko: "반말", en: "Casual", icon: "🫂" },
  polite: { ko: "존댓말", en: "Polite", icon: "🤝" },
};

/** Neutral face for partners added by voice (no preset icon). */
export const DEFAULT_PARTNER_ICON = "🧑";

/** Seed partners so the picker is useful on first launch with zero typing —
 *  the elder just taps a familiar 호칭, the way he taps a mood. Speech level is
 *  pre-set to the natural choice (close family → 반말, outsiders → 존댓말). IDs
 *  are stable strings so they survive a re-seed. Everything is editable: tap to
 *  pick, "+" to add by voice, 편집 to delete. */
export const DEFAULT_PARTNERS: ReadonlyArray<Partner> = [
  { id: "seed-wife", name: "아내", speechLevel: "casual", icon: "👵" },
  { id: "seed-son", name: "아들", speechLevel: "casual", icon: "👨" },
  { id: "seed-daughter", name: "딸", speechLevel: "casual", icon: "👩" },
  { id: "seed-grandchild", name: "손주", speechLevel: "casual", icon: "🧒" },
  { id: "seed-doctor", name: "의사 선생님", speechLevel: "polite", icon: "🩺" },
  { id: "seed-neighbor", name: "이웃", speechLevel: "polite", icon: "🧑‍🌾" },
];

export interface PartnerContextValue {
  partners: ReadonlyArray<Partner>;
  /** The partner the elder is talking to now (or null if the list is empty). */
  current: Partner | null;
  currentId: string | null;
  select: (id: string) => void;
  /** Add a partner and immediately select it. Returns the new id. */
  add: (name: string, speechLevel: SpeechLevel, icon?: string) => string;
  update: (id: string, patch: Partial<Omit<Partner, "id">>) => void;
  remove: (id: string) => void;
}

export const PartnerContext = createContext<PartnerContextValue | null>(null);

export function usePartner(): PartnerContextValue {
  const ctx = useContext(PartnerContext);
  if (!ctx) {
    throw new Error("usePartner must be used inside <PartnerProvider>");
  }
  return ctx;
}

/** Shape the partner into the instruction the suggestion endpoint expects.
 *  Kept here (not in api/) so client and server agree on the contract. */
export function partnerForRequest(
  partner: Partner | null,
): { name: string; speechLevel: SpeechLevel } | undefined {
  if (!partner) return undefined;
  return { name: partner.name, speechLevel: partner.speechLevel };
}
