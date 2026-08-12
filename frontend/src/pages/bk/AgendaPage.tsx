import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { serviceComponents, serviceFields } from "../../lib/bk";

const componentLabels = Object.fromEntries(serviceComponents.map((c) => [c.value, c.label]));

const config: CrudModuleConfig = {
  title: "Agenda BK",
  path: "/counseling-agenda",
  permPrefix: "bk",
  addLabel: "Tambah Agenda",
  fields: [
    { key: "title", label: "Judul", type: "text", required: true },
    { key: "field", label: "Bidang Layanan", type: "select", options: serviceFields },
    { key: "component", label: "Komponen Layanan", type: "select", options: serviceComponents },
    { key: "location", label: "Lokasi", type: "text" },
    { key: "date", label: "Tanggal", type: "date" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "field", label: "Bidang" },
    { key: "component", label: "Komponen", render: (r) => componentLabels[String(r.component ?? "")] ?? "-" },
    { key: "location", label: "Lokasi" },
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date), mono: true },
  ],
};

export default function AgendaPage() {
  return <CrudModulePage config={config} />;
}
