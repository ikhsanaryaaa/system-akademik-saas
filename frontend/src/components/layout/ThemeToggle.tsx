import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getStoredTheme, setTheme, type Theme } from "../../lib/theme";

// ThemeToggle adalah tombol ikon di top bar untuk berpindah mode terang/gelap.
// Pilihan tersimpan di localStorage lewat lib/theme.
export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    // Aktifkan transisi warna hanya saat pengguna menekan, bukan saat boot.
    document.documentElement.classList.add("theme-transition");
    setTheme(next);
    setThemeState(next);
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 220);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={next === "dark" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      title={next === "dark" ? "Mode gelap" : "Mode terang"}
      className="grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-canvas active:scale-95"
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
