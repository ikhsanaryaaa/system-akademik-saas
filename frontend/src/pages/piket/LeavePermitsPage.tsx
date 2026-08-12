import { useState } from "react";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDateTime } from "../../lib/format";
import { http } from "../../lib/http";
import { leaveStatusLabel } from "../../lib/piket";
import { useAuth } from "../../context/AuthContext";

// Status, petugas, dan jam kembali tidak lagi diisi dari form. Status ditetapkan
// server, petugas diambil dari jadwal piket, jam kembali lewat aksi tersendiri.
const config: CrudModuleConfig = {
  title: "Izin Keluar",
  path: "/leave-permits",
  permPrefix: "piket",
  addLabel: "Tambah Izin",
  filters: ["class", "major"],
  fields: [
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "class_id", label: "Kelas", type: "context", contextFrom: "class" },
    { key: "major_id", label: "Jurusan", type: "context", contextFrom: "major" },
    { key: "leave_time", label: "Jam Keluar", type: "datetime" },
    { key: "reason", label: "Alasan", type: "textarea" },
  ],
  columns: [
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "class", label: "Kelas", render: (r) => (r.class as { name: string })?.name ?? "-" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status ?? "")} /> },
    { key: "leave_time", label: "Keluar", render: (r) => fmtDateTime(r.leave_time), mono: true },
    { key: "return_time", label: "Kembali", render: (r) => fmtDateTime(r.return_time), mono: true },
    {
      key: "officer_teacher",
      label: "Petugas",
      render: (r) => (r.officer_teacher as { name: string })?.name ?? String(r.officer ?? "-"),
    },
  ],
};

export default function LeavePermitsPage() {
  const { can } = useAuth();
  const canUpdate = can("piket.update");

  return (
    <CrudModulePage
      config={{
        ...config,
        rowActions: canUpdate
          ? (row, reload) => (row.status === "out" ? <ReturnButton id={String(row.id)} reload={reload} /> : null)
          : undefined,
      }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "returned" ? "bg-success-soft text-success" : "bg-warning-soft text-warning";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {leaveStatusLabel[status] ?? status}
    </span>
  );
}

function ReturnButton({ id, reload }: { id: string; reload: () => void }) {
  const [saving, setSaving] = useState(false);

  async function handleReturn() {
    if (saving) return;
    setSaving(true);
    try {
      await http.put(`/leave-permits/${id}/return`);
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReturn}
      disabled={saving}
      className="mr-3 text-primary hover:underline disabled:opacity-50"
    >
      Catat Kembali
    </button>
  );
}
