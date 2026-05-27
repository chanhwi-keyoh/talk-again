import { useEmergency } from "@/lib/emergency";
import { useI18n } from "@/lib/i18n";

/* -----------------------------------------------------------------------------
 * EmergencyButton
 *
 * Always-visible red SOS button in the header. Two states:
 *   - idle   : 🆘 + "응급" label
 *   - active : ⏹ + "멈추기" label, pulsing border ring as live indicator
 *
 * Tap toggles. There is intentionally NO confirmation dialog — the elderly
 * UX rules in CLAUDE.md forbid them, and an emergency is the LAST place to
 * insert friction. The trade-off (accidental taps) is mitigated by:
 *   1. distinct red color far from any other tap target
 *   2. the same button instantly stops the broadcast on a second tap
 *
 * Color is paired with a glyph and a label — color is never the only signal.
 * ---------------------------------------------------------------------------*/
export function EmergencyButton() {
  const { t } = useI18n();
  const { isActive, trigger, stop } = useEmergency();

  const handleClick = () => (isActive ? stop() : trigger());

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("emergency.aria")}
      aria-pressed={isActive}
      className={[
        "flex min-h-tile-min min-w-tile-min flex-col items-center justify-center gap-2",
        "rounded-tile border-4 px-8 py-4 text-label text-white shadow-tile",
        "transition-colors active:shadow-tile-pressed",
        "bg-emergency",
        // Border + ring contrast: dark red border at rest, white outline ring
        // while active so the broadcasting state is unmistakable even at a
        // glance from across the room.
        isActive
          ? "border-white ring-4 ring-emergency ring-offset-2 ring-offset-canvas animate-pulse"
          : "border-[#7F0000]",
      ].join(" ")}
    >
      <span aria-hidden className="text-[56px] leading-none drop-shadow">
        {isActive ? "■" : "🆘"}
      </span>
      <span className="font-bold">
        {isActive ? t("emergency.stop") : t("emergency.button")}
      </span>
    </button>
  );
}
