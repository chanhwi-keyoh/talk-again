import { pickKoreanVoice } from "@/lib/voices";
import type { Emotion, VoiceEngine } from "@/types";
import type { SpeakOptions, TTSProvider } from "./types";

/* -----------------------------------------------------------------------------
 * Web Speech provider — the offline / fallback path.
 *
 * Owns its own voice-list subscription (a singleton listener) so the React
 * hook layer doesn't need to know which engine is in play. The hook just calls
 * `webSpeechProvider.speak(...)` and trusts the right voice is selected.
 *
 * iPad Safari quirks handled here:
 *   - voice list arrives asynchronously via `voiceschanged`
 *   - `speak()` is no-op before any user gesture (the SDK silently swallows it)
 *   - cancelling before speaking prevents queued mid-sentence interruptions
 *     stacking up when the elder rapid-taps several tiles
 * ---------------------------------------------------------------------------*/

/** Prosody multipliers per emotion — same table as the AI engine's PROSODY map
 *  but expressed in Web Speech's rate/pitch range (1.0 = neutral). */
const PROSODY: Record<Emotion, { rate: number; pitch: number }> = {
  neutral: { rate: 1.0, pitch: 1.0 },
  happy: { rate: 1.1, pitch: 1.1 },
  calm: { rate: 1.0, pitch: 1.0 },
  sad: { rate: 0.85, pitch: 0.9 },
  worried: { rate: 1.0, pitch: 1.05 },
  angry: { rate: 1.15, pitch: 0.95 },
  tired: { rate: 0.8, pitch: 0.85 },
};

let cachedVoices: ReadonlyArray<SpeechSynthesisVoice> = [];
let voiceListenerInstalled = false;

function installVoiceListener(): void {
  if (voiceListenerInstalled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voiceListenerInstalled = true;

  const refresh = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  refresh();
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
  // Some engines never fire `voiceschanged`; a one-shot poll catches them.
  window.setTimeout(refresh, 500);
}

export const webSpeechProvider: TTSProvider = {
  id: "system" satisfies VoiceEngine,

  isReady(): boolean {
    installVoiceListener();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }
    return pickKoreanVoice(cachedVoices).voice !== null;
  },

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    installVoiceListener();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }
    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve();

    const synth = window.speechSynthesis;
    // Replace any in-flight phrase rather than queueing — last tap wins.
    synth.cancel();

    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(trimmed);
      utter.lang = options.lang ?? "ko-KR";
      utter.volume = options.volume ?? 1.0;

      const { rate, pitch } = PROSODY[options.emotion ?? "neutral"];
      utter.rate = rate;
      utter.pitch = pitch;

      const picked = pickKoreanVoice(cachedVoices);
      if (picked.voice) {
        utter.voice = picked.voice;
        // Some engines reset `lang` on voice assignment — keep ours explicit.
        utter.lang = options.lang ?? picked.voice.lang ?? "ko-KR";
      }

      const finish = () => resolve();
      utter.onend = finish;
      utter.onerror = finish;

      // AbortSignal support — caller can interrupt mid-phrase.
      const onAbort = () => {
        synth.cancel();
        resolve();
      };
      options.signal?.addEventListener("abort", onAbort, { once: true });

      synth.speak(utter);
    });
  },

  cancel(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  },
};

/** Exposed so the header chip can explain *why* the Web Speech engine isn't
 *  usable on a particular device (no Korean voice installed, etc.). */
export function getWebSpeechVoiceReason(): ReturnType<
  typeof pickKoreanVoice
>["reason"] {
  installVoiceListener();
  return pickKoreanVoice(cachedVoices).reason;
}
