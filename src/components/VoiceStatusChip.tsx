import type { getWebSpeechVoiceReason } from "@/lib/tts";
import { useI18n } from "@/lib/i18n";
import type { VoiceEngine } from "@/types";

interface VoiceStatusChipProps {
  preferred: VoiceEngine;
  active: VoiceEngine;
  fallbackActive: boolean;
  systemVoiceReason: ReturnType<typeof getWebSpeechVoiceReason>;
  speaking: boolean;
  /** Top-bar variant: caps width and truncates the (occasionally long) label
   *  so the chip never pushes the SOS / settings controls off the header. */
  compact?: boolean;
}

/**
 * Header chip that tells the elder at a glance which voice they're hearing.
 *
 * State machine (in order):
 *   1. Speaking         → "말하는 중…" + pulsing dot, regardless of engine
 *   2. AI + fallback    → "AI가 안 돼서 기본 목소리로 말해요" — warm warning color
 *   3. AI + ready       → "AI 목소리 준비됨" — green dot
 *   4. System + voice   → "한국어 목소리 준비됨" — green dot
 *   5. System + no voice → "iPad 설정에서 한국어 목소리…" — warning color
 *
 * Color is always paired with a label and a dot glyph (●), per CLAUDE.md §4 —
 * the elder must not have to distinguish status by color alone.
 */
export function VoiceStatusChip({
  preferred,
  active,
  fallbackActive,
  systemVoiceReason,
  speaking,
  compact = false,
}: VoiceStatusChipProps) {
  const { t } = useI18n();

  const systemHasKoreanVoice =
    systemVoiceReason === "korean-male" ||
    systemVoiceReason === "korean-siri" ||
    systemVoiceReason === "korean-premium" ||
    systemVoiceReason === "korean-other";

  let message: string;
  let dotClass: string;

  if (speaking) {
    message = t("voice.speaking");
    dotClass = "bg-phrase-yes animate-pulse";
  } else if (preferred === "ai" && fallbackActive) {
    message = t("voice.fallback");
    dotClass = "bg-phrase-wait";
  } else if (preferred === "ai") {
    message = t("voice.ready.ai");
    dotClass = "bg-phrase-yes";
  } else if (systemHasKoreanVoice) {
    message = t("voice.ready");
    dotClass = "bg-phrase-yes";
  } else {
    message = t("voice.notReady");
    dotClass = "bg-phrase-wait";
  }

  // Reserved for a future a11y enhancement; surfaced as data attr so e2e
  // tests can assert on engine without scraping localized copy.
  return (
    <div
      role="status"
      aria-live="polite"
      data-active-engine={active}
      title={message}
      className={[
        "flex min-w-0 items-center gap-3 rounded-pill bg-soft text-ink",
        compact ? "max-w-[240px] px-4 py-2.5 text-body" : "px-5 py-3 text-body",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-4 shrink-0 rounded-pill ${dotClass}`}
      />
      <span className={compact ? "truncate" : ""}>{message}</span>
    </div>
  );
}
