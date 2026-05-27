/* -----------------------------------------------------------------------------
 * /api/tts — ElevenLabs Text-to-Speech proxy (Vercel Edge runtime).
 *
 * Why a serverless function:
 *   The ElevenLabs API key MUST NOT ship in the browser bundle. This handler
 *   reads it from process.env on the server, calls ElevenLabs, and streams the
 *   audio/mpeg body straight back to the client. The browser never sees the key.
 *
 * Why Edge runtime:
 *   ~50ms cold start (vs ~500ms Node) and streaming-friendly Response bodies.
 *   The function uses only Web-standard Request/Response/fetch, so it runs
 *   unchanged on Vercel Edge, Cloudflare Workers, or our local Vite dev proxy.
 *
 * Input  (JSON POST):  { text: string, emotion?: Emotion, voiceId?: string }
 * Output (success):    audio/mpeg Blob, aggressively cached.
 * Output (error):      JSON { error: string, ... } with appropriate HTTP code.
 * ---------------------------------------------------------------------------*/

export const config = { runtime: "edge" };

/** Emotion → ElevenLabs voice_settings.
 *
 * `stability`         lower = more expressive variability
 * `similarity_boost`  how tightly to hew to the designed voice (≥0.7 for warmth)
 * `style`             expressiveness exaggeration (Multilingual v2 supports it)
 *
 * Tuned for an elderly Korean male persona — keep similarity_boost high so the
 * "할아버지" voice identity stays consistent across emotions. Step 2 (EmotionDial)
 * will iterate these against real listening tests. */
const PROSODY: Record<
  string,
  { stability: number; similarity_boost: number; style: number }
> = {
  neutral: { stability: 0.6, similarity_boost: 0.8, style: 0.1 },
  happy: { stability: 0.4, similarity_boost: 0.8, style: 0.35 },
  calm: { stability: 0.7, similarity_boost: 0.8, style: 0.05 },
  sad: { stability: 0.55, similarity_boost: 0.8, style: 0.25 },
  worried: { stability: 0.5, similarity_boost: 0.8, style: 0.2 },
  angry: { stability: 0.35, similarity_boost: 0.75, style: 0.45 },
  tired: { stability: 0.7, similarity_boost: 0.8, style: 0.1 },
};

const ALLOWED_EMOTIONS = new Set(Object.keys(PROSODY));

/** Hard caps to keep a misconfigured client from torching credits. */
const MAX_TEXT_LENGTH = 500;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID;
  // Default: eleven_turbo_v2_5. It explicitly lists Korean among its 32
  // supported languages (multilingual_v2 only "auto-detects" and slips on
  // short Korean phrases like "좋아" / "괜찮아") and has lower TTS latency.
  // Override with ELEVENLABS_MODEL_ID for quick A/B without redeploys.
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5";

  if (!apiKey || !defaultVoiceId) {
    // 503 — the client uses this to silently switch to Web Speech fallback.
    return json(503, { error: "tts_not_configured" });
  }

  let payload: {
    text?: unknown;
    emotion?: unknown;
    voiceId?: unknown;
    lang?: unknown;
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) return json(400, { error: "text_required" });
  if (text.length > MAX_TEXT_LENGTH) {
    return json(413, { error: "text_too_long", max: MAX_TEXT_LENGTH });
  }

  const emotionInput =
    typeof payload.emotion === "string" ? payload.emotion : "neutral";
  const emotion = ALLOWED_EMOTIONS.has(emotionInput) ? emotionInput : "neutral";
  const settings = PROSODY[emotion];

  // Force a language hint so the multilingual model doesn't mis-detect short
  // Korean phrases as something else (the "좋아" → "yo-a" bug). Only honor a
  // very narrow set of values; default to Korean — the elder's actual usage.
  const langInput = typeof payload.lang === "string" ? payload.lang : "ko-KR";
  const languageCode = langInput.toLowerCase().startsWith("ko")
    ? "ko"
    : langInput.toLowerCase().startsWith("en")
      ? "en"
      : "ko";

  // Only honor a client-supplied voiceId if it's a sane shape. Otherwise fall
  // back to the designed voice from env. This blocks a malicious client from
  // billing us for someone else's voice.
  const voiceId =
    typeof payload.voiceId === "string" &&
    /^[A-Za-z0-9]{15,40}$/.test(payload.voiceId)
      ? payload.voiceId
      : defaultVoiceId;

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        // language_code is honored by eleven_turbo_v2_5 / eleven_flash_v2_5 /
        // eleven_v3. multilingual_v2 ignores it (auto-detects). Safe to send
        // unconditionally — unknown fields are dropped server-side.
        language_code: languageCode,
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return json(upstream.status, { error: "elevenlabs_failed", detail });
  }

  // Stream MP3 straight to the client. Aggressive cache headers because the
  // (voice, model, settings, text) tuple is fully deterministic for our usage.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
