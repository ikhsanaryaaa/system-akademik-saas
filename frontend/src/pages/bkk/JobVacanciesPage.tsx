import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { jobVacancyStatuses, jobVacancyStatusLabel } from "../../lib/bkk";

const config: CrudModuleConfig = {
  title: "Lowongan Kerja",
  path: "/job-vacancies",
  permPrefix: "bkk",
  addLabel: "Tambah Lowongan",
  fields: [
    { key: "position", label: "Posisi", type: "text", required: true },
    { key: "company", label: "Perusahaan", type: "text", required: true },
    { key: "location", label: "Lokasi", type: "text" },
    { key: "status", label: "Status", type: "select", options: jobVacancyStatuses },
    { key: "deadline", label: "Deadline", type: "date" },
    { key: "description", label: "Deskripsi", type: "textarea" },
  ],
  columns: [
    { key: "position", label: "Posisi" },
    { key: "company", label: "Perusahaan" },
    { key: "location", label: "Lokasi" },
    { key: "status", label: "Status", render: (r) => jobVacancyStatusLabel[String(r.status)] ?? String(r.status) },
    { key: "deadline", label: "Deadline", render: (r) => fmtDate(r.deadline), mono: true },
  ],
};

export default function JobVacanciesPage() {
  return <CrudModulePage config={config} />;
}
