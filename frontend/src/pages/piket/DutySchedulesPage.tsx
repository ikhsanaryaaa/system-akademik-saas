import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { weekdays } from "../../lib/piket";

const config: CrudModuleConfig = {
  title: "Jadwal Piket",
  path: "/duty-schedules",
  permPrefix: "piket",
  addLabel: "Tambah Jadwal",
  fields: [
    { key: "teacher_id", label: "Guru", type: "teacher", required: true },
    { key: "day", label: "Hari", type: "select", options: weekdays, required: true },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "note", label: "Catatan", type: "textarea" },
  ],
  columns: [
    { key: "teacher", label: "Guru", render: (r) => (r.teacher as { name: string })?.name ?? "-" },
    { key: "day", label: "Hari" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function DutySchedulesPage() {
  return <CrudModulePage config={config} />;
}
