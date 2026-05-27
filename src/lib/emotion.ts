import { createContext, useContext } from "react";
import type { Emotion } from "@/types";

/** Current-emotion context. Picked up by `useTTS` to shape prosody, by Step 4
 *  /api/suggest as a tag for AI-generated answers, and by EmotionPicker as the
 *  source of truth for which tile is highlighted. */
export interface EmotionContextValue {
  emotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
}

export const EmotionContext = createContext<EmotionContextValue | null>(null);

export function useEmotion(): EmotionContextValue {
  const ctx = useContext(EmotionContext);
  if (!ctx) {
    throw new Error("useEmotion must be used inside <EmotionProvider>");
  }
  return ctx;
}

/** Ordered list driving the EmotionPicker layout. `neutral` is first so the
 *  "default state" tile reads first on the left edge. */
export const EMOTION_ORDER: ReadonlyArray<Emotion> = [
  "neutral",
  "happy",
  "calm",
  "sad",
  "worried",
  "angry",
  "tired",
];

/** Emoji + accent color per emotion. Color is an accent border / dot only —
 *  the tile fill always stays neutral so the selection state (dark fill) is
 *  the dominant visual signal, per the same pattern as LangChoice / VoiceChoice. */
export const EMOTION_META: Record<
  Emotion,
  { icon: string; accent: string }
> = {
  neutral: { icon: "😐", accent: "#9A9285" },
  happy: { icon: "😊", accent: "#F9A825" },
  calm: { icon: "😌", accent: "#00897B" },
  sad: { icon: "😢", accent: "#3949AB" },
  worried: { icon: "😟", accent: "#EF6C00" },
  angry: { icon: "😠", accent: "#C62828" },
  tired: { icon: "😴", accent: "#5D4037" },
};
