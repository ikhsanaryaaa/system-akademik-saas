import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, simpleList, type ClassRow, type Major } from "../../lib/master";
import { fmtRupiah, type FinanceReport } from "../../lib/finance";

export default function FinanceReportPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classId, setClassId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [report, setReport] = useState<FinanceReport | null>(null);
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
      const res = await http.get<ApiResponse<FinanceReport>>("/finance/report", { params });
      setReport(res.data.data ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, majorId]);

  const amountCards: { label: string; value: number }[] = [
    { label: "Total Tagihan", value: report?.total_amount ?? 0 },
    { label: "Total Terbayar", value: report?.paid_amount ?? 0 },
    { label: "Sisa Tagihan", value: report?.outstanding_amount ?? 0 },
  ];
  const countCards: { label: string; value: number }[] = [
    { label: "Belum Bayar", value: report?.unpaid_count ?? 0 },
    { label: "Cicil", value: report?.partial_count ?? 0 },
    { label: "Lunas", value: report?.paid_count ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Laporan Keuangan</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-white p-4">
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

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {amountCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-hairline bg-white p-4">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink">{loading ? "-" : fmtRupiah(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {countCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-hairline bg-white p-4">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink">{loading ? "-" : c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
