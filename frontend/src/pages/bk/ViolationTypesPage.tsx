import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Jenis Pelanggaran",
  path: "/violation-types",
  permPrefix: "bk",
  addLabel: "Tambah Jenis",
  fields: [
    { key: "name", label: "Nama", type: "text", required: true },
    { key: "category", label: "Kategori", type: "select", options: ["ringan", "sedang", "berat"] },
    { key: "point", label: "Poin", type: "number", required: true },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "category", label: "Kategori" },
    { key: "point", label: "Poin", mono: true },
  ],
};

export default function ViolationTypesPage() {
  return <CrudModulePage config={config} />;
}
