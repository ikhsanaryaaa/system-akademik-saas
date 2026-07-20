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
import EntityCard from "../../components/EntityCard";
import PhotoUpload from "../../components/PhotoUpload";

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
      photo_url: form.photo_url,
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

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-hairline bg-canvas p-4 sm:flex-row sm:items-end">
        <div className="w-full sm:flex-1">
          <label htmlFor="student-search" className="block text-sm font-medium text-body">Cari Siswa</label>
          <input
            id="student-search"
            placeholder="Cari nama siswa..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="student-class-filter" className="block text-sm font-medium text-body">Kelas</label>
          <select
            id="student-class-filter"
            value={filterClass}
            onChange={(e) => {
              setPage(1);
              setFilterClass(e.target.value);
            }}
            className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm sm:w-auto"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          Belum ada siswa.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <EntityCard
              key={s.id}
              photo={s.photo_url}
              title={s.name}
              rows={[
                { label: "NIS", value: s.nis || "-", mono: true },
                { label: "NISN", value: s.nisn || "-", mono: true },
                { label: "Kelas", value: s.class?.name ?? "-" },
              ]}
              onEdit={can("master.update") ? () => openEdit(s) : undefined}
              onDelete={can("master.delete") ? () => handleDelete(s.id) : undefined}
            />
          ))}
        </div>
      )}

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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Siswa</h2>
            <div className="mt-4 space-y-4">
              <PhotoUpload
                value={form.photo_url}
                onChange={(photo_url) => setForm({ ...form, photo_url })}
              />
              <div>
                <label className="block text-sm font-medium text-body">Nama</label>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-body">NIS</label>
                  <input
                    value={form.nis ?? ""}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-body">NISN</label>
                  <input
                    value={form.nisn ?? ""}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-body">Jenis Kelamin</legend>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {[
                    { value: "L", label: "Laki-laki" },
                    { value: "P", label: "Perempuan" },
                  ].map((option) => {
                    const selected = form.gender === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setForm({ ...form, gender: option.value })}
                        className={`h-[38px] rounded-md border text-sm font-medium ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-hairline bg-canvas text-body hover:bg-surface-soft"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
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
        </div>
      )}
    </div>
  );
}
