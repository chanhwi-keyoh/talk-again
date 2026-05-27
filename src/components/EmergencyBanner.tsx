import { EmergencyButton } from "@/components/EmergencyButton";
import { useEmergency } from "@/lib/emergency";
import { useI18n } from "@/lib/i18n";

/* -----------------------------------------------------------------------------
 * EmergencyBanner
 *
 * Replaces the normal header while an emergency broadcast is active.
 *
 * Why the swap (not an overlay): audio is heard once and gone. Helpers and
 * 119 staff who walk into the room *after* the audio peak need a steady
 * visual reference for the address. The header is the most-watched zone of
 * the screen, so the message belongs there during a crisis — not the title,
 * not the voice chip, not the settings gear.
 *
 * Visual choices:
 *  - Solid red background + white text → maximum contrast for someone
 *    reading from a distance or at an angle. Far above the 7:1 floor.
 *  - Big SOS glyph on the left, "지금 도움이 필요해요" heading, then the
 *    full message in body-lg with preserved line breaks.
 *  - Stop button stays in its usual right-side position — muscle memory
 *    is preserved between idle and active states.
 *  - No animate-pulse on the banner itself (text would jitter and harm
 *    readability); the Stop button keeps its pulse to confirm liveness.
 *  - Settings + voice chip hidden — both are noise in a critical moment.
 * ---------------------------------------------------------------------------*/
export function EmergencyBanner() {
  const { t } = useI18n();
  const { message } = useEmergency();

  return (
    <header
      role="alert"
      aria-live="assertive"
      className="flex items-start justify-between gap-gap border-b-4 border-white bg-emergency px-10 pt-8 pb-6 text-white"
    >
      <div className="flex flex-1 items-start gap-6">
        <span aria-hidden className="text-[80px] leading-none drop-shadow">
          🆘
        </span>
        <div className="flex flex-col gap-3">
          <h1 className="text-title font-bold leading-tight">
            {t("emergency.banner.heading")}
          </h1>
          <p className="whitespace-pre-line text-body-lg font-bold leading-snug">
            {message}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <EmergencyButton />
      </div>
    </header>
  );
}
