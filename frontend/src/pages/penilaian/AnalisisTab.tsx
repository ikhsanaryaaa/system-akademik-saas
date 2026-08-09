import { BarChart3 } from "lucide-react";

// AnalisisTab masih berupa slot kosong. Analisis butir soal dan sebaran nilai
// dikerjakan setelah tab lain stabil, jadi tab ini sengaja diisi empty state
// supaya susunan tab tidak berubah nanti.
export default function AnalisisTab() {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-hairline bg-canvas p-12 text-center">
      <BarChart3 className="h-10 w-10 text-muted-soft" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">Analisis belum tersedia</p>
      <p className="max-w-md text-sm text-muted">
        Sebaran nilai, ketuntasan per komponen, dan analisis butir soal akan tampil di sini.
      </p>
    </div>
  );
}
