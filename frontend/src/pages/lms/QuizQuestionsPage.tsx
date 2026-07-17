import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { quizAnswers, type QuizQuestion } from "../../lib/lms";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  question: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  answer: "a",
  points: 1,
};

export default function QuizQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [rows, setRows] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const canWrite = can("lms.create");
  const canDelete = can("lms.delete");

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<QuizQuestion[]>>(`/quizzes/${id}/questions`);
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await http.post(`/quizzes/${id}/questions`, {
        ...form,
        points: Number(form.points),
        order: rows.length + 1,
      });
      setForm(emptyForm);
      load();
    } catch {
      setError("Gagal menyimpan soal, periksa input");
    }
  }

  async function handleDelete(questionId: string) {
    if (!confirm("Hapus soal ini?")) return;
    await http.delete(`/quizzes/${id}/questions/${questionId}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/lms/quizzes" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">Soal Quiz</h1>

      {loading ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">Memuat...</div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
              Belum ada soal.
            </div>
          ) : (
            rows.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-hairline bg-canvas p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">
                    <span className="font-mono text-muted">{i + 1}.</span> {q.question}
                  </p>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="shrink-0 text-danger hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <ul className="mt-2 space-y-1 text-sm text-body">
                  {(["a", "b", "c", "d"] as const).map((opt) => {
                    const text = q[`option_${opt}` as keyof QuizQuestion] as string;
                    if (!text) return null;
                    return (
                      <li key={opt} className={q.answer === opt ? "font-semibold text-success" : ""}>
                        <span className="uppercase">{opt}.</span> {text}
                        {q.answer === opt && " (kunci)"}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Poin <span className="font-mono">{q.points}</span>
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {canWrite && renderAddForm()}
    </div>
  );

  function renderAddForm() {
    const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";
    return (
      <form onSubmit={handleAdd} className="mt-6 rounded-lg border border-hairline bg-canvas p-4">
        <h2 className="text-lg font-semibold text-ink">Tambah Soal</h2>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="q-question" className="block text-sm font-medium text-body">
              Pertanyaan
            </label>
            <textarea
              id="q-question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
              rows={2}
              className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(["a", "b", "c", "d"] as const).map((opt) => (
              <div key={opt}>
                <label htmlFor={`q-opt-${opt}`} className="block text-sm font-medium text-body">
                  Opsi {opt.toUpperCase()}
                </label>
                <input
                  id={`q-opt-${opt}`}
                  value={form[`option_${opt}` as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="q-answer" className="block text-sm font-medium text-body">
                Kunci Jawaban
              </label>
              <select
                id="q-answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                className={`${inputClass} uppercase`}
              >
                {quizAnswers.map((a) => (
                  <option key={a} value={a}>
                    {a.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-points" className="block text-sm font-medium text-body">
                Poin
              </label>
              <input
                id="q-points"
                type="number"
                min={0}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Soal
          </button>
        </div>
      </form>
    );
  }
}
