// Pengelolaan mode terang/gelap. Pilihan disimpan di localStorage dan
// diterapkan sebagai class "dark" pada <html>, sejalan dengan darkMode: "class".
export type Theme = "light" | "dark";

const STORAGE_KEY = "sim_theme";

// getStoredTheme membaca pilihan tersimpan; default terang bila belum ada.
export function getStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

// applyTheme menuliskan class "dark" ke root document sesuai mode.
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// setTheme menyimpan pilihan lalu menerapkannya.
export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

// initTheme dipanggil sekali saat boot, sebelum React render, agar tidak
// ada kedip warna (flash of incorrect theme).
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
