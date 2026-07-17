import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Materi",
  path: "/materials",
  permPrefix: "lms",
  addLabel: "Tambah Materi",
  filters: ["class", "major"],
  fields: [
    { key: "title", label: "Judul", type: "text", required: true, fullWidth: true },
    { key: "subject_id", label: "Mata Pelajaran", type: "ref", refPath: "/subjects" },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "teacher_id", label: "Pengajar", type: "teacher" },
    { key: "semester", label: "Semester", type: "number" },
    { key: "attachment_url", label: "Lampiran (URL)", type: "text", fullWidth: true },
    { key: "content", label: "Konten", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "subject", label: "Mapel", render: (r) => (r.subject as { name: string })?.name ?? "-" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "semester", label: "Smt", mono: true },
  ],
};

export default function MaterialsPage() {
  return <CrudModulePage config={config} />;
}
