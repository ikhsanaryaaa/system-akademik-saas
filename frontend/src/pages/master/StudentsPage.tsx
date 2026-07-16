import { useEffect, useState, type FormEvent } from "react";
import {
  paginatedList,
  createItem,
  updateItem,
  deleteItem,
  type StudentRow,
  type ClassRow,
} from "../../lib/master";
import { useAuth } from "../../context/AuthContext";

const PATH = "/students";

export default function StudentsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState<Partial<StudentRow>>({});
  const [error, setError] = useState("");

  const perPage = 20;

  async function loadRefs() {
    const res = await paginatedList<ClassRow>("/classes", { per_page: 100 });
    setClasses(res.items);
  }

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (filterClass) params.class_id = filterClass;
      const res = await paginatedList<StudentRow>(PATH, params);
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
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterClass]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setError("");
    setOpen(true);
  }

  function openEdit(row: StudentRow) {
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
      nis: form.nis,
      nisn: form.nisn,
      gender: form.gender,
      class_id: form.class_id || null,
    };
    try {
      if (editing) await updateItem(PATH, editing.id, body);
      else await createItem(PATH, body);
      setOpen(false);
      load();
    } catch {
      setError("Gagal menyimpan siswa, pastikan NIS dan NISN unik");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus siswa ini?")) return;
    await deleteItem(PATH, id);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Siswa</h1>
        {can("master.create") && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Siswa
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-white p-4">
        <input
          placeholder="Cari nama siswa..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="h-[38px] flex-1 rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
        />
        <select
          value={filterClass}
          onChange={(e) => {
            setPage(1);
            setFilterClass(e.target.value);
          }}
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
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">NIS</th>
              <th className="px-4 py-3">NISN</th>
              <th className="px-4 py-3">Kelas</th>
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
                  Belum ada siswa.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{s.name}</td>
                  <td className="px-4 py-3 font-mono">{s.nis}</td>
                  <td className="px-4 py-3 font-mono">{s.nisn}</td>
                  <td className="px-4 py-3">{s.class?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    {can("master.update") && (
                      <button type="button" onClick={() => openEdit(s)} className="text-primary hover:underline">
                        Edit
                      </button>
                    )}
                    {can("master.delete") && (
                      <button type="button"
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

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Total {total} siswa</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Siswa</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-body">NIS</label>
                  <input
                    value={form.nis ?? ""}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-body">NISN</label>
                  <input
                    value={form.nisn ?? ""}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-body">Jenis Kelamin (L/P)</label>
                <input
                  value={form.gender ?? ""}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-body">Kelas</label>
                <select
                  value={form.class_id ?? ""}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Belum ada kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
