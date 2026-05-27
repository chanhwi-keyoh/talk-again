/* -----------------------------------------------------------------------------
 * IndexedDB Blob cache for synthesized audio.
 *
 * Why this exists:
 *   - ElevenLabs charges per character. Quick-phrase text is deterministic, so
 *     we can render each (text + emotion) pair ONCE and reuse the audio Blob
 *     forever — turning "응" into a free, network-free, zero-latency tap.
 *
 * Cache key:
 *   `${voiceVersion}|${emotion}|${text}`
 *   `voiceVersion` is a string baked at module load; when the elder's voice is
 *   re-designed in ElevenLabs we bump it and the old cache silently misses.
 *
 * Failure mode:
 *   Every operation swallows errors. A cache miss or an IndexedDB-locked
 *   Safari Private session falls through to a fresh /api/tts call — never
 *   blocks the user from hearing speech.
 * ---------------------------------------------------------------------------*/

const DB_NAME = "talkagain-tts";
const STORE = "audio";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

export function makeCacheKey(args: {
  voiceVersion: string;
  emotion: string;
  text: string;
}): string {
  return `${args.voiceVersion}|${args.emotion}|${args.text}`;
}

export async function getCachedAudio(key: string): Promise<Blob | undefined> {
  const db = await openDB();
  if (!db) return undefined;
  try {
    return await new Promise<Blob | undefined>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

export async function putCachedAudio(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* silent */
  }
}

/** Wipe the whole audio cache — used when the user re-designs the voice. */
export async function clearCachedAudio(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* silent */
  }
}
