import CrudModulePage, { fmtDate, type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Pembinaan Kesiswaan",
  path: "/student-coaching",
  permPrefix: "kesiswaan",
  addLabel: "Tambah Pembinaan",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "topic", label: "Topik", type: "text", required: true },
    { key: "coach_name", label: "Pembina", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "detail", label: "Detail", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "topic", label: "Topik" },
    { key: "coach_name", label: "Pembina" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function CoachingPage() {
  return <CrudModulePage config={config} />;
}
