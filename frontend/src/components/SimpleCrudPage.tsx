import { useEffect, useState, type FormEvent } from "react";
import { simpleList, createItem, updateItem, deleteItem } from "../lib/master";
import { useAuth } from "../context/AuthContext";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "checkbox";
  required?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => string;
}

// SimpleCrudPage adalah halaman CRUD generik untuk entitas master data datar.
// Dikonfigurasi lewat path, kolom tabel, dan field form.
export default function SimpleCrudPage({
  title,
  path,
  columns,
  fields,
  permPrefix = "master",
}: {
  title: string;
  path: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  permPrefix?: string;
}) {
  const { can } = useAuth();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setRows(await simpleList<Record<string, unknown>>(path));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setError("");
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({ ...row });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await updateItem(path, String(editing.id), form);
      } else {
        await createItem(path, form);
      }
      setOpen(false);
      load();
    } catch {
      setError("Gagal menyimpan data, periksa input");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data ini?")) return;
    await deleteItem(path, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {can(`${permPrefix}.create`) && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)} className="border-t border-hairline hover:bg-surface-soft">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-ink">
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    {can(`${permPrefix}.update`) && (
                      <button type="button" onClick={() => openEdit(row)} className="text-primary hover:underline">
                        Edit
                      </button>
                    )}
                    {can(`${permPrefix}.delete`) && (
                      <button type="button"
                        onClick={() => handleDelete(String(row.id))}
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
              {editing ? "Edit" : "Tambah"} {title}
            </h2>
            <div className="mt-4 space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm text-body">
                      <input
                        type="checkbox"
                        checked={Boolean(form[f.key])}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                      />
                      {f.label}
                    </label>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-body">{f.label}</label>
                      <input
                        type={f.type ?? "text"}
                        value={String(form[f.key] ?? "")}
                        required={f.required}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                          })
                        }
                        className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                      />
                    </>
                  )}
                </div>
              ))}
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
