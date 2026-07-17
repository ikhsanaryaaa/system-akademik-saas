import { useEffect, useRef, useState } from "react";
import { CalendarRange, Check, ChevronDown } from "lucide-react";
import { useAcademicYear } from "../../context/AcademicYearContext";

// AcademicYearSelector adalah dropdown kustom untuk memilih tahun ajaran aktif.
// Menggantikan native select agar tampilan konsisten lintas platform, angka
// tahun tampil monospace, dan status "aktif" ditandai badge (bukan hanya teks).
export default function AcademicYearSelector() {
  const { years, activeId, setActiveId } = useAcademicYear();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = years.find((y) => y.id === activeId) ?? years[0];

  // Tutup saat klik di luar area atau menekan Escape.
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

  if (years.length === 0) return null;

  function choose(id: string) {
    setActiveId(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Pilih tahun ajaran aktif"
        className="flex h-9 items-center gap-2 rounded-md border border-hairline bg-canvas pl-2.5 pr-2 text-left transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <CalendarRange className="h-[18px] w-[18px] shrink-0 text-muted" />
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Tahun Ajaran</span>
          <span className="mt-0.5 font-mono text-[13px] font-semibold text-ink">{active?.name}</span>
        </span>
        <span className="font-mono text-sm font-semibold text-ink sm:hidden">{active?.name}</span>
        {active?.is_active && (
          <span className="hidden items-center gap-1 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Aktif
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 max-h-72 w-64 overflow-auto rounded-lg border border-hairline bg-canvas py-1 shadow-md"
        >
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Tahun Ajaran
          </p>
          {years.map((y) => {
            const selected = y.id === activeId;
            return (
              <button
                key={y.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(y.id)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "bg-primary-soft font-semibold text-primary"
                    : "text-body hover:bg-surface-soft hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check className={`h-4 w-4 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`} />
                  <span className="font-mono">{y.name}</span>
                </span>
                {y.is_active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Aktif
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
