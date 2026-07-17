import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

// NotificationButton adalah tombol lonceng di top bar dengan panel dropdown.
// Untuk saat ini isinya placeholder (UI saja); data notifikasi disambungkan nanti.
export default function NotificationButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifikasi"
        title="Notifikasi"
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-canvas active:scale-95"
      >
        <Bell className="h-[18px] w-[18px]" />
        {/* Titik penanda ada notifikasi belum dibaca. */}
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-canvas bg-danger" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-md"
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifikasi</p>
            <span className="text-xs text-muted">Belum dibaca</span>
          </div>
          <div className="grid place-items-center px-4 py-8 text-center">
            <Bell className="h-6 w-6 text-muted-soft" />
            <p className="mt-2 text-sm text-muted">Belum ada notifikasi.</p>
          </div>
        </div>
      )}
    </div>
  );
}
