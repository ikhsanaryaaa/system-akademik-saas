import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type ClassRow } from "../../lib/master";
import {
  attendanceStatuses,
  statusBadgeClass,
  today,
  type AttendanceStatus,
  type RosterRow,
} from "../../lib/attendance";
import { useAuth } from "../../context/AuthContext";

export default function StudentAttendancePage() {
  const { can } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => today());
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
  }, []);

  async function loadRoster() {
    if (!classId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await http.get<ApiResponse<RosterRow[]>>("/attendance/students/roster", {
        params: { class_id: classId, date },
      });
      setRoster(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRoster((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)));
  }

  function markAll(status: AttendanceStatus) {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await http.post("/attendance/students", {
        class_id: classId,
        date,
        entries: roster.map((r) => ({ student_id: r.student_id, status: r.status, note: r.note })),
      });
      setMessage("Absensi kelas berhasil disimpan");
    } catch {
      setMessage("Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Absensi Siswa</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4">
        <div>
          <label htmlFor="student-att-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select
            id="student-att-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
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
          <label htmlFor="student-att-date" className="block text-sm font-medium text-body">
            Tanggal
          </label>
          <input
            id="student-att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          />
        </div>
        {roster.length > 0 && can("attendance.create") && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted">Tandai semua:</span>
            {attendanceStatuses.map((s) => (
              <button type="button"
                key={s}
                onClick={() => markAll(s)}
                className="rounded-md border border-hairline px-2 py-1 text-xs capitalize hover:bg-surface-soft"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-success">{message}</p>}

      {!classId ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
          Pilih kelas untuk menampilkan daftar siswa.
        </div>
      ) : loading ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
          Memuat...
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      Tidak ada siswa di kelas ini.
                    </td>
                  </tr>
                ) : (
                  roster.map((r) => (
                    <tr key={r.student_id} className="border-t border-hairline">
                      <td className="px-4 py-3 text-ink">{r.name}</td>
                      <td className="px-4 py-3 font-mono">{r.nis}</td>
                      <td className="px-4 py-3">
                        {can("attendance.create") ? (
                          <select
                            aria-label={`Status kehadiran ${r.name}`}
                            value={r.status}
                            onChange={(e) =>
                              setStatus(r.student_id, e.target.value as AttendanceStatus)
                            }
                            className="h-8 rounded-md border border-hairline px-2 text-sm capitalize"
                          >
                            {attendanceStatuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass[r.status]}`}
                          >
                            {r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {roster.length > 0 && can("attendance.create") && (
            <div className="mt-4 flex justify-end">
              <button type="button"
                onClick={save}
                disabled={saving}
                className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Absensi"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
