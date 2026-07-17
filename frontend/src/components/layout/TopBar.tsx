import { Menu } from "lucide-react";
import { useSidebar } from "./sidebarContext";
import SearchBar from "./SearchBar";
import AcademicYearSelector from "./AcademicYearSelector";
import NotificationButton from "./NotificationButton";
import ThemeToggle from "./ThemeToggle";
import ProfileMenu from "./ProfileMenu";

export default function TopBar() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-hairline bg-canvas px-3 md:px-6">
      <div className="flex items-center gap-2">
        {/* Buka drawer (mobile) */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
          className="grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-strong hover:text-ink md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pencarian global; disembunyikan di layar sangat sempit. */}
        <div className="hidden sm:block">
          <SearchBar />
        </div>
        <AcademicYearSelector />
        <NotificationButton />
        <ThemeToggle />
        <div className="border-l border-hairline pl-2 sm:pl-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
