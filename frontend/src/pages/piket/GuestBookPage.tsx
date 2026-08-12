import { useState } from "react";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDateTime } from "../../lib/format";
import { http } from "../../lib/http";
import { useAuth } from "../../context/AuthContext";

// Jam keluar tidak diisi dari form, melainkan lewat aksi Catat Keluar.
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
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "institution", label: "Instansi" },
    { key: "purpose", label: "Keperluan" },
    { key: "check_in_time", label: "Masuk", render: (r) => fmtDateTime(r.check_in_time), mono: true },
    {
      key: "check_out_time",
      label: "Keluar",
      render: (r) => (r.check_out_time ? fmtDateTime(r.check_out_time) : "Masih di dalam"),
      mono: true,
    },
  ],
};

export default function GuestBookPage() {
  const { can } = useAuth();
  const canUpdate = can("piket.update");

  return (
    <CrudModulePage
      config={{
        ...config,
        rowActions: canUpdate
          ? (row, reload) => (row.check_out_time ? null : <CheckOutButton id={String(row.id)} reload={reload} />)
          : undefined,
      }}
    />
  );
}

function CheckOutButton({ id, reload }: { id: string; reload: () => void }) {
  const [saving, setSaving] = useState(false);

  async function handleCheckOut() {
    if (saving) return;
    setSaving(true);
    try {
      await http.put(`/guest-book/${id}/checkout`);
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckOut}
      disabled={saving}
      className="mr-3 text-primary hover:underline disabled:opacity-50"
    >
      Catat Keluar
    </button>
  );
}
