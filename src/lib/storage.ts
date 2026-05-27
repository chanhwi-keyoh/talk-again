// Talk Again — small, defensive localStorage wrapper.
// Wrapped in try/catch so Safari Private Mode (which throws on quota=0) never
// crashes the UI. Returns the fallback on any error.

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota / private mode — swallow silently. */
  }
}

export const STORAGE_KEYS = {
  lang: "talkagain.lang",
  emotion: "talkagain.emotion",
  voiceEngine: "talkagain.voiceEngine",
  emergencyMessage: "talkagain.emergencyMessage",
} as const;
