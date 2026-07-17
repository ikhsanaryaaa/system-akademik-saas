import { useEffect, useReducer, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type ClassRow } from "../../lib/master";
import { fmtDateTime } from "../../lib/format";
import { scheduleStatusLabel, type ExamPackage, type ExamSchedule } from "../../lib/cbt";
import { useAuth } from "../../context/AuthContext";

interface FormState {
  open: boolean;
  id: string | null;
  package_id: string;
  title: string;
  class_id: string;
  duration_min: number;
  start_at: string;
  end_at: string;
  error: string;
}

const emptyForm: FormState = {
  open: false,
  id: null,
  package_id: "",
  title: "",
  class_id: "",
  duration_min: 60,
  start_at: "",
  end_at: "",
  error: "",
};

type Action =
  | { type: "openCreate" }
  | { type: "openEdit"; value: ExamSchedule }
  | { type: "close" }
  | { type: "field"; key: keyof FormState; value: string | number }
  | { type: "error"; value: string };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "openCreate":
      return { ...emptyForm, open: true };
    case "openEdit":
      return {
        open: true,
        id: action.value.id,
        package_id: action.value.package_id,
        title: action.value.title,
        class_id: action.value.class_id ?? "",
        duration_min: action.value.duration_min,
        start_at: action.value.start_at ? action.value.start_at.slice(0, 16) : "",
        end_at: action.value.end_at ? action.value.end_at.slice(0, 16) : "",
        error: "",
      };
    case "close":
      return { ...state, open: false };
    case "field":
      return { ...state, [action.key]: action.value };
    case "error":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

export default function ExamSchedulesPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<ExamSchedule[]>([]);
  const [packages, setPackages] = useState<ExamPackage[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, dispatch] = useReducer(reducer, emptyForm);

  const canWrite = can("cbt.create");
  const canUpdate = can("cbt.update");
  const canDelete = can("cbt.delete");

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ExamSchedule[]>>("/exam-schedules");
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    http.get<ApiResponse<ExamPackage[]>>("/exam-packages").then((res) => setPackages(res.data.data ?? []));
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "error", value: "" });
    const body = {
      package_id: form.package_id,
      title: form.title,
      class_id: form.class_id || null,
      duration_min: Number(form.duration_min),
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    };
    try {
      if (form.id) await http.put(`/exam-schedules/${form.id}`, body);
      else await http.post("/exam-schedules", body);
      dispatch({ type: "close" });
      load();
    } catch {
      dispatch({ type: "error", value: "Gagal menyimpan jadwal, periksa input" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus jadwal ujian ini?")) return;
    await http.delete(`/exam-schedules/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Jadwal Ujian</h1>
        {canWrite && (
          <button
            type="button"
            onClick={() => dispatch({ type: "openCreate" })}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Jadwal
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Paket</th>
              <th className="px-4 py-3">Mulai</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Belum ada jadwal ujian.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{s.title}</td>
                  <td className="px-4 py-3">{s.package?.title ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{fmtDateTime(s.start_at)}</td>
                  <td className="px-4 py-3 font-mono">{s.duration_min} m</td>
                  <td className="px-4 py-3">{scheduleStatusLabel[s.status] ?? s.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/cbt/schedules/${s.id}`} className="text-primary hover:underline">
                      Kelola
                    </Link>
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "openEdit", value: s })}
                        className="ml-3 text-primary hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
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

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">{form.id ? "Edit" : "Tambah"} Jadwal Ujian</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="sc-title" className="block text-sm font-medium text-body">
                  Judul
                </label>
                <input
                  id="sc-title"
                  value={form.title}
                  onChange={(e) => dispatch({ type: "field", key: "title", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="sc-package" className="block text-sm font-medium text-body">
                  Paket Ujian
                </label>
                <select
                  id="sc-package"
                  value={form.package_id}
                  onChange={(e) => dispatch({ type: "field", key: "package_id", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih paket</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sc-class" className="block text-sm font-medium text-body">
                  Kelas
                </label>
                <select
                  id="sc-class"
                  value={form.class_id}
                  onChange={(e) => dispatch({ type: "field", key: "class_id", value: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sc-start" className="block text-sm font-medium text-body">
                    Mulai
                  </label>
                  <input
                    id="sc-start"
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => dispatch({ type: "field", key: "start_at", value: e.target.value })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="sc-duration" className="block text-sm font-medium text-body">
                    Durasi (menit)
                  </label>
                  <input
                    id="sc-duration"
                    type="number"
                    min={0}
                    value={form.duration_min}
                    onChange={(e) => dispatch({ type: "field", key: "duration_min", value: Number(e.target.value) })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sc-end" className="block text-sm font-medium text-body">
                  Selesai
                </label>
                <input
                  id="sc-end"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => dispatch({ type: "field", key: "end_at", value: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                />
              </div>
              {form.error && <p className="text-sm text-danger">{form.error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: "close" })}
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
