import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_EMERGENCY_MESSAGE_KO,
  EmergencyContext,
  EMERGENCY_PAUSE_MS,
} from "@/lib/emergency";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import { useTTS } from "@/hooks/useTTS";

/* -----------------------------------------------------------------------------
 * EmergencyProvider
 *
 * Owns the emergency message text + an abortable "speak 3x" loop. Sits inside
 * <VoicePrefProvider> so the loop can call useTTS — which means an emergency
 * automatically benefits from silent failover (cloud AI first, system voice
 * if AI is down). Offline 119-shout still works.
 *
 * The loop uses an AbortController so a second tap on the SOS button (or any
 * other action that cancels TTS) breaks the loop cleanly between iterations.
 * Speech is always Korean and always at volume 1.0 — this is for actual
 * emergencies, never for demos, never i18n-dependent.
 * ---------------------------------------------------------------------------*/
export function EmergencyProvider({ children }: { children: ReactNode }) {
  const { speak, cancel } = useTTS();

  const [message, setMessageState] = useState<string>(() => {
    const stored = readJSON<string>(
      STORAGE_KEYS.emergencyMessage,
      DEFAULT_EMERGENCY_MESSAGE_KO,
    );
    // Guard against accidental empties in localStorage — empty emergency = bug.
    return stored.trim() ? stored : DEFAULT_EMERGENCY_MESSAGE_KO;
  });

  const [isActive, setIsActive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.emergencyMessage, message);
  }, [message]);

  const setMessage = useCallback((next: string) => {
    setMessageState(next);
  }, []);

  const resetMessage = useCallback(() => {
    setMessageState(DEFAULT_EMERGENCY_MESSAGE_KO);
  }, []);

  const trigger = useCallback(async () => {
    if (isActive) return; // user already broadcasting — don't restack
    const text = message.trim() || DEFAULT_EMERGENCY_MESSAGE_KO;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsActive(true);

    try {
      // Loop until the user explicitly stops. An emergency should keep
      // broadcasting until help arrives — auto-quieting after N attempts
      // creates the failure mode "elder fell at minute 16, app stopped at
      // minute 1, no one heard". Cost is one-and-done because the cached
      // Blob serves every repeat after the first.
      while (!ctrl.signal.aborted) {
        await speak(text, {
          volume: 1.0,
          // Neutral on purpose: clarity beats urgency for a stranger / 119
          // operator parsing the message. Worried tones can muddy consonants.
          emotion: "neutral",
          lang: "ko-KR",
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) break;
        // Inter-repeat pause that is itself abortable — stop() takes effect
        // mid-pause, not just at the next speak() boundary.
        await new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, EMERGENCY_PAUSE_MS);
          ctrl.signal.addEventListener(
            "abort",
            () => {
              window.clearTimeout(t);
              resolve();
            },
            { once: true },
          );
        });
      }
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setIsActive(false);
    }
  }, [isActive, message, speak]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cancel();
    setIsActive(false);
  }, [cancel]);

  const preview = useCallback(() => {
    // One-shot preview at normal volume so the elder can verify how the
    // configured message will sound without alarming everyone in the house.
    void speak(message.trim() || DEFAULT_EMERGENCY_MESSAGE_KO, {
      volume: 1.0,
      emotion: "neutral",
      lang: "ko-KR",
    });
  }, [message, speak]);

  // If the provider unmounts mid-broadcast, hard-stop so audio doesn't dangle.
  useEffect(() => stop, [stop]);

  const value = useMemo(
    () => ({
      message,
      setMessage,
      resetMessage,
      isActive,
      trigger,
      stop,
      preview,
    }),
    [message, setMessage, resetMessage, isActive, trigger, stop, preview],
  );

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}
