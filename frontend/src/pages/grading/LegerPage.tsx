import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type ClassRow } from "../../lib/master";
import type { ReportCardScore } from "../../lib/grading";

export default function LegerPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState(1);
  const [rows, setRows] = useState<ReportCardScore[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
  }, []);

  async function load() {
    if (!classId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ReportCardScore[]>>("/report-cards/leger", {
        params: { class_id: classId, semester },
      });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, semester]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Leger Nilai</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-white p-4">
        <div>
          <label htmlFor="leger-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select
            id="leger-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value="">Pilih kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="leger-semester" className="block text-sm font-medium text-body">
            Semester
          </label>
          <select
            id="leger-semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value={1}>1 Ganjil</option>
            <option value={2}>2 Genap</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Pengetahuan</th>
              <th className="px-4 py-3">Keterampilan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Pilih kelas untuk menampilkan leger.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{r.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.subject?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{r.knowledge_score}</td>
                  <td className="px-4 py-3 font-mono">{r.skill_score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
