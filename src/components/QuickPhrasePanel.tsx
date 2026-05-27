import { useI18n } from "@/lib/i18n";
import { QUICK_PHRASES } from "@/lib/phrases";
import type { Phrase, Emotion } from "@/types";

interface QuickPhrasePanelProps {
  emotion: Emotion;
  onSpeak: (phrase: Phrase) => void;
}

/* -----------------------------------------------------------------------------
 * QuickPhrasePanel
 *
 * 5×2 grid of high-frequency phrases. Each tile:
 *  - is ≥ 160×160px (well above the 120px floor in CLAUDE.md §4)
 *  - has 32px gaps from its neighbors (tremor-safe)
 *  - carries color + emoji + label, so a tile is identifiable even if the
 *    user has reduced color discrimination (e.g. cataract / lens yellowing)
 *  - speaks on the press, with no confirmation dialog (one-tap principle)
 *
 * Layout choice — the panel anchors to the upper portion of the viewport per
 * the research finding that elderly performance improves when primary buttons
 * sit near the top of the screen.
 * ---------------------------------------------------------------------------*/
export function QuickPhrasePanel({ emotion, onSpeak }: QuickPhrasePanelProps) {
  const { lang, t } = useI18n();
  void emotion; // emotion is read by useTTS via the parent; tile UI doesn't change yet

  return (
    <section
      aria-labelledby="quick-phrase-heading"
      className="w-full"
    >
      <header className="mb-gap-sm flex items-baseline justify-between px-2">
        <h2
          id="quick-phrase-heading"
          className="text-label-lg text-ink"
        >
          {t("panel.heading")}
        </h2>
        <p className="text-body text-muted">{t("panel.hint")}</p>
      </header>

      <ul
        className="grid grid-cols-5 gap-gap"
        role="list"
      >
        {QUICK_PHRASES.map((phrase) => (
          <li key={phrase.id} className="list-none">
            <button
              type="button"
              onClick={() => onSpeak(phrase)}
              aria-label={phrase.label[lang]}
              className={[
                "group relative w-full",
                "aspect-square min-h-tile-min",
                "rounded-tile shadow-tile",
                "border-2 border-ink/10",
                "flex flex-col items-center justify-center gap-2",
                "text-white",
                "transition-[transform,box-shadow] duration-100",
                "active:translate-y-[2px] active:shadow-tile-pressed",
                phrase.bgClass,
              ].join(" ")}
            >
              <span
                aria-hidden
                className="text-[72px] leading-none drop-shadow"
              >
                {phrase.icon}
              </span>
              <span className="text-label font-bold tracking-tight">
                {phrase.label[lang]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
