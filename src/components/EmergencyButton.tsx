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
export function EmergencyButton({ compact = false }: { compact?: boolean }) {
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
        "flex flex-col items-center justify-center gap-1",
        "rounded-tile border-4 text-white shadow-tile",
        "transition-colors active:shadow-tile-pressed",
        "bg-emergency",
        // `compact` is the top-bar variant: still a big, unmistakable red
        // target, but sized to share a single header row instead of being a
        // 160px tile. The full-size variant stays available for other surfaces.
        compact
          ? "min-h-[56px] px-4 py-1.5 text-body"
          : "min-h-tile-min min-w-tile-min px-8 py-4 text-label",
        // Border + ring contrast: dark red border at rest, white outline ring
        // while active so the broadcasting state is unmistakable even at a
        // glance from across the room.
        isActive
          ? "border-white ring-4 ring-emergency ring-offset-2 ring-offset-canvas animate-pulse"
          : "border-[#7F0000]",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={
          compact
            ? "text-[26px] leading-none"
            : "text-[56px] leading-none drop-shadow"
        }
      >
        {isActive ? "■" : "🆘"}
      </span>
      <span className={compact ? "text-[15px] font-bold leading-none" : "font-bold"}>
        {isActive ? t("emergency.stop") : t("emergency.button")}
      </span>
    </button>
  );
}
