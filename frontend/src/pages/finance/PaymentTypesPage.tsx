import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtRupiah } from "../../lib/finance";

const config: CrudModuleConfig = {
  title: "Jenis Pembayaran",
  path: "/payment-types",
  permPrefix: "finance",
  addLabel: "Tambah Jenis",
  fields: [
    { key: "name", label: "Nama", type: "text", required: true },
    { key: "default_amount", label: "Nominal Default", type: "number" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "default_amount", label: "Nominal Default", render: (r) => fmtRupiah(r.default_amount), mono: true },
    { key: "description", label: "Deskripsi" },
  ],
};

export default function PaymentTypesPage() {
  return <CrudModulePage config={config} />;
}
