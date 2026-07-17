import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";

const config: CrudModuleConfig = {
  title: "Agenda BK",
  path: "/counseling-agenda",
  permPrefix: "bk",
  addLabel: "Tambah Agenda",
  fields: [
    { key: "title", label: "Judul", type: "text", required: true },
    { key: "location", label: "Lokasi", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "location", label: "Lokasi" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function AgendaPage() {
  return <CrudModulePage config={config} />;
}
