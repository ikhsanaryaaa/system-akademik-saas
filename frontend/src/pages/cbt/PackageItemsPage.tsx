import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { questionTypeLabel, type ExamPackageItem, type Question } from "../../lib/cbt";
import { useAuth } from "../../context/AuthContext";

export default function PackageItemsPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [items, setItems] = useState<ExamPackageItem[]>([]);
  const [bank, setBank] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = can("cbt.update");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ExamPackageItem[]>>(`/exam-packages/${id}/items`);
      setItems(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    http.get<ApiResponse<Question[]>>("/questions").then((res) => setBank(res.data.data ?? []));
  }, [load]);

  async function addQuestion(questionId: string, points: number) {
    await http.post(`/exam-packages/${id}/items`, {
      question_id: questionId,
      order: items.length + 1,
      points,
    });
    load();
  }

  async function removeItem(itemId: string) {
    await http.delete(`/exam-packages/${id}/items/${itemId}`);
    load();
  }

  const usedIds = new Set(items.map((i) => i.question_id));
  const available = bank.filter((q) => !usedIds.has(q.id));

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/cbt/packages" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">Susun Soal Paket</h1>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <div className="border-b border-hairline px-4 py-3 text-sm font-semibold text-ink">Soal dalam Paket</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Soal</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Poin</th>
              {canEdit && <th className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada soal di paket ini.
                </td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={it.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-mono">{i + 1}</td>
                  <td className="px-4 py-3 text-ink">{it.question?.text.slice(0, 80) ?? "-"}</td>
                  <td className="px-4 py-3">{it.question ? questionTypeLabel[it.question.type] : "-"}</td>
                  <td className="px-4 py-3 font-mono">{it.points}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => removeItem(it.id)} className="text-danger hover:underline">
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-white">
          <div className="border-b border-hairline px-4 py-3 text-sm font-semibold text-ink">Tambah dari Bank Soal</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Soal</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Poin</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {available.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Tidak ada soal tersedia.
                  </td>
                </tr>
              ) : (
                available.map((q) => (
                  <tr key={q.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{q.text.slice(0, 80)}</td>
                    <td className="px-4 py-3">{questionTypeLabel[q.type] ?? q.type}</td>
                    <td className="px-4 py-3 font-mono">{q.points}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => addQuestion(q.id, q.points)}
                        className="text-primary hover:underline"
                      >
                        Tambah
                      </button>
                    </td>
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
