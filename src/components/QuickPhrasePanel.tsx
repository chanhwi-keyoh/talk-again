import { useI18n } from "@/lib/i18n";
import { QUICK_PHRASES } from "@/lib/phrases";
import type { Phrase, Emotion } from "@/types";

interface QuickPhrasePanelProps {
  emotion: Emotion;
  onSpeak: (phrase: Phrase) => void;
}

/* -----------------------------------------------------------------------------
 * QuickPhrasePanel — page-shell variant
 *
 * Lives inside the fixed, non-scrolling app shell, so instead of an intrinsic
 * height it *fills* whatever the shell gives it: a 5×2 CSS grid stretched to
 * `h-full`. The visible "Everyday phrases" heading is dropped — the top-bar
 * tab already names this page, and on a short landscape phone every vertical
 * pixel belongs to the buttons.
 *
 * Landscape reality: width is abundant, height is scarce. So tiles are no
 * longer forced square (`aspect-square` made them as tall as they were wide).
 * They fill the grid cell — wide and as tall as the row allows — and the icon
 * / label use `clamp(min, vh, max)` so they shrink on a phone but grow back to
 * full size on a tall iPad. The tap target stays well above the 120px floor
 * because the *width* carries it (~140px+ per column).
 *
 * Each tile still pairs color + emoji + label and speaks on a single tap with
 * no confirmation dialog (one-tap principle, CLAUDE.md §4).
 * ---------------------------------------------------------------------------*/
export function QuickPhrasePanel({ emotion, onSpeak }: QuickPhrasePanelProps) {
  const { lang, t } = useI18n();
  void emotion; // emotion is read by useTTS via the parent; tile UI doesn't change yet

  return (
    <section aria-label={t("panel.heading")} className="h-full">
      <ul
        className="grid h-full grid-cols-5 grid-rows-2 gap-gap-sm"
        role="list"
      >
        {QUICK_PHRASES.map((phrase) => (
          <li key={phrase.id} className="min-h-0 list-none">
            <button
              type="button"
              onClick={() => onSpeak(phrase)}
              aria-label={phrase.label[lang]}
              className={[
                "group relative h-full w-full",
                "rounded-tile shadow-tile",
                "border-2 border-ink/10",
                "flex flex-col items-center justify-center gap-1",
                "text-white",
                "transition-[transform,box-shadow] duration-100",
                "active:translate-y-[2px] active:shadow-tile-pressed",
                phrase.bgClass,
              ].join(" ")}
            >
              <span
                aria-hidden
                className="leading-none text-[clamp(34px,9vh,72px)] drop-shadow"
              >
                {phrase.icon}
              </span>
              <span className="text-[clamp(18px,3.2vh,32px)] font-bold leading-tight tracking-tight">
                {phrase.label[lang]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
