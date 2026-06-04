import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SPEECH_LEVEL_META, usePartner } from "@/lib/partner";
import type { Partner, SpeechLevel } from "@/types";

/* -----------------------------------------------------------------------------
 * PartnerSheet — "who is he talking to right now?" drawer.
 *
 * Same right-side drawer pattern as EmotionSheet (visible trigger button, not a
 * swipe-only gesture — CLAUDE.md §4). Picking a partner switches the active
 * conversation: it changes the speech level the AI uses AND scopes the
 * short-term memory, so the thread he was having with one person never leaks
 * into the next. Switching partner is therefore the app's "new conversation"
 * boundary.
 *
 * Tapping a partner selects and closes (one-tap). Deleting is a separate,
 * spaced button so it can't be hit by accident. Speech level (반말/존댓말) is
 * chosen when adding; to change it, delete and re-add — kept intentionally
 * lightweight per the scope decision.
 * ---------------------------------------------------------------------------*/
interface PartnerSheetProps {
  open: boolean;
  onClose: () => void;
}

const SPEECH_OPTIONS: ReadonlyArray<SpeechLevel> = ["casual", "polite"];

export function PartnerSheet({ open, onClose }: PartnerSheetProps) {
  const { t, lang } = useI18n();
  const { partners, currentId, select, add, remove } = usePartner();

  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<SpeechLevel>("casual");

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

  const pick = (id: string) => {
    select(id);
    onClose();
  };

  const submitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    add(name, newLevel);
    setNewName("");
    setNewLevel("casual");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("partner.heading")}
      className="fixed inset-0 z-50 flex"
    >
      <button
        type="button"
        aria-label={t("settings.close")}
        onClick={onClose}
        className="flex-1 bg-ink/40"
      />

      <div className="flex h-full w-[min(86vw,460px)] flex-col gap-gap-sm border-l-4 border-border bg-canvas px-5 py-4 shadow-tile">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-label text-ink">{t("partner.heading")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("settings.close")}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-tile border-2 border-ink bg-soft text-[24px] text-ink shadow-tile active:shadow-tile-pressed"
          >
            ✕
          </button>
        </div>

        <p className="shrink-0 text-[15px] leading-snug text-ink/70">
          {t("partner.hint")}
        </p>

        <div
          role="radiogroup"
          aria-label={t("partner.heading")}
          className="flex min-h-0 flex-1 flex-col gap-gap-sm overflow-y-auto"
        >
          {partners.length === 0 && (
            <p className="rounded-tile border-2 border-border bg-soft px-4 py-3 text-body text-ink/70">
              {t("partner.empty")}
            </p>
          )}
          {partners.map((p) => (
            <PartnerRow
              key={p.id}
              partner={p}
              selected={p.id === currentId}
              speechLabel={t(`partner.speech.${p.speechLevel}` as const)}
              deleteLabel={t("partner.delete")}
              confirmText={t("partner.delete.confirm")}
              onSelect={pick}
              onDelete={remove}
            />
          ))}
        </div>

        {/* Add form */}
        <div className="shrink-0 border-t-2 border-border pt-3">
          <h3 className="mb-2 text-[18px] font-bold text-ink">
            {t("partner.add.heading")}
          </h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("partner.add.namePlaceholder")}
            aria-label={t("partner.add.heading")}
            className="mb-2 w-full rounded-tile border-2 border-border bg-soft px-4 py-3 text-[20px] text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
          />
          <p className="mb-1 text-[15px] text-ink/70">
            {t("partner.add.speechLabel")}
          </p>
          <div className="mb-3 flex gap-gap-sm">
            {SPEECH_OPTIONS.map((level) => {
              const active = newLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setNewLevel(level)}
                  className={[
                    "flex flex-1 items-center justify-center gap-2 rounded-tile border-4 px-3 py-2.5 text-[18px] font-bold shadow-tile active:shadow-tile-pressed",
                    active
                      ? "border-ink bg-ink text-canvas"
                      : "border-border bg-soft text-ink",
                  ].join(" ")}
                >
                  <span aria-hidden className="text-[22px] leading-none">
                    {SPEECH_LEVEL_META[level].icon}
                  </span>
                  <span>{lang === "ko" ? SPEECH_LEVEL_META[level].ko : SPEECH_LEVEL_META[level].en}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={submitAdd}
            disabled={!newName.trim()}
            className="w-full rounded-tile border-4 border-ink bg-ink px-4 py-3 text-[20px] font-bold text-canvas shadow-tile active:shadow-tile-pressed disabled:opacity-40"
          >
            {t("partner.add.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PartnerRowProps {
  partner: Partner;
  selected: boolean;
  speechLabel: string;
  deleteLabel: string;
  confirmText: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function PartnerRow({
  partner,
  selected,
  speechLabel,
  deleteLabel,
  confirmText,
  onSelect,
  onDelete,
}: PartnerRowProps) {
  return (
    <div className="flex items-stretch gap-gap-sm">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => onSelect(partner.id)}
        className={[
          "flex flex-1 items-center justify-between gap-3 rounded-tile border-4 px-4 py-3 text-left shadow-tile active:shadow-tile-pressed",
          selected ? "border-ink bg-ink text-canvas" : "border-border bg-soft text-ink",
        ].join(" ")}
      >
        <span className="text-[22px] font-bold leading-tight">
          {partner.name}
        </span>
        <span
          className={[
            "shrink-0 rounded-full border-2 px-3 py-1 text-[15px] font-semibold",
            selected ? "border-canvas/50 text-canvas" : "border-ink/30 text-ink/70",
          ].join(" ")}
        >
          {SPEECH_LEVEL_META[partner.speechLevel].icon} {speechLabel}
        </span>
      </button>
      <button
        type="button"
        aria-label={`${deleteLabel}: ${partner.name}`}
        onClick={() => {
          if (window.confirm(confirmText)) onDelete(partner.id);
        }}
        className="flex min-w-[56px] items-center justify-center rounded-tile border-2 border-border bg-soft text-[22px] text-ink shadow-tile active:shadow-tile-pressed"
      >
        🗑
      </button>
    </div>
  );
}
