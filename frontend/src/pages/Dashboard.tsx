import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  ClipboardCheck,
  Wallet,
  Activity,
  ServerCog,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loadDashboard, type DashboardData } from "../lib/dashboard";
import { fmtRupiah } from "../lib/finance";
import { statusBadgeClass } from "../lib/attendance";
import { fmtDate } from "../lib/format";
import { useAcademicYear } from "../context/AcademicYearContext";

// nfmt memformat angka ringkas dengan pemisah ribuan lokal.
function nfmt(v: number | null): string {
  return v === null ? "-" : v.toLocaleString("id-ID");
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { years, activeId } = useAcademicYear();
  const activeYear = years.find((year) => year.id === activeId) ?? years.find((year) => year.is_active);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Selamat datang, {user?.name}.</p>
      </div>

      <CompactStats data={data} loading={loading} activeYear={activeYear} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttendanceTodayCard data={data} loading={loading} />
        <StatusCard data={data} loading={loading} />
      </div>

      <FinanceCard data={data} loading={loading} />
      <ActivityCard data={data} loading={loading} />
    </div>
  );
}

// CompactStats menampilkan snapshot inti tanpa dekorasi berulang.
function CompactStats({
  data,
  loading,
  activeYear,
}: {
  data: DashboardData | null;
  loading: boolean;
  activeYear?: { name: string; is_active: boolean };
}) {
  const stats = [
    { label: "Siswa", value: nfmt(data?.totalStudents ?? null), detail: "terdaftar", icon: GraduationCap },
    { label: "Guru", value: nfmt(data?.totalTeachers ?? null), detail: "pendidik", icon: Users },
    { label: "Kelas", value: nfmt(data?.totalClasses ?? null), detail: "rombongan belajar", icon: School },
    {
      label: "Tahun Ajaran",
      value: activeYear?.name ?? "-",
      detail: activeYear?.is_active ? "aktif" : "belum aktif",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-sm sm:grid-cols-2 lg:grid-cols-4 sm:divide-x sm:divide-hairline">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-4 border-b border-hairline px-5 py-4 last:border-b-0 sm:border-b-0">
            <Icon className="h-5 w-5 shrink-0 text-muted" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{stat.label}</p>
              <p className="mt-0.5 font-mono text-2xl font-semibold text-ink">{loading ? "…" : stat.value}</p>
              <p className="text-xs text-muted">{stat.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// AttendanceTodayCard menonjolkan kondisi kehadiran operasional hari ini.
function AttendanceTodayCard({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const attendance = data?.attendance;

  return (
    <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Kehadiran Hari Ini</h2>
            <p className="mt-0.5 text-xs text-muted">Ringkasan presensi siswa hari ini</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Memuat…</p>
        ) : attendance ? (
          <div className="min-w-[240px] flex-1 sm:max-w-md">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-4xl font-semibold tracking-tight text-ink">{attendance.rate}%</p>
                <p className="mt-1 text-xs text-muted">
                  <span className="font-mono text-success">{nfmt(attendance.present)}</span> dari{" "}
                  <span className="font-mono">{nfmt(attendance.total)}</span> siswa hadir
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Tercatat
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-strong">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(attendance.rate, 100)}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Belum ada data kehadiran hari ini.</p>
        )}
      </div>
    </section>
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
    <div className="mt-4 rounded-lg border border-hairline bg-canvas p-5 shadow-sm">
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
          {items.slice(0, 5).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 sm:flex-nowrap">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                <p className="truncate text-xs text-muted">{a.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[a.status]}`}>
                {a.status}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted">{fmtDate(a.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
