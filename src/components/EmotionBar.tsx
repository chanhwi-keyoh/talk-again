import { EMOTION_META, EMOTION_ORDER, useEmotion } from "@/lib/emotion";
import { useI18n } from "@/lib/i18n";
import type { Emotion } from "@/types";

/* -----------------------------------------------------------------------------
 * EmotionBar — slim, always-visible footer in the fixed app shell.
 *
 * Replaces the old EmotionPicker (which sat at the bottom of a scrolling
 * column). In the landscape page-shell, mood is a property of *whatever* the
 * elder is about to say — a quick phrase or an AI reply — so it lives in a
 * persistent footer that never scrolls away. Change the mood once, then speak
 * from either page; no "scroll down to pick, scroll up to talk" detour.
 *
 * Sizing uses `clamp(min, vh, max)` so each tile shrinks on a short landscape
 * phone but grows on a tall iPad — keeping the bar to a single row in both.
 * Selection language (dark fill = selected) matches LangChoice / VoiceChoice /
 * TabSwitcher so the cue is consistent across the whole app.
 * ---------------------------------------------------------------------------*/
export function EmotionBar() {
  const { t } = useI18n();
  const { emotion: current, setEmotion } = useEmotion();

  return (
    <footer
      aria-labelledby="emotion-heading"
      className="flex shrink-0 items-center gap-gap-sm border-t-2 border-border bg-soft/40 px-6 py-2"
    >
      <h2
        id="emotion-heading"
        className="hidden shrink-0 text-body font-bold text-ink sm:block"
      >
        {t("emotion.heading")}
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="emotion-heading"
        className="flex flex-1 gap-gap-sm"
      >
        {EMOTION_ORDER.map((e) => (
          <EmotionTile
            key={e}
            value={e}
            current={current}
            label={t(`emotion.${e}` as const)}
            onSelect={setEmotion}
          />
        ))}
      </div>
    </footer>
  );
}

interface EmotionTileProps {
  value: Emotion;
  current: Emotion;
  label: string;
  onSelect: (e: Emotion) => void;
}

function EmotionTile({ value, current, label, onSelect }: EmotionTileProps) {
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
        "flex flex-1 flex-col items-center justify-center gap-0.5",
        "rounded-tile border-4 px-1 py-1.5 shadow-tile",
        "transition-colors active:shadow-tile-pressed",
        selected ? "border-ink bg-ink text-canvas" : "bg-soft text-ink",
      ].join(" ")}
      // Color-tinted border is the *secondary* signal; the dark fill (selected)
      // is primary, so the cue never depends on color alone.
      style={selected ? undefined : { borderColor: accent }}
    >
      <span
        aria-hidden
        className="leading-none text-[clamp(24px,4.4vh,40px)]"
      >
        {icon}
      </span>
      <span className="leading-none text-[clamp(13px,2vh,20px)] font-semibold">
        {label}
      </span>
    </button>
  );
}
