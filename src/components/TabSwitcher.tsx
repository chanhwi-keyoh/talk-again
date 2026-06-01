import { useI18n, type MessageKey } from "@/lib/i18n";

export interface TabDef<K extends string> {
  key: K;
  /** i18n key for the tab label. */
  label: MessageKey;
  /** Emoji or short glyph. */
  icon: string;
}

interface TabSwitcherProps<K extends string> {
  tabs: ReadonlyArray<TabDef<K>>;
  current: K;
  onChange: (key: K) => void;
}

/**
 * Top-of-content tab switcher between the two main surfaces (Quick phrases /
 * Conversation). Same selection language as LangChoice / VoiceChoice so the
 * elderly user sees consistent "selected = dark fill" cues across the app.
 *
 * Per design principle 1.1, tab order is fixed by `tabs` prop — never
 * auto-reordered by frequency.
 */
export function TabSwitcher<K extends string>({
  tabs,
  current,
  onChange,
}: TabSwitcherProps<K>) {
  const { t } = useI18n();
  return (
    <nav
      role="tablist"
      aria-label="View"
      className="mb-gap flex flex-wrap gap-gap-sm"
    >
      {tabs.map((tab) => {
        const selected = tab.key === current;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={[
              "flex min-h-[80px] flex-1 items-center justify-center gap-3 rounded-tile border-4 px-8 py-4 text-label-lg shadow-tile active:shadow-tile-pressed",
              selected
                ? "border-ink bg-ink text-canvas"
                : "border-border bg-soft text-ink",
            ].join(" ")}
          >
            <span aria-hidden className="text-[36px] leading-none">
              {tab.icon}
            </span>
            <span>{t(tab.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
