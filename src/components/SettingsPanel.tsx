import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useVoicePref } from "@/lib/voicePref";
import { EmergencySettings } from "@/components/EmergencySettings";
import { VoiceDiagnostic } from "@/components/VoiceDiagnostic";
import type { UILang, VoiceEngine } from "@/types";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

/* -----------------------------------------------------------------------------
 * SettingsPanel
 *
 * Full-screen overlay (not a tiny corner dropdown) because elderly users do
 * better with one-task-per-screen and clear, large affordances.
 *
 * Language is the only setting in Step 1. More toggles (theme, prosody depth,
 * onboarding reset) will land here in later steps without changing the shell.
 * ---------------------------------------------------------------------------*/
export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { lang, setLang, t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the panel opens so a keyboard user can dismiss
  // it instantly with Enter. Also serves as a clear visual focus anchor.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Lock background scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex flex-col bg-canvas"
    >
      <header className="flex items-center justify-between border-b-2 border-border px-10 py-6">
        <h2 id="settings-title" className="text-title text-ink">
          {t("settings.title")}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="rounded-pill border-2 border-ink bg-canvas px-8 py-4 text-label text-ink shadow-tile active:shadow-tile-pressed"
        >
          {t("settings.close")}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-10 py-10">
        <section aria-labelledby="lang-heading" className="mb-14 max-w-3xl">
          <h3 id="lang-heading" className="mb-4 text-label-lg text-ink">
            {t("settings.language")}
          </h3>
          <p className="mb-gap-sm text-body text-muted">
            {t("settings.language.help")}
          </p>

          <div className="flex gap-gap">
            <LangChoice
              value="ko"
              current={lang}
              label={t("settings.language.ko")}
              onSelect={setLang}
            />
            <LangChoice
              value="en"
              current={lang}
              label={t("settings.language.en")}
              onSelect={setLang}
            />
          </div>
        </section>

        <VoiceSection />

        <VoiceDiagnostic />

        <EmergencySettings />
      </main>
    </div>
  );
}

interface LangChoiceProps {
  value: UILang;
  current: UILang;
  label: string;
  onSelect: (lang: UILang) => void;
}

/** Big tap target (≥ 160×160 effective) for the language choice. Using a
 *  pressed-state pattern instead of a small radio dot — color + ring + check
 *  glyph together signal selection, never color alone. */
function LangChoice({ value, current, label, onSelect }: LangChoiceProps) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={[
        "flex min-h-tile-min min-w-tile-min flex-col items-center justify-center gap-3",
        "rounded-tile border-4 px-10 py-6 text-label-lg shadow-tile",
        "transition-colors",
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-soft text-ink",
      ].join(" ")}
    >
      <span aria-hidden className="text-[40px] leading-none">
        {selected ? "✓" : " "}
      </span>
      <span>{label}</span>
    </button>
  );
}

/** Voice engine picker — AI (ElevenLabs) vs Standard (Web Speech).
 *  Same selection pattern as LangChoice for consistency, but wider tiles so
 *  the "what is this voice?" sub-label fits without truncation. */
function VoiceSection() {
  const { t } = useI18n();
  const { engine, setEngine } = useVoicePref();
  return (
    <section aria-labelledby="voice-heading" className="max-w-3xl">
      <h3 id="voice-heading" className="mb-4 text-label-lg text-ink">
        {t("settings.voice")}
      </h3>
      <p className="mb-gap-sm text-body text-muted">
        {t("settings.voice.help")}
      </p>

      <div className="flex flex-col gap-gap-sm sm:flex-row">
        <VoiceChoice
          value="ai"
          current={engine}
          label={t("settings.voice.ai")}
          note={t("settings.voice.ai.note")}
          icon="🤍"
          onSelect={setEngine}
        />
        <VoiceChoice
          value="system"
          current={engine}
          label={t("settings.voice.system")}
          note={t("settings.voice.system.note")}
          icon="🔊"
          onSelect={setEngine}
        />
      </div>
    </section>
  );
}

interface VoiceChoiceProps {
  value: VoiceEngine;
  current: VoiceEngine;
  label: string;
  note: string;
  icon: string;
  onSelect: (engine: VoiceEngine) => void;
}

function VoiceChoice({
  value,
  current,
  label,
  note,
  icon,
  onSelect,
}: VoiceChoiceProps) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={[
        "flex flex-1 items-center gap-gap-sm",
        "min-h-tile-min rounded-tile border-4 px-8 py-6 text-left shadow-tile",
        "transition-colors",
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-soft text-ink",
      ].join(" ")}
    >
      <span aria-hidden className="text-[56px] leading-none">
        {selected ? "✓" : icon}
      </span>
      <span className="flex flex-col">
        <span className="text-label-lg">{label}</span>
        <span
          className={[
            "text-body",
            selected ? "text-canvas/80" : "text-muted",
          ].join(" ")}
        >
          {note}
        </span>
      </span>
    </button>
  );
}
