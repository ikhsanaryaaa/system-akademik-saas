import { useCallback, useEffect, useState, type ReactNode } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { fmtDate, fmtDateTime } from "../../lib/format";
import type { PiketToday } from "../../lib/piket";
import { useAuth } from "../../context/AuthContext";

const today = () => new Date().toISOString().slice(0, 10);

// PiketTodayPage adalah layar kerja harian guru piket. Isinya menyusun ulang
// data yang sudah ada, tidak menambah tabel baru.
export default function PiketTodayPage() {
  const { can } = useAuth();
  const [date, setDate] = useState(today);
  const [data, setData] = useState<PiketToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<PiketToday>>("/piket/today", { params: { date } });
      setData(res.data.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(url: string) {
    if (saving) return;
    setSaving(true);
    try {
      await http.put(url);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const canUpdate = can("piket.update");

  return (
    <div>
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Piket Hari Ini</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
        >
          Cetak
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4 print:hidden">
        <div>
          <label htmlFor="piket-date" className="block text-sm font-medium text-body">
            Tanggal
          </label>
          <input
            id="piket-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 font-mono text-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Memuat...</p>
      ) : !data ? (
        <p className="mt-6 text-sm text-muted">Data piket tidak tersedia.</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-canvas p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Petugas Piket</p>
              <p className="text-lg font-semibold text-ink">
                {data.officer?.name ?? "Belum ada jadwal untuk tanggal ini"}
              </p>
            </div>
            <p className="ml-auto font-mono text-sm text-muted">{fmtDate(data.date)}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Terlambat" value={data.lateness.length} />
            <Stat label="Sedang di Luar" value={data.outside.length} />
            <Stat label="Tamu di Dalam" value={data.guests.length} />
            <Stat label="Pelanggaran" value={data.violations.length} />
          </div>

          <Section title="Siswa Terlambat" count={data.lateness.length}>
            <Table head={["Siswa", "Kelas", "Menit", "Alasan"]}>
              {data.lateness.map((l) => (
                <tr key={l.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{l.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{l.class?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{l.minutes}</td>
                  <td className="px-4 py-3">{l.reason || "-"}</td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Siswa Sedang di Luar" count={data.outside.length}>
            <Table head={["Siswa", "Kelas", "Jam Keluar", "Alasan", ...(canUpdate ? ["Aksi"] : [])]}>
              {data.outside.map((p) => (
                <tr key={p.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{p.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{p.class?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(p.leave_time)}</td>
                  <td className="px-4 py-3">{p.reason || "-"}</td>
                  {canUpdate && (
                    <td className="px-4 py-3 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => act(`/leave-permits/${p.id}/return`)}
                        disabled={saving}
                        className="text-primary hover:underline disabled:opacity-50"
                      >
                        Catat Kembali
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Tamu Belum Keluar" count={data.guests.length}>
            <Table head={["Nama", "Instansi", "Keperluan", "Jam Masuk", ...(canUpdate ? ["Aksi"] : [])]}>
              {data.guests.map((g) => (
                <tr key={g.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{g.name}</td>
                  <td className="px-4 py-3">{g.institution || "-"}</td>
                  <td className="px-4 py-3">{g.purpose || "-"}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(g.check_in_time)}</td>
                  {canUpdate && (
                    <td className="px-4 py-3 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => act(`/guest-book/${g.id}/checkout`)}
                        disabled={saving}
                        className="text-primary hover:underline disabled:opacity-50"
                      >
                        Catat Keluar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Pelanggaran Dicatat" count={data.violations.length}>
            <Table head={["Siswa", "Jenis", "Poin", "Keterangan"]}>
              {data.violations.map((v) => (
                <tr key={v.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{v.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{v.violation_type?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{v.violation_type?.point ?? 0}</td>
                  <td className="px-4 py-3">{v.description || "-"}</td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Catatan Kejadian" count={data.logs.length}>
            <Table head={["Petugas", "Kejadian", "Tindakan"]}>
              {data.logs.map((l) => (
                <tr key={l.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{l.teacher?.name ?? "-"}</td>
                  <td className="px-4 py-3">{l.incident || "-"}</td>
                  <td className="px-4 py-3">{l.action || "-"}</td>
                </tr>
              ))}
            </Table>
          </Section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="font-mono text-xs text-muted">{count} data</span>
      </div>
      {count === 0 ? <p className="px-4 py-6 text-center text-sm text-muted">Belum ada data.</p> : children}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
