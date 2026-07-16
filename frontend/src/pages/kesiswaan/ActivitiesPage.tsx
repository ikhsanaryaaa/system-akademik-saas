import CrudModulePage, { fmtDate, type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Kegiatan Kesiswaan",
  path: "/student-activities",
  permPrefix: "kesiswaan",
  addLabel: "Tambah Kegiatan",
  fields: [
    { key: "name", label: "Nama Kegiatan", type: "text", required: true },
    { key: "type", label: "Jenis", type: "select", options: ["ekstrakurikuler", "acara", "lomba", "lainnya"] },
    { key: "organizer", label: "Penyelenggara", type: "text" },
    { key: "location", label: "Lokasi", type: "text" },
    { key: "start_date", label: "Tanggal Mulai", type: "date" },
    { key: "end_date", label: "Tanggal Selesai", type: "date" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "type", label: "Jenis" },
    { key: "organizer", label: "Penyelenggara" },
    { key: "start_date", label: "Mulai", render: (r) => fmtDate(r.start_date), mono: true },
    { key: "end_date", label: "Selesai", render: (r) => fmtDate(r.end_date), mono: true },
  ],
};

export default function ActivitiesPage() {
  return <CrudModulePage config={config} />;
}
