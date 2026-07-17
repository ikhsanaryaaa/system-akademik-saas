import { useState, type FormEvent } from "react";
import { http } from "../../lib/http";
import type { ClassRow } from "../../lib/master";
import type { ExamRoom } from "../../lib/cbt";

interface Props {
  scheduleId: string;
  classes: ClassRow[];
  rooms: ExamRoom[];
  canEdit: boolean;
  onChange: () => void;
}

// AllocateSection mengalokasikan peserta ke jadwal ujian berdasarkan kelas dan ruang.
export default function AllocateSection({ scheduleId, classes, rooms, canEdit, onChange }: Props) {
  const [classId, setClassId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");

  if (!canEdit) return null;

  async function allocate(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!classId) {
      setMessage("Pilih kelas terlebih dahulu");
      return;
    }
    const res = await http.post<{ data: { added: number } }>(`/exam-schedules/${scheduleId}/participants`, {
      class_id: classId,
      room_id: roomId || null,
    });
    setMessage(`${res.data.data.added} peserta dialokasikan`);
    onChange();
  }

  const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mt-6 rounded-lg border border-hairline bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">Alokasi Peserta</h2>
      <form onSubmit={allocate} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label htmlFor="al-class" className="block text-sm font-medium text-body">
            Kelas
          </label>
          <select id="al-class" value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
            <option value="">Pilih kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="al-room" className="block text-sm font-medium text-body">
            Ruang (opsional)
          </label>
          <select id="al-room" value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputClass}>
            <option value="">Tanpa ruang</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-[38px] w-full rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Alokasikan Kelas
          </button>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-success">{message}</p>}
    </div>
  );
}
