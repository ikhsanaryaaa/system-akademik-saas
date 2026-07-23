import { useEffect, useState, type FormEvent } from "react";
import {
  simpleList,
  paginatedList,
  createItem,
  updateItem,
  deleteItem,
} from "../../lib/master";
import { http, type ApiResponse } from "../../lib/http";
import type { ClassRow } from "../../lib/master";
import { dayNames, type Subject, type Teacher, type LessonSchedule } from "../../lib/curriculum";
import { useAuth } from "../../context/AuthContext";
import IconActions from "../../components/IconActions";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

const PATH = "/lesson-schedules";
const WEEKDAY_TABS = [1, 2, 3, 4, 5];

export default function LessonSchedulesPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<LessonSchedule[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filterClass, setFilterClass] = useState("");
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LessonSchedule | null>(null);
  const [deleting, setDeleting] = useState<LessonSchedule | null>(null);
  const [form, setForm] = useState<Partial<LessonSchedule>>({ day_of_week: 1 });
  const [error, setError] = useState("");

  async function loadRefs() {
    const cls = await paginatedList<ClassRow>("/classes", { per_page: 100 });
    setClasses(cls.items);
    setSubjects(await simpleList<Subject>("/subjects"));
    setTeachers(await simpleList<Teacher>("/teachers"));
  }

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterClass) params.class_id = filterClass;
      const res = await http.get<ApiResponse<LessonSchedule[]>>(PATH, { params });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass]);

  const visibleRows = rows.filter((row) => row.day_of_week === activeDay);

  function openCreate() {
    setEditing(null);
    setForm({ day_of_week: activeDay, class_id: filterClass || undefined });
    setError("");
    setOpen(true);
  }

  function openEdit(row: LessonSchedule) {
    setEditing(row);
    setForm({ ...row });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const body = {
      class_id: form.class_id,
      subject_id: form.subject_id,
      teacher_id: form.teacher_id || null,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
    };
    try {
      if (editing) await updateItem(PATH, editing.id, body);
      else await createItem(PATH, body);
      setOpen(false);
      load();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Gagal menyimpan jadwal";
      setError(msg);
    }
  }

  async function handleDelete(id: string) {
    await deleteItem(PATH, id);
    setDeleting(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Jadwal Pelajaran</h1>
        {can("curriculum.create") && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Jadwal
          </button>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-canvas p-4">
        <label htmlFor="lesson-schedule-filter" className="block text-sm font-medium text-body">Kelas</label>
        <select
          id="lesson-schedule-filter"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="h-[38px] rounded-md border border-hairline px-3 text-sm"
        >
          <option value="">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 border-b border-hairline">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Hari jadwal pelajaran">
          {WEEKDAY_TABS.map((day) => (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={activeDay === day}
              onClick={() => setActiveDay(day)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeDay === day
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {dayNames[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-hairline bg-canvas" role="tabpanel">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Pengajar</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">Memuat...</td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada jadwal hari {dayNames[activeDay]}.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 font-mono text-ink">{row.start_time} - {row.end_time}</td>
                  <td className="px-4 py-3 text-ink">{row.class?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink">{row.subject?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink">{row.teacher?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <IconActions
                        onEdit={can("curriculum.update") ? () => openEdit(row) : undefined}
                        onDelete={can("curriculum.delete") ? () => setDeleting(row) : undefined}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleting && (
        <DeleteConfirmModal
          title="Hapus Jadwal?"
          description={`Jadwal ${deleting.subject?.name ?? "pelajaran"} di kelas ${deleting.class?.name ?? "ini"} akan dihapus permanen.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting.id)}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Jadwal</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="lesson-class" className="block text-sm font-medium text-body">Kelas</label>
                <select
                  id="lesson-class"
                  value={form.class_id ?? ""}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  required
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
              <div>
                <label htmlFor="lesson-subject" className="block text-sm font-medium text-body">Mata Pelajaran</label>
                <select
                  id="lesson-subject"
                  value={form.subject_id ?? ""}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih mata pelajaran</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lesson-teacher" className="block text-sm font-medium text-body">Pengajar</label>
                <select
                  id="lesson-teacher"
                  value={form.teacher_id ?? ""}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Tanpa pengajar</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="lesson-day" className="block text-sm font-medium text-body">Hari</label>
                  <select
                    id="lesson-day"
                    value={form.day_of_week ?? 1}
                    onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-2 text-sm"
                  >
                    {Object.entries(dayNames).map(([n, label]) => (
                      <option key={n} value={n}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lesson-start" className="block text-sm font-medium text-body">Mulai</label>
                  <input
                    id="lesson-start"
                    type="time"
                    value={form.start_time ?? ""}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="lesson-end" className="block text-sm font-medium text-body">Selesai</label>
                  <input
                    id="lesson-end"
                    type="time"
                    value={form.end_time ?? ""}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-2 text-sm"
                  />
                </div>
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
        </div>
      )}
    </div>
  );
}
