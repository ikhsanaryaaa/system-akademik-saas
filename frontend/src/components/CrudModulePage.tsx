import { useEffect, useReducer, useState, type FormEvent, type ReactNode } from "react";
import { http, type ApiResponse } from "../lib/http";
import { simpleList, paginatedList, type ClassRow, type StudentRow, type Major } from "../lib/master";
import { useAuth } from "../context/AuthContext";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "date"
  | "datetime"
  | "select"
  | "student"
  | "class"
  | "major"
  | "teacher"
  | "ref";

export interface CrudField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  fullWidth?: boolean;
  // refPath dan refLabel dipakai untuk type "ref": endpoint daftar dan field label opsi.
  refPath?: string;
  refLabel?: string;
}

export interface CrudColumn {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => ReactNode;
  mono?: boolean;
}

export interface CrudModuleConfig {
  title: string;
  path: string;
  permPrefix: string;
  fields: CrudField[];
  columns: CrudColumn[];
  filters?: ("class" | "major")[];
  addLabel?: string;
}

type FormState = { open: boolean; id: string | null; error: string; values: Record<string, unknown> };

type FormAction =
  | { type: "openCreate" }
  | { type: "openEdit"; row: Record<string, unknown> }
  | { type: "close" }
  | { type: "field"; key: string; value: unknown }
  | { type: "error"; value: string };

const emptyForm: FormState = { open: false, id: null, error: "", values: {} };

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "openCreate":
      return { open: true, id: null, error: "", values: {} };
    case "openEdit":
      return { open: true, id: String(action.row.id), error: "", values: { ...action.row } };
    case "close":
      return { ...state, open: false };
    case "field":
      return { ...state, values: { ...state.values, [action.key]: action.value } };
    case "error":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

// CrudModulePage adalah halaman CRUD dengan filter kelas/jurusan dan form modal
// yang mendukung field select serta relasi siswa, kelas, dan jurusan.
export default function CrudModulePage({ config }: { config: CrudModuleConfig }) {
  const { can } = useAuth();
  const { title, path, permPrefix, fields, columns, filters = [], addLabel } = config;
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  // refData menyimpan daftar opsi untuk tiap field bertipe "ref", dikunci per key field.
  const [refData, setRefData] = useState<Record<string, { id: string; name: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [form, dispatch] = useReducer(reducer, emptyForm);

  const needsStudent = fields.some((f) => f.type === "student");
  const needsClass = fields.some((f) => f.type === "class") || filters.includes("class");
  const needsMajor = fields.some((f) => f.type === "major") || filters.includes("major");
  const needsTeacher = fields.some((f) => f.type === "teacher");

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterClass) params.class_id = filterClass;
      if (filterMajor) params.major_id = filterMajor;
      const res = await http.get<ApiResponse<Record<string, unknown>[]>>(path, { params });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    if (needsStudent) {
      const st = await paginatedList<StudentRow>("/students", { per_page: 100 });
      setStudents(st.items);
    }
    if (needsClass) {
      const cls = await paginatedList<ClassRow>("/classes", { per_page: 100 });
      setClasses(cls.items);
    }
    if (needsMajor) setMajors(await simpleList<Major>("/majors"));
    if (needsTeacher) {
      const tc = await paginatedList<{ id: string; name: string }>("/teachers", { per_page: 100 });
      setTeachers(tc.items);
    }
    // Muat daftar opsi untuk tiap field bertipe "ref" secara paralel.
    const refFields = fields.filter((f) => f.type === "ref" && f.refPath);
    const loaded = await Promise.all(
      refFields.map(async (f) => [f.key, await simpleList<{ id: string; name: string }>(f.refPath!)] as const),
    );
    if (loaded.length > 0) {
      setRefData((prev) => ({ ...prev, ...Object.fromEntries(loaded) }));
    }
  }

  useEffect(() => {
    loadRefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass, filterMajor]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "error", value: "" });
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = form.values[f.key];
      if (f.type === "number") {
        body[f.key] = Number(v ?? 0);
      } else if (f.type === "date" || f.type === "datetime") {
        body[f.key] = v ? new Date(String(v)).toISOString() : null;
      } else if (f.type === "student" || f.type === "class" || f.type === "major" || f.type === "teacher" || f.type === "ref") {
        // FK opsional dikirim null saat kosong; FK required dikirim string kosong agar divalidasi server.
        body[f.key] = v ? v : f.required ? "" : null;
      } else {
        body[f.key] = v ?? "";
      }
    }
    try {
      if (form.id) await http.put(`${path}/${form.id}`, body);
      else await http.post(path, body);
      dispatch({ type: "close" });
      load();
    } catch {
      dispatch({ type: "error", value: "Gagal menyimpan data, periksa input" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data ini?")) return;
    await http.delete(`${path}/${id}`);
    load();
  }

  const canWrite = can(`${permPrefix}.create`);
  const canUpdate = can(`${permPrefix}.update`);
  const canDelete = can(`${permPrefix}.delete`);
  const colCount = columns.length + (canUpdate || canDelete ? 1 : 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {canWrite && (
          <button
            type="button"
            onClick={() => dispatch({ type: "openCreate" })}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {addLabel ?? "Tambah"}
          </button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-white p-4">
          {filters.includes("class") && (
            <div>
              <label htmlFor="filter-class" className="block text-sm font-medium text-body">
                Kelas
              </label>
              <select
                id="filter-class"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {filters.includes("major") && (
            <div>
              <label htmlFor="filter-major" className="block text-sm font-medium text-body">
                Jurusan
              </label>
              <select
                id="filter-major"
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
                className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Semua Jurusan</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  {col.label}
                </th>
              ))}
              {(canUpdate || canDelete) && <th className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-muted">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)} className="border-t border-hairline hover:bg-surface-soft">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-ink ${col.mono ? "font-mono" : ""}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "-")}
                    </td>
                  ))}
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "openEdit", row })}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(String(row.id))}
                          className="ml-3 text-danger hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form.open && renderModal()}
    </div>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
        <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">
            {form.id ? "Edit" : "Tambah"} {title}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.fullWidth || f.type === "textarea" ? "md:col-span-2" : ""}>
                <label htmlFor={`fld-${f.key}`} className="block text-sm font-medium text-body">
                  {f.label}
                </label>
                {renderField(f)}
              </div>
            ))}
          </div>
          {form.error && <p className="mt-3 text-sm text-danger">{form.error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "close" })}
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
    );
  }

  function renderField(f: CrudField) {
    const id = `fld-${f.key}`;
    const value = form.values[f.key];
    const set = (v: unknown) => dispatch({ type: "field", key: f.key, value: v });
    const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";

    if (f.type === "textarea") {
      return (
        <textarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => set(e.target.value)}
          required={f.required}
          rows={2}
          className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
        />
      );
    }
    if (f.type === "select") {
      return (
        <select id={id} value={String(value ?? "")} onChange={(e) => set(e.target.value)} required={f.required} className={inputClass}>
          <option value="">Pilih</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (f.type === "student" || f.type === "class" || f.type === "major" || f.type === "teacher" || f.type === "ref") {
      const list =
        f.type === "student"
          ? students
          : f.type === "class"
            ? classes
            : f.type === "major"
              ? majors
              : f.type === "teacher"
                ? teachers
                : refData[f.key] ?? [];
      return (
        <select id={id} value={String(value ?? "")} onChange={(e) => set(e.target.value)} required={f.required} className={inputClass}>
          <option value="">Pilih</option>
          {list.map((o) => (
            <option key={o.id} value={o.id}>
              {f.type === "student" ? `${(o as StudentRow).name} (${(o as StudentRow).nis})` : (o as { name: string }).name}
            </option>
          ))}
        </select>
      );
    }
    // Nilai tanggal ISO dipotong ke format input date atau datetime-local.
    const displayValue =
      f.type === "date" ? String(value ?? "").slice(0, 10) : f.type === "datetime" ? String(value ?? "").slice(0, 16) : String(value ?? "");
    return (
      <input
        id={id}
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text"}
        value={displayValue}
        onChange={(e) => set(f.type === "number" ? Number(e.target.value) : e.target.value)}
        required={f.required}
        className={`${inputClass} ${f.type === "number" ? "font-mono" : ""}`}
      />
    );
  }
}

