import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList } from "../../lib/master";
import type { Teacher } from "../../lib/curriculum";
import {
  attendanceStatuses,
  statusBadgeClass,
  today,
  type AttendanceStatus,
  type TeacherAttendanceRow,
} from "../../lib/attendance";
import { useAuth } from "../../context/AuthContext";

function timeOnly(v?: string): string {
  if (!v) return "-";
  return new Date(v).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function TeacherAttendancePage() {
  const { can } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [date, setDate] = useState(() => today());
  const [rows, setRows] = useState<TeacherAttendanceRow[]>([]);
  const [selTeacher, setSelTeacher] = useState("");
  const [selStatus, setSelStatus] = useState<AttendanceStatus>("hadir");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    simpleList<Teacher>("/teachers").then(setTeachers);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<TeacherAttendanceRow[]>>("/attendance/teachers", {
        params: { date },
      });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function mark() {
    if (!selTeacher) return;
    await http.post("/attendance/teachers", {
      teacher_id: selTeacher,
      date,
      status: selStatus,
    });
    setSelTeacher("");
    load();
  }

  async function checkout(id: string) {
    await http.post(`/attendance/teachers/${id}/checkout`);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Absensi Guru</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-white p-4">
        <div>
          <label htmlFor="teacher-att-date" className="block text-sm font-medium text-body">
            Tanggal
          </label>
          <input
            id="teacher-att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
          />
        </div>
        {can("attendance.create") && (
          <>
            <div>
              <label htmlFor="teacher-att-teacher" className="block text-sm font-medium text-body">
                Guru
              </label>
              <select
                id="teacher-att-teacher"
                value={selTeacher}
                onChange={(e) => setSelTeacher(e.target.value)}
                className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm"
              >
                <option value="">Pilih guru</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="teacher-att-status" className="block text-sm font-medium text-body">
                Status
              </label>
              <select
                id="teacher-att-status"
                value={selStatus}
                onChange={(e) => setSelStatus(e.target.value as AttendanceStatus)}
                className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm capitalize"
              >
                {attendanceStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button type="button"
              onClick={mark}
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Catat
            </button>
          </>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Masuk</th>
              <th className="px-4 py-3">Keluar</th>
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
                  Belum ada absensi pada tanggal ini.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">{r.teacher?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{timeOnly(r.check_in_time)}</td>
                  <td className="px-4 py-3 font-mono">{timeOnly(r.check_out_time)}</td>
                  <td className="px-4 py-3 text-right">
                    {can("attendance.create") && !r.check_out_time && (
                      <button type="button" onClick={() => checkout(r.id)} className="text-primary hover:underline">
                        Catat Keluar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
