import { Link } from "react-router-dom";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Forum Diskusi",
  path: "/forum-threads",
  permPrefix: "lms",
  addLabel: "Tambah Topik",
  filters: ["class", "major"],
  fields: [
    { key: "title", label: "Judul", type: "text", required: true, fullWidth: true },
    { key: "subject_id", label: "Mata Pelajaran", type: "ref", refPath: "/subjects" },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "created_by", label: "Dibuat Oleh", type: "text" },
    { key: "body", label: "Isi", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "created_by", label: "Dibuat Oleh" },
    { key: "created_at", label: "Tanggal", render: (r) => fmtDate(r.created_at), mono: true },
    {
      key: "posts",
      label: "Diskusi",
      render: (r) => (
        <Link to={`/lms/forum/${String(r.id)}/posts`} className="text-primary hover:underline">
          Buka
        </Link>
      ),
    },
  ],
};

export default function ForumThreadsPage() {
  return <CrudModulePage config={config} />;
}
