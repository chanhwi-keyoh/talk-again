import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";
import { usePartner, partnerForRequest } from "@/lib/partner";
import { useEmotion } from "@/lib/emotion";
import { useTTS } from "@/hooks/useTTS";
import { useSTT } from "@/hooks/useSTT";
import {
  appendExchange,
  readRecentExchanges,
} from "@/lib/recentContext";

/* -----------------------------------------------------------------------------
 * ConversationPanel — page-shell variant (landscape, no scroll)
 *
 * Earlier this stacked three tall blocks (HEARD → actions → REPLY) in one
 * column, which overflowed a short landscape phone and forced scrolling. Now
 * it fills the fixed shell as a SIDE-BY-SIDE two-pane grid:
 *
 *   ┌─ 🎤 HEARD (left) ───────────┐ ┌─ 💬 REPLY (right) ──────────┐
 *   │ editable transcript          │ │ 1  …suggestion…             │
 *   │ + ? toggle                   │ │ 2  …suggestion…             │
 *   │ [듣기] [답변받기] [처음부터]  │ │ 3  …suggestion…             │
 *   └──────────────────────────────┘ └─────────────────────────────┘
 *
 * The controls live *inside* the heard pane (not a separate full-width row) so
 * the reply pane keeps maximum height — its three tiles are the most important
 * output and need room to read a full sentence. Both panes fill height; the
 * reply list scrolls internally only in the rare case three long replies plus
 * label exceed the pane.
 *
 * Edit-in-place transcript + "?" toggle solve the STT problems (mishearing and
 * the statement/question ambiguity where "밥 먹었어" loses its "?"). Failure
 * paths stay soft (no modals): a chip surfaces and the user retries.
 * ---------------------------------------------------------------------------*/

type Phase =
  | "idle"
  | "listening"
  | "transcribed"
  | "requesting"
  | "ready"
  | "error";

/** Conversation-opener intents shown when the elder wants to speak first. The
 *  `key` is sent to /api/suggest; the label comes from i18n. */
const OPENER_INTENTS = [
  { key: "greeting", icon: "👋" },
  { key: "request", icon: "🙏" },
  { key: "question", icon: "🤔" },
  { key: "share", icon: "🗣️" },
] as const;

export function ConversationPanel() {
  const { t } = useI18n();
  const { persona, hasBeenSet } = usePersona();
  const { current: partner, currentId: partnerId } = usePartner();
  const { emotion } = useEmotion();
  const { speak } = useTTS();
  const stt = useSTT("ko-KR");

  const [phase, setPhase] = useState<Phase>("idle");
  const [editedTranscript, setEditedTranscript] = useState("");
  const [suggestions, setSuggestions] = useState<ReadonlyArray<string>>([]);
  const [errorKey, setErrorKey] = useState<
    "sttUnsupported" | "aiUnavailable" | null
  >(null);

  // Keep the editable transcript in sync with the live STT stream, but only
  // until the user starts editing manually (after which we trust their input).
  const liveTranscript = (stt.final + " " + stt.interim).trim();
  useEffect(() => {
    if (phase === "listening" || phase === "idle") {
      setEditedTranscript(liveTranscript);
    }
  }, [liveTranscript, phase]);

  const hasQuestion = editedTranscript.trim().endsWith("?");
  const askedOnce = phase === "ready" || phase === "error";

  const startListening = useCallback(() => {
    if (!stt.supported) {
      setErrorKey("sttUnsupported");
      setPhase("error");
      return;
    }
    stt.reset();
    setEditedTranscript("");
    setSuggestions([]);
    setErrorKey(null);
    setPhase("listening");
    stt.start();
  }, [stt]);

  const requestSuggestions = useCallback(async () => {
    const transcript = editedTranscript.trim();
    if (!transcript) return;
    setPhase("requesting");
    setErrorKey(null);

    try {
      const recent = await readRecentExchanges(partnerId, 5);
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          persona: hasBeenSet ? persona : undefined,
          partner: partnerForRequest(partner),
          emotion,
          recentExchanges: recent.map((r) => ({
            theyHeard: r.theyHeard,
            heSaid: r.heSaid,
          })),
        }),
      });
      if (!res.ok) {
        setErrorKey("aiUnavailable");
        setPhase("error");
        return;
      }
      const data = (await res.json()) as { suggestions?: string[] };
      if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
        setErrorKey("aiUnavailable");
        setPhase("error");
        return;
      }
      setSuggestions(data.suggestions);
      setPhase("ready");
    } catch {
      setErrorKey("aiUnavailable");
      setPhase("error");
    }
  }, [editedTranscript, persona, hasBeenSet, partner, partnerId, emotion]);

  // Stopping the mic immediately asks for replies — one tap fewer for the
  // elder. He can still edit the transcript and re-ask ("다시 답변 받기") if it
  // was misheard. If nothing was captured, just return to idle.
  const stopListening = useCallback(() => {
    stt.stop();
    if (editedTranscript.trim()) void requestSuggestions();
    else setPhase("idle");
  }, [stt, editedTranscript, requestSuggestions]);

  const toggleQuestion = useCallback(() => {
    setEditedTranscript((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return prev;
      if (trimmed.endsWith("?")) return trimmed.slice(0, -1).trimEnd();
      return `${trimmed}?`;
    });
  }, []);

  // OPENER mode: the elder starts the conversation. No transcript — we send an
  // intent instead and get three opening lines back into the same reply pane.
  const requestOpeners = useCallback(
    async (intent: string) => {
      setPhase("requesting");
      setErrorKey(null);
      setSuggestions([]);
      setEditedTranscript("");
      try {
        const recent = await readRecentExchanges(partnerId, 5);
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent,
            persona: hasBeenSet ? persona : undefined,
            partner: partnerForRequest(partner),
            emotion,
            recentExchanges: recent.map((r) => ({
              theyHeard: r.theyHeard,
              heSaid: r.heSaid,
            })),
          }),
        });
        if (!res.ok) {
          setErrorKey("aiUnavailable");
          setPhase("error");
          return;
        }
        const data = (await res.json()) as { suggestions?: string[] };
        if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
          setErrorKey("aiUnavailable");
          setPhase("error");
          return;
        }
        setSuggestions(data.suggestions);
        setPhase("ready");
      } catch {
        setErrorKey("aiUnavailable");
        setPhase("error");
      }
    },
    [persona, hasBeenSet, partner, partnerId, emotion],
  );

  const speakSuggestion = useCallback(
    (text: string) => {
      void speak(text, { emotion, lang: "ko-KR" });
      void appendExchange({
        timestamp: Date.now(),
        theyHeard: editedTranscript.trim(),
        heSaid: text,
        partnerId: partnerId ?? undefined,
      });
    },
    [speak, emotion, editedTranscript, partnerId],
  );

  const startOver = useCallback(() => {
    stt.stop();
    stt.reset();
    setEditedTranscript("");
    setSuggestions([]);
    setErrorKey(null);
    setPhase("idle");
  }, [stt]);

  const hasTranscript = editedTranscript.trim().length > 0;

  return (
    <section
      aria-label={t("conversation.title")}
      className="grid h-full grid-cols-1 gap-gap-sm sm:grid-cols-[1fr_1.15fr]"
    >
      {/* ─── 🎤 HEARD pane (transcript + controls) ─── */}
      <div
        className={[
          "flex min-h-0 flex-col gap-2 rounded-tile border-4 p-3",
          phase === "listening"
            ? "border-phrase-wait bg-phrase-wait/15"
            : "border-phrase-wait/60 bg-phrase-wait/5",
        ].join(" ")}
      >
        {/* The label row doubles as a strip for the secondary refinements
            (? toggle, ↻ start-over). Parking them here — instead of in the
            control row below — stops them from stealing vertical room from the
            transcript field, which on a short landscape phone is the first
            thing to get crushed. */}
        <div className="flex shrink-0 items-center gap-2">
          <span aria-hidden className="text-[24px] leading-none">
            🎤
          </span>
          <span className="text-body font-bold text-ink">
            {t("conversation.heardLabel")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {hasTranscript && (
              <IconButton
                onClick={toggleQuestion}
                active={hasQuestion}
                ariaPressed={hasQuestion}
                ariaLabel={
                  hasQuestion
                    ? t("conversation.questionToggle.remove")
                    : t("conversation.questionToggle.add")
                }
              >
                ?
              </IconButton>
            )}
            {phase !== "idle" && (
              <IconButton
                onClick={startOver}
                ariaLabel={t("conversation.startOver")}
              >
                ↻
              </IconButton>
            )}
          </div>
        </div>

        <textarea
          value={editedTranscript}
          onChange={(e) => setEditedTranscript(e.target.value)}
          placeholder={t("conversation.heardPlaceholder")}
          aria-live="polite"
          className="min-h-[56px] w-full flex-1 resize-none rounded-tile border-2 border-border bg-canvas px-4 py-2 text-body-lg text-ink shadow-inner focus:border-ink focus:outline-none"
          disabled={phase === "listening"}
        />

        {/* Primary control row — kept to a single, non-wrapping line (listen +
            ask) so the transcript above keeps its height. */}
        <div className="flex shrink-0 gap-2">
          {phase === "listening" ? (
            <CtrlButton tone="primary" onClick={stopListening}>
              ■ {t("conversation.stopListening")}
            </CtrlButton>
          ) : (
            <CtrlButton tone="primary" onClick={startListening}>
              🎤 {t("conversation.listen")}
            </CtrlButton>
          )}

          {phase === "requesting" ? (
            <CtrlButton tone="secondary" onClick={() => {}} disabled>
              {t("conversation.requesting")}
            </CtrlButton>
          ) : (
            hasTranscript &&
            phase !== "listening" && (
              <CtrlButton tone="secondary" onClick={requestSuggestions}>
                ✨{" "}
                {askedOnce
                  ? t("conversation.askAgain")
                  : t("conversation.ask")}
              </CtrlButton>
            )
          )}
        </div>

        {errorKey && (
          <p
            role="alert"
            className="shrink-0 rounded-tile border-2 border-phrase-wait bg-phrase-wait/10 px-3 py-2 text-body text-ink"
          >
            {t(`conversation.${errorKey}`)}
          </p>
        )}
      </div>

      {/* ─── 💬 REPLY pane (suggestions or placeholder) ─── */}
      <div
        className={[
          "flex min-h-0 flex-col gap-2 rounded-tile border-4 p-3",
          suggestions.length > 0
            ? "border-phrase-okay/60 bg-phrase-okay/5"
            : "border-border bg-soft/40",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center gap-2">
          <span aria-hidden className="text-[24px] leading-none">
            💬
          </span>
          <span className="text-body font-bold text-ink">
            {t("conversation.suggestionsLabel")}
          </span>
        </div>

        {suggestions.length > 0 ? (
          <ul
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
            role="list"
          >
            {suggestions.map((s, idx) => (
              <li key={`${idx}-${s}`} className="min-h-0 flex-1 list-none">
                <button
                  type="button"
                  onClick={() => speakSuggestion(s)}
                  className="flex h-full w-full items-center gap-3 rounded-tile border-4 border-phrase-okay bg-canvas px-4 py-2 text-left shadow-tile active:shadow-tile-pressed"
                >
                  <span className="shrink-0 text-[clamp(26px,4vh,40px)] font-bold leading-none text-phrase-okay">
                    {idx + 1}
                  </span>
                  <span className="text-[clamp(18px,2.8vh,28px)] font-medium leading-snug text-ink">
                    {s}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : !hasTranscript &&
          phase !== "listening" &&
          phase !== "requesting" ? (
          /* Nothing heard yet → offer to start the conversation. Tapping an
             intent fills this same pane with opening lines. The reply pane has
             the room the short heard pane doesn't. */
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            <p className="shrink-0 text-[15px] font-semibold text-muted">
              {t("conversation.openerHeading")}
            </p>
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
              {OPENER_INTENTS.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => void requestOpeners(it.key)}
                  className="flex min-h-[60px] items-center justify-center gap-2 rounded-tile border-4 border-ink bg-soft px-3 text-[clamp(16px,2.4vh,22px)] font-bold text-ink shadow-tile active:shadow-tile-pressed"
                >
                  <span aria-hidden className="text-[clamp(22px,3.2vh,30px)] leading-none">
                    {it.icon}
                  </span>
                  {t(`conversation.opener.${it.key}` as const)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-2 text-center">
            <p className="text-body text-muted">
              {t("conversation.suggestionsEmpty")}
            </p>
          </div>
        )}

        {/* Persona nudge: a compact footnote pinned to the bottom of the pane
            rather than stacked inside the centered placeholder, where its two
            sentences would overflow the short pane and collide with the label.
            Only shown while there are no suggestions on screen. */}
        {!hasBeenSet && suggestions.length === 0 && (
          <p className="shrink-0 rounded-tile border border-border/60 bg-canvas/60 px-3 py-1.5 text-[14px] leading-snug text-muted">
            {t("conversation.noPersona")}
          </p>
        )}
      </div>
    </section>
  );
}

/* Compact control button for the heard pane. Tones mirror the app's selection
 * language; `toggle` is the on/off "?" pill (dark when active). Smaller than the
 * old BigButton so several fit one row inside a short landscape pane, while
 * staying a comfortable ≥60px tap target. */
function CtrlButton({
  children,
  onClick,
  tone,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "primary" | "secondary" | "tertiary" | "toggle";
  disabled?: boolean;
  active?: boolean;
}) {
  const palette =
    tone === "primary"
      ? "border-ink bg-ink text-canvas"
      : tone === "secondary"
        ? "border-ink bg-soft text-ink"
        : tone === "toggle"
          ? active
            ? "border-ink bg-ink text-canvas"
            : "border-border bg-canvas text-ink"
          : "border-border bg-canvas text-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={tone === "toggle" ? !!active : undefined}
      className={[
        "flex min-h-[60px] items-center justify-center gap-2 rounded-tile border-4 px-4 py-2 text-[20px] font-bold shadow-tile active:shadow-tile-pressed",
        palette,
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* Compact, icon-only control for the heard pane's label-row refinements:
 * the "?" question toggle (dark when the transcript ends in a question mark)
 * and "↻" start-over. They're icon-only to ride in the label row without
 * adding a control-row's worth of height; the aria-label carries the meaning
 * for screen readers since there's no visible text. Still a ≥48px tap target. */
function IconButton({
  children,
  onClick,
  ariaLabel,
  active,
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={[
        "flex min-h-[48px] min-w-[48px] items-center justify-center rounded-tile border-4 text-[24px] font-bold leading-none shadow-tile active:shadow-tile-pressed",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-border bg-canvas text-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
