import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PHRASE_PAGES } from "@/lib/phrases";
import type { Phrase, Emotion } from "@/types";

interface QuickPhrasePanelProps {
  emotion: Emotion;
  onSpeak: (phrase: Phrase) => void;
}

/* -----------------------------------------------------------------------------
 * QuickPhrasePanel — paged page-shell variant
 *
 * The everyday phrases now span several themed PAGES (일상 / 몸·생활 / 마음).
 * One page fills the fixed shell as a 5×2 grid; the elder moves between pages
 * with the flanking ◀ ▶ buttons or the tappable page dots, and — as a bonus —
 * a horizontal swipe. Per CLAUDE.md §4 the swipe is NEVER the only way: every
 * page is reachable by a visible, labelled control, so nothing is hidden behind
 * a gesture.
 *
 * Landscape reality: width is abundant, height is scarce. The arrows live in
 * the abundant horizontal space (narrow side columns); the dots take one short
 * row at the bottom. Tiles still pair color + emoji + label and speak on a
 * single tap with no confirmation (one-tap principle).
 *
 * Swipe vs. tap: a swipe sets a one-shot suppression flag so the release
 * landing on a tile doesn't also fire that tile's speak. The flag clears on the
 * next touch, so a later genuine tap is never swallowed.
 * ---------------------------------------------------------------------------*/

const SWIPE_THRESHOLD = 48; // px of horizontal travel before it counts as a swipe

export function QuickPhrasePanel({ emotion, onSpeak }: QuickPhrasePanelProps) {
  const { lang, t } = useI18n();
  void emotion; // emotion is read by useTTS via the parent; tile UI doesn't change yet

  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = PHRASE_PAGES.length;
  const page = PHRASE_PAGES[pageIndex] ?? PHRASE_PAGES[0];

  const goTo = useCallback(
    (next: number) => {
      setPageIndex((cur) => {
        const clamped = Math.max(0, Math.min(pageCount - 1, next));
        return clamped === cur ? cur : clamped;
      });
    },
    [pageCount],
  );

  // Touch swipe — secondary affordance alongside the visible arrows/dots.
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const suppressTap = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    suppressTap.current = false; // every new touch starts clean
    const tp = e.touches[0];
    touchStartX.current = tp.clientX;
    touchStartY.current = tp.clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const sx = touchStartX.current;
      const sy = touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      if (sx == null || sy == null) return;
      const tp = e.changedTouches[0];
      const dx = tp.clientX - sx;
      const dy = tp.clientY - sy;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
      // Real horizontal swipe: drag left → next page, drag right → previous.
      suppressTap.current = true;
      goTo(pageIndex + (dx < 0 ? 1 : -1));
    },
    [goTo, pageIndex],
  );

  const handleTileTap = useCallback(
    (phrase: Phrase) => {
      if (suppressTap.current) {
        suppressTap.current = false;
        return;
      }
      onSpeak(phrase);
    },
    [onSpeak],
  );

  return (
    <section aria-label={t("panel.heading")} className="flex h-full flex-col gap-gap-sm">
      <div className="flex min-h-0 flex-1 items-stretch gap-gap-sm">
        <PageArrow
          dir="prev"
          label={t("panel.prevPage")}
          disabled={pageIndex === 0}
          onClick={() => goTo(pageIndex - 1)}
        />

        <ul
          className="grid h-full min-w-0 flex-1 grid-cols-5 grid-rows-2 gap-gap-sm"
          role="list"
          aria-label={page.label[lang]}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {page.phrases.map((phrase) => (
            <li key={phrase.id} className="min-h-0 list-none">
              <button
                type="button"
                onClick={() => handleTileTap(phrase)}
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
                  className="leading-none text-[clamp(30px,8vh,64px)] drop-shadow"
                >
                  {phrase.icon}
                </span>
                <span className="text-[clamp(17px,3vh,30px)] font-bold leading-tight tracking-tight">
                  {phrase.label[lang]}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <PageArrow
          dir="next"
          label={t("panel.nextPage")}
          disabled={pageIndex === pageCount - 1}
          onClick={() => goTo(pageIndex + 1)}
        />
      </div>

      {/* Page indicator — labelled dots, each a tappable shortcut to its page. */}
      <nav
        aria-label={t("panel.pages")}
        className="flex shrink-0 items-center justify-center gap-3"
      >
        {PHRASE_PAGES.map((p, i) => {
          const active = i === pageIndex;
          return (
            <button
              key={p.id}
              type="button"
              aria-label={p.label[lang]}
              aria-current={active ? "true" : undefined}
              onClick={() => goTo(i)}
              className={[
                "flex min-h-[40px] items-center gap-2 rounded-pill border-2 px-3 py-1 shadow-tile active:shadow-tile-pressed",
                active
                  ? "border-ink bg-ink text-canvas"
                  : "border-border bg-soft text-ink",
              ].join(" ")}
            >
              <span aria-hidden className="text-[20px] leading-none">
                {p.icon}
              </span>
              <span className="text-[15px] font-bold leading-none">
                {p.label[lang]}
              </span>
            </button>
          );
        })}
      </nav>
    </section>
  );
}

interface PageArrowProps {
  dir: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function PageArrow({ dir, label, disabled, onClick }: PageArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        "flex w-[clamp(48px,7vw,72px)] shrink-0 items-center justify-center",
        "rounded-tile border-2 border-ink bg-soft text-ink shadow-tile",
        "text-[clamp(28px,5vh,44px)] font-bold leading-none",
        "active:shadow-tile-pressed disabled:opacity-30 disabled:shadow-none",
      ].join(" ")}
    >
      <span aria-hidden>{dir === "prev" ? "‹" : "›"}</span>
    </button>
  );
}
