import { useCallback, useEffect, useState, type ReactNode } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { fmtDate, fmtDateTime } from "../../lib/format";
import { leaveStatusLabel, type PiketReport } from "../../lib/piket";

const today = () => new Date().toISOString().slice(0, 10);

// PiketReportPage menyusun laporan piket untuk kepala sekolah dan wakil
// kurikulum. Datanya hanya dibaca, tidak ada tabel laporan tersendiri.
export default function PiketReportPage() {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [data, setData] = useState<PiketReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<PiketReport>>("/piket/report", { params: { start, end } });
      setData(res.data.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Laporan Piket</h1>
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
          <label htmlFor="report-start" className="block text-sm font-medium text-body">
            Tanggal Mulai
          </label>
          <input
            id="report-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 font-mono text-sm"
          />
        </div>
        <div>
          <label htmlFor="report-end" className="block text-sm font-medium text-body">
            Tanggal Akhir
          </label>
          <input
            id="report-end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 font-mono text-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Memuat...</p>
      ) : !data ? (
        <p className="mt-6 text-sm text-muted">Laporan tidak tersedia.</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-hairline bg-canvas p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Periode</p>
            <p className="font-mono text-sm text-ink">
              {fmtDate(data.start)} sampai {fmtDate(data.end)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Terlambat" value={data.summary.lateness_count} />
            <Stat label="Total Menit" value={data.summary.lateness_minutes} />
            <Stat label="Izin Keluar" value={data.summary.permit_count} />
            <Stat label="Belum Kembali" value={data.summary.permit_still_out} />
            <Stat label="Pelanggaran" value={data.summary.violation_count} />
            <Stat label="Tamu" value={data.summary.guest_count} />
          </div>

          <Section title="Keterlambatan" count={data.lateness.length}>
            <Table head={["Tanggal", "Siswa", "Kelas", "Menit", "Petugas"]}>
              {data.lateness.map((l) => (
                <tr key={l.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-mono">{fmtDate(l.date)}</td>
                  <td className="px-4 py-3 text-ink">{l.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{l.class?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{l.minutes}</td>
                  <td className="px-4 py-3">{l.officer_teacher?.name ?? l.officer ?? "-"}</td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Izin Keluar" count={data.permits.length}>
            <Table head={["Siswa", "Kelas", "Keluar", "Kembali", "Status"]}>
              {data.permits.map((p) => (
                <tr key={p.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{p.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{p.class?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(p.leave_time)}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(p.return_time)}</td>
                  <td className="px-4 py-3">{leaveStatusLabel[p.status] ?? p.status}</td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Pelanggaran" count={data.violations.length}>
            <Table head={["Tanggal", "Siswa", "Jenis", "Poin"]}>
              {data.violations.map((v) => (
                <tr key={v.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-mono">{fmtDate(v.date)}</td>
                  <td className="px-4 py-3 text-ink">{v.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{v.violation_type?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{v.violation_type?.point ?? 0}</td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Buku Tamu" count={data.guests.length}>
            <Table head={["Nama", "Instansi", "Keperluan", "Masuk", "Keluar"]}>
              {data.guests.map((g) => (
                <tr key={g.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{g.name}</td>
                  <td className="px-4 py-3">{g.institution || "-"}</td>
                  <td className="px-4 py-3">{g.purpose || "-"}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(g.check_in_time)}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(g.check_out_time)}</td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Catatan Kejadian" count={data.logs.length}>
            <Table head={["Tanggal", "Petugas", "Kejadian", "Tindakan"]}>
              {data.logs.map((l) => (
                <tr key={l.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-mono">{fmtDate(l.date)}</td>
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
