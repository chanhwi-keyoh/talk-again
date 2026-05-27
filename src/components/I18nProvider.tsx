import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext, messages, type MessageKey } from "@/lib/i18n";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { UILang } from "@/types";

/** Top-level provider for UI language. Persists to localStorage and falls back
 *  to Korean (the elder's language) when no preference is stored. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UILang>(
    () => readJSON<UILang>(STORAGE_KEYS.lang, "ko"),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEYS.lang, lang);
    // Update <html lang> so screen readers and Safari heuristics match.
    document.documentElement.lang = lang === "ko" ? "ko" : "en";
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: setLangState,
      t: (key: MessageKey) => messages[lang][key] ?? key,
    }),
    [lang],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}
