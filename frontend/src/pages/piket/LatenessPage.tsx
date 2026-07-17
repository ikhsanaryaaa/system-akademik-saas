import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Keterlambatan",
  path: "/lateness",
  permPrefix: "piket",
  addLabel: "Catat Keterlambatan",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "minutes", label: "Menit Terlambat", type: "number" },
    { key: "officer", label: "Petugas", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "reason", label: "Alasan", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "minutes", label: "Menit", mono: true },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function LatenessPage() {
  return <CrudModulePage config={config} />;
}
