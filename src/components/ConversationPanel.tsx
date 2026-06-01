import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";
import { useEmotion } from "@/lib/emotion";
import { useTTS } from "@/hooks/useTTS";
import { useSTT } from "@/hooks/useSTT";
import {
  appendExchange,
  readRecentExchanges,
} from "@/lib/recentContext";

/* -----------------------------------------------------------------------------
 * ConversationPanel — v2.1 redesign
 *
 * Two visually distinct zones make the flow obvious at a glance:
 *
 *   🎤 [HEARD zone — warm tint]
 *      editable transcript of what the other person said
 *      + "물음표 붙이기/떼기" toggle (STT strips punctuation; "밥 먹었어"
 *        is ambiguous between statement and question)
 *
 *   💬 [REPLY zone — cool tint]
 *      3 candidate replies as big tappable tiles
 *      OR placeholder "여기에 답변이 보일 거예요" before they arrive
 *
 * Edit-in-place: the transcript is a real textarea, not a read-only chip.
 * If STT mishears, the user can correct it before requesting suggestions —
 * this avoids the cycle "STT bad → suggestions bad → re-listen → STT bad
 * again." Same fix for the question-vs-statement ambiguity: append "?" by
 * hand or via the toggle.
 *
 * Failure paths stay soft (no modals): STT unsupported, AI unavailable, or
 * bad model output each surface a chip and let the user retry.
 * ---------------------------------------------------------------------------*/

type Phase =
  | "idle"
  | "listening"
  | "transcribed"
  | "requesting"
  | "ready"
  | "error";

export function ConversationPanel() {
  const { t } = useI18n();
  const { persona, hasBeenSet } = usePersona();
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

  const stopListening = useCallback(() => {
    stt.stop();
    // Stay on this transcript even after STT stops; user may want to edit.
    setPhase(editedTranscript.trim() ? "transcribed" : "idle");
  }, [stt, editedTranscript]);

  const toggleQuestion = useCallback(() => {
    setEditedTranscript((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return prev;
      if (trimmed.endsWith("?")) return trimmed.slice(0, -1).trimEnd();
      return `${trimmed}?`;
    });
  }, []);

  const requestSuggestions = useCallback(async () => {
    const transcript = editedTranscript.trim();
    if (!transcript) return;
    setPhase("requesting");
    setErrorKey(null);

    try {
      const recent = await readRecentExchanges(5);
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          persona: hasBeenSet ? persona : undefined,
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
  }, [editedTranscript, persona, hasBeenSet, emotion]);

  const speakSuggestion = useCallback(
    (text: string) => {
      void speak(text, { emotion, lang: "ko-KR" });
      void appendExchange({
        timestamp: Date.now(),
        theyHeard: editedTranscript.trim(),
        heSaid: text,
      });
    },
    [speak, emotion, editedTranscript],
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
    <section aria-labelledby="conversation-heading" className="w-full">
      <header className="mb-gap flex items-baseline justify-between px-2">
        <h2 id="conversation-heading" className="text-label-lg text-ink">
          {t("conversation.title")}
        </h2>
        <p className="text-body text-muted">{t("conversation.hint")}</p>
      </header>

      {/* ─── HEARD zone ─── */}
      <div
        className={[
          "rounded-tile border-4 p-6",
          phase === "listening"
            ? "border-phrase-wait bg-phrase-wait/15"
            : "border-phrase-wait/60 bg-phrase-wait/5",
        ].join(" ")}
        aria-live="polite"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-label text-ink">
            <span aria-hidden className="text-[36px] leading-none">
              🎤
            </span>
            {t("conversation.heardLabel")}
          </span>
          <span className="text-body text-muted">
            {t("conversation.heardHint")}
          </span>
        </div>

        <textarea
          value={editedTranscript}
          onChange={(e) => setEditedTranscript(e.target.value)}
          rows={2}
          placeholder={t("conversation.heardPlaceholder")}
          className="block w-full resize-y rounded-tile border-2 border-border bg-canvas px-5 py-4 text-body-lg text-ink shadow-inner focus:border-ink focus:outline-none"
          disabled={phase === "listening"}
        />

        {hasTranscript && (
          <div className="mt-gap-sm flex flex-wrap gap-gap-sm">
            <button
              type="button"
              onClick={toggleQuestion}
              className={[
                "min-h-[64px] rounded-pill border-2 px-6 py-3 text-body font-bold shadow-tile active:shadow-tile-pressed",
                hasQuestion
                  ? "border-ink bg-ink text-canvas"
                  : "border-border bg-canvas text-ink",
              ].join(" ")}
            >
              {hasQuestion
                ? t("conversation.questionToggle.remove")
                : t("conversation.questionToggle.add")}
            </button>
          </div>
        )}
      </div>

      {/* ─── Action row ─── */}
      <div className="mt-gap flex flex-wrap gap-gap-sm">
        {phase === "listening" ? (
          <BigButton tone="primary" onClick={stopListening}>
            ■ {t("conversation.stopListening")}
          </BigButton>
        ) : (
          <BigButton tone="primary" onClick={startListening}>
            🎤 {t("conversation.listen")}
          </BigButton>
        )}

        {hasTranscript && phase !== "listening" && phase !== "requesting" && (
          <BigButton tone="secondary" onClick={requestSuggestions}>
            ✨{" "}
            {askedOnce
              ? t("conversation.askAgain")
              : t("conversation.ask")}
          </BigButton>
        )}

        {phase === "requesting" && (
          <BigButton tone="secondary" onClick={() => {}} disabled>
            {t("conversation.requesting")}
          </BigButton>
        )}

        {phase !== "idle" && (
          <BigButton tone="tertiary" onClick={startOver}>
            ↻ {t("conversation.startOver")}
          </BigButton>
        )}
      </div>

      {!hasBeenSet && (
        <p className="mt-gap-sm text-body text-muted">
          {t("conversation.noPersona")}
        </p>
      )}

      {errorKey && (
        <p
          role="alert"
          className="mt-gap-sm rounded-tile border-2 border-phrase-wait bg-phrase-wait/10 px-6 py-4 text-body text-ink"
        >
          {t(`conversation.${errorKey}`)}
        </p>
      )}

      {/* ─── REPLY zone — always visible, shows placeholder until ready ─── */}
      <div
        className={[
          "mt-gap rounded-tile border-4 p-6",
          suggestions.length > 0
            ? "border-phrase-okay/60 bg-phrase-okay/5"
            : "border-border bg-soft/40",
        ].join(" ")}
      >
        <div className="mb-gap-sm flex items-center gap-2">
          <span aria-hidden className="text-[36px] leading-none">
            💬
          </span>
          <span className="text-label text-ink">
            {t("conversation.suggestionsLabel")}
          </span>
        </div>

        {suggestions.length > 0 ? (
          <ul
            className="grid grid-cols-1 gap-gap-sm sm:grid-cols-3"
            role="list"
          >
            {suggestions.map((s, idx) => (
              <li key={`${idx}-${s}`} className="list-none">
                <button
                  type="button"
                  onClick={() => speakSuggestion(s)}
                  className="flex h-full w-full flex-col items-start gap-3 rounded-tile border-4 border-phrase-okay bg-canvas px-6 py-5 text-left shadow-tile active:shadow-tile-pressed"
                >
                  <span className="text-[40px] font-bold leading-none text-phrase-okay">
                    {idx + 1}
                  </span>
                  <span className="text-body-lg text-ink">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-body text-muted">
            {t("conversation.suggestionsEmpty")}
          </p>
        )}
      </div>
    </section>
  );
}

function BigButton({
  children,
  onClick,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
}) {
  const palette =
    tone === "primary"
      ? "border-ink bg-ink text-canvas"
      : tone === "secondary"
        ? "border-ink bg-soft text-ink"
        : "border-border bg-canvas text-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex min-h-tile-min items-center justify-center gap-3 rounded-tile border-4 px-10 py-4 text-label-lg shadow-tile active:shadow-tile-pressed",
        palette,
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
