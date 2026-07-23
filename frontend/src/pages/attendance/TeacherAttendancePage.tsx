import { useEffect, useRef, useState } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList } from "../../lib/master";
import type { LessonSchedule, Teacher } from "../../lib/curriculum";
import {
  attendanceStatuses,
  statusBadgeClass,
  methodBadgeClass,
  today,
  type AttendanceStatus,
  type AttendanceSession,
  type AttendanceRecord,
  type AttendanceMethod,
  type QrAttendanceToken,
} from "../../lib/attendance";
import { useAuth } from "../../context/AuthContext";
import AttendanceQrModal from "../../components/AttendanceQrModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import AttendanceSessionCard from "../../components/AttendanceSessionCard";

function timeOnly(v?: string): string {
  if (!v) return "-";
  return new Date(v).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function TeacherAttendancePage() {
  const { can } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [viewScope, setViewScope] = useState<"daily" | "lesson">("daily");
  const [teachingSchedules, setTeachingSchedules] = useState<LessonSchedule[]>([]);
  const [teachingSessions, setTeachingSessions] = useState<AttendanceSession[]>([]);
  const [date, setDate] = useState(() => today());
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<AttendanceMethod>("manual");
  const [selTeacher, setSelTeacher] = useState("");
  const [selStatus, setSelStatus] = useState<AttendanceStatus>("hadir");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [qrToken, setQrToken] = useState<QrAttendanceToken | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const requestPending = useRef(false);

  useEffect(() => {
    simpleList<Teacher>("/teachers").then(setTeachers);
  }, []);

  async function loadSession(signal?: AbortSignal) {
    setMessage("");
    const res = await http.get<ApiResponse<AttendanceSession[]>>("/attendance/sessions", {
      params: { session_type: "teacher", scope: "daily", date }, signal,
    });
    if (signal?.aborted) return;
    const found = (res.data.data ?? [])[0] ?? null;
    setSession(found);
    setQrToken(null);
    if (found) loadRecords(found.id, signal);
    else setRecords([]);
  }

  useEffect(() => {
    const controller = new AbortController();
    if (viewScope === "daily") loadSession(controller.signal);
    else Promise.all([
      http.get<ApiResponse<LessonSchedule[]>>("/attendance/teaching/schedule", { params: { date }, signal: controller.signal }),
      http.get<ApiResponse<AttendanceSession[]>>("/attendance/sessions", { params: { session_type: "teacher", scope: "lesson", date }, signal: controller.signal }),
    ]).then(([scheduleRes, sessionRes]) => { if (!controller.signal.aborted) { setTeachingSchedules(scheduleRes.data.data ?? []); setTeachingSessions(sessionRes.data.data ?? []); } });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, viewScope]);

  async function loadRecords(sessionId: string, signal?: AbortSignal) {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<AttendanceRecord[]>>("/attendance/records", {
        params: { session_id: sessionId }, signal,
      });
      if (!signal?.aborted) setRecords(res.data.data ?? []);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  async function createSession() {
    if (requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    setMessage("");
    try {
      const res = await http.post<ApiResponse<AttendanceSession>>("/attendance/sessions", {
        session_type: "teacher",
        date,
        default_method: defaultMethod,
      });
      setSession(res.data.data!);
      setRecords([]);
    } catch {
      setMessage("Gagal membuat sesi absensi");
    } finally { requestPending.current = false; setPending(false); }
  }

  async function openSession() {
    if (!session || requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    try {
      await http.post(`/attendance/sessions/${session.id}/open`);
      loadSession();
    } catch {
      setMessage("Gagal membuka sesi");
    } finally { requestPending.current = false; setPending(false); }
  }

  async function closeSession() {
    if (!session || requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    try { await http.post(`/attendance/sessions/${session.id}/close`); setQrToken(null); await loadSession(); }
    catch { setMessage("Gagal menghentikan sesi"); } finally { requestPending.current = false; setPending(false); }
  }

  function clearSession() {
    setSession(null);
    setRecords([]);
    setQrToken(null);
    setShowQr(false);
  }

  async function deleteSession() {
    if (!session || requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    try { await http.delete(`/attendance/sessions/${session.id}`); setShowDelete(false); clearSession(); setMessage("Sesi berhasil dihapus"); }
    catch { setMessage("Gagal menghapus sesi"); } finally { requestPending.current = false; setPending(false); }
  }

  async function mark() {
    if (!session || !selTeacher || requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    setMessage("");
    try {
      await http.post("/attendance/records/mark", {
        session_id: session.id,
        entries: [{ person_id: selTeacher, status: selStatus, note: "" }],
      });
      setSelTeacher("");
      loadRecords(session.id);
    } catch {
      setMessage("Gagal mencatat absensi");
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  async function generateQr() {
    if (!session || requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    setMessage("");
    try {
      const res = await http.post<ApiResponse<QrAttendanceToken>>("/attendance/qr/generate", {
        session_id: session.id,
      });
      setQrToken(res.data.data!);
      setShowQr(true);
    } catch {
      setMessage("Gagal membuat token QR");
    } finally { requestPending.current = false; setPending(false); }
  }

  async function openTeaching(scheduleId: string) {
    if (requestPending.current) return;
    requestPending.current = true; setPending(true); setMessage("");
    try {
      await http.post("/attendance/sessions/lesson/teaching", { lesson_schedule_id: scheduleId, date, default_method: "manual" });
      const res = await http.get<ApiResponse<AttendanceSession[]>>("/attendance/sessions", { params: { session_type: "teacher", scope: "lesson", date } });
      setTeachingSessions(res.data.data ?? []);
    } catch { setMessage("Gagal membuka sesi mengajar"); }
    finally { requestPending.current = false; setPending(false); }
  }

  const canWrite = can("attendance.create");
  const canManage = can("attendance.manage");
  const sessionOpen = session?.status === "open";

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Absensi Guru</h1>
      <div className="mt-4 flex gap-2" role="tablist" aria-label="Scope absensi guru">{(["daily", "lesson"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={viewScope === value} onClick={() => setViewScope(value)} className={`h-9 rounded-md px-4 text-sm font-medium ${viewScope === value ? "bg-primary text-white" : "border border-hairline bg-canvas text-body"}`}>{value === "daily" ? "Harian" : "Sesi Mengajar"}</button>)}</div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4">
        <div><label htmlFor="teacher-att-date" className="block text-sm font-medium text-body">Tanggal</label><input id="teacher-att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-[38px] rounded-md border border-hairline px-3 text-sm" /></div>
      </div>

      {viewScope === "daily" ? <div className="mt-4"><AttendanceSessionCard session={session} canManage={canManage} pending={pending} defaultMethod={defaultMethod} onDefaultMethodChange={setDefaultMethod} onCreate={createSession} onOpen={openSession} onQr={generateQr} onClose={closeSession} onDelete={() => setShowDelete(true)} /></div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{teachingSchedules.map((schedule) => { const active = teachingSessions.find((s) => s.lesson_schedule_id === schedule.id); return <article key={schedule.id} className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm"><h2 className="font-semibold text-ink">{schedule.subject?.name}</h2><p className="mt-1 text-sm text-muted">{schedule.class?.name} · <span className="font-mono">{schedule.start_time}-{schedule.end_time}</span></p><p className="mt-2 text-sm">Status: <strong className="uppercase">{active?.status ?? "belum dibuka"}</strong></p>{canWrite && active?.status !== "open" && <button type="button" disabled={pending} onClick={() => openTeaching(schedule.id)} className="mt-3 h-9 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50">Check-in Mengajar</button>}</article>; })}{teachingSchedules.length === 0 && <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-muted sm:col-span-2">Tidak ada jadwal mengajar pada tanggal ini.</div>}</div>}

      {message && <p className="mt-3 text-sm text-success">{message}</p>}

      {viewScope === "daily" && <>
      {session && canWrite && sessionOpen && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4">
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
          <button
            type="button"
            onClick={mark}
            disabled={pending}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Catat
          </button>
        </div>
      )}

      {!session ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
          {canManage
            ? "Belum ada sesi pada tanggal ini. Buat sesi untuk mulai absensi."
            : "Belum ada sesi absensi pada tanggal ini."}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Guru</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3">Masuk</th>
                <th className="px-4 py-3">Keluar</th>
                <th className="px-4 py-3">Ditandai Oleh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Memuat...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Belum ada absensi pada sesi ini.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink">{r.teacher?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs uppercase ${methodBadgeClass[r.method]}`}
                      >
                        {r.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{timeOnly(r.check_in_time)}</td>
                    <td className="px-4 py-3 font-mono">{timeOnly(r.check_out_time)}</td>
                    <td className="px-4 py-3 text-sm text-muted">{r.marked_by_user?.name ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </>}
      {showQr && qrToken && <AttendanceQrModal token={qrToken} onClose={() => setShowQr(false)} onRegenerate={generateQr} />}
      {showDelete && <DeleteConfirmModal title="Hapus sesi?" description="Tindakan ini permanen. Sesi, seluruh record absensi, token QR, dan scan terkait akan dihapus dan tidak dapat dipulihkan." pending={pending} onCancel={() => setShowDelete(false)} onConfirm={deleteSession} />}
    </div>
  );
}
