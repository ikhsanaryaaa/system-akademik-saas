import { Link } from "react-router-dom";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Tugas",
  path: "/assignments",
  permPrefix: "lms",
  addLabel: "Tambah Tugas",
  filters: ["class", "major"],
  fields: [
    { key: "title", label: "Judul", type: "text", required: true, fullWidth: true },
    { key: "subject_id", label: "Mata Pelajaran", type: "ref", refPath: "/subjects" },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "teacher_id", label: "Pengajar", type: "teacher" },
    { key: "semester", label: "Semester", type: "number" },
    { key: "max_score", label: "Nilai Maksimal", type: "number" },
    { key: "due_date", label: "Tenggat", type: "datetime" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "subject", label: "Mapel", render: (r) => (r.subject as { name: string })?.name ?? "-" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "due_date", label: "Tenggat", render: (r) => fmtDate(r.due_date), mono: true },
    {
      key: "submissions",
      label: "Pengumpulan",
      render: (r) => (
        <Link to={`/lms/assignments/${String(r.id)}/submissions`} className="text-primary hover:underline">
          Lihat
        </Link>
      ),
    },
  ],
};

export default function AssignmentsPage() {
  return <CrudModulePage config={config} />;
}
