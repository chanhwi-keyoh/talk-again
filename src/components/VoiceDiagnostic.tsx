import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { listKoreanVoices, pickKoreanVoice } from "@/lib/voices";

/**
 * Lists every Korean Web Speech voice the device exposes — paired with a
 * one-line guide to download more from the OS. Lives inside SettingsPanel
 * so it doesn't clutter the main one-task-per-screen surface.
 *
 * Why this exists: on stock iPadOS only Yuna (female) is preinstalled. The
 * elder asked for a male voice; the only fix is an OS-level download, and
 * without this diagnostic he'd have no way to know whether a male voice is
 * actually available or whether the picker is failing to pick it.
 */
export function VoiceDiagnostic() {
  const { t } = useI18n();
  const [voices, setVoices] = useState<ReadonlyArray<SpeechSynthesisVoice>>(
    [],
  );

  // Subscribe to voice list changes — Safari may deliver it well after mount.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    const t1 = window.setTimeout(refresh, 500);
    const t2 = window.setTimeout(refresh, 1500);
    return () => {
      synth.removeEventListener("voiceschanged", refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const koreanVoices = listKoreanVoices(voices);
  const picked = pickKoreanVoice(voices);
  const usingName = picked.voice?.name ?? null;

  return (
    <section aria-labelledby="voicelist-heading" className="mt-14 max-w-3xl">
      <h3 id="voicelist-heading" className="mb-4 text-label-lg text-ink">
        {t("settings.voiceList.heading")}
      </h3>

      {koreanVoices.length === 0 ? (
        <p className="rounded-tile border-2 border-phrase-wait bg-phrase-wait/10 px-6 py-4 text-body text-ink">
          {t("settings.voiceList.empty")}
        </p>
      ) : (
        <ul className="mb-gap-sm flex flex-col gap-3" role="list">
          {koreanVoices.map((v) => {
            const inUse = v.name === usingName;
            return (
              <li
                key={`${v.name}|${v.lang}`}
                className={[
                  "flex items-center justify-between gap-4 rounded-tile border-2 px-6 py-4",
                  inUse
                    ? "border-ink bg-ink text-canvas"
                    : "border-border bg-soft text-ink",
                ].join(" ")}
              >
                <span className="flex flex-col">
                  <span className="text-body-lg">{v.name}</span>
                  <span
                    className={[
                      "text-body",
                      inUse ? "text-canvas/70" : "text-muted",
                    ].join(" ")}
                  >
                    {v.lang}
                    {v.isDefault
                      ? ` · ${t("settings.voiceList.default")}`
                      : ""}
                  </span>
                </span>
                {inUse && (
                  <span className="text-body font-bold">
                    ← {t("settings.voiceList.using")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="whitespace-pre-line text-body text-muted">
        {t("settings.voiceList.help")}
      </p>
    </section>
  );
}
