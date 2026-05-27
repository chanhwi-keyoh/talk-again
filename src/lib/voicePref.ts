import { createContext, useContext } from "react";
import type { VoiceEngine } from "@/types";

/** Voice-engine preference context. Mirrors the i18n context shape so the app
 *  has one pattern for "global user preference, persisted to localStorage". */
export interface VoicePrefContextValue {
  engine: VoiceEngine;
  setEngine: (engine: VoiceEngine) => void;
}

export const VoicePrefContext = createContext<VoicePrefContextValue | null>(
  null,
);

export function useVoicePref(): VoicePrefContextValue {
  const ctx = useContext(VoicePrefContext);
  if (!ctx) {
    throw new Error("useVoicePref must be used inside <VoicePrefProvider>");
  }
  return ctx;
}
