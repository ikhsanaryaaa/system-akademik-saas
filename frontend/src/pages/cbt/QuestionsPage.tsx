import { useEffect, useReducer, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList, type Major } from "../../lib/master";
import type { Subject } from "../../lib/curriculum";
import { difficultyLabel, questionTypeLabel, questionTypes, type Question, type QuestionOption } from "../../lib/cbt";
import { useAuth } from "../../context/AuthContext";
import QuestionModal from "./QuestionModal";

// FormOption menambahkan key stabil sisi klien agar tiap baris opsi punya
// identitas tetap saat baris ditambah atau dihapus (bukan index array).
export interface FormOption extends QuestionOption {
  _key: string;
}

export interface FormState {
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
  options: FormOption[];
  error: string;
}

let optionKeySeq = 0;
function newOptionKey(): string {
  optionKeySeq += 1;
  return `opt-${optionKeySeq}`;
}

const emptyOption = (order: number): FormOption => ({ _key: newOptionKey(), text: "", is_correct: false, order });

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

export type Action =
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
        options: opts.map((o, i) => ({ ...o, _key: newOptionKey(), order: i + 1 })),
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

      <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-canvas p-4">
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

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
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

      {form.open && (
        <QuestionModal form={form} dispatch={dispatch} subjects={subjects} majors={majors} onSubmit={handleSubmit} />
      )}
    </div>
  );

}
