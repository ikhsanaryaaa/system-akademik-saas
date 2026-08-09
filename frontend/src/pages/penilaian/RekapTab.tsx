import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Lock, LockOpen, Upload } from "lucide-react";
import IconActions from "../../components/IconActions";
import {
  bukaKunciNilai,
  getRekap,
  imporNilai,
  kunciNilai,
  unduhTemplate,
} from "../../lib/penilaian";
import type { HasilImpor, KonteksTerpilih, RekapResponse, Rencana } from "../../lib/penilaian";

interface Props {
  konteks: KonteksTerpilih;
  rencana: Rencana | null;
  onBerubah: () => void;
}

// RekapTab menampilkan nilai akhir seluruh siswa beserta statistik ringkas,
// dan menjadi tempat tombol kunci nilai.
export default function RekapTab({ konteks, rencana, onBerubah }: Props) {
  const [rekap, setRekap] = useState<RekapResponse | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [hasilImpor, setHasilImpor] = useState<HasilImpor | null>(null);
  const [mengimpor, setMengimpor] = useState(false);
  const berkasRef = useRef<HTMLInputElement>(null);

  const rencanaID = rencana?.id ?? null;
  const terkunci = rencana?.status === "TERKUNCI";

  const muat = useCallback(() => {
    if (!rencanaID) {
      setRekap(null);
      return;
    }
    setMemuat(true);
    getRekap(rencanaID)
      .then(setRekap)
      .catch(() => setRekap(null))
      .finally(() => setMemuat(false));
  }, [rencanaID]);

  useEffect(muat, [muat]);

  async function ubahKunci() {
    if (!rencanaID) return;
    setPesan(null);
    try {
      if (terkunci) await bukaKunciNilai(rencanaID);
      else await kunciNilai(rencanaID);
      onBerubah();
      muat();
    } catch (err) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      if (resp?.status === 403) {
        setPesan("Hanya Administrator dan Wakil Kurikulum yang bisa membuka kunci nilai.");
      } else {
        setPesan(resp?.data?.message ?? "Aksi gagal.");
      }
    }
  }

  async function pilihBerkas(berkas: File | undefined) {
    if (!berkas || !rencanaID) return;
    setMengimpor(true);
    setPesan(null);
    setHasilImpor(null);
    try {
      const hasil = await imporNilai(rencanaID, berkas);
      setHasilImpor(hasil);
      muat();
    } catch (err) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      setPesan(resp?.data?.message ?? "Impor gagal.");
    } finally {
      setMengimpor(false);
      if (berkasRef.current) berkasRef.current.value = "";
    }
  }

  function cetakSiswa(siswaID: string) {
    const url =
      `/penilaian/siswa/${siswaID}/cetak` +
      `?tahun=${konteks.tahun_ajaran_id}&semester=${konteks.semester}`;
    window.open(url, "_blank", "noopener");
  }

  if (!rencana) {
    return (
      <p className="rounded-xl border border-hairline bg-canvas p-8 text-center text-sm text-muted">
        Rencana penilaian belum dibuat untuk konteks ini.
      </p>
    );
  }

  if (memuat || !rekap) {
    return <p className="p-6 text-center text-sm text-muted">Memuat rekap nilai...</p>;
  }

  const s = rekap.statistik;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Statistik label="Rata-rata" nilai={s.rata_rata.toFixed(2)} />
          <Statistik label="Tertinggi" nilai={s.tertinggi.toFixed(2)} />
          <Statistik label="Tuntas" nilai={`${s.tuntas} dari ${s.jumlah_siswa}`} />
          <Statistik label="Belum tuntas" nilai={String(s.belum_tuntas)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => rencanaID && unduhTemplate(rencanaID)}
            className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Unduh template
          </button>

          <input
            ref={berkasRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            aria-label="Pilih file Excel untuk diimpor"
            onChange={(e) => void pilihBerkas(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => berkasRef.current?.click()}
            disabled={terkunci || mengimpor}
            className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-strong disabled:opacity-50"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {mengimpor ? "Mengimpor..." : "Impor Excel"}
          </button>

          <button
            type="button"
            onClick={ubahKunci}
            className={
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium " +
              (terkunci
                ? "border border-hairline text-ink hover:bg-surface-strong"
                : "bg-primary text-white hover:bg-primary-hover")
            }
          >
            {terkunci ? (
              <>
                <LockOpen className="h-4 w-4" aria-hidden="true" />
                Buka kunci nilai
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" />
                Kunci nilai
              </>
            )}
          </button>
        </div>
      </div>

      {pesan && (
        <p
          className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {pesan}
        </p>
      )}

      {terkunci && (
        <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm">
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span className="text-ink">Nilai terkunci. Grid input bersifat read-only.</span>
        </div>
      )}

      {hasilImpor && (
        <div className="rounded-lg border border-hairline bg-canvas p-4 text-sm" role="status">
          <p className="font-medium text-ink">
            Impor selesai: {hasilImpor.tersimpan} nilai tersimpan pada{" "}
            {hasilImpor.siswa_diubah} siswa.
          </p>
          {hasilImpor.baris_gagal.length > 0 ? (
            <>
              <p className="mt-2 text-danger">
                {hasilImpor.baris_gagal.length} baris dilewati karena tidak valid:
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                {hasilImpor.baris_gagal.map((b) => (
                  <li key={`${b.baris}-${b.nis}`}>
                    Baris <span className="font-mono">{b.baris}</span> (NIS{" "}
                    <span className="font-mono">{b.nis}</span>): {b.alasan}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-success">Semua baris berhasil diproses.</p>
          )}
        </div>
      )}

      <p className="text-sm text-muted">
        Rata-rata menghitung siswa yang belum dinilai sebagai nol, jadi angkanya masih rendah selama
        grid belum terisi penuh.
      </p>

      <div className="overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-strong text-left text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Siswa</th>
              <th className="px-3 py-2 text-center font-medium">Nilai Akhir</th>
              <th className="px-3 py-2 text-center font-medium">Predikat</th>
              <th className="px-3 py-2 text-center font-medium">Ketuntasan</th>
              <th className="px-3 py-2 font-medium">Deskripsi Capaian</th>
              <th className="px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rekap.siswa.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
                  Belum ada siswa pada kelas ini.
                </td>
              </tr>
            )}
            {rekap.siswa.map((r) => (
              <tr key={r.siswa_id} className="border-t border-hairline-soft">
                <td className="px-3 py-2">
                  <span className="block text-ink">{r.nama}</span>
                  <span className="block font-mono text-xs text-muted">{r.nis}</span>
                </td>
                <td className="px-3 py-2 text-center font-mono text-ink">{r.nilai.toFixed(2)}</td>
                <td className="px-3 py-2 text-center font-mono text-ink">{r.predikat}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " +
                      (r.tuntas ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
                    }
                  >
                    <span
                      className={
                        "h-1.5 w-1.5 rounded-full " + (r.tuntas ? "bg-success" : "bg-danger")
                      }
                      aria-hidden="true"
                    />
                    {r.tuntas ? "Tuntas" : "Belum tuntas"}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted">{r.deskripsi || "-"}</td>
                <td className="px-3 py-2">
                  <IconActions onPrint={() => cetakSiswa(r.siswa_id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Statistik({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2">
      <span className="block text-xs text-muted">{label}</span>
      <span className="block font-mono text-base text-ink">{nilai}</span>
    </div>
  );
}
