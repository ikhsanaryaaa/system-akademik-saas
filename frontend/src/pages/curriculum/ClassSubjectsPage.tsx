import { useEffect, useState, type FormEvent } from "react";
import { simpleList, createItem, updateItem, deleteItem, paginatedList } from "../../lib/master";
import { http, type ApiResponse } from "../../lib/http";
import type { ClassRow } from "../../lib/master";
import type { Subject, Teacher, ClassSubject } from "../../lib/curriculum";
import { useAuth } from "../../context/AuthContext";
import EntityCard from "../../components/EntityCard";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

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
  const [deleting, setDeleting] = useState<ClassSubject | null>(null);
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
    await deleteItem(PATH, id);
    setDeleting(null);
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

      <div className="mt-4 rounded-lg border border-hairline bg-canvas p-4">
        <label htmlFor="class-subject-filter" className="block text-sm font-medium text-body">Kelas</label>
        <select
          id="class-subject-filter"
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

      {loading ? (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-4 py-8 text-center text-sm text-muted">
          Memuat...
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-4 py-8 text-center text-sm text-muted">
          Belum ada pemetaan.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              hidePhoto
              title={r.class?.name ?? "-"}
              rows={[
                { label: "Mata Pelajaran", value: r.subject?.name ?? "-" },
                { label: "Pengajar", value: r.teacher?.name ?? "-" },
              ]}
              onEdit={can("curriculum.update") ? () => openEdit(r) : undefined}
              onDelete={can("curriculum.delete") ? () => setDeleting(r) : undefined}
            />
          ))}
        </div>
      )}

      {deleting && (
        <DeleteConfirmModal
          title="Hapus Pemetaan?"
          description={`${deleting.subject?.name ?? "Mata pelajaran"} dari kelas ${deleting.class?.name ?? "ini"} akan dihapus permanen.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting.id)}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">
              {editing ? "Edit" : "Tambah"} Pemetaan
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="class-subject-class" className="block text-sm font-medium text-body">Kelas</label>
                <select
                  id="class-subject-class"
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
                <label htmlFor="class-subject-subject" className="block text-sm font-medium text-body">Mata Pelajaran</label>
                <select
                  id="class-subject-subject"
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
                <label htmlFor="class-subject-teacher" className="block text-sm font-medium text-body">Pengajar</label>
                <select
                  id="class-subject-teacher"
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
        </div>
      )}
    </div>
  );
}
