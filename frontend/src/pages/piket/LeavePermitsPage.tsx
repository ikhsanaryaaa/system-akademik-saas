import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDateTime } from "../../lib/format";
import { leaveStatuses, leaveStatusLabel } from "../../lib/piket";

const config: CrudModuleConfig = {
  title: "Izin Keluar",
  path: "/leave-permits",
  permPrefix: "piket",
  addLabel: "Tambah Izin",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "status", label: "Status", type: "select", options: leaveStatuses },
    { key: "officer", label: "Petugas", type: "text" },
    { key: "leave_time", label: "Jam Keluar", type: "datetime" },
    { key: "return_time", label: "Jam Kembali", type: "datetime" },
    { key: "reason", label: "Alasan", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "status", label: "Status", render: (r) => leaveStatusLabel[String(r.status)] ?? String(r.status) },
    { key: "leave_time", label: "Keluar", render: (r) => fmtDateTime(r.leave_time), mono: true },
    { key: "return_time", label: "Kembali", render: (r) => fmtDateTime(r.return_time), mono: true },
  ],
};

export default function LeavePermitsPage() {
  return <CrudModulePage config={config} />;
}
