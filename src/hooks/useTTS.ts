import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudTTSError,
  elevenLabsProvider,
  getWebSpeechVoiceReason,
  webSpeechProvider,
  type SpeakOptions,
} from "@/lib/tts";
import { useVoicePref } from "@/lib/voicePref";
import type { VoiceEngine } from "@/types";

/* -----------------------------------------------------------------------------
 * useTTS — engine-agnostic speech hook with silent failover.
 *
 * Behaviour:
 *   - Reads the engine preference from <VoicePrefProvider>.
 *   - If "ai", calls ElevenLabs through /api/tts. On any failure (network,
 *     503 "tts_not_configured", upstream 4xx/5xx) it silently retries with
 *     Web Speech so the elder still hears something, then surfaces the
 *     `activeEngine` / `fallbackActive` flags so the header chip can explain
 *     the downgrade at a glance.
 *   - If "system", calls Web Speech directly — no cloud round-trip.
 *
 * The hook owns no playback state of its own; both providers are singletons
 * underneath. It just maps preference → provider and shapes status for the UI.
 * ---------------------------------------------------------------------------*/

export interface UseTTSResult {
  /** True when the *active* provider is currently playable. */
  ready: boolean;
  /** True from the start of `speak()` until the audio finishes or aborts. */
  speaking: boolean;
  /** Which engine actually spoke the most recent phrase. May differ from the
   *  user's preference if AI was preferred but failed. */
  activeEngine: VoiceEngine;
  /** True when the user preferred "ai" but the last call fell back to system.
   *  The chip uses this to show a "AI 안 됨" message without alarming the user. */
  fallbackActive: boolean;
  /** Reason used by the chip when the system voice is in play (e.g. "korean-male",
   *  "korean-other", "fallback", "none"). */
  systemVoiceReason: ReturnType<typeof getWebSpeechVoiceReason>;
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  cancel: () => void;
}

export function useTTS(): UseTTSResult {
  const { engine: preferred } = useVoicePref();
  const [speaking, setSpeaking] = useState(false);
  const [activeEngine, setActiveEngine] = useState<VoiceEngine>(preferred);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [systemVoiceReason, setSystemVoiceReason] =
    useState<ReturnType<typeof getWebSpeechVoiceReason>>("none");

  // Poll the Web Speech voice list a few times after mount — Safari delivers
  // it asynchronously, so the first reading is often "none" even when a voice
  // is actually about to show up.
  useEffect(() => {
    const tick = () => setSystemVoiceReason(getWebSpeechVoiceReason());
    tick();
    const ids = [
      window.setTimeout(tick, 200),
      window.setTimeout(tick, 800),
      window.setTimeout(tick, 2000),
    ];
    return () => ids.forEach(window.clearTimeout);
  }, []);

  // When the preference flips back to "ai", clear any stale fallback flag —
  // the user is asking us to try the cloud again from a clean slate.
  useEffect(() => {
    if (preferred === "ai") setFallbackActive(false);
  }, [preferred]);

  // Keep a ref to the last AbortController so cancel() can hit it even after
  // re-renders.
  const inflight = useRef<AbortController | null>(null);

  const speak = useCallback<UseTTSResult["speak"]>(
    async (text, options = {}) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Cancel anything currently playing before we start the next phrase.
      inflight.current?.abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      const opts: SpeakOptions = { ...options, signal: ctrl.signal };

      setSpeaking(true);

      try {
        if (preferred === "ai") {
          try {
            setActiveEngine("ai");
            await elevenLabsProvider.speak(trimmed, opts);
            setFallbackActive(false);
          } catch (err) {
            if (ctrl.signal.aborted) return; // user moved on, not a real failure
            // Log once for the developer console; user just hears the fallback.
            const status =
              err instanceof CloudTTSError ? err.status : undefined;
            console.warn(
              "[useTTS] AI engine failed, falling back to system voice",
              { status, error: err },
            );
            setActiveEngine("system");
            setFallbackActive(true);
            await webSpeechProvider.speak(trimmed, opts);
          }
        } else {
          setActiveEngine("system");
          await webSpeechProvider.speak(trimmed, opts);
        }
      } finally {
        if (inflight.current === ctrl) inflight.current = null;
        setSpeaking(false);
      }
    },
    [preferred],
  );

  const cancel = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    elevenLabsProvider.cancel();
    webSpeechProvider.cancel();
    setSpeaking(false);
  }, []);

  // On unmount, drop any in-flight audio so an SPA navigation doesn't leave
  // a phrase mid-air.
  useEffect(() => cancel, [cancel]);

  // Compute readiness from the engine that's actually about to run.
  const ready =
    preferred === "ai"
      ? elevenLabsProvider.isReady() || webSpeechProvider.isReady() // fallback counts
      : webSpeechProvider.isReady();

  return {
    ready,
    speaking,
    activeEngine,
    fallbackActive,
    systemVoiceReason,
    speak,
    cancel,
  };
}
