import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import type { ScoreRow } from "../../lib/grading";
import { useAuth } from "../../context/AuthContext";

export default function AssessmentScoresPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ScoreRow[]>>(`/assessments/${id}/scores`);
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setScore(studentId: string, score: number) {
    setRows((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, score } : r)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await http.post(`/assessments/${id}/scores`, {
        entries: rows.map((r) => ({ student_id: r.student_id, score: Number(r.score), note: r.note })),
      });
      setMessage("Nilai berhasil disimpan");
    } catch {
      setMessage("Gagal menyimpan nilai, pastikan rentang 0 sampai 100");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/grading/assessments" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">Isi Nilai</h1>

      {message && <p className="mt-3 text-sm text-success">{message}</p>}

      {loading ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
          Memuat...
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      Tidak ada siswa di kelas ini.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.student_id} className="border-t border-hairline">
                      <td className="px-4 py-3 text-ink">{r.name}</td>
                      <td className="px-4 py-3 font-mono">{r.nis}</td>
                      <td className="px-4 py-3">
                        {can("grading.create") ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            aria-label={`Nilai ${r.name}`}
                            value={r.score}
                            onChange={(e) => setScore(r.student_id, Number(e.target.value))}
                            className="h-8 w-24 rounded-md border border-hairline px-2 text-sm font-mono"
                          />
                        ) : (
                          <span className="font-mono">{r.score}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && can("grading.create") && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Nilai"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
