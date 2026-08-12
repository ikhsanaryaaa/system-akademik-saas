import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";

// Petugas diambil server dari jadwal piket. Mencatat keterlambatan di sini
// sekaligus menandai kehadiran siswa menjadi terlambat pada tanggal yang sama.
const config: CrudModuleConfig = {
  title: "Keterlambatan",
  path: "/lateness",
  permPrefix: "piket",
  addLabel: "Catat Keterlambatan",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "context", contextFrom: "class" },
    { key: "major_id", label: "Jurusan", type: "context", contextFrom: "major" },
    { key: "minutes", label: "Menit Terlambat", type: "number" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "reason", label: "Alasan", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "minutes", label: "Menit", mono: true },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
    {
      key: "officer_teacher",
      label: "Petugas",
      render: (r) => (r.officer_teacher as { name: string })?.name ?? String(r.officer ?? "-"),
    },
  ],
};

export default function LatenessPage() {
  return <CrudModulePage config={config} />;
}
