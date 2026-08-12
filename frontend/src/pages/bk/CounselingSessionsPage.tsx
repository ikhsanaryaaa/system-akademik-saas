import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { counselingTypes, serviceFields } from "../../lib/bk";

const config: CrudModuleConfig = {
  title: "Sesi Konseling",
  path: "/counseling-sessions",
  permPrefix: "bk",
  addLabel: "Tambah Sesi",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "type", label: "Jenis Layanan", type: "select", options: counselingTypes },
    { key: "field", label: "Bidang Layanan", type: "select", options: serviceFields },
    { key: "topic", label: "Topik", type: "text", required: true },
    { key: "counsel_name", label: "Konselor", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "summary", label: "Ringkasan", type: "textarea" },
    { key: "result", label: "Hasil", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "type", label: "Jenis" },
    { key: "field", label: "Bidang" },
    { key: "topic", label: "Topik" },
    { key: "counsel_name", label: "Konselor" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function CounselingSessionsPage() {
  return <CrudModulePage config={config} />;
}
