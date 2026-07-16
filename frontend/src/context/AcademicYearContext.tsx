import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { simpleList, type AcademicYear } from "../lib/master";
import { getToken } from "../lib/auth";

interface AcademicYearState {
  years: AcademicYear[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  reload: () => void;
}

const STORAGE_KEY = "sim_active_year";
const Ctx = createContext<AcademicYearState | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(localStorage.getItem(STORAGE_KEY));

  function setActiveId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveIdState(id);
  }

  async function reload() {
    if (!getToken()) return;
    try {
      const data = await simpleList<AcademicYear>("/academic-years");
      setYears(data);
      // Pilih tahun aktif dari server bila pengguna belum memilih.
      if (!localStorage.getItem(STORAGE_KEY)) {
        const active = data.find((y) => y.is_active) ?? data[0];
        if (active) setActiveId(active.id);
      }
    } catch {
      // Abaikan; pengguna mungkin belum punya permission master.read.
    }
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <Ctx.Provider value={{ years, activeId, setActiveId, reload }}>{children}</Ctx.Provider>
  );
}

export function useAcademicYear(): AcademicYearState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAcademicYear harus dipakai di dalam AcademicYearProvider");
  return ctx;
}
