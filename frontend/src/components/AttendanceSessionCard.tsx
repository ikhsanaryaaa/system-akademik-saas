import { Clock3, CreditCard, MousePointer2, Play, Plus, QrCode, Square, Trash2, type LucideIcon } from "lucide-react";
import { sessionStatusBadgeClass, type AttendanceMethod, type AttendanceSession } from "../lib/attendance";

type SessionListCardProps = {
  session: AttendanceSession;
  canManage: boolean;
  pending: boolean;
  onOpen: () => void;
  onQr: () => void;
  onClose: () => void;
  onDelete: () => void;
  onClick: () => void;
};

type CreateCardProps = {
  canManage: boolean;
  pending: boolean;
  defaultMethod: AttendanceMethod;
  sessionName: string;
  onDefaultMethodChange: (method: AttendanceMethod) => void;
  onSessionNameChange: (name: string) => void;
  onCreate: () => void;
};

const buttonClass = "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const methodOptions: { value: AttendanceMethod; label: string; icon: LucideIcon }[] = [
  { value: "manual", label: "Manual", icon: MousePointer2 },
  { value: "qr", label: "QR", icon: QrCode },
  { value: "rfid", label: "RFID", icon: CreditCard },
];

function MethodSelector({ value, onChange, labelId }: { value: AttendanceMethod; onChange: (method: AttendanceMethod) => void; labelId: string }) {
  return (
    <fieldset className="w-full sm:w-auto">
      <legend id={labelId} className="sr-only">Metode</legend>
      <div className="grid h-8 w-full grid-cols-[auto_repeat(3,minmax(0,1fr))] overflow-hidden rounded-md border border-hairline bg-canvas sm:flex sm:w-auto" aria-labelledby={labelId}>
        <span className="inline-flex items-center border-r border-success/20 bg-success-soft px-2 text-[11px] font-semibold text-success sm:px-2.5 sm:text-xs">Metode</span>
        {methodOptions.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`relative inline-flex min-w-0 items-center justify-center gap-0.5 border-r border-hairline px-1 text-[11px] font-medium transition-all duration-150 last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:flex-none sm:gap-1 sm:px-2 sm:text-xs ${active ? "bg-primary-soft text-primary shadow-[inset_0_-2px_0_var(--color-primary)]" : "text-muted hover:bg-primary-soft/60 hover:text-primary active:bg-primary-soft"}`}
            >
              <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span className={option.value === "manual" ? "hidden min-[360px]:inline" : "inline"}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function handleAction(e: React.MouseEvent, action: () => void) {
  e.stopPropagation();
  action();
}

export function AttendanceSessionListCard({ session, canManage, pending, onOpen, onQr, onClose, onDelete, onClick }: SessionListCardProps) {
  const open = session.status === "open";

  return (
    <article className="group rounded-xl border border-hairline bg-canvas p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onClick} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <h3 className="font-semibold text-ink group-hover:text-primary">{session.scope === "lesson" ? session.subject?.name || "Jam Pelajaran" : session.name || "Sesi Harian"}</h3>
          </button>
          {session.scope === "lesson" && <p className="mt-1 text-sm text-muted">{session.class?.name} · <span className="font-mono">{session.scheduled_start}-{session.scheduled_end}</span> · {session.teacher?.name || "Guru belum ditentukan"}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <time dateTime={session.date}>{session.date}</time>
            {session.opened_at && (
              <>
                <span aria-hidden="true">•</span>
                <span>{new Date(session.opened_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </>
            )}
            {session.closed_at && (
              <>
                <span>-</span>
                <span>{new Date(session.closed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${sessionStatusBadgeClass[session.status]}`}>
              {session.status}
            </span>
            <span className="text-xs text-muted">
              <span className="font-mono font-medium text-body">{session.present_count ?? 0}</span> / <span className="font-mono">{session.student_count ?? 0}</span> hadir
            </span>
          </div>
        </div>
        {canManage && (
          <div className="flex w-full shrink-0 gap-1.5 border-t border-hairline pt-3 sm:w-auto sm:flex-wrap sm:border-0 sm:pt-0">
            {!open && (
              <button
                type="button"
                aria-label="Lanjutkan sesi"
                title="Lanjutkan"
                disabled={pending}
                onClick={(e) => handleAction(e, onOpen)}
                className="grid h-9 flex-1 place-items-center rounded-md sm:h-8 sm:w-8 sm:flex-none bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {open && (
              <>
                <button
                  type="button"
                  aria-label="Tampilkan QR"
                  title="QR"
                  disabled={pending}
                  onClick={(e) => handleAction(e, onQr)}
                  className="grid h-9 flex-1 place-items-center rounded-md sm:h-8 sm:w-8 sm:flex-none bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Hentikan sesi"
                  title="Stop"
                  disabled={pending}
                  onClick={(e) => handleAction(e, onClose)}
                  className="grid h-9 flex-1 place-items-center rounded-md sm:h-8 sm:w-8 sm:flex-none border border-danger text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
                >
                  <Square className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
            <button
              type="button"
              aria-label="Hapus sesi"
              title="Hapus"
              disabled={pending}
              onClick={(e) => handleAction(e, onDelete)}
              className="grid h-9 flex-1 place-items-center rounded-md sm:h-8 sm:w-8 sm:flex-none border border-danger text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function AttendanceCreateSessionCard({ canManage, pending, defaultMethod, sessionName, onDefaultMethodChange, onSessionNameChange, onCreate }: CreateCardProps) {
  if (!canManage) return null;

  return (
    <section aria-labelledby="create-session-title" className="rounded-xl border border-hairline bg-canvas p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <label id="create-session-title" htmlFor="session-name-input" className="block text-xs font-medium text-body">Nama Sesi</label>
            <input
              id="session-name-input"
              type="text"
              value={sessionName}
              onChange={(e) => onSessionNameChange(e.target.value)}
              placeholder="Pagi, Siang"
              className="mt-1 h-8 w-full rounded-md border border-hairline bg-canvas px-2.5 text-xs"
            />
          </div>
        </div>
        <MethodSelector value={defaultMethod} onChange={onDefaultMethodChange} labelId="student-default-method" />
        <button type="button" disabled={pending || !sessionName.trim()} onClick={onCreate} className={`${buttonClass} w-full bg-primary text-white hover:bg-primary-hover sm:w-auto`}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Buat Sesi
        </button>
      </div>
    </section>
  );
}

export default function AttendanceSessionCard({ session, canManage, pending, defaultMethod, onDefaultMethodChange, onCreate, onOpen, onQr, onClose, onDelete }: {
  session: AttendanceSession | null;
  canManage: boolean;
  pending: boolean;
  defaultMethod: AttendanceMethod;
  onDefaultMethodChange: (method: AttendanceMethod) => void;
  onCreate: () => void;
  onOpen: () => void;
  onQr: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const open = session?.status === "open";

  return (
    <section aria-labelledby="attendance-session-title" className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary"><Clock3 className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 id="attendance-session-title" className="font-semibold text-ink">Sesi Absensi</h2>
              <p className="text-sm text-muted">Kelola lifecycle dan metode pencatatan sesi.</p>
            </div>
          </div>
          {session && <div className="mt-4 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs uppercase ${sessionStatusBadgeClass[session.status]}`}>{session.status}</span><span className="text-sm text-muted">Metode <strong className="font-medium text-body">{session.default_method.toUpperCase()}</strong></span></div>}
        </div>

        {canManage && (!session ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
            <MethodSelector value={defaultMethod} onChange={onDefaultMethodChange} labelId="teacher-default-method" />
            <button type="button" disabled={pending} onClick={onCreate} className={`${buttonClass} w-full bg-primary text-white hover:bg-primary-hover sm:w-auto`}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Buat Sesi</button>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {!open && <button type="button" aria-label="Lanjutkan sesi absensi" title="Lanjutkan sesi" disabled={pending} onClick={onOpen} className={`${buttonClass} bg-primary text-white hover:bg-primary-hover`}><Play className="h-4 w-4" aria-hidden="true" />Lanjutkan</button>}
            {open && <button type="button" aria-label="Tampilkan QR absensi" title="Tampilkan QR" disabled={pending} onClick={onQr} className={`${buttonClass} bg-primary text-white hover:bg-primary-hover`}><QrCode className="h-4 w-4" aria-hidden="true" />QR</button>}
            {open && <button type="button" aria-label="Hentikan sesi absensi" title="Hentikan sesi" disabled={pending} onClick={onClose} className={`${buttonClass} border border-danger text-danger hover:bg-danger-soft`}><Square className="h-4 w-4" aria-hidden="true" />Stop</button>}
            <button type="button" aria-label="Hapus permanen sesi absensi" title="Hapus sesi" disabled={pending} onClick={onDelete} className={`${buttonClass} border border-danger text-danger hover:bg-danger-soft`}><Trash2 className="h-4 w-4" aria-hidden="true" />Hapus</button>
          </div>
        ))}
      </div>
    </section>
  );
}
