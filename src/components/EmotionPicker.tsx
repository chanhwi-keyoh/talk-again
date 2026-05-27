import { EMOTION_META, EMOTION_ORDER, useEmotion } from "@/lib/emotion";
import { useI18n } from "@/lib/i18n";
import type { Emotion } from "@/types";

/* -----------------------------------------------------------------------------
 * EmotionPicker
 *
 * Seven horizontal tiles: 보통 + 6 emotions. The selected tile gets a dark
 * fill (same selection language as LangChoice / VoiceChoice — visual
 * consistency reduces the cognitive load for an elderly user across the app).
 *
 * Design departures from the original radial spec in INITIAL_PROMPT_FOR_CODE
 * Step 2:
 *   - Linear grid instead of radial picker. A radial wheel looks cool but
 *     packs unequal tap-target geometry around the edges; for shaky hands,
 *     a flat grid is more forgiving. This matches the elderly UX research
 *     finding that uniform, predictable tap geometry beats novelty.
 *   - "보통" is included as a first-class tile so the user can return to
 *     neutral with one tap — no hidden "long-press to clear" gesture.
 *
 * Layout: a single row of 7 tiles. Each tile uses flex-1 so total width
 * scales to viewport; min-h-[120px] keeps each tap target comfortably above
 * the 100px minimum from CLAUDE.md §4.
 * ---------------------------------------------------------------------------*/
export function EmotionPicker() {
  const { t } = useI18n();
  const { emotion: current, setEmotion } = useEmotion();

  return (
    <section
      aria-labelledby="emotion-heading"
      className="mt-gap w-full"
    >
      <header className="mb-gap-sm flex items-baseline justify-between px-2">
        <h2 id="emotion-heading" className="text-label-lg text-ink">
          {t("emotion.heading")}
        </h2>
        <p className="text-body text-muted">{t("emotion.hint")}</p>
      </header>

      <div
        role="radiogroup"
        aria-labelledby="emotion-heading"
        className="flex flex-wrap gap-gap-sm"
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
    </section>
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
      onClick={() => onSelect(value)}
      className={[
        "flex flex-1 basis-[140px] flex-col items-center justify-center gap-1",
        "min-h-[120px] rounded-tile border-4 px-4 py-3 shadow-tile",
        "transition-colors active:shadow-tile-pressed",
        selected
          ? "border-ink bg-ink text-canvas"
          : "bg-soft text-ink",
      ].join(" ")}
      // Color-tinted border is the *secondary* signal — selection state
      // (dark fill) is the primary signal.
      style={selected ? undefined : { borderColor: accent }}
    >
      <span aria-hidden className="text-[52px] leading-none">
        {icon}
      </span>
      <span className="text-label">{label}</span>
    </button>
  );
}
