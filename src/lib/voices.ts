// Talk Again — voice selection for Web Speech Synthesis
//
// Priority (CLAUDE.md §5 + research notes):
//   1. Korean MALE voice  — best persona fit for an elderly Korean man
//   2. Korean "Siri" voice — newer, much warmer than the classic Yuna engine
//   3. Korean "Enhanced" / "Premium" voice — high-quality download tier
//   4. Any Korean voice (typically Yuna female on stock macOS / iPadOS)
//   5. Fallback: first available voice of any language
//
// On stock iPadOS, only Yuna (female) is preinstalled. To get a male voice
// the user must download an additional Korean voice through:
//   Settings → Accessibility → Spoken Content → Voices → Korean → +
// Most likely candidates that appear after download: "Junho" (male, iOS 17+),
// "Minsu" (older male), or the Siri "Voice 1/2/3" series.

const MALE_HINTS = [
  "male",
  "men",
  "남", // 남자, 남성
  "junho", // iOS 17+ Korean male
  "minsu", // legacy Korean male voice on some macOS builds
  "siwoo",
  "jihoon",
];

const SIRI_HINTS = ["siri"];
const PREMIUM_HINTS = ["enhanced", "premium", "neural"];

function hasAny(name: string, hints: ReadonlyArray<string>): boolean {
  const lower = name.toLowerCase();
  return hints.some((h) => lower.includes(h));
}

export type VoicePickReason =
  | "korean-male"
  | "korean-siri"
  | "korean-premium"
  | "korean-other"
  | "fallback"
  | "none";

export interface PickedVoice {
  voice: SpeechSynthesisVoice | null;
  reason: VoicePickReason;
}

export function pickKoreanVoice(
  voices: ReadonlyArray<SpeechSynthesisVoice>,
): PickedVoice {
  if (voices.length === 0) return { voice: null, reason: "none" };

  const koreanVoices = voices.filter((v) =>
    v.lang?.toLowerCase().startsWith("ko"),
  );

  if (koreanVoices.length > 0) {
    // 1. Male first — best persona fit.
    const male = koreanVoices.find((v) => hasAny(v.name, MALE_HINTS));
    if (male) return { voice: male, reason: "korean-male" };

    // 2. Siri voices — newer, much warmer than classic Yuna engine.
    const siri = koreanVoices.find((v) => hasAny(v.name, SIRI_HINTS));
    if (siri) return { voice: siri, reason: "korean-siri" };

    // 3. Premium / Enhanced download tier.
    const premium = koreanVoices.find((v) => hasAny(v.name, PREMIUM_HINTS));
    if (premium) return { voice: premium, reason: "korean-premium" };

    // 4. Default Korean voice (typically Yuna).
    const koKR = koreanVoices.find((v) =>
      v.lang.toLowerCase().includes("ko-kr"),
    );
    return { voice: koKR ?? koreanVoices[0], reason: "korean-other" };
  }

  // 5. No Korean voice installed at all — let *something* speak.
  return { voice: voices[0], reason: "fallback" };
}

/** Enumerate every Korean voice the device exposes. Surfaced by the settings
 *  panel so the user can see exactly which voices are available and decide
 *  whether to download more from iPad settings. */
export function listKoreanVoices(
  voices: ReadonlyArray<SpeechSynthesisVoice>,
): ReadonlyArray<{ name: string; lang: string; isDefault: boolean }> {
  return voices
    .filter((v) => v.lang?.toLowerCase().startsWith("ko"))
    .map((v) => ({ name: v.name, lang: v.lang, isDefault: v.default }));
}
