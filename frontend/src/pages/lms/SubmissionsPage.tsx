import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { submissionStatusLabel, type Submission } from "../../lib/lms";
import { useAuth } from "../../context/AuthContext";

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const canGrade = can("lms.update");

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<Submission[]>>(`/assignments/${id}/submissions`);
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setField(subId: string, key: "score" | "feedback", value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === subId ? { ...r, [key]: key === "score" ? Number(value) : value } : r)),
    );
  }

  async function saveGrade(sub: Submission) {
    setMessage("");
    try {
      await http.put(`/assignments/${id}/submissions/${sub.id}`, {
        score: sub.score === null ? null : Number(sub.score),
        feedback: sub.feedback,
      });
      setMessage("Nilai tugas berhasil disimpan");
      load();
    } catch {
      setMessage("Gagal menyimpan nilai tugas");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/lms/assignments" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">Pengumpulan Tugas</h1>

      {message && <p className="mt-3 text-sm text-success">{message}</p>}

      {loading ? (
        <div className="mt-6 rounded-lg border border-hairline bg-white p-8 text-center text-muted">Memuat...</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">NIS</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Nilai</th>
                <th className="px-4 py-3">Umpan Balik</th>
                {canGrade && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canGrade ? 6 : 5} className="px-4 py-8 text-center text-muted">
                    Belum ada pengumpulan.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{r.student?.name ?? "-"}</td>
                    <td className="px-4 py-3 font-mono">{r.student?.nis ?? "-"}</td>
                    <td className="px-4 py-3">{submissionStatusLabel[r.status] ?? r.status}</td>
                    <td className="px-4 py-3">
                      {canGrade ? (
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          aria-label={`Nilai ${r.student?.name ?? ""}`}
                          value={r.score ?? ""}
                          onChange={(e) => setField(r.id, "score", e.target.value)}
                          className="h-8 w-24 rounded-md border border-hairline px-2 text-sm font-mono"
                        />
                      ) : (
                        <span className="font-mono">{r.score ?? "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canGrade ? (
                        <input
                          type="text"
                          aria-label={`Umpan balik ${r.student?.name ?? ""}`}
                          value={r.feedback}
                          onChange={(e) => setField(r.id, "feedback", e.target.value)}
                          className="h-8 w-full rounded-md border border-hairline px-2 text-sm"
                        />
                      ) : (
                        r.feedback || "-"
                      )}
                    </td>
                    {canGrade && (
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => saveGrade(r)} className="text-primary hover:underline">
                          Simpan
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
