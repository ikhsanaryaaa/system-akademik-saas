import { useEffect, useState, type FormEvent } from "react";
import { CalendarOff, CalendarPlus, ChevronLeft, ChevronRight, ClipboardCheck, Trash2, type LucideIcon } from "lucide-react";
import { createItem, updateItem, deleteItem } from "../../lib/master";
import { http, type ApiResponse } from "../../lib/http";
import type { AcademicCalendarEvent } from "../../lib/curriculum";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

const PATH = "/academic-calendar";
const eventTypes = ["libur", "ujian", "kegiatan"];
const eventIcons: Record<string, LucideIcon> = {
  libur: CalendarOff,
  ujian: ClipboardCheck,
  kegiatan: CalendarPlus,
};
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function isoDate(value?: string): string {
  return value ? value.slice(0, 10) : "";
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventTextClass(type: string): string {
  if (type === "libur") return "text-danger";
  if (type === "kegiatan") return "text-success";
  return "text-primary";
}

function eventsOnDate(events: AcademicCalendarEvent[], date: string) {
  return events.filter((event) => isoDate(event.start_date) <= date && isoDate(event.end_date) >= date);
}

function academicMonths(name?: string): { year: number; month: number }[] {
  const years = name?.match(/\d{4}/g)?.map(Number) ?? [];
  if (years.length >= 2) {
    return Array.from({ length: 12 }, (_, index) => ({
      year: index < 6 ? years[0] : years[1],
      month: (index + 6) % 12,
    }));
  }
  const year = years[0] ?? new Date().getFullYear();
  return Array.from({ length: 12 }, (_, month) => ({ year, month }));
}

export default function AcademicCalendarPage() {
  const { can } = useAuth();
  const { activeId, years } = useAcademicYear();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [rows, setRows] = useState<AcademicCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicCalendarEvent | null>(null);
  const [form, setForm] = useState<Partial<AcademicCalendarEvent>>({ event_type: "kegiatan" });
  const [deleteConfirm, setDeleteConfirm] = useState<AcademicCalendarEvent | null>(null);
  const [error, setError] = useState("");

  const displayYearId = selectedYearId || activeId || years.find((year) => year.is_active)?.id || years[0]?.id || "";
  const selectedIndex = years.findIndex((year) => year.id === displayYearId);
  const selectedYear = years[selectedIndex];
  const months = academicMonths(selectedYear?.name);

  async function load() {
    if (!displayYearId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<AcademicCalendarEvent[]>>(PATH, {
        params: { academic_year_id: displayYearId },
      });
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayYearId]);

  function openCreate(date?: string) {
    if (!can("curriculum.create")) return;
    setEditing(null);
    setForm({ event_type: "kegiatan", start_date: date, end_date: date });
    setError("");
    setOpen(true);
  }

  function openEdit(row: AcademicCalendarEvent) {
    if (!can("curriculum.update")) return;
    setEditing(row);
    setForm({ ...row, start_date: isoDate(row.start_date), end_date: isoDate(row.end_date) });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!displayYearId) {
      setError("Pilih tahun ajaran terlebih dahulu");
      return;
    }
    const body = {
      title: form.title,
      description: form.description ?? "",
      event_type: form.event_type,
      start_date: `${form.start_date}T00:00:00.000Z`,
      end_date: `${form.end_date}T00:00:00.000Z`,
      academic_year_id: displayYearId,
    };
    try {
      if (editing) await updateItem(PATH, editing.id, body);
      else await createItem(PATH, body);
      setOpen(false);
      load();
    } catch {
      setError("Gagal menyimpan agenda, periksa tanggal");
    }
  }

  async function handleDelete(id: string) {
    await deleteItem(PATH, id);
    setDeleteConfirm(null);
    setOpen(false);
    load();
  }

  function moveYear(direction: number) {
    const next = selectedIndex + direction;
    if (next >= 0 && next < years.length) setSelectedYearId(years[next].id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Kalender Akademik</h1>
          <p className="mt-1 text-sm text-muted">Ringkasan agenda dalam satu tahun ajaran.</p>
        </div>
        {can("curriculum.create") && (
          <button type="button" onClick={() => openCreate()} className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
            Tambah Agenda
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-lg border border-hairline bg-canvas p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2">
          <button type="button" onClick={() => moveYear(-1)} disabled={selectedIndex <= 0} aria-label="Tahun ajaran sebelumnya" className="grid h-9 w-9 place-items-center rounded-md border border-hairline text-muted hover:bg-surface-soft disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select value={displayYearId} onChange={(event) => setSelectedYearId(event.target.value)} aria-label="Tahun ajaran" className="h-9 min-w-0 w-full rounded-md border border-hairline bg-canvas px-2 font-mono text-xs font-semibold text-ink sm:px-3 sm:text-sm">
            {years.length === 0 && <option value="">Belum ada tahun ajaran</option>}
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <button type="button" onClick={() => moveYear(1)} disabled={selectedIndex < 0 || selectedIndex >= years.length - 1} aria-label="Tahun ajaran berikutnya" className="grid h-9 w-9 place-items-center rounded-md border border-hairline text-muted hover:bg-surface-soft disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" aria-label="Jenis agenda">
          {eventTypes.map((type) => {
            const Icon = eventIcons[type];
            return (
              <span key={type} className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-md bg-surface-soft px-2 py-1.5 text-[11px] font-medium capitalize sm:text-xs ${eventTextClass(type)}`}>
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{type}</span>
              </span>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-4 py-12 text-center text-sm text-muted">Memuat kalender...</p>
      ) : !selectedYear ? (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-4 py-12 text-center text-sm text-muted">Belum ada tahun ajaran.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {months.map(({ year, month }) => (
            <MiniMonth key={`${year}-${month}`} year={year} month={month} events={rows} canCreate={can("curriculum.create")} canEdit={can("curriculum.update")} onCreate={openCreate} onEdit={openEdit} />
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Tambah"} Agenda</h2>
                {editing && can("curriculum.delete") && (
                  <button type="button" onClick={() => setDeleteConfirm(editing)} aria-label="Hapus agenda" title="Hapus agenda" className="grid h-9 w-9 place-items-center rounded-md text-danger hover:bg-danger-soft">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-4 space-y-4">
                <div><label htmlFor="calendar-title" className="block text-sm font-medium text-body">Judul</label><input id="calendar-title" value={form.title ?? ""} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary" /></div>
                <div><label htmlFor="calendar-type" className="block text-sm font-medium text-body">Jenis</label><select id="calendar-type" value={form.event_type ?? "kegiatan"} onChange={(event) => setForm({ ...form, event_type: event.target.value })} className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink capitalize">{eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><label htmlFor="calendar-start" className="block text-sm font-medium text-body">Tanggal Mulai</label><input id="calendar-start" type="date" value={isoDate(form.start_date)} onChange={(event) => setForm({ ...form, start_date: event.target.value })} required className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-2 text-sm text-ink" /></div>
                  <div><label htmlFor="calendar-end" className="block text-sm font-medium text-body">Tanggal Selesai</label><input id="calendar-end" type="date" value={isoDate(form.end_date)} onChange={(event) => setForm({ ...form, end_date: event.target.value })} required className="mt-1 h-[38px] w-full rounded-md border border-hairline bg-canvas px-2 text-sm text-ink" /></div>
                </div>
                <div><label htmlFor="calendar-description" className="block text-sm font-medium text-body">Deskripsi</label><textarea id="calendar-description" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary" rows={3} /></div>
                {error && <p className="text-sm text-danger">{error}</p>}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft">Batal</button>
                <button type="submit" className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay px-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-agenda-title" className="w-full max-w-sm rounded-xl border border-hairline bg-canvas p-6 shadow-lg">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-danger-soft text-danger">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 id="delete-agenda-title" className="mt-4 text-lg font-semibold text-ink">Hapus Agenda?</h2>
            <p className="mt-2 text-sm text-muted">
              Agenda <span className="font-medium text-ink">{deleteConfirm.title}</span> akan dihapus permanen.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft">Batal</button>
              <button type="button" onClick={() => handleDelete(deleteConfirm.id)} className="h-[38px] rounded-md bg-danger px-4 text-sm font-medium text-white hover:opacity-90">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniMonth({ year, month, events, canCreate, canEdit, onCreate, onEdit }: { year: number; month: number; events: AcademicCalendarEvent[]; canCreate: boolean; canEdit: boolean; onCreate: (date?: string) => void; onEdit: (event: AcademicCalendarEvent) => void }) {
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: offset + days }, (_, index) => index < offset ? null : index - offset + 1);
  const monthStart = dateKey(year, month, 1);
  const monthEnd = dateKey(year, month, days);
  const monthEvents = events.filter(
    (event) => isoDate(event.start_date) <= monthEnd && isoDate(event.end_date) >= monthStart,
  );

  return (
    <section className="rounded-lg border border-hairline bg-canvas p-3 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-ink">{monthNames[month]} <span className="font-mono text-muted">{year}</span></h2>
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-muted">{dayLabels.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const key = dateKey(year, month, day);
          const dayEvents = eventsOnDate(events, key);
          const isSunday = (offset + day - 1) % 7 === 6;
          const primaryEvent = dayEvents[0];
          const dayColor = primaryEvent ? eventTextClass(primaryEvent.event_type) : isSunday ? "text-danger" : "text-body";
          const handleClick = () => primaryEvent && canEdit ? onEdit(primaryEvent) : onCreate(key);
          return (
            <div key={key} className="group relative flex min-h-10 flex-col items-center rounded-md py-1 hover:bg-surface-soft">
              <button
                type="button"
                disabled={!primaryEvent && !canCreate}
                onClick={handleClick}
                aria-label={primaryEvent ? `${primaryEvent.title}, ${primaryEvent.event_type}` : `Tambah agenda ${key}`}
                title={dayEvents.map((event) => event.title).join(", ") || undefined}
                className={`font-mono text-xs disabled:cursor-default ${primaryEvent || isSunday ? "font-semibold" : ""} ${dayColor}`}
              >
                {day}
              </button>
              {dayEvents.length > 1 && <span className="text-[9px] text-muted">+{dayEvents.length - 1}</span>}
            </div>
          );
        })}
      </div>
      {monthEvents.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
          {monthEvents.slice(0, 3).map((event) => {
            const start = new Date(`${isoDate(event.start_date)}T00:00:00`);
            const end = new Date(`${isoDate(event.end_date)}T00:00:00`);
            const startLabel = `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)}`;
            const endLabel = `${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)}`;
            const range = isoDate(event.start_date) === isoDate(event.end_date) ? startLabel : `${startLabel}–${endLabel}`;
            return (
              <li key={event.id}>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => onEdit(event)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-soft disabled:cursor-default"
                >
                  <span className={`shrink-0 whitespace-nowrap font-mono text-[11px] font-semibold ${eventTextClass(event.event_type)}`}>{range}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-body">{event.title}</span>
                </button>
              </li>
            );
          })}
          {monthEvents.length > 3 && (
            <li className="px-2 pt-1 text-xs font-medium text-muted">
              +{monthEvents.length - 3} agenda lainnya
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
