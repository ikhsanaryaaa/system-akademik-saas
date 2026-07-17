import { useMemo, useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { SidebarContext } from "./sidebarContext";

// AppShell adalah kerangka setiap halaman terautentikasi:
// sidebar gelap + top bar terang + area kanvas soft (lihat DESIGN.md § App Shell).
export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const value = useMemo(() => ({ mobileOpen, setMobileOpen }), [mobileOpen]);

  return (
    <SidebarContext.Provider value={value}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
