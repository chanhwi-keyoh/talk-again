import { useCallback, useEffect, useState } from "react";
import { ConversationPanel } from "@/components/ConversationPanel";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { EmergencyButton } from "@/components/EmergencyButton";
import { EmotionPicker } from "@/components/EmotionPicker";
import { PersonaOnboarding } from "@/components/PersonaOnboarding";
import { PortraitHint } from "@/components/PortraitHint";
import { QuickPhrasePanel } from "@/components/QuickPhrasePanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TabSwitcher, type TabDef } from "@/components/TabSwitcher";
import { VoiceStatusChip } from "@/components/VoiceStatusChip";
import { useEmergency } from "@/lib/emergency";
import { useEmotion } from "@/lib/emotion";
import { useI18n } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";
import { useTTS } from "@/hooks/useTTS";
import { useVoicePref } from "@/lib/voicePref";
import type { Phrase } from "@/types";
import { appendExchange } from "@/lib/recentContext";

/* -----------------------------------------------------------------------------
 * App shell
 *
 * v2 layout (landscape canonical):
 *  1. PortraitHint — dismissible chip when device is portrait
 *  2. Header — title + chip + SOS + settings (or EmergencyBanner when active)
 *  3. TabSwitcher — "자주 쓰는 말" / "대화하기"
 *  4. Selected tab's content (QuickPhrasePanel or ConversationPanel)
 *  5. EmotionPicker — secondary mode selector across both tabs
 *
 * First-run logic: if the persona has never been answered, PersonaOnboarding
 * takes over the screen on initial mount. Skippable; re-runnable via Settings.
 * ---------------------------------------------------------------------------*/

type PageKey = "quick" | "conversation";

const TABS: ReadonlyArray<TabDef<PageKey>> = [
  { key: "quick", label: "tab.quick", icon: "🗨️" },
  { key: "conversation", label: "tab.conversation", icon: "💬" },
];

export default function App() {
  const { lang, t } = useI18n();
  const { engine: preferredEngine } = useVoicePref();
  const { emotion } = useEmotion();
  const { isActive: emergencyActive } = useEmergency();
  const { persona, complete } = usePersona();
  const {
    ready,
    speaking,
    activeEngine,
    fallbackActive,
    systemVoiceReason,
    speak,
  } = useTTS();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState<PageKey>("quick");
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // First-run: open onboarding once on initial mount if persona is unset.
  // Re-opening from Settings is handled via `onReenterPersona`.
  useEffect(() => {
    if (!persona.completedAt) {
      setOnboardingOpen(true);
    }
    // Intentionally empty deps: we only check first-mount state, not on every
    // persona keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSpeakPhrase = useCallback(
    (phrase: Phrase) => {
      const ttsLang = lang === "ko" ? "ko-KR" : "en-US";
      void speak(phrase.speech[lang], { emotion, lang: ttsLang });
      // Persist quick-phrase taps too so AI Suggestions has up-to-date context
      // of what he most recently chose to say.
      void appendExchange({
        timestamp: Date.now(),
        theyHeard: "",
        heSaid: phrase.speech.ko,
      });
    },
    [lang, emotion, speak],
  );

  const dismissOnboarding = useCallback(() => {
    // If user skipped through, still mark completedAt so the dialog doesn't
    // re-open on next launch. They can revisit from Settings.
    complete();
    setOnboardingOpen(false);
  }, [complete]);

  const reopenOnboarding = useCallback(() => setOnboardingOpen(true), []);

  const showHardUnavailable = !ready;

  return (
    <div className="flex min-h-full flex-col bg-canvas text-ink">
      <PortraitHint />

      {emergencyActive ? (
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

        <TabSwitcher tabs={TABS} current={page} onChange={setPage} />

        {page === "quick" ? (
          <QuickPhrasePanel emotion={emotion} onSpeak={handleSpeakPhrase} />
        ) : (
          <ConversationPanel />
        )}

        <EmotionPicker />
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReenterPersona={reopenOnboarding}
      />

      {onboardingOpen && <PersonaOnboarding onDone={dismissOnboarding} />}
    </div>
  );
}
