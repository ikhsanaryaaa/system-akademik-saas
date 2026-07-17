import { useEffect, useReducer, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList, type Major } from "../../lib/master";
import type { Subject } from "../../lib/curriculum";
import {
  difficulties,
  difficultyLabel,
  questionTypeLabel,
  questionTypes,
  type Question,
  type QuestionOption,
} from "../../lib/cbt";
import { useAuth } from "../../context/AuthContext";

interface FormState {
  open: boolean;
  id: string | null;
  subject_id: string;
  major_id: string;
  type: string;
  text: string;
  formula: string;
  difficulty: string;
  points: number;
  essay_key: string;
  options: QuestionOption[];
  error: string;
}

const emptyOption = (order: number): QuestionOption => ({ text: "", is_correct: false, order });

const emptyForm: FormState = {
  open: false,
  id: null,
  subject_id: "",
  major_id: "",
  type: "multiple_choice",
  text: "",
  formula: "",
  difficulty: "medium",
  points: 1,
  essay_key: "",
  options: [emptyOption(1), emptyOption(2)],
  error: "",
};

type Action =
  | { type: "openCreate" }
  | { type: "openEdit"; value: Question }
  | { type: "close" }
  | { type: "field"; key: keyof FormState; value: string | number }
  | { type: "optionField"; index: number; key: keyof QuestionOption; value: string | boolean }
  | { type: "addOption" }
  | { type: "removeOption"; index: number }
  | { type: "error"; value: string };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "openCreate":
      return { ...emptyForm, open: true };
    case "openEdit": {
      const q = action.value;
      const opts = q.options && q.options.length > 0 ? q.options : [emptyOption(1), emptyOption(2)];
      return {
        open: true,
        id: q.id,
        subject_id: q.subject_id ?? "",
        major_id: q.major_id ?? "",
        type: q.type,
        text: q.text,
        formula: q.formula ?? "",
        difficulty: q.difficulty || "medium",
        points: q.points,
        essay_key: q.essay_key ?? "",
        options: opts.map((o, i) => ({ ...o, order: i + 1 })),
        error: "",
      };
    }
    case "close":
      return { ...state, open: false };
    case "field":
      return { ...state, [action.key]: action.value };
    case "optionField": {
      const options = state.options.map((o, i) =>
        i === action.index ? { ...o, [action.key]: action.value } : o,
      );
      return { ...state, options };
    }
    case "addOption":
      return { ...state, options: [...state.options, emptyOption(state.options.length + 1)] };
    case "removeOption":
      return { ...state, options: state.options.filter((_, i) => i !== action.index) };
    case "error":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

export default function QuestionsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [form, dispatch] = useReducer(reducer, emptyForm);

  const canWrite = can("cbt.create");
  const canUpdate = can("cbt.update");
  const canDelete = can("cbt.delete");
  const needsOptions = form.type === "multiple_choice" || form.type === "true_false" || form.type === "matching";

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      const res = await http.get<ApiResponse<Question[]>>("/questions", { params });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    simpleList<Subject>("/subjects").then(setSubjects);
    simpleList<Major>("/majors").then(setMajors);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "error", value: "" });
    const body = {
      subject_id: form.subject_id || null,
      major_id: form.major_id || null,
      type: form.type,
      text: form.text,
      formula: form.formula,
      difficulty: form.difficulty,
      points: Number(form.points),
      essay_key: form.essay_key,
      options: needsOptions
        ? form.options.map((o, i) => ({
            text: o.text,
            match_text: o.match_text ?? "",
            is_correct: o.is_correct,
            order: i + 1,
          }))
        : [],
    };
    try {
      if (form.id) await http.put(`/questions/${form.id}`, body);
      else await http.post("/questions", body);
      dispatch({ type: "close" });
      load();
    } catch {
      dispatch({ type: "error", value: "Gagal menyimpan soal, periksa input" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus soal ini?")) return;
    await http.delete(`/questions/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Bank Soal</h1>
        {canWrite && (
          <button
            type="button"
            onClick={() => dispatch({ type: "openCreate" })}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Soal
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-white p-4">
        <div>
          <label htmlFor="filter-type" className="block text-sm font-medium text-body">
            Tipe Soal
          </label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value="">Semua Tipe</option>
            {questionTypes.map((t) => (
              <option key={t} value={t}>
                {questionTypeLabel[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Soal</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Mapel</th>
              <th className="px-4 py-3">Kesukaran</th>
              <th className="px-4 py-3">Poin</th>
              {(canUpdate || canDelete) && <th className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Belum ada soal.
                </td>
              </tr>
            ) : (
              rows.map((q) => (
                <tr key={q.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{q.text.slice(0, 80)}</td>
                  <td className="px-4 py-3">{questionTypeLabel[q.type] ?? q.type}</td>
                  <td className="px-4 py-3">{q.subject?.name ?? "-"}</td>
                  <td className="px-4 py-3">{difficultyLabel[q.difficulty] ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{q.points}</td>
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "openEdit", value: q })}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          className="ml-3 text-danger hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form.open && renderModal()}
    </div>
  );

  function renderModal() {
    const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
        <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-xl bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">{form.id ? "Edit" : "Tambah"} Soal</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="q-type" className="block text-sm font-medium text-body">
                Tipe Soal
              </label>
              <select
                id="q-type"
                value={form.type}
                onChange={(e) => dispatch({ type: "field", key: "type", value: e.target.value })}
                className={inputClass}
              >
                {questionTypes.map((t) => (
                  <option key={t} value={t}>
                    {questionTypeLabel[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-difficulty" className="block text-sm font-medium text-body">
                Kesukaran
              </label>
              <select
                id="q-difficulty"
                value={form.difficulty}
                onChange={(e) => dispatch({ type: "field", key: "difficulty", value: e.target.value })}
                className={inputClass}
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {difficultyLabel[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-subject" className="block text-sm font-medium text-body">
                Mata Pelajaran
              </label>
              <select
                id="q-subject"
                value={form.subject_id}
                onChange={(e) => dispatch({ type: "field", key: "subject_id", value: e.target.value })}
                className={inputClass}
              >
                <option value="">Pilih</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-major" className="block text-sm font-medium text-body">
                Jurusan
              </label>
              <select
                id="q-major"
                value={form.major_id}
                onChange={(e) => dispatch({ type: "field", key: "major_id", value: e.target.value })}
                className={inputClass}
              >
                <option value="">Pilih</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
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
                onChange={(e) => dispatch({ type: "field", key: "points", value: Number(e.target.value) })}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="q-text" className="block text-sm font-medium text-body">
                Teks Soal
              </label>
              <textarea
                id="q-text"
                value={form.text}
                onChange={(e) => dispatch({ type: "field", key: "text", value: e.target.value })}
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="q-formula" className="block text-sm font-medium text-body">
                Rumus (opsional)
              </label>
              <input
                id="q-formula"
                value={form.formula}
                onChange={(e) => dispatch({ type: "field", key: "formula", value: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {needsOptions && renderOptions()}
          {form.type === "essay" && (
            <div className="mt-4">
              <label htmlFor="q-essaykey" className="block text-sm font-medium text-body">
                Kunci Jawaban Esai
              </label>
              <textarea
                id="q-essaykey"
                value={form.essay_key}
                onChange={(e) => dispatch({ type: "field", key: "essay_key", value: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          )}

          {form.error && <p className="mt-3 text-sm text-danger">{form.error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "close" })}
              className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderOptions() {
    const isMatching = form.type === "matching";
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-body">Opsi Jawaban</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "addOption" })}
            className="text-sm text-primary hover:underline"
          >
            Tambah Opsi
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {form.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                aria-label={`Opsi ${i + 1}`}
                value={o.text}
                onChange={(e) => dispatch({ type: "optionField", index: i, key: "text", value: e.target.value })}
                placeholder={isMatching ? "Pernyataan" : "Teks opsi"}
                className="h-[38px] flex-1 rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
              />
              {isMatching ? (
                <input
                  type="text"
                  aria-label={`Pasangan ${i + 1}`}
                  value={o.match_text ?? ""}
                  onChange={(e) => dispatch({ type: "optionField", index: i, key: "match_text", value: e.target.value })}
                  placeholder="Pasangan"
                  className="h-[38px] flex-1 rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              ) : (
                <label className="flex items-center gap-1 text-sm text-body">
                  <input
                    type="checkbox"
                    aria-label={`Kunci opsi ${i + 1}`}
                    checked={o.is_correct}
                    onChange={(e) => dispatch({ type: "optionField", index: i, key: "is_correct", value: e.target.checked })}
                  />
                  Kunci
                </label>
              )}
              <button
                type="button"
                onClick={() => dispatch({ type: "removeOption", index: i })}
                className="text-danger hover:underline"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
