import CrudModulePage, { fmtDate, type CrudModuleConfig } from "../../components/CrudModulePage";
import { achievementLevels } from "../../lib/bk";

const config: CrudModuleConfig = {
  title: "Prestasi Siswa",
  path: "/achievements",
  permPrefix: "bk",
  addLabel: "Tambah Prestasi",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "title", label: "Judul Prestasi", type: "text", required: true },
    { key: "category", label: "Kategori", type: "select", options: ["akademik", "non-akademik"] },
    { key: "level", label: "Tingkat", type: "select", options: achievementLevels },
    { key: "rank", label: "Peringkat", type: "text" },
    { key: "organizer", label: "Penyelenggara", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "title", label: "Prestasi" },
    { key: "level", label: "Tingkat" },
    { key: "rank", label: "Peringkat" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function AchievementsPage() {
  return <CrudModulePage config={config} />;
}
