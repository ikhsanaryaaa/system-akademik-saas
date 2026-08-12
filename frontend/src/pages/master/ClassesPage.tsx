import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  paginatedList,
  simpleList,
  createItem,
  updateItem,
  type ClassRow,
  type GradeLevel,
  type Major,
  type AcademicYear,
  type Teacher,
  type StudentRow,
} from "../../lib/master";
import { http, type ApiResponse } from "../../lib/http";
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
  const [roster, setRoster] = useState<ClassRow | null>(null);
  // blockers menampung rincian penahan yang dikirim server saat hapus ditolak.
  const [blockers, setBlockers] = useState<{ name: string; detail: Record<string, number> } | null>(null);
  const [form, setForm] = useState<Partial<ClassRow>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (saving) return;
    setError("");
    setSaving(true);
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
      await load();
    } catch {
      setError("Gagal menyimpan kelas, periksa input");
    } finally {
      setSaving(false);
    }
  }

  // Penolakan hapus dibaca dari body 409 supaya penahannya bisa ditampilkan
  // satu per satu, bukan sekadar pesan gagal tanpa keterangan.
  async function handleDelete(row: ClassRow) {
    if (saving) return;
    setSaving(true);
    try {
      await http.delete(`${PATH}/${row.id}`);
      setDeleting(null);
      await load();
    } catch (err) {
      setDeleting(null);
      const detail = isAxiosError(err) ? (err.response?.data?.errors as Record<string, number> | undefined) : undefined;
      setBlockers({ name: row.name, detail: detail ?? {} });
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Kelas dan Rombel</h1>
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
            <div key={r.id} className="flex flex-col gap-2">
              <EntityCard
                title={r.name}
                titleBadge
                hidePhoto
                rows={[
                  { label: "Tingkatan", value: r.grade_level?.name ?? "-" },
                  { label: "Jurusan", value: r.major?.name ?? "-" },
                  { label: "Wali Kelas", value: r.homeroom?.name ?? "-" },
                  { label: "Jumlah Murid", value: String(r.student_count ?? 0) },
                ]}
                onEdit={can("master.update") ? () => openEdit(r) : undefined}
                onDelete={can("master.delete") ? () => setDeleting(r) : undefined}
              />
              <button
                type="button"
                onClick={() => setRoster(r)}
                className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
              >
                Kelola Murid
              </button>
            </div>
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
          description={`Kelas ${deleting.name} akan dihapus permanen. Kelas yang masih dipakai data lain tidak dapat dihapus.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}

      {blockers && <BlockersModal name={blockers.name} detail={blockers.detail} onClose={() => setBlockers(null)} />}

      {roster && (
        <RosterModal
          classRow={roster}
          onClose={(changed) => {
            setRoster(null);
            if (changed) load();
          }}
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
                disabled={saving}
                className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
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

// BlockersModal menjelaskan kenapa sebuah kelas tidak dapat dihapus, memakai
// rincian yang dikirim server, supaya pengguna tahu apa yang harus dibereskan.
function BlockersModal({
  name,
  detail,
  onClose,
}: {
  name: string;
  detail: Record<string, number>;
  onClose: () => void;
}) {
  const entries = Object.entries(detail);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <div className="w-full max-w-[480px] rounded-xl bg-canvas p-6">
        <h2 className="text-lg font-semibold text-ink">Kelas Tidak Dapat Dihapus</h2>
        <p className="mt-2 text-sm text-body">
          Kelas {name} masih dipakai data lain. Pindahkan atau hapus data berikut lebih dulu.
        </p>
        {entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Rincian penahan tidak tersedia.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {entries.map(([label, count]) => (
              <li key={label} className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-sm">
                <span className="text-body">{label}</span>
                <span className="font-mono text-ink">{count}</span>
              </li>
            ))}
          </ul>
        )}
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

// RosterModal mengelola isi satu kelas. Menempatkan murid ikut menyamakan
// jurusan dan tahun ajarannya dengan kelas, dikerjakan di sisi server.
function RosterModal({ classRow, onClose }: { classRow: ClassRow; onClose: (changed: boolean) => void }) {
  const { can } = useAuth();
  const [members, setMembers] = useState<StudentRow[]>([]);
  const [available, setAvailable] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Penanda ada perubahan hanya dibaca saat modal ditutup, jadi tidak perlu
  // memicu render ulang.
  const changedRef = useRef(false);

  const path = `${PATH}/${classRow.id}/students`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<StudentRow[]>>(path);
      setMembers(res.data.data ?? []);
      const all = await paginatedList<StudentRow>("/students", { per_page: 200 });
      setAvailable(all.items.filter((s) => !s.class_id));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await http.post(path, { student_ids: [studentId] });
      setStudentId("");
      changedRef.current = true;
      await load();
    } catch {
      setError("Gagal menempatkan murid ke kelas");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (saving) return;
    if (!confirm("Keluarkan murid ini dari kelas? Data siswanya tidak dihapus.")) return;
    setSaving(true);
    try {
      await http.delete(`${path}/${id}`);
      changedRef.current = true;
      await load();
    } finally {
      setSaving(false);
    }
  }

  const canManage = can("master.update");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-xl bg-canvas p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Murid Kelas {classRow.name}</h2>
            <p className="text-sm text-muted">
              Wali Kelas {classRow.homeroom?.name ?? "belum ditentukan"} · Jurusan {classRow.major?.name ?? "-"}
            </p>
          </div>
          <span className="font-mono text-sm text-muted">{members.length} murid</span>
        </div>

        {canManage && (
          <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline p-4">
            <div className="grow">
              <label htmlFor="roster-student" className="block text-sm font-medium text-body">
                Tambah Murid
              </label>
              <select
                id="roster-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Pilih siswa yang belum punya kelas</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nis})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
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
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">NIS</th>
                <th className="px-4 py-3">Jurusan</th>
                {canManage && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Memuat...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Belum ada murid di kelas ini.
                  </td>
                </tr>
              ) : (
                members.map((s) => (
                  <tr key={s.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{s.name}</td>
                    <td className="px-4 py-3 font-mono">{s.nis}</td>
                    <td className="px-4 py-3">{s.major?.name ?? "-"}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(s.id)}
                          disabled={saving}
                          className="text-danger hover:underline disabled:opacity-50"
                        >
                          Keluarkan
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
            onClick={() => onClose(changedRef.current)}
            className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
