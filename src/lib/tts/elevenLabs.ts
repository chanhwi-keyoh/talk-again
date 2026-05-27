import type { VoiceEngine } from "@/types";
import {
  getCachedAudio,
  makeCacheKey,
  putCachedAudio,
} from "./cache";
import type { SpeakOptions, TTSProvider } from "./types";

/* -----------------------------------------------------------------------------
 * ElevenLabs provider — the "designed voice" path.
 *
 * Flow per `speak(text, opts)`:
 *   1. Cancel any in-flight playback (last tap wins).
 *   2. Compute cache key; if hit, play the cached Blob immediately.
 *   3. Otherwise POST /api/tts → receive audio/mpeg Blob → play + persist.
 *
 * The Vercel function holds the API key; the client never sees it. A 503
 * response means the function is unconfigured (no env vars), and the calling
 * `useTTS` hook treats that as "primary engine down" and falls back to
 * webSpeechProvider.
 * ---------------------------------------------------------------------------*/

/**
 * Bumped whenever the designed ElevenLabs voice changes OR the upstream model
 * changes (the resulting audio will sound different). Old cached Blobs
 * silently miss after a bump (still playable from the cache table but never
 * read — they'll be evicted naturally over time).
 *
 * History:
 *   v1 — initial cut, model: eleven_multilingual_v2
 *   v2 — switched to eleven_turbo_v2_5 (Korean explicit), language_code: 'ko'
 */
const VOICE_VERSION = "v2";

let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
let everSucceeded = false;
let lastFailureAt = 0;

function teardownPlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio.load();
    currentAudio = null;
  }
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
}

/** Thrown by `speak()` when the cloud path failed — the hook layer catches
 *  this and triggers the Web Speech fallback. */
export class CloudTTSError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CloudTTSError";
    this.status = status;
  }
}

async function fetchAudioBlob(
  text: string,
  emotion: string,
  lang: string,
  signal: AbortSignal,
): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, emotion, lang }),
    signal,
  });
  if (!res.ok) {
    throw new CloudTTSError(
      `tts ${res.status}`,
      res.status,
    );
  }
  return await res.blob();
}

export const elevenLabsProvider: TTSProvider = {
  id: "ai" satisfies VoiceEngine,

  isReady(): boolean {
    // Optimistic: assume the server is reachable until proven otherwise.
    // If we've failed in the last 30s, mark not-ready so the chip can show
    // the fallback state without a fresh round-trip.
    if (!everSucceeded && lastFailureAt > Date.now() - 30_000) return false;
    return true;
  },

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    teardownPlayback();

    const emotion = options.emotion ?? "neutral";
    const lang = options.lang ?? "ko-KR";
    const cacheKey = makeCacheKey({
      voiceVersion: VOICE_VERSION,
      emotion,
      // Include lang in the cache key so the Korean and English renders of
      // the same `text` (rare, but possible for the demo "Yes" tile) don't
      // overwrite each other.
      text: `${lang}|${trimmed}`,
    });

    let blob = await getCachedAudio(cacheKey);

    if (!blob) {
      const abort = new AbortController();
      currentAbort = abort;
      options.signal?.addEventListener("abort", () => abort.abort(), {
        once: true,
      });
      try {
        blob = await fetchAudioBlob(trimmed, emotion, lang, abort.signal);
      } catch (e) {
        lastFailureAt = Date.now();
        throw e;
      } finally {
        if (currentAbort === abort) currentAbort = null;
      }
      // Fire-and-forget cache write — never blocks playback.
      void putCachedAudio(cacheKey, blob);
    }

    everSucceeded = true;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = options.volume ?? 1.0;
    currentAudio = audio;

    return new Promise<void>((resolve) => {
      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });
      options.signal?.addEventListener(
        "abort",
        () => {
          audio.pause();
          cleanup();
        },
        { once: true },
      );

      // iOS Safari rejects play() if not gesture-anchored. We're called from
      // a click handler so this resolves fine; catch defensively anyway so a
      // rejection doesn't leave the audio URL leaking.
      void audio.play().catch(cleanup);
    });
  },

  cancel(): void {
    teardownPlayback();
  },
};
