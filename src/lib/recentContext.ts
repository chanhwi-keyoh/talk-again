import type { Exchange } from "@/types";

/* -----------------------------------------------------------------------------
 * Recent conversation context — short-term memory for AI Suggestions.
 *
 * Stores up to MAX_KEPT exchanges (one exchange = "they heard X" + "he said Y").
 * Each time `/api/suggest` is called, the most recent few are included in the
 * Claude system prompt as context.
 *
 * Privacy principle 1.4: this store is internal. There is no UI view of this
 * data anywhere in the app. Family cannot read his conversation log. The only
 * consumer is the AI suggestion request, which sees the entries through the
 * server function. The user can wipe via `clearRecentContext()` (exposed in
 * settings later if requested).
 * ---------------------------------------------------------------------------*/

const DB_NAME = "talkagain-context";
const STORE = "exchanges";
const VERSION = 1;
const MAX_KEPT = 10;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

/** Persist one exchange and prune older entries past `MAX_KEPT`. */
export async function appendExchange(
  exchange: Omit<Exchange, "id">,
): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.add(exchange);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  // Pruning runs in its own transaction so a failure here doesn't lose the new entry.
  await prune();
}

async function prune(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const idx = store.index("timestamp");
    // Count first; if under cap, no work needed.
    const countReq = store.count();
    countReq.onsuccess = () => {
      const surplus = countReq.result - MAX_KEPT;
      if (surplus <= 0) return resolve();
      const cursorReq = idx.openCursor(null, "next"); // oldest first
      let removed = 0;
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor || removed >= surplus) return;
        cursor.delete();
        removed += 1;
        cursor.continue();
      };
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

/** Read the N most recent exchanges (newest last). Default N = MAX_KEPT.
 *  Used only by the code path that POSTs to /api/suggest. */
export async function readRecentExchanges(
  limit = MAX_KEPT,
): Promise<ReadonlyArray<Exchange>> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("timestamp");
    const out: Exchange[] = [];
    const cursorReq = idx.openCursor(null, "prev"); // newest first
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor || out.length >= limit) return;
      out.push(cursor.value as Exchange);
      cursor.continue();
    };
    tx.oncomplete = () => resolve(out.reverse()); // chronological order for prompt
    tx.onerror = () => resolve([]);
    tx.onabort = () => resolve([]);
  });
}

/** Wipe the entire conversation context. */
export async function clearRecentContext(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}
