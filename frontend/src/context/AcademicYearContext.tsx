import { createContext, useContext } from "react";
import type { AcademicYear } from "../lib/master";

export interface AcademicYearState {
  years: AcademicYear[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  reload: () => void;
}

export const AcademicYearContext = createContext<AcademicYearState | undefined>(undefined);

export function useAcademicYear(): AcademicYearState {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error("useAcademicYear harus dipakai di dalam AcademicYearProvider");
  return ctx;
}
