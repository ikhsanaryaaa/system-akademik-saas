import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { http } from "../../lib/http";
import { paginatedList, type ClassRow } from "../../lib/master";
import { admissionStatuses, type Admission } from "../../lib/kesiswaan";
import { useAuth } from "../../context/AuthContext";

type Dialog = { mode: "status" | "convert"; row: Admission; reload: () => void };

export default function AdmissionsPage() {
  const { can } = useAuth();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const canUpdate = can("kesiswaan.update");

  function closeDialog(saved: boolean) {
    if (saved) dialog?.reload();
    setDialog(null);
  }

  const config: CrudModuleConfig = {
    title: "PPDB",
    path: "/admissions",
    permPrefix: "kesiswaan",
    addLabel: "Tambah Pendaftar",
    fields: [
      { key: "name", label: "Nama", type: "text", required: true },
      { key: "origin_school", label: "Asal Sekolah", type: "text" },
      { key: "gender", label: "Jenis Kelamin", type: "select", options: ["L", "P"] },
      { key: "major_id", label: "Jurusan Pilihan", type: "major" },
      { key: "phone", label: "Telepon", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "registered_at", label: "Tanggal Daftar", type: "date" },
      { key: "address", label: "Alamat", type: "textarea" },
      { key: "note", label: "Catatan", type: "textarea" },
    ],
    columns: [
      { key: "name", label: "Nama" },
      { key: "origin_school", label: "Asal Sekolah" },
      { key: "major", label: "Jurusan", render: (r) => (r.major as { name: string })?.name ?? "-" },
      { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status ?? "")} /> },
      { key: "student_id", label: "Siswa", render: (r) => (r.student_id ? "Sudah dikonversi" : "-") },
      { key: "registered_at", label: "Daftar", render: (r) => fmtDate(r.registered_at), mono: true },
    ],
    // Status dan konversi sengaja jadi aksi baris tersendiri, bukan bagian modal
    // edit, supaya keputusan penerimaan terpisah dari koreksi data pendaftar.
    rowActions: canUpdate
      ? (row, reload) => {
          const item = row as unknown as Admission;
          return (
            <>
              <button
                type="button"
                onClick={() => setDialog({ mode: "status", row: item, reload })}
                className="mr-3 text-primary hover:underline"
              >
                Status
              </button>
              {item.status === "accepted" && !item.student_id && (
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "convert", row: item, reload })}
                  className="mr-3 text-primary hover:underline"
                >
                  Jadikan Siswa
                </button>
              )}
            </>
          );
        }
      : undefined,
  };

  return (
    <>
      <CrudModulePage config={config} />
      {dialog?.mode === "status" && <StatusDialog row={dialog.row} onClose={closeDialog} />}
      {dialog?.mode === "convert" && <ConvertDialog row={dialog.row} onClose={closeDialog} />}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "accepted"
      ? "bg-success-soft text-success"
      : status === "rejected"
        ? "bg-danger-soft text-danger"
        : "bg-surface-soft text-body";
  return <span className={`rounded-md px-2 py-1 text-xs font-medium ${tone}`}>{status || "-"}</span>;
}

function StatusDialog({ row, onClose }: { row: Admission; onClose: (saved: boolean) => void }) {
  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await http.put(`/admissions/${row.id}/status`, { status, note });
      onClose(true);
    } catch {
      setError("Gagal mengubah status pendaftar");
    }
  }

  return (
    <Dialog title="Ubah Status Pendaftar" subtitle={row.name} onClose={onClose} onSubmit={handleSubmit} error={error}>
      <div>
        <label htmlFor="ad-status" className="block text-sm font-medium text-body">
          Status
        </label>
        <select
          id="ad-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
        >
          {admissionStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="ad-note" className="block text-sm font-medium text-body">
          Catatan
        </label>
        <textarea
          id="ad-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm"
        />
      </div>
    </Dialog>
  );
}

// ConvertDialog membuat siswa master data dari pendaftar yang diterima.
// NIS diisi manual karena formatnya baru ditentukan pada tahap Setting Sekolah.
function ConvertDialog({ row, onClose }: { row: Admission; onClose: (saved: boolean) => void }) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await http.post(`/admissions/${row.id}/convert`, { nis, nisn, class_id: classId || null });
      onClose(true);
    } catch {
      setError("Gagal mengonversi, pastikan NIS dan NISN belum dipakai siswa lain");
    }
  }

  return (
    <Dialog title="Jadikan Siswa" subtitle={row.name} onClose={onClose} onSubmit={handleSubmit} error={error}>
      <div>
        <label htmlFor="cv-nis" className="block text-sm font-medium text-body">
          NIS
        </label>
        <input
          id="cv-nis"
          value={nis}
          onChange={(e) => setNis(e.target.value)}
          required
          className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 font-mono text-sm"
        />
      </div>
      <div>
        <label htmlFor="cv-nisn" className="block text-sm font-medium text-body">
          NISN
        </label>
        <input
          id="cv-nisn"
          value={nisn}
          onChange={(e) => setNisn(e.target.value)}
          className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 font-mono text-sm"
        />
      </div>
      <div>
        <label htmlFor="cv-class" className="block text-sm font-medium text-body">
          Kelas
        </label>
        <select
          id="cv-class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
        >
          <option value="">Belum ditentukan</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted md:col-span-2">
        Nama, jenis kelamin, dan jurusan terbawa otomatis dari data pendaftar.
      </p>
    </Dialog>
  );
}

function Dialog({
  title,
  subtitle,
  error,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  subtitle: string;
  error: string;
  onClose: (saved: boolean) => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-xl bg-canvas p-6">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
          >
            Batal
          </button>
          <button
            type="submit"
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
