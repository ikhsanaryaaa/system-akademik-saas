import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, simpleList, type ClassRow } from "../../lib/master";
import type { LessonSchedule } from "../../lib/curriculum";
import {
  attendanceStatuses,
  statusBadgeClass,
  methodBadgeClass,
  today,
  type AttendanceStatus,
  type AttendanceSession,
  type AttendanceRecord,
  type AttendanceMethod,
  type AttendanceScope,
  type QrAttendanceToken,
} from "../../lib/attendance";
import { useAuth } from "../../context/AuthContext";
import AttendanceQrModal from "../../components/AttendanceQrModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { AttendanceSessionListCard, AttendanceCreateSessionCard } from "../../components/AttendanceSessionCard";

export default function StudentAttendancePage() {
  const { can } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [schedules, setSchedules] = useState<LessonSchedule[]>([]);
  const [scope, setScope] = useState<AttendanceScope>("daily");
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => today());
  const [view, setView] = useState<"list" | "detail">("list");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [lessonScheduleId, setLessonScheduleId] = useState("");
  const [overrideSession, setOverrideSession] = useState<AttendanceSession | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [defaultMethod, setDefaultMethod] = useState<AttendanceMethod>("manual");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [qrToken, setQrToken] = useState<QrAttendanceToken | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const sessionToDelete = useRef<string | null>(null);
  const requestPending = useRef(false);
  const scheduleRequest = useRef(0);

  useEffect(() => {
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
  }, []);

  function loadSchedules(nextClassId: string, nextScope: AttendanceScope) {
    const requestId = ++scheduleRequest.current;
    setSchedules([]);
    if (!nextClassId || nextScope !== "lesson") return;
    simpleList<LessonSchedule>(`/lesson-schedules?class_id=${nextClassId}`).then((rows) => {
      if (requestId === scheduleRequest.current) setSchedules(rows);
    });
  }

  async function loadSessions(signal?: AbortSignal) {
    if (!classId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await http.get<ApiResponse<AttendanceSession[]>>("/attendance/sessions", {
        params: { session_type: "student", scope, class_id: classId, date }, signal,
      });
      if (!signal?.aborted) setSessions(res.data.data ?? []);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    if (view === "list") loadSessions(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, scope, view]);

  async function loadRoster(session: AttendanceSession) {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<AttendanceRecord[]>>(
        `/attendance/sessions/${session.id}/roster`,
        { params: { class_id: session.class_id } }
      );
      setRecords(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openSessionDetail(session: AttendanceSession) {
    setSelectedSession(session);
    setView("detail");
    loadRoster(session);
  }

  function backToList() {
    setView("list");
    setSelectedSession(null);
    setRecords([]);
    setQrToken(null);
    setShowQr(false);
    loadSessions();
  }

  async function createSession() {
    if (requestPending.current || !classId || (scope === "daily" ? !sessionName.trim() : !lessonScheduleId)) return;
    requestPending.current = true;
    setPending(true);
    setMessage("");
    try {
      await http.post<ApiResponse<AttendanceSession>>("/attendance/sessions", {
        session_type: "student",
        scope,
        class_id: scope === "daily" ? classId : undefined,
        name: scope === "daily" ? sessionName.trim() : undefined,
        lesson_schedule_id: scope === "lesson" ? lessonScheduleId : undefined,
        date,
        default_method: defaultMethod,
      });
      setSessionName("");
      await loadSessions();
      setMessage("Sesi berhasil dibuat");
    } catch (err: any) {
      if (err.response?.status === 409) {
        setMessage("Nama sesi sudah ada pada kelas dan tanggal ini");
      } else {
        setMessage("Gagal membuat sesi absensi");
      }
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  async function openSession(sessionId: string) {
    if (requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    try {
      await http.post(`/attendance/sessions/${sessionId}/open`);
      await loadSessions();
    } catch {
      setMessage("Gagal membuka sesi");
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  async function overrideOpen() {
    if (!overrideSession || !overrideReason.trim() || requestPending.current) return;
    requestPending.current = true; setPending(true);
    try {
      await http.post(`/attendance/sessions/${overrideSession.id}/override`, { override_reason: overrideReason.trim() });
      setOverrideSession(null); setOverrideReason(""); await loadSessions();
    } catch { setMessage("Gagal membuka sesi dengan override"); }
    finally { requestPending.current = false; setPending(false); }
  }

  async function closeSession(sessionId: string) {
    if (requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    try {
      await http.post(`/attendance/sessions/${sessionId}/close`);
      setQrToken(null);
      setShowQr(false);
      if (view === "detail" && selectedSession?.id === sessionId) {
        backToList();
      } else {
        await loadSessions();
      }
    } catch {
      setMessage("Gagal menghentikan sesi");
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  async function deleteSession() {
    if (!sessionToDelete.current || requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    try {
      await http.delete(`/attendance/sessions/${sessionToDelete.current}`);
      const deletedSessionId = sessionToDelete.current;
      setShowDelete(false);
      sessionToDelete.current = null;
      setQrToken(null);
      setMessage("Sesi berhasil dihapus");
      if (view === "detail" && selectedSession?.id === deletedSessionId) {
        backToList();
      } else {
        await loadSessions();
      }
    } catch {
      setMessage("Gagal menghapus sesi");
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  function confirmDelete(sessionId: string) {
    sessionToDelete.current = sessionId;
    setShowDelete(true);
  }

  function setStatus(personId: string, status: AttendanceStatus) {
    setRecords((prev) => prev.map((r) => (r.person_id === personId ? { ...r, status } : r)));
  }

  function markAll(status: AttendanceStatus) {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function save() {
    if (!selectedSession) return;
    setSaving(true);
    setMessage("");
    try {
      await http.post("/attendance/records/mark", {
        session_id: selectedSession.id,
        entries: records.map((r) => ({ person_id: r.person_id, status: r.status, note: r.note })),
      });
      setMessage("Absensi kelas berhasil disimpan");
      await loadRoster(selectedSession);
      await loadSessions();
    } catch {
      setMessage("Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  }

  async function generateQr(sessionId: string) {
    if (requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    setMessage("");
    try {
      const res = await http.post<ApiResponse<QrAttendanceToken>>("/attendance/qr/generate", {
        session_id: sessionId,
      });
      setQrToken(res.data.data!);
      setShowQr(true);
    } catch {
      setMessage("Gagal membuat token QR");
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  const canWrite = can("attendance.create");
  const canManage = can("attendance.manage");
  const sessionOpen = selectedSession?.status === "open";

  if (view === "detail" && selectedSession) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={backToList}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-hairline px-3 text-sm font-medium text-body hover:bg-surface-soft"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">{selectedSession.name}</h1>
            <p className="text-sm text-muted">
              {selectedSession.class?.name} • {selectedSession.date}
            </p>
          </div>
        </div>

        {message && <p className="mb-3 text-sm text-success">{message}</p>}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">
              Status: <strong className="font-medium text-body capitalize">{selectedSession.status}</strong>
            </span>
            <span className="text-sm text-muted">
              Metode: <strong className="font-medium text-body uppercase">{selectedSession.default_method}</strong>
            </span>
          </div>
          {records.length > 0 && canWrite && sessionOpen && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Tandai semua:</span>
              {attendanceStatuses.map((s) => (
                <button
                  type="button"
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

        {loading ? (
          <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">Memuat...</div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Ditandai Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted">
                        Tidak ada siswa di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.person_id} className="border-t border-hairline">
                        <td className="px-4 py-3 text-ink">{r.student?.name ?? "-"}</td>
                        <td className="px-4 py-3 font-mono">{r.student?.nis ?? "-"}</td>
                        <td className="px-4 py-3">
                          {canWrite && sessionOpen ? (
                            <select
                              aria-label={`Status kehadiran ${r.student?.name}`}
                              value={r.status}
                              onChange={(e) => setStatus(r.person_id, e.target.value as AttendanceStatus)}
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
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs uppercase ${methodBadgeClass[r.method]}`}
                          >
                            {r.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{r.marked_by_user?.name ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {records.length > 0 && canWrite && sessionOpen && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
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

        {showQr && qrToken && (
          <AttendanceQrModal
            token={qrToken}
            onClose={() => setShowQr(false)}
            onRegenerate={() => generateQr(selectedSession.id)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Absensi Siswa</h1>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="Scope absensi">
        {(["daily", "lesson"] as AttendanceScope[]).map((value) => <button key={value} type="button" role="tab" aria-selected={scope === value} onClick={() => { setScope(value); setLessonScheduleId(""); loadSchedules(classId, value); }} className={`h-9 rounded-md px-4 text-sm font-medium ${scope === value ? "bg-primary text-white" : "border border-hairline bg-canvas text-body"}`}>{value === "daily" ? "Harian" : "Jam Pelajaran"}</button>)}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-canvas p-4">
        <div>
          <label htmlFor="student-att-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select
            id="student-att-class"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setLessonScheduleId(""); loadSchedules(e.target.value, scope); }}
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
      </div>

      {message && <p className="mt-3 text-sm text-success">{message}</p>}

      {!classId ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
          Pilih kelas untuk melihat sesi absensi.
        </div>
      ) : (
        <>
          <div className="mt-4">
            {scope === "daily" ? <AttendanceCreateSessionCard
              canManage={canManage}
              pending={pending}
              defaultMethod={defaultMethod}
              sessionName={sessionName}
              onDefaultMethodChange={setDefaultMethod}
              onSessionNameChange={setSessionName}
              onCreate={createSession}
            /> : canManage && <section className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm"><h2 className="font-semibold text-ink">Buat Sesi Jam Pelajaran</h2><div className="mt-3 flex flex-wrap items-end gap-3"><div className="min-w-[260px] flex-1"><label htmlFor="lesson-schedule" className="block text-sm font-medium text-body">Jadwal</label><select id="lesson-schedule" value={lessonScheduleId} onChange={(e) => setLessonScheduleId(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline px-3 text-sm"><option value="">Pilih jadwal sesuai hari</option>{schedules.map((s) => s.day_of_week === (((new Date(`${date}T00:00:00`).getDay() + 6) % 7) + 1) ? <option key={s.id} value={s.id}>{s.subject?.name} · {s.start_time}-{s.end_time} · {s.teacher?.name || "Tanpa guru"}</option> : null)}</select></div><button type="button" disabled={pending || !lessonScheduleId} onClick={createSession} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50">Buat Sesi</button></div></section>}
          </div>

          {loading ? (
            <div className="mt-4 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
              Memuat...
            </div>
          ) : sessions.length === 0 ? (
            <div className="mt-4 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
              {canManage
                ? "Belum ada sesi pada tanggal ini. Buat sesi untuk mulai absensi."
                : "Belum ada sesi absensi pada tanggal ini."}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <AttendanceSessionListCard
                  key={s.id}
                  session={s}
                  canManage={canManage}
                  pending={pending}
                  onOpen={() => scope === "lesson" && !s.parent_session_id ? setOverrideSession(s) : openSession(s.id)}
                  onQr={() => generateQr(s.id)}
                  onClose={() => closeSession(s.id)}
                  onDelete={() => confirmDelete(s.id)}
                  onClick={() => openSessionDetail(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {overrideSession && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="override-title" className="w-full max-w-md rounded-xl bg-canvas p-5 shadow-xl"><h2 id="override-title" className="font-semibold text-ink">Override Sesi Pelajaran</h2><p className="mt-1 text-sm text-muted">Buka tanpa konfirmasi mengajar. Alasan masuk audit.</p><label htmlFor="override-reason" className="mt-4 block text-sm font-medium text-body">Alasan</label><textarea id="override-reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-hairline p-3 text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setOverrideSession(null); setOverrideReason(""); }} className="h-9 rounded-md border border-hairline px-4 text-sm">Batal</button><button type="button" disabled={pending || !overrideReason.trim()} onClick={overrideOpen} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50">Buka Override</button></div></section></div>}
      {showQr && qrToken && (
        <AttendanceQrModal
          token={qrToken}
          onClose={() => setShowQr(false)}
          onRegenerate={() => {
            const sid = sessions.find((s) => s.id === qrToken.session_id)?.id;
            if (sid) generateQr(sid);
          }}
        />
      )}
      {showDelete && (
        <DeleteConfirmModal
          title="Hapus sesi?"
          description="Tindakan ini permanen. Sesi, seluruh record absensi, token QR, dan scan terkait akan dihapus dan tidak dapat dipulihkan."
          pending={pending}
          onCancel={() => {
            setShowDelete(false);
            sessionToDelete.current = null;
          }}
          onConfirm={deleteSession}
        />
      )}
    </div>
  );
}
