import CrudModulePage, { fmtDate, type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Home Visit",
  path: "/home-visits",
  permPrefix: "bk",
  addLabel: "Tambah Kunjungan",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "purpose", label: "Tujuan", type: "text", required: true },
    { key: "officer", label: "Petugas", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "address", label: "Alamat", type: "textarea" },
    { key: "result", label: "Hasil", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "purpose", label: "Tujuan" },
    { key: "officer", label: "Petugas" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function HomeVisitsPage() {
  return <CrudModulePage config={config} />;
}
