import { Link } from "react-router-dom";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Paket Ujian",
  path: "/exam-packages",
  permPrefix: "cbt",
  addLabel: "Tambah Paket",
  filters: ["class", "major"],
  fields: [
    { key: "title", label: "Judul Paket", type: "text", required: true, fullWidth: true },
    { key: "subject_id", label: "Mata Pelajaran", type: "ref", refPath: "/subjects" },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "shuffle_questions", label: "Acak Soal", type: "boolean" },
    { key: "shuffle_options", label: "Acak Opsi", type: "boolean" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "subject", label: "Mapel", render: (r) => (r.subject as { name: string })?.name ?? "-" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    {
      key: "items",
      label: "Soal",
      render: (r) => (
        <Link to={`/cbt/packages/${String(r.id)}/items`} className="text-primary hover:underline">
          Susun Soal
        </Link>
      ),
    },
  ],
};

export default function ExamPackagesPage() {
  return <CrudModulePage config={config} />;
}
