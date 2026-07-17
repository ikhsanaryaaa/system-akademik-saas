import { type Dispatch, type FormEvent } from "react";
import type { Major } from "../../lib/master";
import type { Subject } from "../../lib/curriculum";
import { difficulties, difficultyLabel, questionTypeLabel, questionTypes } from "../../lib/cbt";
import type { Action, FormState } from "./QuestionsPage";

interface Props {
  form: FormState;
  dispatch: Dispatch<Action>;
  subjects: Subject[];
  majors: Major[];
  onSubmit: (e: FormEvent) => void;
}

const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";

// QuestionModal adalah form tambah atau edit soal beserta editor opsi jawaban.
// Dipisah dari QuestionsPage agar tiap komponen tetap ringkas.
export default function QuestionModal({ form, dispatch, subjects, majors, onSubmit }: Props) {
  const needsOptions = form.type === "multiple_choice" || form.type === "true_false" || form.type === "matching";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-xl bg-white p-6">
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

        {needsOptions && <OptionsEditor form={form} dispatch={dispatch} />}
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

// OptionsEditor mengelola daftar opsi jawaban untuk soal pilihan ganda,
// benar/salah, atau menjodohkan.
function OptionsEditor({ form, dispatch }: { form: FormState; dispatch: Dispatch<Action> }) {
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
          <div key={o._key} className="flex items-center gap-2">
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
