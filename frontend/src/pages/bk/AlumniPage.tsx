import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Data Alumni",
  path: "/alumni",
  permPrefix: "bk",
  addLabel: "Tambah Alumni",
  fields: [
    { key: "name", label: "Nama", type: "text", required: true },
    { key: "graduation_year", label: "Tahun Lulus", type: "number" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "track", label: "Jalur", type: "select", options: ["kuliah", "kerja", "wirausaha", "lainnya"] },
    { key: "destination", label: "Tujuan", type: "text" },
    { key: "phone", label: "Telepon", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "note", label: "Catatan", type: "textarea" },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "graduation_year", label: "Tahun Lulus", mono: true },
    { key: "major", label: "Jurusan", render: (r) => (r.major as { name: string })?.name ?? "-" },
    { key: "track", label: "Jalur" },
    { key: "destination", label: "Tujuan" },
  ],
};

export default function AlumniPage() {
  return <CrudModulePage config={config} />;
}
