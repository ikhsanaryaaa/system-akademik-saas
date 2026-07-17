import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDateTime } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Buku Tamu",
  path: "/guest-book",
  permPrefix: "piket",
  addLabel: "Tambah Tamu",
  fields: [
    { key: "name", label: "Nama", type: "text", required: true },
    { key: "institution", label: "Instansi", type: "text" },
    { key: "purpose", label: "Keperluan", type: "text" },
    { key: "phone", label: "Telepon", type: "text" },
    { key: "check_in_time", label: "Jam Masuk", type: "datetime" },
    { key: "check_out_time", label: "Jam Keluar", type: "datetime" },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "institution", label: "Instansi" },
    { key: "purpose", label: "Keperluan" },
    { key: "check_in_time", label: "Masuk", render: (r) => fmtDateTime(r.check_in_time), mono: true },
    { key: "check_out_time", label: "Keluar", render: (r) => fmtDateTime(r.check_out_time), mono: true },
  ],
};

export default function GuestBookPage() {
  return <CrudModulePage config={config} />;
}
