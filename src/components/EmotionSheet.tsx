import { useEffect } from "react";
import { EMOTION_META, EMOTION_ORDER, useEmotion } from "@/lib/emotion";
import { useI18n } from "@/lib/i18n";
import type { Emotion } from "@/types";

/* -----------------------------------------------------------------------------
 * EmotionSheet — right-side mood drawer for SHORT (landscape-phone) screens.
 *
 * On a tablet the 7 emotions live in a persistent bottom EmotionBar. On a phone
 * the bottom bar is hidden to reclaim vertical space, and mood moves here: a
 * drawer that slides over the right edge when the header's current-mood button
 * is tapped. The trigger is a *visible button* (not a swipe-only gesture, which
 * CLAUDE.md §4 forbids); the drawer just keeps the picker out of the way until
 * it's wanted.
 *
 * Picking an emotion applies it immediately and closes the drawer (one-tap,
 * no confirm). Backdrop tap and the ✕ button also close it. Nothing
 * auto-dismisses on a timer.
 * ---------------------------------------------------------------------------*/
interface EmotionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function EmotionSheet({ open, onClose }: EmotionSheetProps) {
  const { t } = useI18n();
  const { emotion: current, setEmotion } = useEmotion();

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (e: Emotion) => {
    setEmotion(e);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("emotion.heading")}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop — tap anywhere outside the panel to dismiss. */}
      <button
        type="button"
        aria-label={t("settings.close")}
        onClick={onClose}
        className="flex-1 bg-ink/40"
      />

      {/* Panel — slides in over the right edge. */}
      <div className="flex h-full w-[min(80vw,440px)] flex-col gap-gap-sm border-l-4 border-border bg-canvas px-5 py-4 shadow-tile">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-label text-ink">{t("emotion.heading")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("settings.close")}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-tile border-2 border-ink bg-soft text-[24px] text-ink shadow-tile active:shadow-tile-pressed"
          >
            ✕
          </button>
        </div>

        <div
          role="radiogroup"
          aria-label={t("emotion.heading")}
          className="grid min-h-0 flex-1 grid-cols-2 gap-gap-sm overflow-y-auto"
        >
          {EMOTION_ORDER.map((e) => (
            <SheetTile
              key={e}
              value={e}
              current={current}
              label={t(`emotion.${e}` as const)}
              onSelect={pick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SheetTileProps {
  value: Emotion;
  current: Emotion;
  label: string;
  onSelect: (e: Emotion) => void;
}

function SheetTile({ value, current, label, onSelect }: SheetTileProps) {
  const { icon, accent } = EMOTION_META[value];
  const selected = value === current;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={() => onSelect(value)}
      className={[
        "flex min-h-[64px] flex-col items-center justify-center gap-1",
        "rounded-tile border-4 px-2 py-2 shadow-tile",
        "transition-colors active:shadow-tile-pressed",
        selected ? "border-ink bg-ink text-canvas" : "bg-soft text-ink",
      ].join(" ")}
      // Color-tinted border is the secondary signal; the dark fill (selected)
      // is primary, so the cue never depends on color alone.
      style={selected ? undefined : { borderColor: accent }}
    >
      <span aria-hidden className="text-[32px] leading-none">
        {icon}
      </span>
      <span className="text-[18px] font-semibold leading-none">{label}</span>
    </button>
  );
}
