import { useCallback, useState } from "react";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { EmergencyButton } from "@/components/EmergencyButton";
import { EmotionPicker } from "@/components/EmotionPicker";
import { QuickPhrasePanel } from "@/components/QuickPhrasePanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { VoiceStatusChip } from "@/components/VoiceStatusChip";
import { useEmergency } from "@/lib/emergency";
import { useEmotion } from "@/lib/emotion";
import { useI18n } from "@/lib/i18n";
import { useTTS } from "@/hooks/useTTS";
import { useVoicePref } from "@/lib/voicePref";
import type { Phrase } from "@/types";

/* -----------------------------------------------------------------------------
 * App shell
 *
 * iPad landscape (1180×820) is the target. Vertical layout (top → bottom):
 *  1. Header — status chip + settings access; sits in the upper third because
 *     research shows elderly performance improves with primary targets near
 *     the top of the screen.
 *  2. QuickPhrasePanel — the primary action: 5×2 grid of one-tap phrases.
 *  3. EmotionPicker — secondary mode selector. Placed *below* the phrases on
 *     purpose: the phrase IS the urgent action; emotion is a quiet modifier.
 *
 * Speech-language policy:
 *   The spoken text follows the UI language. When the UI is in English (a
 *   demo / instructor flow), the buttons speak English using the phrase's
 *   `speech.en`. When in Korean (the elder's actual usage), they speak Korean.
 *   This keeps demo coherent without splitting "see one language, hear
 *   another" — which is exactly the bug item the elder reported.
 * ---------------------------------------------------------------------------*/
export default function App() {
  const { lang, t } = useI18n();
  const { engine: preferredEngine } = useVoicePref();
  const { emotion } = useEmotion();
  const { isActive: emergencyActive } = useEmergency();
  const {
    ready,
    speaking,
    activeEngine,
    fallbackActive,
    systemVoiceReason,
    speak,
  } = useTTS();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSpeak = useCallback(
    (phrase: Phrase) => {
      const ttsLang = lang === "ko" ? "ko-KR" : "en-US";
      void speak(phrase.speech[lang], { emotion, lang: ttsLang });
    },
    [lang, emotion, speak],
  );

  // Inline alert only when BOTH engines have nothing to play — otherwise the
  // chip already communicates the state, and stacking warnings violates the
  // one-task-per-screen rule.
  const showHardUnavailable = !ready;

  return (
    <div className="flex min-h-full flex-col bg-canvas text-ink">
      {emergencyActive ? (
        // During a broadcast, the header becomes a high-contrast red banner
        // showing the full emergency message text. Helpers / 119 staff who
        // arrive after the audio peak can read the address steadily.
        <EmergencyBanner />
      ) : (
        <header className="flex items-center justify-between gap-gap px-10 pt-8 pb-6">
          <div>
            <h1 className="text-title">{t("app.title")}</h1>
            <p className="mt-2 text-body text-muted">{t("app.tagline")}</p>
          </div>

          <div className="flex items-center gap-gap-sm">
            <VoiceStatusChip
              preferred={preferredEngine}
              active={activeEngine}
              fallbackActive={fallbackActive}
              systemVoiceReason={systemVoiceReason}
              speaking={speaking}
            />
            <EmergencyButton />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t("settings.open")}
              className="flex min-h-tile-min min-w-tile-min flex-col items-center justify-center gap-2 rounded-tile border-2 border-ink bg-soft px-8 py-4 text-label text-ink shadow-tile active:shadow-tile-pressed"
            >
              <span aria-hidden className="text-[48px] leading-none">
                ⚙
              </span>
              <span>{t("settings.open")}</span>
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 px-10 pb-10">
        {showHardUnavailable && (
          <p
            role="alert"
            className="mb-gap-sm rounded-tile border-2 border-phrase-wait bg-phrase-wait/10 px-6 py-4 text-body text-ink"
          >
            {t("voice.notReady")}
          </p>
        )}
        <QuickPhrasePanel emotion={emotion} onSpeak={handleSpeak} />
        <EmotionPicker />
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
