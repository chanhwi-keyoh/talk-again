import { useCallback, useState } from "react";
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
 * ConversationPanel
 *
 * Two-step interaction inside the "대화하기" tab:
 *   1. Tap "듣기 시작" → STT captures what the other person said.
 *   2. Tap "답변 받기" → POST /api/suggest → 3 candidate replies appear as
 *      big tiles → tap one to speak (via useTTS) + persist the exchange to
 *      IndexedDB for the next call's context.
 *
 * Failure paths (all silent — no modals):
 *   - STT unsupported (Firefox / desktop Safari): inline message + the
 *     transcript stays empty.
 *   - /api/suggest returns 503 (no key yet): inline "AI unavailable" message,
 *     re-runnable.
 *   - /api/suggest returns 4xx/5xx other: same retry chip.
 *
 * No-persona case: still calls /api/suggest (the server uses a generic
 * fallback persona), but shows a soft hint that adding the persona makes
 * suggestions sound more like him.
 * ---------------------------------------------------------------------------*/

type Phase = "idle" | "listening" | "transcribed" | "requesting" | "ready" | "error";

export function ConversationPanel() {
  const { t } = useI18n();
  const { persona, hasBeenSet } = usePersona();
  const { emotion } = useEmotion();
  const { speak } = useTTS();
  const stt = useSTT("ko-KR");

  const [phase, setPhase] = useState<Phase>("idle");
  const [suggestions, setSuggestions] = useState<ReadonlyArray<string>>([]);
  const [errorKey, setErrorKey] = useState<"sttUnsupported" | "aiUnavailable" | null>(
    null,
  );

  const transcript = (stt.final + " " + stt.interim).trim();

  const startListening = useCallback(() => {
    if (!stt.supported) {
      setErrorKey("sttUnsupported");
      setPhase("error");
      return;
    }
    stt.reset();
    setSuggestions([]);
    setErrorKey(null);
    setPhase("listening");
    stt.start();
  }, [stt]);

  const stopListening = useCallback(() => {
    stt.stop();
    setPhase(stt.final.trim() ? "transcribed" : "idle");
  }, [stt]);

  const requestSuggestions = useCallback(async () => {
    const finalTranscript = stt.final.trim();
    if (!finalTranscript) return;
    setPhase("requesting");
    setErrorKey(null);

    try {
      const recent = await readRecentExchanges(5);
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalTranscript,
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
  }, [stt.final, persona, hasBeenSet, emotion]);

  const speakSuggestion = useCallback(
    (text: string) => {
      void speak(text, { emotion, lang: "ko-KR" });
      void appendExchange({
        timestamp: Date.now(),
        theyHeard: stt.final.trim(),
        heSaid: text,
      });
    },
    [speak, emotion, stt.final],
  );

  const startOver = useCallback(() => {
    stt.stop();
    stt.reset();
    setSuggestions([]);
    setErrorKey(null);
    setPhase("idle");
  }, [stt]);

  return (
    <section aria-labelledby="conversation-heading" className="w-full">
      <header className="mb-gap-sm flex items-baseline justify-between px-2">
        <h2 id="conversation-heading" className="text-label-lg text-ink">
          {t("conversation.title")}
        </h2>
        <p className="text-body text-muted">{t("conversation.hint")}</p>
      </header>

      {/* Transcript area — always visible so the elder sees what was heard. */}
      <div
        className={[
          "rounded-tile border-4 px-6 py-5",
          phase === "listening"
            ? "border-phrase-wait bg-phrase-wait/10"
            : "border-border bg-soft",
        ].join(" ")}
        aria-live="polite"
      >
        <p className="text-body text-muted">{t("conversation.transcriptLabel")}</p>
        <p className="mt-2 min-h-[64px] whitespace-pre-line text-body-lg text-ink">
          {transcript || (
            <span className="text-muted">
              {t("conversation.transcriptPlaceholder")}
            </span>
          )}
        </p>
      </div>

      {/* Primary action row — depends on phase. */}
      <div className="mt-gap-sm flex flex-wrap gap-gap-sm">
        {phase === "idle" || phase === "transcribed" ? (
          <BigButton tone="primary" onClick={startListening}>
            🎤 {t("conversation.listen")}
          </BigButton>
        ) : null}

        {phase === "listening" ? (
          <BigButton tone="primary" onClick={stopListening}>
            ■ {t("conversation.stopListening")}
          </BigButton>
        ) : null}

        {phase === "transcribed" || phase === "ready" || phase === "error" ? (
          <BigButton tone="secondary" onClick={requestSuggestions}>
            ✨ {t("conversation.askAgain")}
          </BigButton>
        ) : null}

        {phase === "requesting" ? (
          <BigButton tone="secondary" onClick={() => {}} disabled>
            {t("conversation.requesting")}
          </BigButton>
        ) : null}

        {phase !== "idle" ? (
          <BigButton tone="tertiary" onClick={startOver}>
            ↻ {t("conversation.startOver")}
          </BigButton>
        ) : null}
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

      {suggestions.length > 0 && (
        <div className="mt-gap">
          <h3 className="mb-gap-sm text-label text-ink">
            {t("conversation.suggestionsLabel")}
          </h3>
          <ul className="grid grid-cols-1 gap-gap-sm sm:grid-cols-3" role="list">
            {suggestions.map((s, idx) => (
              <li key={idx} className="list-none">
                <button
                  type="button"
                  onClick={() => speakSuggestion(s)}
                  className="flex h-full w-full flex-col items-start gap-3 rounded-tile border-4 border-ink bg-soft px-6 py-5 text-left shadow-tile active:shadow-tile-pressed"
                >
                  <span className="text-[40px] font-bold leading-none text-ink">
                    {idx + 1}
                  </span>
                  <span className="text-body-lg text-ink">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
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
