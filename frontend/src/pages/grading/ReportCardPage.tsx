import { useEffect, useReducer, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList, paginatedList, type StudentRow } from "../../lib/master";
import type { Subject } from "../../lib/curriculum";
import type { ReportCardScore } from "../../lib/grading";
import { useAuth } from "../../context/AuthContext";

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

// State form input nilai raport, dikelompokkan karena selalu berubah bersama.
interface FormState {
  subjectId: string;
  knowledge: number;
  skill: number;
  description: string;
  message: string;
}

type FormAction =
  | { type: "setField"; field: "subjectId" | "description"; value: string }
  | { type: "setScore"; field: "knowledge" | "skill"; value: number }
  | { type: "submitStart" }
  | { type: "saved" }
  | { type: "error" };

const initialForm: FormState = {
  subjectId: "",
  knowledge: 0,
  skill: 0,
  description: "",
  message: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setScore":
      return { ...state, [action.field]: action.value };
    case "submitStart":
      return { ...state, message: "" };
    case "saved":
      return { ...initialForm, message: "Nilai raport disimpan" };
    case "error":
      return { ...state, message: "Gagal menyimpan nilai raport, pastikan rentang 0 sampai 100" };
    default:
      return state;
  }
}

export default function ReportCardPage() {
  const { can } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [studentId, setStudentId] = useState("");
  const [semester, setSemester] = useState(1);
  const [rows, setRows] = useState<ReportCardScore[]>([]);
  const [loading, setLoading] = useState(false);

  // Form input nilai raport.
  const [form, dispatch] = useReducer(formReducer, initialForm);
  const { subjectId, knowledge, skill, description, message } = form;

  useEffect(() => {
    paginatedList<StudentRow>("/students", { per_page: 100 }).then((res) => setStudents(res.items));
    simpleList<Subject>("/subjects").then(setSubjects);
    simpleList<AcademicYear>("/academic-years").then(setYears);
  }, []);

  async function load() {
    if (!studentId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ReportCardScore[]>>("/report-cards/student", {
        params: { student_id: studentId, semester },
      });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, semester]);

  const selectedStudent = students.find((s) => s.id === studentId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "submitStart" });
    const activeYear = years.find((y) => y.is_active) ?? years[0];
    try {
      await http.post("/report-cards", {
        student_id: studentId,
        subject_id: subjectId,
        semester,
        academic_year_id: activeYear?.id,
        class_id: selectedStudent?.class_id ?? null,
        knowledge_score: Number(knowledge),
        skill_score: Number(skill),
        description,
      });
      dispatch({ type: "saved" });
      load();
    } catch {
      dispatch({ type: "error" });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">e-Raport</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-white p-4">
        <div>
          <label htmlFor="rc-student" className="block text-sm font-medium text-body">
            Siswa
          </label>
          <select
            id="rc-student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
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
        <div>
          <label htmlFor="rc-semester" className="block text-sm font-medium text-body">
            Semester
          </label>
          <select
            id="rc-semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value={1}>1 Ganjil</option>
            <option value={2}>2 Genap</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Pengetahuan</th>
              <th className="px-4 py-3">Keterampilan</th>
              <th className="px-4 py-3">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  {studentId ? "Belum ada nilai raport." : "Pilih siswa untuk menampilkan raport."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{r.subject?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{r.knowledge_score}</td>
                  <td className="px-4 py-3 font-mono">{r.skill_score}</td>
                  <td className="px-4 py-3 text-muted">{r.description || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {studentId && can("grading.create") && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-hairline bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Input Nilai Raport</h2>
          {message && <p className="mt-2 text-sm text-success">{message}</p>}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="rc-subject" className="block text-sm font-medium text-body">
                Mata Pelajaran
              </label>
              <select
                id="rc-subject"
                value={subjectId}
                onChange={(e) => dispatch({ type: "setField", field: "subjectId", value: e.target.value })}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rc-knowledge" className="block text-sm font-medium text-body">
                  Pengetahuan
                </label>
                <input
                  id="rc-knowledge"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={knowledge}
                  onChange={(e) => dispatch({ type: "setScore", field: "knowledge", value: Number(e.target.value) })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label htmlFor="rc-skill" className="block text-sm font-medium text-body">
                  Keterampilan
                </label>
                <input
                  id="rc-skill"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={skill}
                  onChange={(e) => dispatch({ type: "setScore", field: "skill", value: Number(e.target.value) })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm font-mono"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="rc-desc" className="block text-sm font-medium text-body">
                Deskripsi
              </label>
              <textarea
                id="rc-desc"
                value={description}
                onChange={(e) => dispatch({ type: "setField", field: "description", value: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Simpan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
