import { useCallback, useEffect, useRef, useState } from "react";

/* -----------------------------------------------------------------------------
 * useSTT — Web Speech Recognition wrapper.
 *
 * Lifecycle:
 *   start() → recognition begins. `listening` flips to true. `interim`
 *             updates with partial results; `final` accumulates committed
 *             segments.
 *   stop()  → recognition ends. `listening` flips to false. `final` holds
 *             the full transcript for the caller to ship to /api/suggest.
 *   reset() → wipes both transcripts before a new pass.
 *
 * Browser support note: `webkitSpeechRecognition` is the de-facto name in
 * Chrome / Android Chrome / older Safari. Standard `SpeechRecognition` exists
 * in newer browsers; we accept either. Firefox and most desktop Safari builds
 * don't support either — `supported` reports false and the UI shows a
 * fallback message rather than a broken button.
 *
 * Privacy: we explicitly turn `continuous: false` off-flow so the browser
 * stops listening between sessions. No background mic.
 * ---------------------------------------------------------------------------*/

// `SpeechRecognition` is not in lib.dom types yet. Minimal shape needed.
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [resultIndex: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSTTResult {
  supported: boolean;
  listening: boolean;
  interim: string;
  final: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSTT(lang = "ko-KR"): UseSTTResult {
  const ctorRef = useRef<SpeechRecognitionCtor | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [final, setFinal] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Probe browser support once.
  useEffect(() => {
    const ctor = getCtor();
    ctorRef.current = ctor;
    setSupported(ctor !== null);
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped — ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = ctorRef.current;
    if (!Ctor) {
      setError("unsupported");
      return;
    }
    // Tear down any previous instance to avoid duplicate result events.
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }

    const recog = new Ctor();
    recog.lang = lang;
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    recog.onresult = (event) => {
      let nextInterim = "";
      let nextFinalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) nextFinalChunk += transcript;
        else nextInterim += transcript;
      }
      if (nextFinalChunk) {
        setFinal((prev) => (prev ? `${prev} ${nextFinalChunk}` : nextFinalChunk));
        setInterim("");
      } else {
        setInterim(nextInterim);
      }
    };

    recog.onerror = (e) => {
      setError(e.error || "stt_error");
      setListening(false);
    };

    recog.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recog;
    setError(null);
    setInterim("");
    setListening(true);
    try {
      recog.start();
    } catch (e) {
      // Calling start while already started throws InvalidStateError — safe to ignore.
      setError((e as Error).message);
      setListening(false);
    }
  }, [lang]);

  const reset = useCallback(() => {
    setInterim("");
    setFinal("");
    setError(null);
  }, []);

  // Clean up if the consumer unmounts mid-listen.
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return { supported, listening, interim, final, error, start, stop, reset };
}
