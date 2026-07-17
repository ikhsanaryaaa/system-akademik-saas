import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type ClassRow } from "../../lib/master";
import {
  statusBadgeClass,
  type StudentAttendanceReportRow,
} from "../../lib/attendance";

function isoDate(v: string): string {
  return v ? v.slice(0, 10) : "";
}

export default function AttendanceReportPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rows, setRows] = useState<StudentAttendanceReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (classId) params.class_id = classId;
      if (start) params.start = start;
      if (end) params.end = end;
      const res = await http.get<ApiResponse<StudentAttendanceReportRow[]>>(
        "/attendance/students/report",
        { params }
      );
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, start, end]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Laporan Absensi</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4">
        <div>
          <label htmlFor="report-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select
            id="report-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="report-start" className="block text-sm font-medium text-body">
            Dari
          </label>
          <input
            id="report-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="report-end" className="block text-sm font-medium text-body">
            Sampai
          </label>
          <input
            id="report-end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada data absensi.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 font-mono">{isoDate(r.date)}</td>
                  <td className="px-4 py-3 text-ink">{r.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.class?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.note || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
