import { useEffect, useState, type FormEvent } from "react";
import { createItem, updateItem, deleteItem } from "../../lib/master";
import { http, type ApiResponse } from "../../lib/http";
import type { AcademicCalendarEvent } from "../../lib/curriculum";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

const PATH = "/academic-calendar";
const eventTypes = ["libur", "ujian", "kegiatan"];

// isoDate memotong nilai tanggal ISO ke format input date (YYYY-MM-DD).
function isoDate(v?: string): string {
  return v ? v.slice(0, 10) : "";
}

export default function AcademicCalendarPage() {
  const { can } = useAuth();
  const { activeId, years } = useAcademicYear();
  const [rows, setRows] = useState<AcademicCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicCalendarEvent | null>(null);
  const [form, setForm] = useState<Partial<AcademicCalendarEvent>>({ event_type: "kegiatan" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeId) params.academic_year_id = activeId;
      const res = await http.get<ApiResponse<AcademicCalendarEvent[]>>(PATH, { params });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  function openCreate() {
    setEditing(null);
    setForm({ event_type: "kegiatan" });
    setError("");
    setOpen(true);
  }

  function openEdit(row: AcademicCalendarEvent) {
    setEditing(row);
    setForm({ ...row, start_date: isoDate(row.start_date), end_date: isoDate(row.end_date) });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const yearId = activeId ?? years.find((y) => y.is_active)?.id;
    if (!yearId) {
      setError("Pilih tahun ajaran aktif terlebih dahulu");
      return;
    }
    const body = {
      title: form.title,
      description: form.description ?? "",
      event_type: form.event_type,
      start_date: new Date(String(form.start_date)).toISOString(),
      end_date: new Date(String(form.end_date)).toISOString(),
      academic_year_id: yearId,
    };
    try {
      if (editing) await updateItem(PATH, editing.id, body);
      else await createItem(PATH, body);
      setOpen(false);
      load();
    } catch {
      setError("Gagal menyimpan agenda, periksa tanggal");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus agenda ini?")) return;
    await deleteItem(PATH, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Kalender Akademik</h1>
        {can("curriculum.create") && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Agenda
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Mulai</th>
              <th className="px-4 py-3">Selesai</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada agenda.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{r.title}</td>
                  <td className="px-4 py-3 capitalize">{r.event_type}</td>
                  <td className="px-4 py-3 font-mono">{isoDate(r.start_date)}</td>
                  <td className="px-4 py-3 font-mono">{isoDate(r.end_date)}</td>
                  <td className="px-4 py-3 text-right">
                    {can("curriculum.update") && (
                      <button type="button" onClick={() => openEdit(r)} className="text-primary hover:underline">
                        Edit
                      </button>
                    )}
                    {can("curriculum.delete") && (
                      <button type="button"
                        onClick={() => handleDelete(r.id)}
                        className="ml-3 text-danger hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Agenda</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-body">Judul</label>
                <input
                  value={form.title ?? ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-body">Jenis</label>
                <select
                  value={form.event_type ?? "kegiatan"}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm capitalize"
                >
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-body">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={isoDate(form.start_date)}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-body">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={isoDate(form.end_date)}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-body">Deskripsi</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
                  rows={3}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
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
      )}
    </div>
  );
}
