import { Link } from "react-router-dom";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDateTime } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Quiz",
  path: "/quizzes",
  permPrefix: "lms",
  addLabel: "Tambah Quiz",
  filters: ["class", "major"],
  fields: [
    { key: "title", label: "Judul", type: "text", required: true, fullWidth: true },
    { key: "subject_id", label: "Mata Pelajaran", type: "ref", refPath: "/subjects" },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "teacher_id", label: "Pengajar", type: "teacher" },
    { key: "semester", label: "Semester", type: "number" },
    { key: "duration_min", label: "Durasi (menit)", type: "number" },
    { key: "start_at", label: "Mulai", type: "datetime" },
    { key: "end_at", label: "Selesai", type: "datetime" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "subject", label: "Mapel", render: (r) => (r.subject as { name: string })?.name ?? "-" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "start_at", label: "Mulai", render: (r) => fmtDateTime(r.start_at), mono: true },
    {
      key: "questions",
      label: "Soal",
      render: (r) => (
        <Link to={`/lms/quizzes/${String(r.id)}/questions`} className="text-primary hover:underline">
          Kelola
        </Link>
      ),
    },
  ],
};

export default function QuizzesPage() {
  return <CrudModulePage config={config} />;
}
