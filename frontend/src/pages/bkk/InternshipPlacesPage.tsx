import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Tempat PKL",
  path: "/internship-places",
  permPrefix: "bkk",
  addLabel: "Tambah Tempat",
  fields: [
    { key: "name", label: "Nama Tempat", type: "text", required: true },
    { key: "field", label: "Bidang", type: "text" },
    { key: "contact_name", label: "Kontak", type: "text" },
    { key: "phone", label: "Telepon", type: "text" },
    { key: "quota", label: "Kuota", type: "number" },
    { key: "address", label: "Alamat", type: "textarea" },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "field", label: "Bidang" },
    { key: "contact_name", label: "Kontak" },
    { key: "quota", label: "Kuota", mono: true },
  ],
};

export default function InternshipPlacesPage() {
  return <CrudModulePage config={config} />;
}
