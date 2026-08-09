import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { bukaKunciNilai, getRekap, kunciNilai } from "../../lib/penilaian";
import type { RekapResponse, Rencana } from "../../lib/penilaian";

interface Props {
  rencana: Rencana | null;
  onBerubah: () => void;
}

// RekapTab menampilkan nilai akhir seluruh siswa beserta statistik ringkas,
// dan menjadi tempat tombol kunci nilai.
export default function RekapTab({ rencana, onBerubah }: Props) {
  const [rekap, setRekap] = useState<RekapResponse | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

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
            </tr>
          </thead>
          <tbody>
            {rekap.siswa.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
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
