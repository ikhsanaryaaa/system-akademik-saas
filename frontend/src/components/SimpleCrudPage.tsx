import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { simpleList, createItem, updateItem, deleteItem } from "../lib/master";
import { useAuth } from "../context/AuthContext";
import IconActions from "./IconActions";
import PhotoUpload from "./PhotoUpload";
import DeleteConfirmModal from "./DeleteConfirmModal";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "checkbox" | "photo" | "gender";
  required?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => string;
}

export interface CardDef {
  render: (
    row: Record<string, unknown>,
    actions: { onEdit?: () => void; onDelete?: () => void },
  ) => ReactNode;
}

// SimpleCrudPage adalah halaman CRUD generik untuk entitas master data datar.
// Dikonfigurasi lewat path, kolom tabel, dan field form.
export default function SimpleCrudPage({
  title,
  path,
  columns,
  fields,
  card,
  onChanged,
  hideHeader = false,
  permPrefix = "master",
}: {
  title: string;
  path: string;
  columns?: ColumnDef[];
  fields: FieldDef[];
  card?: CardDef;
  onChanged?: () => void;
  hideHeader?: boolean;
  permPrefix?: string;
}) {
  const { can } = useAuth();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null);
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
      await load();
      onChanged?.();
    } catch {
      setError("Gagal menyimpan data, periksa input");
    }
  }

  async function handleDelete(id: string) {
    await deleteItem(path, id);
    setDeleting(null);
    await load();
    onChanged?.();
  }

  return (
    <div>
      {!hideHeader && (
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
      )}
      {hideHeader && can(`${permPrefix}.create`) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah {title}
          </button>
        </div>
      )}

      {card ? (
        loading ? (
          <p className="mt-6 rounded-lg border border-hairline bg-canvas px-4 py-8 text-center text-sm text-muted">
            Memuat...
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-6 rounded-lg border border-hairline bg-canvas px-4 py-8 text-center text-sm text-muted">
            Belum ada data.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <div key={String(row.id)}>
                {card.render(row, {
                  onEdit: can(`${permPrefix}.update`) ? () => openEdit(row) : undefined,
                  onDelete: can(`${permPrefix}.delete`) ? () => setDeleting(row) : undefined,
                })}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                {columns?.map((col) => (
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
                  <td colSpan={(columns?.length ?? 0) + 1} className="px-4 py-8 text-center text-muted">
                    Memuat...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={(columns?.length ?? 0) + 1} className="px-4 py-8 text-center text-muted">
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className="border-t border-hairline hover:bg-surface-soft">
                    {columns?.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-ink">
                        {col.render ? col.render(row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <IconActions
                          onEdit={can(`${permPrefix}.update`) ? () => openEdit(row) : undefined}
                          onDelete={can(`${permPrefix}.delete`) ? () => handleDelete(String(row.id)) : undefined}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <DeleteConfirmModal
          title={`Hapus ${title}?`}
          description={`Data ${String(deleting.name ?? deleting.code ?? "ini")} akan dihapus permanen.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(String(deleting.id))}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">
              {editing ? "Edit" : "Tambah"} {title}
            </h2>
            <div className="mt-4 space-y-4">
              {fields.map((f) =>
                f.type === "photo" ? (
                  <PhotoUpload
                    key={f.key}
                    value={String(form[f.key] ?? "")}
                    onChange={(url) => setForm({ ...form, [f.key]: url })}
                  />
                ) : (
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
                    ) : f.type === "gender" ? (
                      <fieldset>
                        <legend className="text-sm font-medium text-body">{f.label}</legend>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {[
                            { value: "L", label: "Laki-laki" },
                            { value: "P", label: "Perempuan" },
                          ].map((option) => {
                            const selected = form[f.key] === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setForm({ ...form, [f.key]: option.value })}
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
                          className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
                        />
                      </>
                    )}
                  </div>
                ),
              )}
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
