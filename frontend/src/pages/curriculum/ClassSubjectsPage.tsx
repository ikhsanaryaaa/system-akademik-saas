import { useEffect, useState, type FormEvent } from "react";
import { simpleList, createItem, updateItem, deleteItem, paginatedList } from "../../lib/master";
import { http, type ApiResponse } from "../../lib/http";
import type { ClassRow } from "../../lib/master";
import type { Subject, Teacher, ClassSubject } from "../../lib/curriculum";
import { useAuth } from "../../context/AuthContext";

const PATH = "/class-subjects";

export default function ClassSubjectsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<ClassSubject[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSubject | null>(null);
  const [form, setForm] = useState<Partial<ClassSubject>>({});
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
      const res = await http.get<ApiResponse<ClassSubject[]>>(PATH, { params });
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

  function openCreate() {
    setEditing(null);
    setForm(filterClass ? { class_id: filterClass } : {});
    setError("");
    setOpen(true);
  }

  function openEdit(row: ClassSubject) {
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
    };
    try {
      if (editing) await updateItem(PATH, editing.id, body);
      else await createItem(PATH, body);
      setOpen(false);
      load();
    } catch {
      setError("Gagal menyimpan, mata pelajaran mungkin sudah dipetakan ke kelas ini");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pemetaan ini?")) return;
    await deleteItem(PATH, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Pemetaan Mata Pelajaran</h1>
        {can("curriculum.create") && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Pemetaan
          </button>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-white p-4">
        <select
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

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Pengajar</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Belum ada pemetaan.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{r.class?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.subject?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.teacher?.name ?? "-"}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">
              {editing ? "Edit" : "Tambah"} Pemetaan
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-body">Kelas</label>
                <select
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
                <label className="block text-sm font-medium text-body">Mata Pelajaran</label>
                <select
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
                <label className="block text-sm font-medium text-body">Pengajar</label>
                <select
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
