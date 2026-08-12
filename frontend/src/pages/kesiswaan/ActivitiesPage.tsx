import { useCallback, useEffect, useState, type FormEvent } from "react";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type StudentRow } from "../../lib/master";
import { bidangOptions, participantRoles, type ActivityParticipant } from "../../lib/kesiswaan";
import { useAuth } from "../../context/AuthContext";

type OpenActivity = { id: string; name: string };

export default function ActivitiesPage() {
  const [openActivity, setOpenActivity] = useState<OpenActivity | null>(null);

  const config: CrudModuleConfig = {
    title: "Kegiatan Kesiswaan",
    path: "/student-activities",
    permPrefix: "kesiswaan",
    addLabel: "Tambah Kegiatan",
    fields: [
      { key: "name", label: "Nama Kegiatan", type: "text", required: true },
      { key: "type", label: "Jenis", type: "select", options: ["ekstrakurikuler", "acara", "lomba", "lainnya"] },
      { key: "field", label: "Bidang", type: "select", options: bidangOptions },
      { key: "organizer", label: "Penyelenggara", type: "text" },
      { key: "location", label: "Lokasi", type: "text" },
      { key: "start_date", label: "Tanggal Mulai", type: "date" },
      { key: "end_date", label: "Tanggal Selesai", type: "date" },
      { key: "description", label: "Deskripsi", type: "textarea" },
    ],
    columns: [
      { key: "name", label: "Nama" },
      { key: "type", label: "Jenis" },
      { key: "field", label: "Bidang" },
      { key: "organizer", label: "Penyelenggara" },
      { key: "start_date", label: "Mulai", render: (r) => fmtDate(r.start_date), mono: true },
      { key: "end_date", label: "Selesai", render: (r) => fmtDate(r.end_date), mono: true },
    ],
    rowActions: (row) => (
      <button
        type="button"
        onClick={() => setOpenActivity({ id: String(row.id), name: String(row.name) })}
        className="mr-3 text-primary hover:underline"
      >
        Peserta
      </button>
    ),
  };

  return (
    <>
      <CrudModulePage config={config} />
      {openActivity && <ParticipantsModal activity={openActivity} onClose={() => setOpenActivity(null)} />}
    </>
  );
}

// ParticipantsModal mengelola daftar peserta satu kegiatan. Peran diubah dengan
// menghapus lalu menambahkan kembali, karena datanya hanya sebaris relasi.
function ParticipantsModal({ activity, onClose }: { activity: OpenActivity; onClose: () => void }) {
  const { can } = useAuth();
  const [items, setItems] = useState<ActivityParticipant[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState("anggota");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const path = `/student-activities/${activity.id}/participants`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ActivityParticipant[]>>(path);
      setItems(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
    paginatedList<StudentRow>("/students", { per_page: 100 }).then((res) => setStudents(res.items));
  }, [load]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await http.post(path, { student_id: studentId, role });
      setStudentId("");
      load();
    } catch {
      setError("Gagal menambahkan peserta, siswa mungkin sudah terdaftar");
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Hapus peserta ini?")) return;
    await http.delete(`${path}/${id}`);
    load();
  }

  const canAdd = can("kesiswaan.create");
  const canRemove = can("kesiswaan.delete");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-xl bg-canvas p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Peserta Kegiatan</h2>
            <p className="text-sm text-muted">{activity.name}</p>
          </div>
          <span className="font-mono text-sm text-muted">{items.length} peserta</span>
        </div>

        {canAdd && (
          <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline p-4">
            <div className="grow">
              <label htmlFor="ap-student" className="block text-sm font-medium text-body">
                Siswa
              </label>
              <select
                id="ap-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Pilih siswa</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nis})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ap-role" className="block text-sm font-medium text-body">
                Peran
              </label>
              <select
                id="ap-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
              >
                {participantRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Tambah
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-lg border border-hairline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Peran</th>
                {canRemove && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Memuat...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Belum ada peserta.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{p.student?.name ?? "-"}</td>
                    <td className="px-4 py-3">{p.student?.class?.name ?? "-"}</td>
                    <td className="px-4 py-3">{p.role}</td>
                    {canRemove && (
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => handleRemove(p.id)} className="text-danger hover:underline">
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
