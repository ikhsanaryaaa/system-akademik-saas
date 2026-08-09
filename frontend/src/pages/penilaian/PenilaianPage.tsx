import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { getRencana, listKonteks } from "../../lib/penilaian";
import type { Konteks, KonteksTerpilih, Rencana } from "../../lib/penilaian";
import RencanaTab from "./RencanaTab";
import InputNilaiTab from "./InputNilaiTab";
import RekapTab from "./RekapTab";
import AnalisisTab from "./AnalisisTab";

const TABS = [
  { key: "rencana", label: "Rencana Penilaian" },
  { key: "input", label: "Input Nilai" },
  { key: "rekap", label: "Rekap dan Nilai Akhir" },
  { key: "analisis", label: "Analisis" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Kunci localStorage diberi versi supaya bentuk data lama tidak dibaca sebagai
// bentuk baru kalau strukturnya berubah nanti.
const STORAGE_KEY = "penilaian_konteks_v1";

// PenilaianPage adalah kerangka modul Penilaian: context bar sticky berisi empat
// dropdown cascading, lalu empat tab di bawahnya. Pilihan konteks disimpan di URL
// search params supaya bisa di-bookmark, tahan refresh, dan dua tab browser tidak
// saling menimpa konteks satu sama lain.
export default function PenilaianPage() {
  const { years, activeId } = useAcademicYear();
  const [params, setParams] = useSearchParams();
  const [konteks, setKonteks] = useState<Konteks[]>([]);
  const [rencana, setRencana] = useState<Rencana | null>(null);
  const [memuat, setMemuat] = useState(false);

  const tahunID = params.get("tahun") ?? activeId ?? "";
  const semester = Number(params.get("semester") ?? "1");
  const mapelID = params.get("mapel") ?? "";
  const kelasID = params.get("kelas") ?? "";
  const tab = (params.get("tab") as TabKey) ?? "input";

  const ubahParam = useCallback(
    (patch: Record<string, string>) => {
      setParams(
        (lama) => {
          const baru = new URLSearchParams(lama);
          for (const [k, v] of Object.entries(patch)) {
            if (v) baru.set(k, v);
            else baru.delete(k);
          }
          return baru;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  useEffect(() => {
    listKonteks()
      .then(setKonteks)
      .catch(() => setKonteks([]));
  }, []);

  // Pulihkan konteks terakhir dari localStorage saat URL masih kosong.
  useEffect(() => {
    if (mapelID || kelasID) return;
    const simpanan = localStorage.getItem(STORAGE_KEY);
    if (!simpanan) return;
    try {
      const k = JSON.parse(simpanan) as Partial<KonteksTerpilih>;
      ubahParam({
        tahun: k.tahun_ajaran_id ?? "",
        semester: String(k.semester ?? 1),
        mapel: k.mata_pelajaran_id ?? "",
        kelas: k.kelas_id ?? "",
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [mapelID, kelasID, ubahParam]);

  const mapelOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const k of konteks) seen.set(k.mata_pelajaran_id, k.mata_pelajaran);
    return [...seen].map(([id, nama]) => ({ id, nama }));
  }, [konteks]);

  // Kelas dibatasi ke mata pelajaran yang sedang dipilih, jadi dropdown ini cascading.
  const kelasOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const k of konteks) {
      if (mapelID && k.mata_pelajaran_id !== mapelID) continue;
      seen.set(k.kelas_id, k.kelas);
    }
    return [...seen].map(([id, nama]) => ({ id, nama }));
  }, [konteks, mapelID]);

  // Kalau hanya ada satu opsi, pilih otomatis supaya guru tidak perlu memilih.
  useEffect(() => {
    if (!mapelID && mapelOptions.length === 1) ubahParam({ mapel: mapelOptions[0].id });
  }, [mapelID, mapelOptions, ubahParam]);

  useEffect(() => {
    if (!kelasID && kelasOptions.length === 1) ubahParam({ kelas: kelasOptions[0].id });
  }, [kelasID, kelasOptions, ubahParam]);

  const konteksLengkap = Boolean(tahunID && semester && mapelID && kelasID);

  const konteksTerpilih: KonteksTerpilih | null = konteksLengkap
    ? { tahun_ajaran_id: tahunID, semester, mata_pelajaran_id: mapelID, kelas_id: kelasID }
    : null;

  const muatRencana = useCallback(() => {
    if (!(tahunID && semester && mapelID && kelasID)) {
      setRencana(null);
      return;
    }
    const k: KonteksTerpilih = {
      tahun_ajaran_id: tahunID,
      semester,
      mata_pelajaran_id: mapelID,
      kelas_id: kelasID,
    };
    setMemuat(true);
    getRencana(k)
      .then(setRencana)
      .catch(() => setRencana(null))
      .finally(() => setMemuat(false));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(k));
  }, [tahunID, semester, mapelID, kelasID]);

  useEffect(muatRencana, [muatRencana]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-ink">Penilaian</h1>
        <p className="text-sm text-muted">
          Susun rencana penilaian, isi nilai per komponen, dan kunci nilai setelah final.
        </p>
      </header>

      <div className="sticky top-0 z-10 rounded-xl border border-hairline bg-canvas p-3 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Pilihan label="Tahun Ajaran" value={tahunID} onChange={(v) => ubahParam({ tahun: v })}>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </Pilihan>

          <Pilihan
            label="Semester"
            value={String(semester)}
            onChange={(v) => ubahParam({ semester: v })}
          >
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </Pilihan>

          {mapelOptions.length > 1 && (
            <Pilihan
              label="Mata Pelajaran"
              value={mapelID}
              onChange={(v) => ubahParam({ mapel: v, kelas: "" })}
            >
              <option value="">Pilih mata pelajaran</option>
              {mapelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ))}
            </Pilihan>
          )}

          {kelasOptions.length > 1 && (
            <Pilihan label="Kelas" value={kelasID} onChange={(v) => ubahParam({ kelas: v })}>
              <option value="">Pilih kelas</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </Pilihan>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-hairline" role="tablist">
        {TABS.map((t) => {
          const aktif = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={aktif}
              onClick={() => ubahParam({ tab: t.key })}
              className={
                "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors " +
                (aktif
                  ? "border-b-2 border-primary bg-surface-strong text-primary"
                  : "text-muted hover:bg-surface-strong hover:text-ink")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {!konteksTerpilih ? (
        <p className="rounded-xl border border-hairline bg-canvas p-6 text-center text-sm text-muted">
          Pilih tahun ajaran, semester, mata pelajaran, dan kelas untuk mulai.
        </p>
      ) : memuat ? (
        <p className="p-6 text-center text-sm text-muted">Memuat data penilaian...</p>
      ) : (
        <>
          {tab === "rencana" && (
            <RencanaTab
              key={rencana?.id ?? "rencana-baru"}
              konteks={konteksTerpilih}
              rencana={rencana}
              onTersimpan={muatRencana}
            />
          )}
          {tab === "input" && <InputNilaiTab rencana={rencana} />}
          {tab === "rekap" && <RekapTab rencana={rencana} onBerubah={muatRencana} />}
          {tab === "analisis" && <AnalisisTab />}
        </>
      )}
    </div>
  );
}

function Pilihan({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-ink focus:border-primary focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}
