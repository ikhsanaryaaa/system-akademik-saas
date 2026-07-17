import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Buku Piket",
  path: "/duty-logs",
  permPrefix: "piket",
  addLabel: "Tambah Catatan",
  fields: [
    { key: "teacher_id", label: "Petugas Piket", type: "teacher" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "incident", label: "Kejadian", type: "textarea" },
    { key: "action", label: "Tindakan", type: "textarea" },
  ],
  columns: [
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
    { key: "teacher", label: "Petugas", render: (r) => (r.teacher as { name: string })?.name ?? "-" },
    { key: "incident", label: "Kejadian" },
  ],
};

export default function DutyLogsPage() {
  return <CrudModulePage config={config} />;
}
