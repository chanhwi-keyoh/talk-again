import { useCallback, useEffect, useState } from "react";
import { ConversationPanel } from "@/components/ConversationPanel";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { EmergencyButton } from "@/components/EmergencyButton";
import { EmotionBar } from "@/components/EmotionBar";
import { PersonaOnboarding } from "@/components/PersonaOnboarding";
import { PortraitHint } from "@/components/PortraitHint";
import { QuickPhrasePanel } from "@/components/QuickPhrasePanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { VoiceStatusChip } from "@/components/VoiceStatusChip";
import { useEmergency } from "@/lib/emergency";
import { useEmotion } from "@/lib/emotion";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";
import { useTTS } from "@/hooks/useTTS";
import { useVoicePref } from "@/lib/voicePref";
import type { Phrase } from "@/types";
import { appendExchange } from "@/lib/recentContext";

/* -----------------------------------------------------------------------------
 * App shell — v2.2 fixed "page shell" (landscape canonical)
 *
 * The viewport is a fixed full-height flex column that NEVER scrolls:
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ TOP BAR (shrink-0): [tabs] ……… [voice chip][🆘 SOS][⚙]         │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ BODY (flex-1, overflow-hidden): the selected page fills it      │
 *   │   · quick → QuickPhrasePanel (5×2 grid fills height)            │
 *   │   · conversation → ConversationPanel (heard | reply two-pane)   │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ EMOTION BAR (shrink-0): mood, always visible across both pages  │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * Why: a landscape phone is wide but short (~380px tall). The old single
 * scrolling column buried the mood picker below the fold and forced the elder
 * to scroll to find buttons — exactly what the elderly-UX rules forbid (key
 * actions near the top, predictable positions, no hidden scrolling). Fixing the
 * chrome top & bottom and letting only the body change keeps every control in
 * the same place every time.
 *
 * The SOS button stays in the top bar on every page (CLAUDE.md: Emergency must
 * always be visible & one-tap). During an active broadcast the header is
 * replaced by EmergencyBanner.
 *
 * First-run: PersonaOnboarding takes over on initial mount if the persona has
 * never been answered. Skippable; re-runnable from Settings.
 * ---------------------------------------------------------------------------*/

type PageKey = "quick" | "conversation";

const TABS: ReadonlyArray<{ key: PageKey; label: MessageKey; icon: string }> = [
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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas text-ink">
      <PortraitHint />

      {emergencyActive ? (
        <EmergencyBanner />
      ) : (
        <header className="flex shrink-0 items-center gap-gap-sm border-b-2 border-border px-6 py-2">
          <nav
            role="tablist"
            aria-label={lang === "ko" ? "화면 선택" : "Select view"}
            className="flex gap-gap-sm"
          >
            {TABS.map((tab) => {
              const selected = page === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setPage(tab.key)}
                  className={[
                    "flex min-h-[52px] items-center gap-2 rounded-tile border-4 px-4 py-1.5 text-[20px] font-bold shadow-tile active:shadow-tile-pressed",
                    selected
                      ? "border-ink bg-ink text-canvas"
                      : "border-border bg-soft text-ink",
                  ].join(" ")}
                >
                  <span aria-hidden className="text-[24px] leading-none">
                    {tab.icon}
                  </span>
                  <span>{t(tab.label)}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-gap-sm">
            <VoiceStatusChip
              compact
              preferred={preferredEngine}
              active={activeEngine}
              fallbackActive={fallbackActive}
              systemVoiceReason={systemVoiceReason}
              speaking={speaking}
            />
            <EmergencyButton compact />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t("settings.open")}
              className="flex min-h-[52px] items-center justify-center rounded-tile border-2 border-ink bg-soft px-4 text-ink shadow-tile active:shadow-tile-pressed"
            >
              <span aria-hidden className="text-[26px] leading-none">
                ⚙
              </span>
            </button>
          </div>
        </header>
      )}

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-3">
        {showHardUnavailable && (
          <p
            role="alert"
            className="mb-2 shrink-0 rounded-tile border-2 border-phrase-wait bg-phrase-wait/10 px-4 py-2 text-body text-ink"
          >
            {t("voice.notReady")}
          </p>
        )}

        <div className="min-h-0 flex-1">
          {page === "quick" ? (
            <QuickPhrasePanel emotion={emotion} onSpeak={handleSpeakPhrase} />
          ) : (
            <ConversationPanel />
          )}
        </div>
      </main>

      <EmotionBar />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReenterPersona={reopenOnboarding}
      />

      {onboardingOpen && <PersonaOnboarding onDone={dismissOnboarding} />}
    </div>
  );
}
