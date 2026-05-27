import { useEmergency } from "@/lib/emergency";
import { useI18n } from "@/lib/i18n";

/* -----------------------------------------------------------------------------
 * EmergencySettings
 *
 * Section inside SettingsPanel that lets the user edit the SOS message — the
 * text the EmergencyButton will shout three times. Includes:
 *   - 24px+ editable textarea (no IT jargon in any label)
 *   - "한 번 들어보기" preview so the elder can verify how it'll sound
 *   - "기본 글로 되돌리기" reset so a mistaken edit can be undone
 *   - Helper copy nudging them to add a street address
 *
 * Saves through context → localStorage on every keystroke (debounce isn't
 * worth it: the writes are small and infrequent).
 * ---------------------------------------------------------------------------*/
export function EmergencySettings() {
  const { t } = useI18n();
  const { message, setMessage, resetMessage, preview } = useEmergency();

  return (
    <section aria-labelledby="emergency-heading" className="mt-14 max-w-3xl">
      <h3 id="emergency-heading" className="mb-4 text-label-lg text-ink">
        {t("settings.emergency.heading")}
      </h3>
      <p className="mb-gap-sm whitespace-pre-line text-body text-muted">
        {t("settings.emergency.help")}
      </p>

      <label
        className="mb-3 block text-body font-bold text-ink"
        htmlFor="emergency-text"
      >
        {t("settings.emergency.label")}
      </label>
      <textarea
        id="emergency-text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("settings.emergency.placeholder")}
        rows={4}
        className={[
          "block w-full rounded-tile border-4 border-border bg-canvas",
          "px-6 py-4 text-body-lg text-ink shadow-inner",
          "focus:border-ink focus:outline-none",
          "resize-y min-h-[180px]",
        ].join(" ")}
      />

      <div className="mt-gap-sm flex flex-wrap gap-gap-sm">
        <button
          type="button"
          onClick={preview}
          className={[
            "flex min-h-[80px] items-center justify-center gap-3",
            "rounded-tile border-2 border-ink bg-soft px-8 py-4 text-label text-ink shadow-tile",
            "active:shadow-tile-pressed",
          ].join(" ")}
        >
          <span aria-hidden className="text-[36px] leading-none">
            🔊
          </span>
          <span>{t("settings.emergency.preview")}</span>
        </button>
        <button
          type="button"
          onClick={resetMessage}
          className={[
            "flex min-h-[80px] items-center justify-center gap-3",
            "rounded-tile border-2 border-border bg-canvas px-8 py-4 text-label text-muted shadow-tile",
            "active:shadow-tile-pressed",
          ].join(" ")}
        >
          <span aria-hidden className="text-[36px] leading-none">
            ↺
          </span>
          <span>{t("settings.emergency.reset")}</span>
        </button>
      </div>
    </section>
  );
}
