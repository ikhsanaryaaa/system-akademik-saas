import { useEffect, useState } from "react";
import { ScrollText, LogIn, LogOut, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { listAuditLogs, type AuditLog } from "../lib/audit";
import { fmtDateTime } from "../lib/format";

// Metadata tampilan per action: ikon, label, dan warna badge.
const ACTIONS: Record<string, { label: string; icon: typeof LogIn; tone: string; dot: string }> = {
  login: { label: "Login", icon: LogIn, tone: "bg-success-soft text-success", dot: "bg-success" },
  logout: { label: "Logout", icon: LogOut, tone: "bg-surface-strong text-muted", dot: "bg-muted" },
  create: { label: "Create", icon: Plus, tone: "bg-info-soft text-info", dot: "bg-info" },
  update: { label: "Update", icon: Pencil, tone: "bg-warning-soft text-warning", dot: "bg-warning" },
  delete: { label: "Delete", icon: Trash2, tone: "bg-danger-soft text-danger", dot: "bg-danger" },
};

const FILTER_ACTIONS = ["login", "logout", "create", "update", "delete"];
const PER_PAGE = 20;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await listAuditLogs({ page, per_page: PER_PAGE, action, search });
      setLogs(res.items ?? []);
      setTotal(res.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action]);

  // Pencarian di-debounce ringan lewat submit form agar tidak memanggil API tiap ketikan.
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else load();
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Audit Log</h1>
        <p className="mt-1 text-sm text-muted">
          Jejak aktivitas sistem: login, logout, dan perubahan data.
          {!loading && total > 0 && <span className="ml-1 font-mono text-body">{total} entri</span>}
        </p>
      </div>

      <FilterBar
        action={action}
        search={search}
        onAction={(a) => {
          setPage(1);
          setAction(a);
        }}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearch}
      />

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="grid place-items-center">
                    <ScrollText className="h-7 w-7 text-muted-soft" />
                    <p className="mt-2 text-sm text-muted">Belum ada jejak aktivitas.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => <AuditRow key={log.id} log={log} />)
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}

// FilterBar berisi filter action (chip) dan pencarian username.
function FilterBar({
  action,
  search,
  onAction,
  onSearchChange,
  onSearchSubmit,
}: {
  action: string;
  search: string;
  onAction: (a: string) => void;
  onSearchChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip label="Semua" active={action === ""} onClick={() => onAction("")} />
        {FILTER_ACTIONS.map((a) => (
          <FilterChip key={a} label={ACTIONS[a].label} active={action === a} onClick={() => onAction(a)} />
        ))}
      </div>
      <form onSubmit={onSearchSubmit}>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari username..."
          className="h-[38px] w-[220px] rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </form>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-soft text-primary"
          : "text-muted hover:bg-surface-soft hover:text-body"
      }`}
    >
      {label}
    </button>
  );
}

// AuditRow merender satu baris jejak audit dengan badge action berlabel dan dot.
function AuditRow({ log }: { log: AuditLog }) {
  const meta = ACTIONS[log.action] ?? {
    label: log.action,
    icon: ScrollText,
    tone: "bg-surface-strong text-muted",
    dot: "bg-muted",
  };
  const Icon = meta.icon;
  return (
    <tr className="border-t border-hairline transition-colors hover:bg-surface-soft">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-body">{fmtDateTime(log.created_at)}</td>
      <td className="px-4 py-3 font-medium text-ink">{log.username || "-"}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${meta.tone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-3 text-body">{log.resource || "-"}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted">
        <span className="mr-1.5 font-semibold text-muted-soft">{log.method}</span>
        {log.path}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted">{log.ip_address || "-"}</td>
    </tr>
  );
}

// Pagination sederhana untuk daftar audit.
function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted">
        Halaman <span className="font-mono text-body">{page}</span> dari{" "}
        <span className="font-mono text-body">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="flex h-8 items-center gap-1 rounded-md border border-hairline px-3 text-sm text-body transition-colors hover:bg-surface-soft disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="flex h-8 items-center gap-1 rounded-md border border-hairline px-3 text-sm text-body transition-colors hover:bg-surface-soft disabled:opacity-50"
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
