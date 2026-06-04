import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_PARTNER_ICON,
  SPEECH_LEVEL_META,
  usePartner,
} from "@/lib/partner";
import { useSTT } from "@/hooks/useSTT";
import type { Partner, SpeechLevel } from "@/types";

/* -----------------------------------------------------------------------------
 * PartnerSheet — "who is he talking to right now?" drawer.
 *
 * Same right-side drawer pattern as EmotionSheet (visible trigger button, not a
 * swipe-only gesture — CLAUDE.md §4). Picking a partner switches the active
 * conversation: it changes the speech level the AI uses AND scopes the
 * short-term memory, so the thread he was having with one person never leaks
 * into the next. Switching partner is the app's "new conversation" boundary.
 *
 * Picking is a MOOD-LIKE GRID of preset 호칭 tiles — tap one, like tapping an
 * emotion. Zero typing. A trailing "＋" tile adds a new person, and the add
 * flow captures the 호칭 by VOICE (the elder can't type comfortably), not a
 * keyboard. "편집" turns the grid into a delete mode so a mistaken voice entry
 * can be removed.
 * ---------------------------------------------------------------------------*/
interface PartnerSheetProps {
  open: boolean;
  onClose: () => void;
}

const SPEECH_OPTIONS: ReadonlyArray<SpeechLevel> = ["casual", "polite"];

type Mode = "list" | "add";

export function PartnerSheet({ open, onClose }: PartnerSheetProps) {
  const { t } = useI18n();
  const { partners, currentId, select, add, remove } = usePartner();

  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState(false);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset transient UI each time the drawer opens.
  useEffect(() => {
    if (open) {
      setMode("list");
      setEditing(false);
    }
  }, [open]);

  if (!open) return null;

  const pick = (id: string) => {
    select(id);
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

      <div className="flex h-full w-[min(88vw,480px)] flex-col gap-gap-sm border-l-4 border-border bg-canvas px-5 py-4 shadow-tile">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <h2 className="text-label text-ink">
            {mode === "add" ? t("partner.add.heading") : t("partner.heading")}
          </h2>
          <div className="flex items-center gap-2">
            {mode === "list" && partners.length > 0 && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                aria-pressed={editing}
                className={[
                  "min-h-[48px] rounded-tile border-2 px-4 text-[17px] font-bold shadow-tile active:shadow-tile-pressed",
                  editing
                    ? "border-ink bg-ink text-canvas"
                    : "border-ink bg-soft text-ink",
                ].join(" ")}
              >
                {editing ? t("partner.edit.done") : t("partner.edit")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("settings.close")}
              className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-tile border-2 border-ink bg-soft text-[24px] text-ink shadow-tile active:shadow-tile-pressed"
            >
              ✕
            </button>
          </div>
        </div>

        {mode === "list" ? (
          <>
            <p className="shrink-0 text-[15px] leading-snug text-ink/70">
              {t("partner.hint")}
            </p>
            <div
              role="radiogroup"
              aria-label={t("partner.heading")}
              className="grid min-h-0 flex-1 grid-cols-2 content-start gap-gap-sm overflow-y-auto"
            >
              {partners.map((p) => (
                <PartnerTile
                  key={p.id}
                  partner={p}
                  selected={p.id === currentId}
                  editing={editing}
                  speechLabel={t(`partner.speech.${p.speechLevel}` as const)}
                  confirmText={t("partner.delete.confirm")}
                  onSelect={pick}
                  onDelete={remove}
                />
              ))}
              {!editing && (
                <button
                  type="button"
                  onClick={() => setMode("add")}
                  aria-label={t("partner.addTile")}
                  className="flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-tile border-4 border-dashed border-border bg-soft/60 text-ink active:shadow-tile-pressed"
                >
                  <span aria-hidden className="text-[34px] leading-none">
                    ＋
                  </span>
                  <span className="text-[16px] font-bold leading-none">
                    {t("partner.addTile")}
                  </span>
                </button>
              )}
            </div>
          </>
        ) : (
          <AddByVoice
            onCancel={() => setMode("list")}
            onAdd={(name, level) => {
              add(name, level, DEFAULT_PARTNER_ICON);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface PartnerTileProps {
  partner: Partner;
  selected: boolean;
  editing: boolean;
  speechLabel: string;
  confirmText: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function PartnerTile({
  partner,
  selected,
  editing,
  speechLabel,
  confirmText,
  onSelect,
  onDelete,
}: PartnerTileProps) {
  const handle = () => {
    if (editing) {
      if (window.confirm(confirmText)) onDelete(partner.id);
    } else {
      onSelect(partner.id);
    }
  };

  return (
    <button
      type="button"
      role={editing ? undefined : "radio"}
      aria-checked={editing ? undefined : selected}
      onClick={handle}
      className={[
        "relative flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-tile border-4 px-2 py-2 text-center shadow-tile active:shadow-tile-pressed",
        editing
          ? "border-emergency bg-soft text-ink"
          : selected
            ? "border-ink bg-ink text-canvas"
            : "border-border bg-soft text-ink",
      ].join(" ")}
    >
      {editing && (
        <span
          aria-hidden
          className="absolute right-1 top-1 text-[20px] leading-none"
        >
          🗑
        </span>
      )}
      <span aria-hidden className="text-[32px] leading-none">
        {partner.icon ?? "🧑"}
      </span>
      <span className="text-[19px] font-bold leading-tight">{partner.name}</span>
      <span
        className={[
          "rounded-full border px-2 text-[13px] font-semibold leading-tight",
          selected && !editing
            ? "border-canvas/50 text-canvas"
            : "border-ink/30 text-ink/70",
        ].join(" ")}
      >
        {SPEECH_LEVEL_META[partner.speechLevel].icon} {speechLabel}
      </span>
    </button>
  );
}

interface AddByVoiceProps {
  onCancel: () => void;
  onAdd: (name: string, level: SpeechLevel) => void;
}

/** Voice-first add flow: the 호칭 is dictated, never typed. */
function AddByVoice({ onCancel, onAdd }: AddByVoiceProps) {
  const { t, lang } = useI18n();
  const stt = useSTT("ko-KR");
  const [level, setLevel] = useState<SpeechLevel>("casual");

  // Fresh capture whenever this flow mounts.
  useEffect(() => {
    stt.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captured = (stt.final + " " + stt.interim).trim();
  const savedName = stt.final.trim() || captured;

  const toggleMic = useCallback(() => {
    if (stt.listening) stt.stop();
    else {
      stt.reset();
      stt.start();
    }
  }, [stt]);

  if (!stt.supported) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-gap-sm">
        <p className="rounded-tile border-2 border-phrase-wait bg-phrase-wait/10 px-4 py-3 text-body text-ink">
          {t("partner.add.unsupported")}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-auto w-full rounded-tile border-4 border-ink bg-soft px-4 py-3 text-[20px] font-bold text-ink shadow-tile active:shadow-tile-pressed"
        >
          {t("partner.add.cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gap-sm overflow-y-auto">
      {/* Mic — the only way in: press, speak the 호칭. */}
      <button
        type="button"
        onClick={toggleMic}
        aria-label={stt.listening ? t("partner.add.mic.listening") : t("partner.add.mic.idle")}
        className={[
          "flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-tile border-4 px-4 py-4 text-center shadow-tile active:shadow-tile-pressed",
          stt.listening
            ? "animate-pulse border-emergency bg-emergency text-white"
            : "border-ink bg-soft text-ink",
        ].join(" ")}
      >
        <span aria-hidden className="text-[40px] leading-none">
          🎤
        </span>
        <span className="text-[18px] font-bold leading-tight">
          {stt.listening ? t("partner.add.mic.listening") : t("partner.add.mic.idle")}
        </span>
      </button>

      {/* What we heard. */}
      {captured && (
        <div className="rounded-tile border-2 border-border bg-soft px-4 py-3">
          <p className="text-[14px] text-ink/60">{t("partner.add.captured")}</p>
          <p className="text-[26px] font-bold leading-tight text-ink">
            {captured}
          </p>
        </div>
      )}
      {captured && !stt.listening && (
        <button
          type="button"
          onClick={toggleMic}
          className="self-start rounded-tile border-2 border-ink bg-soft px-4 py-2 text-[16px] font-bold text-ink shadow-tile active:shadow-tile-pressed"
        >
          🔁 {t("partner.add.again")}
        </button>
      )}

      {/* Speech level — tap, no typing. */}
      <p className="text-[15px] text-ink/70">{t("partner.add.speechLabel")}</p>
      <div className="flex gap-gap-sm">
        {SPEECH_OPTIONS.map((opt) => {
          const active = level === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => setLevel(opt)}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-tile border-4 px-3 py-2.5 text-[18px] font-bold shadow-tile active:shadow-tile-pressed",
                active
                  ? "border-ink bg-ink text-canvas"
                  : "border-border bg-soft text-ink",
              ].join(" ")}
            >
              <span aria-hidden className="text-[22px] leading-none">
                {SPEECH_LEVEL_META[opt].icon}
              </span>
              <span>
                {lang === "ko"
                  ? SPEECH_LEVEL_META[opt].ko
                  : SPEECH_LEVEL_META[opt].en}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex gap-gap-sm pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-tile border-4 border-ink bg-soft px-4 py-3 text-[20px] font-bold text-ink shadow-tile active:shadow-tile-pressed"
        >
          {t("partner.add.cancel")}
        </button>
        <button
          type="button"
          onClick={() => {
            const name = savedName.trim();
            if (name) onAdd(name, level);
          }}
          disabled={!savedName.trim()}
          className="flex-1 rounded-tile border-4 border-ink bg-ink px-4 py-3 text-[20px] font-bold text-canvas shadow-tile active:shadow-tile-pressed disabled:opacity-40"
        >
          {t("partner.add.submit")}
        </button>
      </div>
    </div>
  );
}
