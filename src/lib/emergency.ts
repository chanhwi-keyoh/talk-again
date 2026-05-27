import { createContext, useContext } from "react";

/* -----------------------------------------------------------------------------
 * Emergency broadcasting — shared context shape.
 *
 * The default message is concise and complete on its own — no `[주소]` style
 * placeholder. A literal "[주소]" spoken aloud would waste precious seconds of
 * an actual emergency. The settings UI nudges the user to ADD their address;
 * if they never do, the default still gets the basics across (cannot speak,
 * call 119).
 * ---------------------------------------------------------------------------*/

export const DEFAULT_EMERGENCY_MESSAGE_KO =
  "도와주세요. 저는 말을 못 합니다. 119에 전화해 주세요.";

/** Pause between repeats, ms. Long enough to be perceived as separate sentences,
 *  short enough that a passer-by hears the message multiple times per minute.
 *  The loop runs until the user explicitly stops it — an emergency should keep
 *  broadcasting until help arrives, not auto-quiet after N attempts.
 *
 *  Cost note: the configured message is identical every iteration, so the
 *  IndexedDB blob cache makes every repeat after the first a zero-network,
 *  zero-credit cache hit. An hour-long broadcast still bills exactly one
 *  ElevenLabs call. */
export const EMERGENCY_PAUSE_MS = 500;

export interface EmergencyContextValue {
  /** Current message that will be spoken when the SOS button fires. */
  message: string;
  setMessage: (next: string) => void;
  /** Reset to the built-in Korean default. */
  resetMessage: () => void;
  /** True while a broadcast is currently looping. */
  isActive: boolean;
  /** Start the loop. Idempotent — re-calls while active are no-ops. */
  trigger: () => void;
  /** Abort the current loop immediately. */
  stop: () => void;
  /** Speak the message once at normal volume — for previewing in settings. */
  preview: () => void;
}

export const EmergencyContext = createContext<EmergencyContextValue | null>(
  null,
);

export function useEmergency(): EmergencyContextValue {
  const ctx = useContext(EmergencyContext);
  if (!ctx) {
    throw new Error("useEmergency must be used inside <EmergencyProvider>");
  }
  return ctx;
}
