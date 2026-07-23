import { useEffect, useState, type FormEvent } from "react";
import {
  paginatedList,
  simpleList,
  createItem,
  updateItem,
  deleteItem,
  type ClassRow,
  type GradeLevel,
  type Major,
  type AcademicYear,
  type Teacher,
} from "../../lib/master";
import { useAuth } from "../../context/AuthContext";
import EntityCard from "../../components/EntityCard";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

const PATH = "/classes";

export default function ClassesPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [filterGrade, setFilterGrade] = useState("");
  const [filterMajor, setFilterMajor] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState<ClassRow | null>(null);
  const [form, setForm] = useState<Partial<ClassRow>>({});
  const [error, setError] = useState("");

  const perPage = 20;

  async function loadRefs() {
    setGrades(await simpleList<GradeLevel>("/grade-levels"));
    setMajors(await simpleList<Major>("/majors"));
    setYears(await simpleList<AcademicYear>("/academic-years"));
    setTeachers(await simpleList<Teacher>("/teachers"));
  }

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterGrade) params.grade_level_id = filterGrade;
      if (filterMajor) params.major_id = filterMajor;
      const res = await paginatedList<ClassRow>(PATH, params);
      setRows(res.items);
      setTotal(res.meta.total);
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
  }, [page, filterGrade, filterMajor]);

  function openCreate() {
    setEditing(null);
    setForm({ academic_year_id: years.find((y) => y.is_active)?.id });
    setError("");
    setOpen(true);
  }

  function openEdit(row: ClassRow) {
    setEditing(row);
    setForm({ ...row });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const body = {
      name: form.name,
      grade_level_id: form.grade_level_id,
      major_id: form.major_id || null,
      academic_year_id: form.academic_year_id,
      homeroom_id: form.homeroom_id || null,
    };
    try {
      if (editing) await updateItem(PATH, editing.id, body);
      else await createItem(PATH, body);
      setOpen(false);
      load();
    } catch {
      setError("Gagal menyimpan kelas, periksa input");
    }
  }

  async function handleDelete(id: string) {
    await deleteItem(PATH, id);
    setDeleting(null);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Kelas</h1>
        {can("master.create") && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Kelas
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-hairline bg-canvas p-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-auto">
          <label htmlFor="class-grade-filter" className="block text-sm font-medium text-body">Tingkatan</label>
          <select
            id="class-grade-filter"
            value={filterGrade}
            onChange={(e) => {
              setPage(1);
              setFilterGrade(e.target.value);
            }}
            className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm sm:w-auto"
          >
            <option value="">Semua Tingkatan</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="class-major-filter" className="block text-sm font-medium text-body">Jurusan</label>
          <select
            id="class-major-filter"
            value={filterMajor}
            onChange={(e) => {
              setPage(1);
              setFilterMajor(e.target.value);
            }}
            className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm sm:w-auto"
          >
            <option value="">Semua Jurusan</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-4 py-8 text-center text-sm text-muted">
          Memuat...
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-4 py-8 text-center text-sm text-muted">
          Belum ada kelas.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              title={r.name}
              titleBadge
              hidePhoto
              rows={[
                { label: "Tingkatan", value: r.grade_level?.name ?? "-" },
                { label: "Jurusan", value: r.major?.name ?? "-" },
                { label: "Wali Kelas", value: r.homeroom?.name ?? "-" },
              ]}
              onEdit={can("master.update") ? () => openEdit(r) : undefined}
              onDelete={can("master.delete") ? () => setDeleting(r) : undefined}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Total {total} kelas</span>
        <div className="flex gap-2">
          <button type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-hairline px-3 py-1 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <span className="px-2 py-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-hairline px-3 py-1 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {deleting && (
        <DeleteConfirmModal
          title="Hapus Kelas?"
          description={`Kelas ${deleting.name} akan dihapus permanen.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting.id)}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Kelas</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="class-name" className="block text-sm font-medium text-body">Nama</label>
                <input
                  id="class-name"
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="class-grade" className="block text-sm font-medium text-body">Tingkatan</label>
                <select
                  id="class-grade"
                  value={form.grade_level_id ?? ""}
                  onChange={(e) => setForm({ ...form, grade_level_id: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih tingkatan</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="class-major" className="block text-sm font-medium text-body">Jurusan</label>
                <select
                  id="class-major"
                  value={form.major_id ?? ""}
                  onChange={(e) => setForm({ ...form, major_id: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Tanpa jurusan</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="class-year" className="block text-sm font-medium text-body">Tahun Ajaran</label>
                <select
                  id="class-year"
                  value={form.academic_year_id ?? ""}
                  onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih tahun ajaran</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="class-homeroom" className="block text-sm font-medium text-body">Wali Kelas</label>
                <select
                  id="class-homeroom"
                  value={form.homeroom_id ?? ""}
                  onChange={(e) => setForm({ ...form, homeroom_id: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Tanpa wali kelas</option>
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
