import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { paginatedList, type ClassRow } from "../../lib/master";
import { fmtDateTime } from "../../lib/format";
import {
  participantStatusBadge,
  participantStatusLabel,
  scheduleStatusLabel,
  type ExamParticipant,
  type ExamResult,
  type ExamRoom,
  type ExamSchedule,
} from "../../lib/cbt";
import { useAuth } from "../../context/AuthContext";
import RoomsSection from "./RoomsSection";
import AllocateSection from "./AllocateSection";
import PushGradingSection from "./PushGradingSection";

// ResultCards menampilkan rekap hasil ujian. Komponen murni tanpa state,
// diletakkan di module scope agar tidak dibangun ulang tiap render.
function ResultCards({ result }: { result: ExamResult }) {
  const cards = [
    { label: "Total Peserta", value: result.total_participant },
    { label: "Sudah Dinilai", value: result.scored_count },
    { label: "Rata-rata", value: result.average_score.toFixed(1) },
    { label: "Tertinggi", value: result.highest_score.toFixed(1) },
    { label: "Terendah", value: result.lowest_score.toFixed(1) },
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-hairline bg-white p-4">
          <p className="text-sm text-muted">{c.label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [schedule, setSchedule] = useState<ExamSchedule | null>(null);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [participants, setParticipants] = useState<ExamParticipant[]>([]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const canControl = can("cbt.control");
  const canUpdate = can("cbt.update");
  const canMonitor = can("cbt.monitor");

  const loadSchedule = useCallback(async () => {
    const res = await http.get<ApiResponse<ExamSchedule>>(`/exam-schedules/${id}`);
    setSchedule(res.data.data ?? null);
    setRooms(res.data.data?.rooms ?? []);
  }, [id]);

  const loadParticipants = useCallback(async () => {
    if (!canMonitor) return;
    const res = await http.get<ApiResponse<ExamParticipant[]>>(`/exam-schedules/${id}/participants`);
    setParticipants(res.data.data ?? []);
  }, [id, canMonitor]);

  const loadResult = useCallback(async () => {
    const res = await http.get<ApiResponse<ExamResult>>(`/exam-schedules/${id}/report`);
    setResult(res.data.data ?? null);
  }, [id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadSchedule(), loadParticipants(), loadResult()]);
    } finally {
      setLoading(false);
    }
  }, [loadSchedule, loadParticipants, loadResult]);

  useEffect(() => {
    loadAll();
    paginatedList<ClassRow>("/classes", { per_page: 100 }).then((res) => setClasses(res.items));
  }, [loadAll]);

  async function releaseToken() {
    const res = await http.post<ApiResponse<{ token: string }>>(`/exam-schedules/${id}/token`, {});
    setMessage(`Token dirilis: ${res.data.data?.token ?? ""}`);
    loadSchedule();
  }

  async function control(participantId: string, action: string, extraMinute = 0) {
    await http.post(`/exam-participants/${participantId}/control`, { action, extra_minute: extraMinute });
    loadParticipants();
  }

  if (loading) {
    return <div className="rounded-lg border border-hairline bg-white p-8 text-center text-muted">Memuat...</div>;
  }
  if (!schedule) {
    return <div className="rounded-lg border border-hairline bg-white p-8 text-center text-muted">Jadwal tidak ditemukan.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/cbt/schedules" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">{schedule.title}</h1>
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      {renderHeader(schedule)}
      {result && <ResultCards result={result} />}
      <RoomsSection
        scheduleId={id!}
        rooms={rooms}
        canEdit={canUpdate}
        onChange={loadSchedule}
      />
      <AllocateSection
        scheduleId={id!}
        classes={classes}
        rooms={rooms}
        canEdit={canUpdate}
        onChange={loadParticipants}
      />
      {canMonitor && renderMonitoring()}
      {canUpdate && <PushGradingSection scheduleId={id!} classes={classes} onDone={setMessage} />}
    </div>
  );

  function renderHeader(s: ExamSchedule) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-white p-4">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted">Paket: </span>
            <span className="text-ink">{s.package?.title ?? "-"}</span>
          </p>
          <p>
            <span className="text-muted">Mulai: </span>
            <span className="font-mono text-ink">{fmtDateTime(s.start_at)}</span>
          </p>
          <p>
            <span className="text-muted">Durasi: </span>
            <span className="font-mono text-ink">{s.duration_min} menit</span>
          </p>
          <p>
            <span className="text-muted">Status: </span>
            <span className="text-ink">{scheduleStatusLabel[s.status] ?? s.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted">Token Ujian</p>
            <p className="font-mono text-xl font-semibold tracking-widest text-ink">{s.token || "------"}</p>
          </div>
          {canControl && (
            <button
              type="button"
              onClick={releaseToken}
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Rilis Token
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderMonitoring() {
    return (
      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-white">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <span className="text-sm font-semibold text-ink">Monitoring Peserta</span>
          <button type="button" onClick={loadParticipants} className="text-sm text-primary hover:underline">
            Muat Ulang
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Ruang</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nilai</th>
              {canControl && <th className="px-4 py-3 text-right">Kontrol Sesi</th>}
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={canControl ? 5 : 4} className="px-4 py-8 text-center text-muted">
                  Belum ada peserta dialokasikan.
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id} className="border-t border-hairline">
                  <td className="px-4 py-3 text-ink">
                    {p.student?.name ?? "-"}
                    {p.student?.nis && <span className="ml-1 font-mono text-muted">({p.student.nis})</span>}
                  </td>
                  <td className="px-4 py-3">{p.room?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${participantStatusBadge[p.status] ?? ""}`}>
                      {participantStatusLabel[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{p.score ?? "-"}</td>
                  {canControl && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => control(p.id, "reset_login")} className="text-primary hover:underline">
                          Reset Login
                        </button>
                        <button
                          type="button"
                          onClick={() => control(p.id, p.access_open ? "close_access" : "open_access")}
                          className="text-primary hover:underline"
                        >
                          {p.access_open ? "Tutup Akses" : "Buka Akses"}
                        </button>
                        <button type="button" onClick={() => control(p.id, "extend_time", 5)} className="text-primary hover:underline">
                          +5 Menit
                        </button>
                        <button type="button" onClick={() => control(p.id, "stop")} className="text-primary hover:underline">
                          Hentikan
                        </button>
                        <button type="button" onClick={() => control(p.id, "resume")} className="text-primary hover:underline">
                          Lanjutkan
                        </button>
                        <button type="button" onClick={() => control(p.id, "flag")} className="text-danger hover:underline">
                          Tandai
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
