import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PersonaContext, type PersonaFieldKey } from "@/lib/persona";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { Persona } from "@/types";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>(() =>
    readJSON<Persona>(STORAGE_KEYS.persona, {}),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEYS.persona, persona);
  }, [persona]);

  const setField = useCallback(
    <K extends PersonaFieldKey>(key: K, value: Persona[K]) => {
      setPersona((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const complete = useCallback(() => {
    setPersona((prev) => ({ ...prev, completedAt: Date.now() }));
  }, []);

  const reset = useCallback(() => {
    setPersona({});
  }, []);

  const value = useMemo(() => {
    const hasBeenSet = Object.entries(persona).some(
      ([k, v]) => k !== "completedAt" && v != null && v !== "",
    );
    return { persona, hasBeenSet, setField, complete, reset };
  }, [persona, setField, complete, reset]);

  return (
    <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
  );
}
