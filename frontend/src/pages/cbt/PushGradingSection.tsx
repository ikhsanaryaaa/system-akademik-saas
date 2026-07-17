import { useEffect, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList } from "../../lib/master";
import type { ClassRow } from "../../lib/master";
import type { Subject } from "../../lib/curriculum";

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

interface Props {
  scheduleId: string;
  classes: ClassRow[];
  onDone: (message: string) => void;
}

// PushGradingSection mengintegrasikan nilai peserta ujian ke modul Penilaian.
export default function PushGradingSection({ scheduleId, classes, onDone }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    simpleList<Subject>("/subjects").then(setSubjects);
    simpleList<AcademicYear>("/academic-years").then(setYears);
  }, []);

  async function push(e: FormEvent) {
    e.preventDefault();
    setError("");
    const activeYear = years.find((y) => y.is_active) ?? years[0];
    if (!subjectId || !classId || !activeYear) {
      setError("Lengkapi mata pelajaran, kelas, dan tahun ajaran aktif");
      return;
    }
    try {
      const res = await http.post<ApiResponse<{ pushed: number }>>(`/exam-schedules/${scheduleId}/push-grading`, {
        subject_id: subjectId,
        class_id: classId,
        academic_year_id: activeYear.id,
        semester: Number(semester),
        weight: 1,
      });
      onDone(`${res.data.data?.pushed ?? 0} nilai diintegrasikan ke penilaian`);
    } catch {
      setError("Gagal mengintegrasikan nilai, pastikan sudah ada nilai peserta");
    }
  }

  const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mt-6 rounded-lg border border-hairline bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">Integrasi Nilai ke Penilaian</h2>
      <form onSubmit={push} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label htmlFor="pg-subject" className="block text-sm font-medium text-body">
            Mata Pelajaran
          </label>
          <select id="pg-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClass}>
            <option value="">Pilih</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pg-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select id="pg-class" value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
            <option value="">Pilih</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pg-semester" className="block text-sm font-medium text-body">
            Semester
          </label>
          <select
            id="pg-semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className={inputClass}
          >
            <option value={1}>1 Ganjil</option>
            <option value={2}>2 Genap</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-[38px] w-full rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Integrasikan
          </button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
