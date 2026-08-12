import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { achievementLevels } from "../../lib/bk";
import { bidangOptions } from "../../lib/kesiswaan";

const config: CrudModuleConfig = {
  title: "Prestasi Siswa",
  path: "/achievements",
  permPrefix: "bk",
  addLabel: "Tambah Prestasi",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "title", label: "Judul Prestasi", type: "text", required: true },
    { key: "field", label: "Bidang", type: "select", options: bidangOptions },
    { key: "category", label: "Kategori", type: "select", options: ["akademik", "non-akademik"] },
    { key: "level", label: "Tingkat", type: "select", options: achievementLevels },
    { key: "rank", label: "Peringkat", type: "text" },
    { key: "organizer", label: "Penyelenggara", type: "text" },
    { key: "point", label: "Poin Positif", type: "number" },
    { key: "date", label: "Tanggal", type: "date" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "title", label: "Prestasi" },
    { key: "field", label: "Bidang" },
    { key: "level", label: "Tingkat" },
    { key: "rank", label: "Peringkat" },
    { key: "point", label: "Poin", mono: true },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function AchievementsPage() {
  return <CrudModulePage config={config} />;
}
