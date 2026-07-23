import { useEffect, useRef, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type StudentRow } from "../../lib/master";
import type { StudentBook } from "../../lib/bk";
import { fmtDate } from "../../lib/format";

export default function StudentBookPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [book, setBook] = useState<StudentBook | null>(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    paginatedList<StudentRow>("/students", { per_page: 100 }).then((res) => setStudents(res.items));
    return () => requestRef.current?.abort();
  }, []);

  async function selectStudent(id: string) {
    requestRef.current?.abort();
    setStudentId(id);
    setBook(null);
    if (!id) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<StudentBook>>("/student-book", {
        params: { student_id: id },
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setBook(res.data.data ?? null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Buku Siswa</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4">
        <div>
          <label htmlFor="sb-student" className="block text-sm font-medium text-body">
            Siswa
          </label>
          <select
            id="sb-student"
            value={studentId}
            onChange={(e) => selectStudent(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value="">Pilih siswa</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.nis})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Memuat...</p>
      ) : !book ? (
        <p className="mt-6 text-sm text-muted">Pilih siswa untuk menampilkan buku siswa.</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-canvas p-4">
            <div>
              <p className="text-lg font-semibold text-ink">{book.student.name}</p>
              <p className="text-sm text-muted">
                {book.student.nis} · {book.student.class?.name ?? "-"} · {book.student.major?.name ?? "-"}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs uppercase tracking-wide text-muted">Total Poin Pelanggaran</p>
              <p className="font-mono text-2xl font-semibold text-danger">{book.total_point}</p>
            </div>
          </div>

          <Section title="Pelanggaran" count={book.violations.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Poin</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody>
                {book.violations.map((v) => (
                  <tr key={v.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{v.violation_type?.name ?? "-"}</td>
                    <td className="px-4 py-3 font-mono">{v.violation_type?.point ?? 0}</td>
                    <td className="px-4 py-3 font-mono">{fmtDate(v.date)}</td>
                    <td className="px-4 py-3">{v.follow_up_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Prestasi" count={book.achievements.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Tingkat</th>
                  <th className="px-4 py-3">Peringkat</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {book.achievements.map((a) => (
                  <tr key={a.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{a.title}</td>
                    <td className="px-4 py-3">{a.level}</td>
                    <td className="px-4 py-3">{a.rank}</td>
                    <td className="px-4 py-3 font-mono">{fmtDate(a.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Sesi Konseling" count={book.sessions.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Topik</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Konselor</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {book.sessions.map((s) => (
                  <tr key={s.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{s.topic}</td>
                    <td className="px-4 py-3">{s.type}</td>
                    <td className="px-4 py-3">{s.counsel_name}</td>
                    <td className="px-4 py-3 font-mono">{fmtDate(s.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Home Visit" count={book.home_visits.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Tujuan</th>
                  <th className="px-4 py-3">Petugas</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {book.home_visits.map((h) => (
                  <tr key={h.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{h.purpose}</td>
                    <td className="px-4 py-3">{h.officer}</td>
                    <td className="px-4 py-3 font-mono">{fmtDate(h.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
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
