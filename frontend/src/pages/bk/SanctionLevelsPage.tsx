import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";

const config: CrudModuleConfig = {
  title: "Tahap Sanksi",
  path: "/sanction-levels",
  permPrefix: "bk",
  addLabel: "Tambah Tahap",
  fields: [
    { key: "min_point", label: "Ambang Poin", type: "number", required: true },
    { key: "name", label: "Nama Tahap", type: "text", required: true },
    { key: "action", label: "Tindakan", type: "textarea" },
    { key: "note", label: "Catatan", type: "textarea" },
  ],
  columns: [
    { key: "min_point", label: "Ambang Poin", mono: true },
    { key: "name", label: "Tahap" },
    { key: "action", label: "Tindakan" },
  ],
};

// Tahap sanksi berlaku saat akumulasi poin siswa pada tahun ajaran berjalan
// mencapai ambangnya. Nilai awal dari seeder hanya contoh dan boleh diubah.
export default function SanctionLevelsPage() {
  return <CrudModulePage config={config} />;
}
