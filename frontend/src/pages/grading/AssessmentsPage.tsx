import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList, paginatedList, type ClassRow } from "../../lib/master";
import type { Subject } from "../../lib/curriculum";
import { assessmentTypes, type Assessment } from "../../lib/grading";
import { useAuth } from "../../context/AuthContext";

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

interface FormState {
  open: boolean;
  id: string | null;
  title: string;
  type: string;
  weight: number;
  semester: number;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  error: string;
}

const emptyForm: FormState = {
  open: false,
  id: null,
  title: "",
  type: "ulangan harian",
  weight: 1,
  semester: 1,
  class_id: "",
  subject_id: "",
  academic_year_id: "",
  error: "",
};

type FormAction =
  | { type: "openCreate"; academicYearId: string }
  | { type: "openEdit"; value: Assessment }
  | { type: "close" }
  | { type: "field"; key: keyof FormState; value: string | number }
  | { type: "error"; value: string };

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "openCreate":
      return { ...emptyForm, open: true, academic_year_id: action.academicYearId };
    case "openEdit":
      return { ...action.value, open: true, id: action.value.id, error: "" };
    case "close":
      return { ...state, open: false };
    case "field":
      return { ...state, [action.key]: action.value };
    case "error":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

export default function AssessmentsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // years hanya dipakai di handler openCreate untuk memilih tahun ajaran aktif,
  // tidak dirender, jadi disimpan di ref agar tidak memicu render ulang.
  const yearsRef = useRef<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [form, dispatch] = useReducer(reducer, emptyForm);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterClass) params.class_id = filterClass;
      const res = await http.get<ApiResponse<Assessment[]>>("/assessments", { params });
      setItems(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    const cls = await paginatedList<ClassRow>("/classes", { per_page: 100 });
    setClasses(cls.items);
    setSubjects(await simpleList<Subject>("/subjects"));
    yearsRef.current = await simpleList<AcademicYear>("/academic-years");
  }

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass]);

  function openCreate() {
    const years = yearsRef.current;
    const active = years.find((y) => y.is_active) ?? years[0];
    dispatch({ type: "openCreate", academicYearId: active?.id ?? "" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "error", value: "" });
    const body = {
      title: form.title,
      type: form.type,
      weight: Number(form.weight),
      semester: Number(form.semester),
      class_id: form.class_id,
      subject_id: form.subject_id,
      academic_year_id: form.academic_year_id,
    };
    try {
      if (form.id) await http.put(`/assessments/${form.id}`, body);
      else await http.post("/assessments", body);
      dispatch({ type: "close" });
      load();
    } catch {
      dispatch({ type: "error", value: "Gagal menyimpan penilaian, periksa input" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus penilaian ini?")) return;
    await http.delete(`/assessments/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Penilaian</h1>
        {can("grading.create") && (
          <button
            type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Penilaian
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-white p-4">
        <div>
          <label htmlFor="filter-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select
            id="filter-class"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
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
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Mapel</th>
              <th className="px-4 py-3">Smt</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Belum ada penilaian.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{a.title}</td>
                  <td className="px-4 py-3 capitalize">{a.type}</td>
                  <td className="px-4 py-3">{a.class?.name ?? "-"}</td>
                  <td className="px-4 py-3">{a.subject?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{a.semester}</td>
                  <td className="px-4 py-3 text-right">
                    {can("grading.create") && (
                      <Link to={`/grading/assessments/${a.id}/scores`} className="text-primary hover:underline">
                        Isi Nilai
                      </Link>
                    )}
                    {can("grading.create") && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "openEdit", value: a })}
                        className="ml-3 text-primary hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {can("grading.create") && (
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="ml-3 text-danger hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">
              {form.id ? "Edit" : "Tambah"} Penilaian
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="as-title" className="block text-sm font-medium text-body">
                  Judul
                </label>
                <input
                  id="as-title"
                  value={form.title}
                  onChange={(e) => dispatch({ type: "field", key: "title", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="as-type" className="block text-sm font-medium text-body">
                    Jenis
                  </label>
                  <select
                    id="as-type"
                    value={form.type}
                    onChange={(e) => dispatch({ type: "field", key: "type", value: e.target.value })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm capitalize"
                  >
                    {assessmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="as-semester" className="block text-sm font-medium text-body">
                    Semester
                  </label>
                  <select
                    id="as-semester"
                    value={form.semester}
                    onChange={(e) => dispatch({ type: "field", key: "semester", value: Number(e.target.value) })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                  >
                    <option value={1}>1 Ganjil</option>
                    <option value={2}>2 Genap</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="as-class" className="block text-sm font-medium text-body">
                  Kelas
                </label>
                <select
                  id="as-class"
                  value={form.class_id}
                  onChange={(e) => dispatch({ type: "field", key: "class_id", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="as-subject" className="block text-sm font-medium text-body">
                  Mata Pelajaran
                </label>
                <select
                  id="as-subject"
                  value={form.subject_id}
                  onChange={(e) => dispatch({ type: "field", key: "subject_id", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih mata pelajaran</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {form.error && <p className="text-sm text-danger">{form.error}</p>}
            </div>
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
      )}
    </div>
  );
}
