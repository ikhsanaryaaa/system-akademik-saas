import { useEffect, useState, type FormEvent } from "react";
import { http } from "../../lib/http";
import { paginatedList } from "../../lib/master";
import type { Teacher } from "../../lib/master";
import type { ExamRoom } from "../../lib/cbt";

interface Props {
  scheduleId: string;
  rooms: ExamRoom[];
  canEdit: boolean;
  onChange: () => void;
}

// RoomsSection mengelola ruang dan sesi ujian beserta pengawas pada satu jadwal.
export default function RoomsSection({ scheduleId, rooms, canEdit, onChange }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [name, setName] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [session, setSession] = useState("");

  useEffect(() => {
    paginatedList<Teacher>("/teachers", { per_page: 100 }).then((res) => setTeachers(res.items));
  }, []);

  async function addRoom(e: FormEvent) {
    e.preventDefault();
    await http.post(`/exam-schedules/${scheduleId}/rooms`, {
      name,
      supervisor_id: supervisorId || null,
      capacity: Number(capacity),
      session,
    });
    setName("");
    setSupervisorId("");
    setCapacity(0);
    setSession("");
    onChange();
  }

  async function removeRoom(roomId: string) {
    if (!confirm("Hapus ruang ini?")) return;
    await http.delete(`/exam-schedules/${scheduleId}/rooms/${roomId}`);
    onChange();
  }

  const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas">
      <div className="border-b border-hairline px-4 py-3 text-sm font-semibold text-ink">Ruang dan Pengawas</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Ruang</th>
            <th className="px-4 py-3">Sesi</th>
            <th className="px-4 py-3">Kapasitas</th>
            <th className="px-4 py-3">Pengawas</th>
            {canEdit && <th className="px-4 py-3 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rooms.length === 0 ? (
            <tr>
              <td colSpan={canEdit ? 5 : 4} className="px-4 py-8 text-center text-muted">
                Belum ada ruang.
              </td>
            </tr>
          ) : (
            rooms.map((r) => (
              <tr key={r.id} className="border-t border-hairline">
                <td className="px-4 py-3 text-ink">{r.name}</td>
                <td className="px-4 py-3">{r.session || "-"}</td>
                <td className="px-4 py-3 font-mono">{r.capacity}</td>
                <td className="px-4 py-3">{r.supervisor?.name ?? "-"}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => removeRoom(r.id)} className="text-danger hover:underline">
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {canEdit && (
        <form onSubmit={addRoom} className="grid grid-cols-1 gap-3 border-t border-hairline p-4 md:grid-cols-5">
          <div>
            <label htmlFor="rm-name" className="block text-sm font-medium text-body">
              Nama Ruang
            </label>
            <input id="rm-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="rm-session" className="block text-sm font-medium text-body">
              Sesi
            </label>
            <input id="rm-session" value={session} onChange={(e) => setSession(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="rm-capacity" className="block text-sm font-medium text-body">
              Kapasitas
            </label>
            <input
              id="rm-capacity"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="rm-supervisor" className="block text-sm font-medium text-body">
              Pengawas
            </label>
            <select
              id="rm-supervisor"
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className={inputClass}
            >
              <option value="">Pilih guru</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="h-[38px] w-full rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Tambah Ruang
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
