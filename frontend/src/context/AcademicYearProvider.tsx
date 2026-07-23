import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { simpleList, type AcademicYear } from "../lib/master";
import { useAuth } from "./AuthContext";
import { AcademicYearContext, type AcademicYearState } from "./AcademicYearContext";

const STORAGE_KEY = "sim_active_year";

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const setActiveId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveIdState(id);
  }, []);

  const reload = useCallback(async () => {
    if (!user) {
      setYears([]);
      return;
    }
    try {
      const data = await simpleList<AcademicYear>("/academic-years");
      setYears(data);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || !data.some((year) => year.id === stored)) {
        const active = data.find((year) => year.is_active) ?? data[0];
        if (active) setActiveId(active.id);
      }
    } catch {
      // Pengguna mungkin belum punya permission master.read.
    }
  }, [user, setActiveId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<AcademicYearState>(() => ({ years, activeId, setActiveId, reload }), [years, activeId, setActiveId, reload]);
  return <AcademicYearContext.Provider value={value}>{children}</AcademicYearContext.Provider>;
}
