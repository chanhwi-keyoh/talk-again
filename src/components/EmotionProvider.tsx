import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EmotionContext } from "@/lib/emotion";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { Emotion } from "@/types";

const VALID: ReadonlyArray<Emotion> = [
  "neutral",
  "happy",
  "calm",
  "sad",
  "worried",
  "angry",
  "tired",
];

/** Persists the selected emotion across sessions. Defaults to "neutral" so a
 *  first-time user (or someone returning after a crash) doesn't accidentally
 *  speak in a sad / angry tone they never picked. */
export function EmotionProvider({ children }: { children: ReactNode }) {
  const [emotion, setEmotionState] = useState<Emotion>(() => {
    const stored = readJSON<Emotion>(STORAGE_KEYS.emotion, "neutral");
    return VALID.includes(stored) ? stored : "neutral";
  });

  useEffect(() => {
    writeJSON(STORAGE_KEYS.emotion, emotion);
  }, [emotion]);

  const value = useMemo(
    () => ({ emotion, setEmotion: setEmotionState }),
    [emotion],
  );

  return (
    <EmotionContext.Provider value={value}>
      {children}
    </EmotionContext.Provider>
  );
}
