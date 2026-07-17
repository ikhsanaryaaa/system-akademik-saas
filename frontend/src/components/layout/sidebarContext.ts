import { createContext, useContext } from "react";

// State sidebar dibagikan lintas AppShell, Sidebar, dan TopBar.
// mobileOpen mengontrol drawer overlay di layar kecil.
export interface SidebarState {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar harus dipakai di dalam AppShell");
  return ctx;
}

// Kunci localStorage untuk menyimpan grup accordion yang sedang terbuka.
export const OPEN_GROUPS_STORAGE_KEY = "sim_sidebar_open_groups";

// Kunci localStorage untuk menyimpan state sidebar collapse (rail ikon) di desktop.
export const SIDEBAR_COLLAPSED_STORAGE_KEY = "sim_sidebar_collapsed";
