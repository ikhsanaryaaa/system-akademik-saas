import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { getRaport } from "../../lib/penilaian";
import type { Raport } from "../../lib/penilaian";

// CetakRaportPage adalah halaman siap cetak berisi nilai seluruh mata pelajaran
// seorang siswa pada satu semester. Halaman ini berada di luar AppShell supaya
// tidak ada sidebar dan top bar yang perlu disembunyikan saat dicetak.
export default function CetakRaportPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [raport, setRaport] = useState<Raport | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const tahunID = params.get("tahun") ?? "";
  const semester = Number(params.get("semester") ?? "1");

  useEffect(() => {
    if (!id || !tahunID) {
      setGalat("Konteks raport tidak lengkap.");
      return;
    }
    getRaport(id, tahunID, semester)
      .then(setRaport)
      .catch(() => setGalat("Gagal memuat data raport."));
  }, [id, tahunID, semester]);

  if (galat) {
    return <p className="p-8 text-center text-sm text-danger">{galat}</p>;
  }
  if (!raport) {
    return <p className="p-8 text-center text-sm text-muted">Memuat raport...</p>;
  }

  return (
    <div className="mx-auto max-w-[210mm] bg-canvas p-8 text-ink print:p-0">
      <button
        type="button"
        onClick={() => window.print()}
        className="mb-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover print:hidden"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Cetak
      </button>

      <header className="mb-6 border-b-2 border-ink pb-4 text-center">
        <h1 className="text-lg font-bold uppercase">Laporan Hasil Belajar</h1>
        <p className="text-sm">
          Semester {raport.semester} Tahun Ajaran {raport.tahun_ajaran}
        </p>
      </header>

      <dl className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <Baris label="Nama" nilai={raport.siswa.nama} />
        <Baris label="Kelas" nilai={raport.siswa.kelas} />
        <Baris label="NIS" nilai={raport.siswa.nis} mono />
        <Baris label="NISN" nilai={raport.siswa.nisn} mono />
      </dl>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-ink">
            <th className="w-10 px-2 py-2 text-left font-semibold">No</th>
            <th className="px-2 py-2 text-left font-semibold">Mata Pelajaran</th>
            <th className="w-24 px-2 py-2 text-center font-semibold">Pengetahuan</th>
            <th className="w-24 px-2 py-2 text-center font-semibold">Keterampilan</th>
            <th className="px-2 py-2 text-left font-semibold">Deskripsi Capaian</th>
          </tr>
        </thead>
        <tbody>
          {raport.mata_pelajaran.length === 0 && (
            <tr>
              <td colSpan={5} className="px-2 py-6 text-center text-muted">
                Belum ada nilai raport pada semester ini.
              </td>
            </tr>
          )}
          {raport.mata_pelajaran.map((m, i) => (
            <tr key={m.mata_pelajaran} className="break-inside-avoid border-b border-hairline">
              <td className="px-2 py-2 font-mono">{i + 1}</td>
              <td className="px-2 py-2">{m.mata_pelajaran}</td>
              <td className="px-2 py-2 text-center font-mono">{m.pengetahuan.toFixed(2)}</td>
              <td className="px-2 py-2 text-center font-mono">{m.keterampilan.toFixed(2)}</td>
              <td className="px-2 py-2">{m.deskripsi || "-"}</td>
            </tr>
          ))}
        </tbody>
        {raport.mata_pelajaran.length > 0 && (
          <tfoot>
            <tr className="border-t border-ink font-semibold">
              <td className="px-2 py-2" colSpan={2}>
                Rata-rata
              </td>
              <td className="px-2 py-2 text-center font-mono">{raport.rata_rata.toFixed(2)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>

      <div className="mt-16 flex break-inside-avoid justify-end">
        <div className="w-64 text-center text-sm">
          <p>Wali Kelas</p>
          <div className="mt-20 border-t border-ink pt-1">
            <p>Nama dan Tanda Tangan</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Baris({ label, nilai, mono }: { label: string; nilai: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className={mono ? "font-mono" : undefined}>: {nilai || "-"}</dd>
    </div>
  );
}
