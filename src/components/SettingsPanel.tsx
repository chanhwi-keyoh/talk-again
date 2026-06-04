import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";
import { useVoicePref } from "@/lib/voicePref";
import { EmergencySettings } from "@/components/EmergencySettings";
import { VoiceDiagnostic } from "@/components/VoiceDiagnostic";
import type { UILang, VoiceEngine } from "@/types";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Caller wires this to re-open PersonaOnboarding. */
  onReenterPersona: () => void;
}

/* -----------------------------------------------------------------------------
 * SettingsPanel
 *
 * Full-screen overlay (not a tiny corner dropdown) because elderly users do
 * better with one-task-per-screen and clear, large affordances.
 *
 * Each section is its own labelled <section>, separated by `mt-14`, so adding
 * new sections (persona, emergency, voice diagnostic, ...) doesn't require
 * shell rewrites.
 * ---------------------------------------------------------------------------*/
export function SettingsPanel({
  open,
  onClose,
  onReenterPersona,
}: SettingsPanelProps) {
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
      <header className="flex items-center justify-between border-b-2 border-border px-10 py-6 short:px-6 short:py-3">
        <h2
          id="settings-title"
          className="text-title text-ink short:text-label-lg"
        >
          {t("settings.title")}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="rounded-pill border-2 border-ink bg-canvas px-8 py-4 text-label text-ink shadow-tile active:shadow-tile-pressed short:px-5 short:py-2 short:text-body"
        >
          {t("settings.close")}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-10 py-10 short:px-6 short:py-5">
        <section aria-labelledby="lang-heading" className="mb-14 max-w-3xl short:mb-8">
          <h3
            id="lang-heading"
            className="mb-4 text-label-lg text-ink short:mb-2 short:text-label"
          >
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

        <PersonaSection onReenter={onReenterPersona} onCloseSettings={onClose} />

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
        "short:min-h-[84px] short:min-w-[120px] short:gap-1 short:px-6 short:py-3 short:text-label",
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-soft text-ink",
      ].join(" ")}
    >
      <span aria-hidden className="text-[40px] leading-none short:text-[26px]">
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
      <h3
        id="voice-heading"
        className="mb-4 text-label-lg text-ink short:mb-2 short:text-label"
      >
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
        "short:min-h-[72px] short:gap-3 short:px-5 short:py-3",
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-soft text-ink",
      ].join(" ")}
    >
      <span aria-hidden className="text-[56px] leading-none short:text-[34px]">
        {selected ? "✓" : icon}
      </span>
      <span className="flex flex-col">
        <span className="text-label-lg short:text-label">{label}</span>
        <span
          className={[
            "text-body short:text-[15px]",
            selected ? "text-canvas/80" : "text-muted",
          ].join(" ")}
        >
          {note}
        </span>
      </span>
    </button>
  );
}

/** Persona section — lets the user re-run the 10-question onboarding or
 *  clear the stored persona entirely. The persona itself is not shown as a
 *  list: it's input material for AI Suggestions, not a profile page. */
function PersonaSection({
  onReenter,
  onCloseSettings,
}: {
  onReenter: () => void;
  onCloseSettings: () => void;
}) {
  const { t } = useI18n();
  const { hasBeenSet, reset } = usePersona();

  return (
    <section aria-labelledby="persona-heading" className="mt-14 max-w-3xl short:mt-8">
      <h3
        id="persona-heading"
        className="mb-4 text-label-lg text-ink short:mb-2 short:text-label"
      >
        {t("settings.persona")}
      </h3>
      <p className="mb-gap-sm whitespace-pre-line text-body text-muted">
        {t("settings.persona.help")}
      </p>

      <div className="flex flex-wrap gap-gap-sm">
        <button
          type="button"
          onClick={() => {
            onCloseSettings();
            onReenter();
          }}
          className="flex min-h-[80px] items-center gap-3 rounded-tile border-2 border-ink bg-soft px-8 py-4 text-label text-ink shadow-tile active:shadow-tile-pressed short:min-h-[60px] short:px-5 short:py-2 short:text-body"
        >
          <span aria-hidden className="text-[36px] leading-none short:text-[26px]">
            ↻
          </span>
          <span>{t("settings.persona.reenter")}</span>
        </button>
        {hasBeenSet && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("settings.persona.clearConfirm"))) reset();
            }}
            className="flex min-h-[80px] items-center gap-3 rounded-tile border-2 border-border bg-canvas px-8 py-4 text-label text-muted shadow-tile active:shadow-tile-pressed short:min-h-[60px] short:px-5 short:py-2 short:text-body"
          >
            <span aria-hidden className="text-[36px] leading-none short:text-[26px]">
              ✕
            </span>
            <span>{t("settings.persona.clear")}</span>
          </button>
        )}
      </div>
    </section>
  );
}
