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
    if (!confirm("Hapus kelas ini?")) return;
    await deleteItem(PATH, id);
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

      <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-canvas p-4">
        <select
          value={filterGrade}
          onChange={(e) => {
            setPage(1);
            setFilterGrade(e.target.value);
          }}
          className="h-[38px] rounded-md border border-hairline px-3 text-sm"
        >
          <option value="">Semua Tingkatan</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={filterMajor}
          onChange={(e) => {
            setPage(1);
            setFilterMajor(e.target.value);
          }}
          className="h-[38px] rounded-md border border-hairline px-3 text-sm"
        >
          <option value="">Semua Jurusan</option>
          {majors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Tingkatan</th>
              <th className="px-4 py-3">Jurusan</th>
              <th className="px-4 py-3">Wali Kelas</th>
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
                  Belum ada kelas.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{r.name}</td>
                  <td className="px-4 py-3">{r.grade_level?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.major?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.homeroom?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    {can("master.update") && (
                      <button type="button" onClick={() => openEdit(r)} className="text-primary hover:underline">
                        Edit
                      </button>
                    )}
                    {can("master.delete") && (
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
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-hairline px-3 py-1 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Kelas</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-body">Nama</label>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-body">Tingkatan</label>
                <select
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
                <label className="block text-sm font-medium text-body">Jurusan</label>
                <select
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
                <label className="block text-sm font-medium text-body">Tahun Ajaran</label>
                <select
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
                <label className="block text-sm font-medium text-body">Wali Kelas</label>
                <select
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
