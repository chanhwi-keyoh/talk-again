import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PARTNERS,
  PartnerContext,
  type PartnerContextValue,
} from "@/lib/partner";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { Partner, SpeechLevel } from "@/types";

/** Mirrors PersonaProvider: a small localStorage-backed list. First launch is
 *  seeded with DEFAULT_PARTNERS so there is always someone selected; once the
 *  user edits the list their version is what persists. */
export function PartnerProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>(() => {
    const stored = readJSON<Partner[]>(STORAGE_KEYS.partners, []);
    return Array.isArray(stored) && stored.length > 0
      ? stored
      : [...DEFAULT_PARTNERS];
  });
  const [currentId, setCurrentId] = useState<string | null>(() =>
    readJSON<string | null>(STORAGE_KEYS.partnerCurrent, null),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEYS.partners, partners);
  }, [partners]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.partnerCurrent, currentId);
  }, [currentId]);

  const select = useCallback((id: string) => setCurrentId(id), []);

  const add = useCallback((name: string, speechLevel: SpeechLevel) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPartners((prev) => [...prev, { id, name: name.trim(), speechLevel }]);
    setCurrentId(id);
    return id;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Omit<Partner, "id">>) => {
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    setCurrentId((cur) => (cur === id ? null : cur));
  }, []);

  const value = useMemo<PartnerContextValue>(() => {
    // Resolve current; if the stored id no longer exists (deleted, or first
    // run with a null id), fall back to the first partner so something is
    // always active without forcing a write here.
    const resolved =
      partners.find((p) => p.id === currentId) ?? partners[0] ?? null;
    return {
      partners,
      current: resolved,
      currentId: resolved?.id ?? null,
      select,
      add,
      update,
      remove,
    };
  }, [partners, currentId, select, add, update, remove]);

  return (
    <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
  );
}
