import { useEffect, useReducer, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList, paginatedList, type ClassRow, type StudentRow, type Major } from "../../lib/master";
import { followUpStatuses, type ViolationRecord, type ViolationType } from "../../lib/bk";
import { fmtDate } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";

const PATH = "/violation-records";

// Label status tindak lanjut untuk tampilan badge.
const statusLabel: Record<string, string> = {
  open: "Terbuka",
  in_progress: "Proses",
  resolved: "Selesai",
};

interface RecordForm {
  open: boolean;
  id: string | null;
  student_id: string;
  violation_type_id: string;
  class_id: string;
  major_id: string;
  description: string;
  date: string;
  reporter_name: string;
  error: string;
}

const emptyRecord: RecordForm = {
  open: false,
  id: null,
  student_id: "",
  violation_type_id: "",
  class_id: "",
  major_id: "",
  description: "",
  date: "",
  reporter_name: "",
  error: "",
};

type RecordAction =
  | { type: "openCreate" }
  | { type: "openEdit"; value: ViolationRecord }
  | { type: "close" }
  | { type: "field"; key: keyof RecordForm; value: string }
  | { type: "error"; value: string };

function recordReducer(state: RecordForm, action: RecordAction): RecordForm {
  switch (action.type) {
    case "openCreate":
      return { ...emptyRecord, open: true };
    case "openEdit":
      return {
        open: true,
        id: action.value.id,
        student_id: action.value.student_id,
        violation_type_id: action.value.violation_type_id,
        class_id: action.value.class_id ?? "",
        major_id: action.value.major_id ?? "",
        description: action.value.description ?? "",
        date: (action.value.date ?? "").slice(0, 10),
        reporter_name: action.value.reporter_name ?? "",
        error: "",
      };
    case "close":
      return { ...state, open: false };
    case "field":
      return { ...state, [action.key]: action.value };
    case "error":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

interface FollowUpForm {
  open: boolean;
  id: string | null;
  follow_up_status: string;
  follow_up_note: string;
  follow_up_date: string;
  error: string;
}

const emptyFollowUp: FollowUpForm = {
  open: false,
  id: null,
  follow_up_status: "open",
  follow_up_note: "",
  follow_up_date: "",
  error: "",
};

type FollowUpAction =
  | { type: "open"; value: ViolationRecord }
  | { type: "close" }
  | { type: "field"; key: keyof FollowUpForm; value: string }
  | { type: "error"; value: string };

function followUpReducer(state: FollowUpForm, action: FollowUpAction): FollowUpForm {
  switch (action.type) {
    case "open":
      return {
        open: true,
        id: action.value.id,
        follow_up_status: action.value.follow_up_status || "open",
        follow_up_note: action.value.follow_up_note ?? "",
        follow_up_date: (action.value.follow_up_date ?? "").slice(0, 10),
        error: "",
      };
    case "close":
      return { ...state, open: false };
    case "field":
      return { ...state, [action.key]: action.value };
    case "error":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

export default function ViolationRecordsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<ViolationRecord[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [types, setTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [record, dispatchRecord] = useReducer(recordReducer, emptyRecord);
  const [followUp, dispatchFollowUp] = useReducer(followUpReducer, emptyFollowUp);

  const canWrite = can("bk.create");
  const canUpdate = can("bk.update");
  const canDelete = can("bk.delete");

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterClass) params.class_id = filterClass;
      if (filterStatus) params.follow_up_status = filterStatus;
      const res = await http.get<ApiResponse<ViolationRecord[]>>(PATH, { params });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    const st = await paginatedList<StudentRow>("/students", { per_page: 100 });
    setStudents(st.items);
    const cls = await paginatedList<ClassRow>("/classes", { per_page: 100 });
    setClasses(cls.items);
    setMajors(await simpleList<Major>("/majors"));
    setTypes(await simpleList<ViolationType>("/violation-types"));
  }

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass, filterStatus]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatchRecord({ type: "error", value: "" });
    const body = {
      student_id: record.student_id,
      violation_type_id: record.violation_type_id,
      class_id: record.class_id || null,
      major_id: record.major_id || null,
      description: record.description,
      date: record.date ? new Date(record.date).toISOString() : null,
      reporter_name: record.reporter_name,
    };
    try {
      if (record.id) await http.put(`${PATH}/${record.id}`, body);
      else await http.post(PATH, body);
      dispatchRecord({ type: "close" });
      load();
    } catch {
      dispatchRecord({ type: "error", value: "Gagal menyimpan pelanggaran, periksa input" });
    }
  }

  async function handleFollowUp(e: FormEvent) {
    e.preventDefault();
    dispatchFollowUp({ type: "error", value: "" });
    const body = {
      follow_up_status: followUp.follow_up_status,
      follow_up_note: followUp.follow_up_note,
      follow_up_date: followUp.follow_up_date ? new Date(followUp.follow_up_date).toISOString() : null,
    };
    try {
      await http.put(`${PATH}/${followUp.id}/follow-up`, body);
      dispatchFollowUp({ type: "close" });
      load();
    } catch {
      dispatchFollowUp({ type: "error", value: "Gagal menyimpan tindak lanjut" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pelanggaran ini?")) return;
    await http.delete(`${PATH}/${id}`);
    load();
  }

  const showActions = canUpdate || canDelete;
  const colCount = 6 + (showActions ? 1 : 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Pencatatan Pelanggaran</h1>
        {canWrite && (
          <button
            type="button"
            onClick={() => dispatchRecord({ type: "openCreate" })}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Catat Pelanggaran
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-3 rounded-lg border border-hairline bg-white p-4">
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
        <div>
          <label htmlFor="filter-status" className="block text-sm font-medium text-body">
            Tindak Lanjut
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          >
            <option value="">Semua Status</option>
            {followUpStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Pelanggaran</th>
              <th className="px-4 py-3">Poin</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Tindak Lanjut</th>
              {showActions && <th className="px-4 py-3 text-right">Aksi</th>}
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
                  Belum ada pelanggaran.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{r.student?.name ?? "-"}</td>
                  <td className="px-4 py-3">{r.violation_type?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-mono">{r.violation_type?.point ?? 0}</td>
                  <td className="px-4 py-3 font-mono">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3">{r.class?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-soft px-2 py-1 text-xs font-medium text-body">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.follow_up_status === "resolved"
                            ? "bg-success"
                            : r.follow_up_status === "in_progress"
                              ? "bg-warning"
                              : "bg-danger"
                        }`}
                      />
                      {statusLabel[r.follow_up_status] ?? r.follow_up_status}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => dispatchFollowUp({ type: "open", value: r })}
                          className="text-primary hover:underline"
                        >
                          Tindak Lanjut
                        </button>
                      )}
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => dispatchRecord({ type: "openEdit", value: r })}
                          className="ml-3 text-primary hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
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

      {record.open && renderRecordModal()}
      {followUp.open && renderFollowUpModal()}
    </div>
  );

  function renderRecordModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
        <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">{record.id ? "Edit" : "Catat"} Pelanggaran</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="vr-student" className="block text-sm font-medium text-body">
                Siswa
              </label>
              <select
                id="vr-student"
                value={record.student_id}
                onChange={(e) => dispatchRecord({ type: "field", key: "student_id", value: e.target.value })}
                required
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Pilih siswa</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nis})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vr-type" className="block text-sm font-medium text-body">
                Jenis Pelanggaran
              </label>
              <select
                id="vr-type"
                value={record.violation_type_id}
                onChange={(e) => dispatchRecord({ type: "field", key: "violation_type_id", value: e.target.value })}
                required
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Pilih jenis</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.point})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vr-date" className="block text-sm font-medium text-body">
                Tanggal
              </label>
              <input
                id="vr-date"
                type="date"
                value={record.date}
                onChange={(e) => dispatchRecord({ type: "field", key: "date", value: e.target.value })}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="vr-class" className="block text-sm font-medium text-body">
                Kelas
              </label>
              <select
                id="vr-class"
                value={record.class_id}
                onChange={(e) => dispatchRecord({ type: "field", key: "class_id", value: e.target.value })}
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
              <label htmlFor="vr-major" className="block text-sm font-medium text-body">
                Jurusan
              </label>
              <select
                id="vr-major"
                value={record.major_id}
                onChange={(e) => dispatchRecord({ type: "field", key: "major_id", value: e.target.value })}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Pilih jurusan</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="vr-reporter" className="block text-sm font-medium text-body">
                Pelapor
              </label>
              <input
                id="vr-reporter"
                value={record.reporter_name}
                onChange={(e) => dispatchRecord({ type: "field", key: "reporter_name", value: e.target.value })}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="vr-desc" className="block text-sm font-medium text-body">
                Deskripsi
              </label>
              <textarea
                id="vr-desc"
                value={record.description}
                onChange={(e) => dispatchRecord({ type: "field", key: "description", value: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          {record.error && <p className="mt-3 text-sm text-danger">{record.error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatchRecord({ type: "close" })}
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

  function renderFollowUpModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4">
        <form onSubmit={handleFollowUp} className="w-full max-w-[480px] rounded-xl bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Tindak Lanjut Pelanggaran</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="fu-status" className="block text-sm font-medium text-body">
                Status
              </label>
              <select
                id="fu-status"
                value={followUp.follow_up_status}
                onChange={(e) => dispatchFollowUp({ type: "field", key: "follow_up_status", value: e.target.value })}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              >
                {followUpStatuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fu-date" className="block text-sm font-medium text-body">
                Tanggal Tindak Lanjut
              </label>
              <input
                id="fu-date"
                type="date"
                value={followUp.follow_up_date}
                onChange={(e) => dispatchFollowUp({ type: "field", key: "follow_up_date", value: e.target.value })}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="fu-note" className="block text-sm font-medium text-body">
                Catatan
              </label>
              <textarea
                id="fu-note"
                value={followUp.follow_up_note}
                onChange={(e) => dispatchFollowUp({ type: "field", key: "follow_up_note", value: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            {followUp.error && <p className="text-sm text-danger">{followUp.error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatchFollowUp({ type: "close" })}
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
}

