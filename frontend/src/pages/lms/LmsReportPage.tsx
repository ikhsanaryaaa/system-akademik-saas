import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, simpleList, type ClassRow, type Major } from "../../lib/master";
import { type LmsReport } from "../../lib/lms";

const cards: { key: keyof LmsReport; label: string }[] = [
  { key: "material_count", label: "Materi" },
  { key: "assignment_count", label: "Tugas" },
  { key: "quiz_count", label: "Quiz" },
  { key: "thread_count", label: "Forum Diskusi" },
];

export default function LmsReportPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classId, setClassId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [report, setReport] = useState<LmsReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
    simpleList<Major>("/majors").then(setMajors);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (classId) params.class_id = classId;
      if (majorId) params.major_id = majorId;
      const res = await http.get<ApiResponse<LmsReport>>("/lms/report", { params });
      setReport(res.data.data ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, majorId]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Laporan LMS</h1>

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
          <label htmlFor="report-major" className="block text-sm font-medium text-body">
            Jurusan
          </label>
          <select
            id="report-major"
            value={majorId}
            onChange={(e) => setMajorId(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value="">Semua Jurusan</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.key} className="rounded-lg border border-hairline bg-canvas p-4">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink">
              {loading ? "-" : (report?.[c.key] ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
