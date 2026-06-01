import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { STORAGE_KEYS } from "@/lib/storage";

/**
 * Tiny dismissible hint that appears only when the device is in portrait.
 * Per PLAN_v2 §1.2, the app is canonical-landscape — but we never block
 * portrait use; we just suggest rotating with a soft chip the user can
 * dismiss for the session.
 *
 * Storage: `sessionStorage` so the next reload (post-rotate or post-install)
 * starts fresh. Persisting "dismissed" forever would be too sticky.
 */
export function PortraitHint() {
  const { t } = useI18n();
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(
      window.sessionStorage.getItem(STORAGE_KEYS.portraitHintDismissed) === "1",
    );

    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setIsPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div
      role="note"
      className="flex items-center justify-between gap-4 bg-soft px-6 py-3 text-body text-ink"
    >
      <span>{t("portrait.hint")}</span>
      <button
        type="button"
        onClick={() => {
          window.sessionStorage.setItem(
            STORAGE_KEYS.portraitHintDismissed,
            "1",
          );
          setDismissed(true);
        }}
        className="rounded-pill border-2 border-ink bg-canvas px-5 py-2 text-body text-ink"
      >
        {t("portrait.dismiss")}
      </button>
    </div>
  );
}
