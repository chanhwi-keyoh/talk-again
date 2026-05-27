import type { Emotion, VoiceEngine } from "@/types";

/* -----------------------------------------------------------------------------
 * Provider abstraction
 *
 * Both the cloud (ElevenLabs) and local (Web Speech) TTS engines plug into the
 * same shape so the `useTTS` hook and the rest of the app stay engine-agnostic.
 * Cloud calls are async; Web Speech is fire-and-forget but we still return a
 * Promise so the calling code looks uniform.
 * ---------------------------------------------------------------------------*/

export interface SpeakOptions {
  emotion?: Emotion;
  /** BCP-47 language tag. Mostly relevant for Web Speech voice selection. */
  lang?: string;
  /** 0..1. Emergency phrases (Step 5) push this to 1.0. */
  volume?: number;
  /** AbortSignal: caller can cancel an in-flight cloud request. */
  signal?: AbortSignal;
}

/** Coarse status the UI surfaces in the header chip. */
export type ProviderStatus =
  | "idle" // never spoken yet
  | "ready" // voice known to be available
  | "speaking" // a phrase is currently playing
  | "warming" // first ever call (Web Speech voices loading / cloud cold start)
  | "fallback" // primary engine failed and we silently dropped back to Web Speech
  | "unavailable"; // no playable voice at all

export interface TTSProvider {
  readonly id: VoiceEngine;
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  cancel: () => void;
  /** Best-effort readiness probe. For Web Speech this maps to "voice list
   *  loaded and a Korean voice exists"; for ElevenLabs this is optimistic
   *  (true until a request fails). */
  isReady: () => boolean;
}
