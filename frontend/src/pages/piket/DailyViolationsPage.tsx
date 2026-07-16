import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { dailyViolationCategories } from "../../lib/piket";

const config: CrudModuleConfig = {
  title: "Pelanggaran Harian",
  path: "/daily-violations",
  permPrefix: "piket",
  addLabel: "Catat Pelanggaran",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "category", label: "Kategori", type: "select", options: dailyViolationCategories },
    { key: "officer", label: "Petugas", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "detail", label: "Detail", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "category", label: "Kategori" },
    { key: "officer", label: "Petugas" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function DailyViolationsPage() {
  return <CrudModulePage config={config} />;
}
