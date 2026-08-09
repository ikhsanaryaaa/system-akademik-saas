import { useState } from "react";
import { ArrowDown, ArrowUp, Lock, Plus } from "lucide-react";
import IconActions from "../../components/IconActions";
import { JENIS_KOMPONEN, createRencana, totalBobot, updateRencana } from "../../lib/penilaian";
import type { Komponen, KonteksTerpilih, Rencana } from "../../lib/penilaian";

interface Props {
  konteks: KonteksTerpilih;
  rencana: Rencana | null;
  onTersimpan: () => void;
}

// BarisKomponen menambahkan kunci lokal supaya baris baru punya identitas stabil
// tanpa memakai index array sebagai key React.
interface BarisKomponen extends Komponen {
  kunci: string;
}

// angkaDari menjaga parse input numerik: kosong dan teks bukan angka
// dikembalikan ke fallback, bukan diam-diam jadi 0 atau NaN.
function angkaDari(teks: string, fallback: number): number {
  if (teks.trim() === "") return fallback;
  const angka = Number(teks);
  return Number.isNaN(angka) ? fallback : angka;
}

function barisBaru(urutan: number): BarisKomponen {
  return {
    kunci: crypto.randomUUID(),
    nama: "",
    jenis: "SUMATIF_LINGKUP_MATERI",
    bobot: 0,
    urutan,
    deskripsi: "",
  };
}

// RencanaTab mengelola komponen penilaian beserta bobotnya. Tombol simpan
// nonaktif selama total bobot belum 100, sesuai aturan yang juga ditegakkan server.
//
// Induk memberi key berdasarkan id rencana, jadi komponen ini di-remount saat
// konteks berganti dan state awal cukup diambil dari prop sekali lewat useState.
export default function RencanaTab({ konteks, rencana, onTersimpan }: Props) {
  const [komponen, setKomponen] = useState<BarisKomponen[]>(() =>
    rencana ? rencana.komponen.map((k) => ({ ...k, kunci: k.id ?? crypto.randomUUID() })) : []
  );
  const [kktp, setKktp] = useState(rencana?.kktp ?? 70);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const terkunci = rencana?.status === "TERKUNCI";
  const total = totalBobot(komponen);
  const bobotPas = total === 100;

  function ubah(index: number, patch: Partial<Komponen>) {
    setKomponen((lama) => lama.map((k, i) => (i === index ? { ...k, ...patch } : k)));
  }

  function tambah() {
    setKomponen((lama) => [...lama, barisBaru(lama.length)]);
  }

  function hapus(index: number) {
    setKomponen((lama) => lama.filter((_, i) => i !== index));
  }

  // Urutan disimpan sebagai kolom, jadi pemindahan cukup menukar posisi array.
  function pindah(index: number, arah: -1 | 1) {
    const tujuan = index + arah;
    if (tujuan < 0 || tujuan >= komponen.length) return;
    setKomponen((lama) => {
      const baru = [...lama];
      [baru[index], baru[tujuan]] = [baru[tujuan], baru[index]];
      return baru.map((k, i) => ({ ...k, urutan: i }));
    });
  }

  async function simpan(konfirmasi = false) {
    setMenyimpan(true);
    setPesan(null);
    // kunci hanya identitas lokal untuk key React, tidak ikut dikirim ke server.
    const payload: Komponen[] = komponen.map(({ kunci: _kunci, ...k }, i) => ({ ...k, urutan: i }));
    try {
      if (rencana) await updateRencana(rencana.id, konteks, kktp, payload, konfirmasi);
      else await createRencana(konteks, kktp, payload);
      onTersimpan();
      setPesan("Rencana penilaian tersimpan.");
    } catch (err) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      // 409 saat komponen yang dihapus masih punya nilai, tawarkan konfirmasi eksplisit.
      if (resp?.status === 409 && !konfirmasi) {
        const lanjut = window.confirm(
          `${resp.data?.message ?? "Komponen yang dihapus sudah punya nilai."}\n\nHapus komponen beserta nilainya?`
        );
        if (lanjut) {
          setMenyimpan(false);
          return simpan(true);
        }
        setPesan("Penyimpanan dibatalkan.");
      } else {
        setPesan(resp?.data?.message ?? "Gagal menyimpan rencana penilaian.");
      }
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div className="space-y-4">
      {terkunci && (
        <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm">
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span className="text-ink">
            Nilai sudah dikunci. Buka kunci di tab Rekap sebelum mengubah komponen.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-muted">KKTP</span>
          <input
            type="number"
            min={0}
            max={100}
            value={kktp}
            disabled={terkunci}
            onChange={(e) => setKktp(angkaDari(e.target.value, 0))}
            className="w-28 rounded-lg border border-hairline bg-canvas px-3 py-2 font-mono text-ink focus:border-primary focus:outline-none disabled:opacity-60"
          />
        </label>

        <div className="flex items-center gap-3">
          <span
            className={
              "rounded-lg px-3 py-2 font-mono text-sm " +
              (bobotPas ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
            }
          >
            Total bobot {total} dari 100
          </span>
          <button
            type="button"
            onClick={tambah}
            disabled={terkunci}
            className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-strong disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah komponen
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-strong text-left text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Urutan</th>
              <th className="px-3 py-2 font-medium">Nama Komponen</th>
              <th className="px-3 py-2 font-medium">Jenis</th>
              <th className="px-3 py-2 font-medium">Bobot</th>
              <th className="px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {komponen.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  Belum ada komponen. Tambahkan minimal satu komponen berbobot.
                </td>
              </tr>
            )}
            {komponen.map((k, i) => (
              <tr key={k.kunci} className="border-t border-hairline-soft">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-6 font-mono text-muted">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => pindah(i, -1)}
                      disabled={terkunci || i === 0}
                      aria-label="Naikkan urutan"
                      title="Naikkan urutan"
                      className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface-strong disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => pindah(i, 1)}
                      disabled={terkunci || i === komponen.length - 1}
                      aria-label="Turunkan urutan"
                      title="Turunkan urutan"
                      className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface-strong disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={k.nama}
                    disabled={terkunci}
                    onChange={(e) => ubah(i, { nama: e.target.value })}
                    placeholder="Contoh: Sumatif Bab 1"
                    aria-label={`Nama komponen baris ${i + 1}`}
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-ink focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={k.jenis}
                    disabled={terkunci}
                    onChange={(e) => ubah(i, { jenis: e.target.value })}
                    aria-label={`Jenis komponen baris ${i + 1}`}
                    className="rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-ink focus:border-primary focus:outline-none disabled:opacity-60"
                  >
                    {JENIS_KOMPONEN.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={k.bobot}
                    disabled={terkunci}
                    onChange={(e) => ubah(i, { bobot: angkaDari(e.target.value, 0) })}
                    aria-label={`Bobot komponen baris ${i + 1}`}
                    className="w-24 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-right font-mono text-ink focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                </td>
                <td className="px-3 py-2">{!terkunci && <IconActions onDelete={() => hapus(i)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted" role="status">
          {pesan}
        </span>
        <button
          type="button"
          onClick={() => simpan()}
          disabled={terkunci || !bobotPas || menyimpan || komponen.length === 0}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {menyimpan ? "Menyimpan..." : "Simpan rencana"}
        </button>
      </div>

      {!bobotPas && komponen.length > 0 && (
        <p className="text-sm text-danger">
          Total bobot komponen berbobot harus tepat 100 sebelum rencana bisa disimpan.
        </p>
      )}
    </div>
  );
}
