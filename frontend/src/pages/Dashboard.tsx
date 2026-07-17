import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  ClipboardCheck,
  Wallet,
  Activity,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loadDashboard, type DashboardData } from "../lib/dashboard";
import { fmtRupiah } from "../lib/finance";
import { statusBadgeClass } from "../lib/attendance";
import { fmtDate } from "../lib/format";

// nfmt memformat angka ringkas dengan pemisah ribuan lokal.
function nfmt(v: number | null): string {
  return v === null ? "-" : v.toLocaleString("id-ID");
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Selamat datang, {user?.name}.</p>

      <StatCards data={data} loading={loading} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FinanceCard data={data} loading={loading} />
        <StatusCard data={data} loading={loading} />
      </div>

      <ActivityCard data={data} loading={loading} />
    </div>
  );
}

// StatCards menampilkan empat metrik utama sebagai kartu ringkas.
function StatCards({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const cards: { label: string; value: string; hint: string; icon: LucideIcon }[] = [
    { label: "Total Siswa", value: nfmt(data?.totalStudents ?? null), hint: "siswa terdaftar", icon: GraduationCap },
    { label: "Total Guru", value: nfmt(data?.totalTeachers ?? null), hint: "pendidik aktif", icon: Users },
    { label: "Ruang Kelas", value: nfmt(data?.totalClasses ?? null), hint: "rombongan belajar", icon: School },
    {
      label: "Kehadiran Hari Ini",
      value: data?.attendance ? `${data.attendance.rate}%` : "-",
      hint: data?.attendance ? `${data.attendance.present}/${data.attendance.total} siswa masuk` : "belum ada data",
      icon: ClipboardCheck,
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted">{c.label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-ink">
              {loading ? "…" : c.value}
            </p>
            <p className="mt-1 text-xs text-muted">{c.hint}</p>
          </div>
        );
      })}
    </div>
  );
}

// FinanceCard menampilkan ringkasan keuangan (tertagih, terbayar, tunggakan).
function FinanceCard({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const f = data?.finance;
  const rows = [
    { label: "Total Tagihan", value: f ? fmtRupiah(f.total_amount) : "-" },
    { label: "Sudah Dibayar", value: f ? fmtRupiah(f.paid_amount) : "-" },
    { label: "Tunggakan", value: f ? fmtRupiah(f.outstanding_amount) : "-", danger: true },
  ];
  const paidRate =
    f && f.total_amount > 0 ? Math.round((f.paid_amount / f.total_amount) * 100) : 0;

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm lg:col-span-2">
      <div className="flex items-center gap-2">
        <Wallet className="h-[18px] w-[18px] text-muted" />
        <h2 className="text-sm font-semibold text-ink">Ringkasan Keuangan</h2>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Memuat…</p>
      ) : !f ? (
        <p className="mt-4 text-sm text-muted">Data keuangan tidak tersedia.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {rows.map((r) => (
              <div key={r.label}>
                <p className="text-xs text-muted">{r.label}</p>
                <p className={`mt-1 font-mono text-lg font-semibold ${r.danger ? "text-danger" : "text-ink"}`}>
                  {r.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Progress pelunasan</span>
              <span className="font-mono">{paidRate}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-strong">
              <div className="h-full rounded-full bg-primary" style={{ width: `${paidRate}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
              <span>Lunas: <span className="font-mono text-success">{f.paid_count}</span></span>
              <span>Cicil: <span className="font-mono text-warning">{f.partial_count}</span></span>
              <span>Belum Bayar: <span className="font-mono text-danger">{f.unpaid_count}</span></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// StatusCard menampilkan status koneksi API dan database.
function StatusCard({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const h = data?.health;
  const online = h?.status === "ok" || h?.status === "healthy";
  const dbOnline = !!h?.database && h.database !== "down";

  const items = [
    { label: "API", ok: online, value: h?.status ?? "tidak diketahui" },
    { label: "Database", ok: dbOnline, value: h?.database ?? "tidak diketahui" },
  ];

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ServerCog className="h-[18px] w-[18px] text-muted" />
        <h2 className="text-sm font-semibold text-ink">Status</h2>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Memeriksa…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((it) => (
            <li key={it.label} className="flex items-center justify-between">
              <span className="text-sm text-body">{it.label}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  it.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${it.ok ? "bg-success" : "bg-danger"}`} />
                {it.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ActivityCard menampilkan aktivitas absensi terbaru hari ini.
function ActivityCard({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const items = data?.recentActivity ?? [];
  return (
    <div className="mt-4 rounded-lg border border-hairline bg-canvas shadow-sm">
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-3">
        <Activity className="h-[18px] w-[18px] text-muted" />
        <h2 className="text-sm font-semibold text-ink">Aktivitas Terbaru</h2>
      </div>
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Memuat…</p>
      ) : items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Belum ada aktivitas absensi hari ini.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                <p className="truncate text-xs text-muted">{a.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[a.status]}`}>
                  {a.status}
                </span>
                <span className="font-mono text-xs text-muted">{fmtDate(a.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
