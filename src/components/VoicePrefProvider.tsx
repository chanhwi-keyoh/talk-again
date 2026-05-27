import { useEffect, useMemo, useState, type ReactNode } from "react";
import { VoicePrefContext } from "@/lib/voicePref";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { VoiceEngine } from "@/types";

/** Persists the chosen voice engine to localStorage and exposes it through
 *  context. Defaults to "ai" — the designed voice is what we want the elder
 *  to hear; the system fallback is only there for offline / failure modes. */
export function VoicePrefProvider({ children }: { children: ReactNode }) {
  const [engine, setEngineState] = useState<VoiceEngine>(
    () => readJSON<VoiceEngine>(STORAGE_KEYS.voiceEngine, "ai"),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEYS.voiceEngine, engine);
  }, [engine]);

  const value = useMemo(
    () => ({ engine, setEngine: setEngineState }),
    [engine],
  );

  return (
    <VoicePrefContext.Provider value={value}>
      {children}
    </VoicePrefContext.Provider>
  );
}
