import CrudModulePage, { fmtDate, type CrudModuleConfig } from "../../components/CrudModulePage";
import { admissionStatuses } from "../../lib/kesiswaan";

const config: CrudModuleConfig = {
  title: "PPDB",
  path: "/admissions",
  permPrefix: "kesiswaan",
  addLabel: "Tambah Pendaftar",
  fields: [
    { key: "name", label: "Nama", type: "text", required: true },
    { key: "origin_school", label: "Asal Sekolah", type: "text" },
    { key: "gender", label: "Jenis Kelamin", type: "select", options: ["L", "P"] },
    { key: "major_id", label: "Jurusan Pilihan", type: "major" },
    { key: "status", label: "Status", type: "select", options: admissionStatuses },
    { key: "phone", label: "Telepon", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "registered_at", label: "Tanggal Daftar", type: "date" },
    { key: "address", label: "Alamat", type: "textarea" },
    { key: "note", label: "Catatan", type: "textarea" },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "origin_school", label: "Asal Sekolah" },
    { key: "major", label: "Jurusan", render: (r) => (r.major as { name: string })?.name ?? "-" },
    { key: "status", label: "Status" },
    { key: "registered_at", label: "Daftar", render: (r) => fmtDate(r.registered_at), mono: true },
  ],
};

export default function AdmissionsPage() {
  return <CrudModulePage config={config} />;
}
