import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Pengembangan Bakat dan Minat",
  path: "/talent-development",
  permPrefix: "kesiswaan",
  addLabel: "Tambah Data",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "field", label: "Bidang", type: "text", required: true },
    { key: "category", label: "Kategori", type: "select", options: ["akademik", "non-akademik"] },
    { key: "mentor", label: "Pembimbing", type: "text" },
    { key: "detail", label: "Detail", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "field", label: "Bidang" },
    { key: "category", label: "Kategori" },
    { key: "mentor", label: "Pembimbing" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
  ],
};

export default function TalentPage() {
  return <CrudModulePage config={config} />;
}
