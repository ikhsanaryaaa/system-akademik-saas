import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AlertCircle, Check, Loader2, Lock } from "lucide-react";
import { getGrid, simpanNilai } from "../../lib/penilaian";
import type { EntryNilai, GridSiswa, Rencana } from "../../lib/penilaian";

interface Props {
  rencana: Rencana | null;
}

type StatusSimpan = "diam" | "menyimpan" | "tersimpan" | "gagal";

const JEDA_SIMPAN = 2000;

// InputNilaiTab menampilkan grid siswa dikali komponen. Pengetikan ditampung
// sebagai perubahan tertunda, lalu dikirim sebagai satu batch dua detik setelah
// ketikan terakhir, bukan tiap ketikan.
export default function InputNilaiTab({ rencana }: Props) {
  const [siswa, setSiswa] = useState<GridSiswa[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [status, setStatus] = useState<StatusSimpan>("diam");
  const [pesanGagal, setPesanGagal] = useState<string | null>(null);

  const tertunda = useRef<Map<string, EntryNilai>>(new Map());
  const sebelumnya = useRef<GridSiswa[]>([]);
  const timer = useRef<number | null>(null);

  const rencanaID = rencana?.id ?? null;
  const terkunci = rencana?.status === "TERKUNCI";
  const komponen = rencana?.komponen ?? [];
  const kktp = rencana?.kktp ?? 0;

  useEffect(() => {
    if (!rencanaID) {
      setSiswa([]);
      return;
    }
    setMemuat(true);
    getGrid(rencanaID)
      .then((g) => setSiswa(g.siswa))
      .catch(() => setSiswa([]))
      .finally(() => setMemuat(false));
  }, [rencanaID]);

  const kirimBatch = useCallback(async () => {
    if (!rencanaID || tertunda.current.size === 0) return;
    const entries = [...tertunda.current.values()];
    tertunda.current.clear();
    setStatus("menyimpan");
    setPesanGagal(null);
    try {
      const hasil = await simpanNilai(rencanaID, entries);
      // Nilai akhir dihitung server, jadi kolomnya diperbarui dari response.
      setSiswa((lama) =>
        lama.map((s) => {
          const akhir = hasil.nilai_akhir.find((a) => a.siswa_id === s.siswa_id);
          return akhir ? { ...s, nilai_akhir: akhir.nilai, predikat: akhir.predikat } : s;
        })
      );
      setStatus("tersimpan");
    } catch (err) {
      // Rollback ke kondisi sebelum perubahan tertunda supaya layar tidak
      // menampilkan angka yang sebenarnya tidak tersimpan.
      setSiswa(sebelumnya.current);
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      setPesanGagal(resp?.data?.message ?? "Gagal menyimpan nilai.");
      setStatus("gagal");
    }
  }, [rencanaID]);

  const jadwalkanSimpan = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void kirimBatch();
    }, JEDA_SIMPAN);
  }, [kirimBatch]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const ubahNilai = useCallback(
    (siswaID: string, komponenID: string, nilai: number | null) => {
      setSiswa((lama) => {
        // Snapshot sebelum perubahan pertama pada batch berjalan, dipakai rollback.
        if (tertunda.current.size === 0) sebelumnya.current = lama;
        tertunda.current.set(`${siswaID}:${komponenID}`, {
          siswa_id: siswaID,
          komponen_id: komponenID,
          nilai,
        });
        return lama.map((s) =>
          s.siswa_id === siswaID ? { ...s, nilai: { ...s.nilai, [komponenID]: nilai } } : s
        );
      });
      setStatus("diam");
      jadwalkanSimpan();
    },
    [jadwalkanSimpan]
  );

  if (!rencana) {
    return (
      <p className="rounded-xl border border-hairline bg-canvas p-8 text-center text-sm text-muted">
        Rencana penilaian belum dibuat untuk konteks ini. Buat dulu di tab Rencana Penilaian.
      </p>
    );
  }

  if (memuat) {
    return <p className="p-6 text-center text-sm text-muted">Memuat grid nilai...</p>;
  }

  return (
    <div className="space-y-3">
      {terkunci && (
        <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm">
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span className="text-ink">
            Nilai sudah dikunci sehingga grid bersifat read-only. Buka kunci di tab Rekap untuk
            mengubah.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Tab pindah kolom, Enter pindah baris, panah untuk arah bebas, Escape membatalkan edit sel.
        </p>
        <IndikatorStatus status={status} pesanGagal={pesanGagal} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-strong text-left text-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-surface-strong px-3 py-2 font-medium">Siswa</th>
              {komponen.map((k) => (
                <th key={k.id} className="px-3 py-2 text-center font-medium">
                  <span className="block">{k.nama}</span>
                  <span className="block font-mono text-xs text-muted-soft">bobot {k.bobot}</span>
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium">Nilai Akhir</th>
            </tr>
          </thead>
          <tbody>
            {siswa.length === 0 && (
              <tr>
                <td colSpan={komponen.length + 2} className="px-3 py-8 text-center text-muted">
                  Belum ada siswa pada kelas ini.
                </td>
              </tr>
            )}
            {siswa.map((s, baris) => (
              <tr key={s.siswa_id} className="border-t border-hairline-soft">
                <td className="sticky left-0 z-10 bg-canvas px-3 py-2">
                  <span className="block text-ink">{s.nama}</span>
                  <span className="block font-mono text-xs text-muted">{s.nis}</span>
                </td>
                {komponen.map((k, kolom) => (
                  <SelNilai
                    key={k.id}
                    baris={baris}
                    kolom={kolom}
                    nilai={s.nilai[k.id ?? ""] ?? null}
                    kktp={kktp}
                    terkunci={Boolean(terkunci)}
                    siswaID={s.siswa_id}
                    komponenID={k.id ?? ""}
                    onUbah={ubahNilai}
                  />
                ))}
                <td className="px-3 py-2 text-center">
                  <span className="font-mono text-ink">{s.nilai_akhir.toFixed(2)}</span>
                  {s.predikat && (
                    <span className="ml-2 rounded bg-surface-strong px-1.5 py-0.5 text-xs text-muted">
                      {s.predikat}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndikatorStatus({
  status,
  pesanGagal,
}: {
  status: StatusSimpan;
  pesanGagal: string | null;
}) {
  if (status === "menyimpan") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Menyimpan
      </span>
    );
  }
  if (status === "tersimpan") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-success" role="status">
        <Check className="h-4 w-4" aria-hidden="true" />
        Tersimpan
      </span>
    );
  }
  if (status === "gagal") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-danger" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        {pesanGagal ?? "Gagal menyimpan"}
      </span>
    );
  }
  return <span className="text-sm text-muted-soft">Perubahan tersimpan otomatis</span>;
}

// SelNilai memegang teksnya sendiri supaya pengetikan pada satu sel tidak
// memicu render ulang seluruh tabel. Perubahan dilaporkan ke induk saat commit.
const SelNilai = memo(function SelNilai({
  baris,
  kolom,
  nilai,
  kktp,
  terkunci,
  siswaID,
  komponenID,
  onUbah,
}: {
  baris: number;
  kolom: number;
  nilai: number | null;
  kktp: number;
  terkunci: boolean;
  siswaID: string;
  komponenID: string;
  onUbah: (siswaID: string, komponenID: string, nilai: number | null) => void;
}) {
  const [teks, setTeks] = useState(nilai === null ? "" : String(nilai));

  useEffect(() => {
    setTeks(nilai === null ? "" : String(nilai));
  }, [nilai]);

  function commit() {
    const bersih = teks.trim();
    const baru = bersih === "" ? null : Number(bersih);
    if (baru !== null && (Number.isNaN(baru) || baru < 0 || baru > 100)) {
      setTeks(nilai === null ? "" : String(nilai));
      return;
    }
    if (baru !== nilai) onUbah(siswaID, komponenID, baru);
  }

  function fokusKe(barisTujuan: number, kolomTujuan: number) {
    const target = document.querySelector<HTMLInputElement>(
      `input[data-baris="${barisTujuan}"][data-kolom="${kolomTujuan}"]`
    );
    target?.focus();
    target?.select();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setTeks(nilai === null ? "" : String(nilai));
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      commit();
      fokusKe(baris + 1, kolom);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      commit();
      fokusKe(baris - 1, kolom);
      return;
    }
    // Panah kiri dan kanan hanya berpindah sel saat kursor sudah di ujung teks,
    // supaya navigasi di dalam angka tetap normal.
    const input = e.currentTarget;
    if (e.key === "ArrowRight" && input.selectionStart === teks.length) {
      e.preventDefault();
      commit();
      fokusKe(baris, kolom + 1);
      return;
    }
    if (e.key === "ArrowLeft" && input.selectionStart === 0) {
      e.preventDefault();
      commit();
      fokusKe(baris, kolom - 1);
    }
  }

  const kosong = nilai === null;
  const dibawahKktp = nilai !== null && nilai < kktp;

  return (
    <td className="px-1 py-1 text-center">
      <input
        data-baris={baris}
        data-kolom={kolom}
        value={teks}
        disabled={terkunci}
        onChange={(e) => setTeks(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        inputMode="decimal"
        aria-label={dibawahKktp ? "Nilai di bawah KKTP" : kosong ? "Belum dinilai" : "Nilai"}
        title={dibawahKktp ? "Di bawah KKTP" : kosong ? "Belum dinilai" : undefined}
        className={
          "w-20 rounded-md border px-2 py-1.5 text-center font-mono focus:border-primary focus:outline-none disabled:opacity-60 " +
          (kosong
            ? "border-dashed border-hairline bg-surface-strong text-muted"
            : dibawahKktp
              ? "border-danger bg-danger-soft text-danger"
              : "border-hairline bg-canvas text-ink")
        }
      />
    </td>
  );
});
