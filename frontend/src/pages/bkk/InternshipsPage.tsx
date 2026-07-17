import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { internshipStatuses, internshipStatusLabel } from "../../lib/bkk";

const config: CrudModuleConfig = {
  title: "Data PKL",
  path: "/internships",
  permPrefix: "bkk",
  addLabel: "Tambah PKL",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "place_id", label: "Tempat PKL", type: "ref", refPath: "/internship-places", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "mentor", label: "Pembimbing", type: "text" },
    { key: "status", label: "Status", type: "select", options: internshipStatuses },
    { key: "start_date", label: "Mulai", type: "date" },
    { key: "end_date", label: "Selesai", type: "date" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "place", label: "Tempat", render: (r) => (r.place as { name: string })?.name ?? "-" },
    { key: "mentor", label: "Pembimbing" },
    { key: "status", label: "Status", render: (r) => internshipStatusLabel[String(r.status)] ?? String(r.status) },
    { key: "start_date", label: "Mulai", render: (r) => fmtDate(r.start_date), mono: true },
  ],
};

export default function InternshipsPage() {
  return <CrudModulePage config={config} />;
}
