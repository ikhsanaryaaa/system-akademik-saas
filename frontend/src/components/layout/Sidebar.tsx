import { NavLink } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  CalendarRange,
  Layers3,
  GitBranch,
  School,
  UserCog,
  Users,
  GraduationCap,
  BookOpen,
  Network,
  Clock4,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  CreditCard,
  FileBarChart,
  ClipboardList,
  BookMarked,
  FileText,
  UserPlus,
  HeartHandshake,
  Sparkles,
  PartyPopper,
  ShieldAlert,
  CalendarClock,
  AlertTriangle,
  MessagesSquare,
  Home,
  Trophy,
  Contact,
  BookUser,
  Building2,
  Briefcase,
  BriefcaseBusiness,
  Library,
  FileQuestion,
  MessageSquare,
  Wallet,
  ReceiptText,
  FileStack,
  PackageOpen,
  CalendarCheck2,
  ShieldCheck,
  KeyRound,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  MonitorCheck,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import {
  useSidebar,
  OPEN_GROUPS_STORAGE_KEY,
  SIDEBAR_COLLAPSED_STORAGE_KEY,
} from "./sidebarContext";

interface MenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
}

interface MenuGroup {
  label?: string;
  icon?: LucideIcon;
  items: MenuItem[];
}

// Menu dikelompokkan. Item dengan permission hanya tampil bila user berwenang.
// Tiap item punya icon lucide agar tetap terbaca saat sidebar di-collapse ke rail.
const groups: MenuGroup[] = [
  {
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Master Data",
    icon: Database,
    items: [
      { label: "Tahun Ajaran", to: "/master/academic-years", icon: CalendarRange, permission: "master.read" },
      { label: "Tingkatan", to: "/master/grade-levels", icon: Layers3, permission: "master.read" },
      { label: "Jurusan", to: "/master/majors", icon: GitBranch, permission: "master.read" },
      { label: "Kelas", to: "/master/classes", icon: School, permission: "master.read" },
      { label: "Pendidik", to: "/master/teachers", icon: UserCog, permission: "master.read" },
      { label: "Tenaga Non-Kependidikan", to: "/master/staff", icon: Users, permission: "master.read" },
      { label: "Siswa", to: "/master/students", icon: GraduationCap, permission: "master.read" },
    ],
  },
  {
    label: "Kurikulum",
    icon: BookOpen,
    items: [
      { label: "Mata Pelajaran", to: "/curriculum/subjects", icon: BookOpen, permission: "curriculum.read" },
      { label: "Pemetaan Kelas", to: "/curriculum/class-subjects", icon: Network, permission: "curriculum.read" },
      { label: "Jadwal Pelajaran", to: "/curriculum/schedules", icon: Clock4, permission: "curriculum.read" },
      { label: "Kalender Akademik", to: "/curriculum/calendar", icon: CalendarDays, permission: "curriculum.read" },
    ],
  },
  {
    label: "Absensi",
    icon: ClipboardCheck,
    items: [
      { label: "Absensi Siswa", to: "/attendance/students", icon: ClipboardCheck, permission: "attendance.read" },
      { label: "Absensi Guru", to: "/attendance/teachers", icon: UserCheck, permission: "attendance.read" },
      { label: "Kartu RFID", to: "/attendance/rfid-cards", icon: CreditCard, permission: "attendance.manage" },
      { label: "Laporan Absensi", to: "/attendance/report", icon: FileBarChart, permission: "attendance.read" },
    ],
  },
  {
    label: "Penilaian",
    icon: BookMarked,
    items: [
      { label: "Penilaian", to: "/grading/assessments", icon: ClipboardList, permission: "grading.read" },
      { label: "Leger Nilai", to: "/grading/leger", icon: BookMarked, permission: "grading.read" },
      { label: "e-Raport", to: "/grading/report-card", icon: FileText, permission: "grading.read" },
    ],
  },
  {
    label: "Kesiswaan",
    icon: PartyPopper,
    items: [
      { label: "PPDB", to: "/kesiswaan/admissions", icon: UserPlus, permission: "kesiswaan.read" },
      { label: "Pembinaan", to: "/kesiswaan/coaching", icon: HeartHandshake, permission: "kesiswaan.read" },
      { label: "Bakat dan Minat", to: "/kesiswaan/talent", icon: Sparkles, permission: "kesiswaan.read" },
      { label: "Kegiatan", to: "/kesiswaan/activities", icon: PartyPopper, permission: "kesiswaan.read" },
    ],
  },
  {
    label: "Bimbingan Konseling",
    icon: HeartHandshake,
    items: [
      { label: "Jenis Pelanggaran", to: "/bk/violation-types", icon: ShieldAlert, permission: "bk.read" },
      { label: "Agenda BK", to: "/bk/agenda", icon: CalendarClock, permission: "bk.read" },
      { label: "Pelanggaran", to: "/bk/violations", icon: AlertTriangle, permission: "bk.read" },
      { label: "Sesi Konseling", to: "/bk/sessions", icon: MessagesSquare, permission: "bk.read" },
      { label: "Home Visit", to: "/bk/home-visits", icon: Home, permission: "bk.read" },
      { label: "Prestasi", to: "/bk/achievements", icon: Trophy, permission: "bk.read" },
      { label: "Alumni", to: "/bk/alumni", icon: Contact, permission: "bk.read" },
      { label: "Buku Siswa", to: "/bk/student-book", icon: BookUser, permission: "bk.read" },
    ],
  },
  {
    label: "Guru Piket",
    icon: CalendarClock,
    items: [
      { label: "Jadwal Piket", to: "/piket/schedules", icon: CalendarClock, permission: "piket.read" },
      { label: "Buku Piket", to: "/piket/logs", icon: ClipboardList, permission: "piket.read" },
      { label: "Buku Tamu", to: "/piket/guest-book", icon: BookUser, permission: "piket.read" },
      { label: "Pelanggaran Harian", to: "/piket/daily-violations", icon: AlertTriangle, permission: "piket.read" },
      { label: "Keterlambatan", to: "/piket/lateness", icon: Clock4, permission: "piket.read" },
      { label: "Izin Keluar", to: "/piket/leave-permits", icon: FileText, permission: "piket.read" },
    ],
  },
  {
    label: "Bursa Kerja Khusus",
    icon: BriefcaseBusiness,
    items: [
      { label: "Tempat PKL", to: "/bkk/places", icon: Building2, permission: "bkk.read" },
      { label: "Data PKL", to: "/bkk/internships", icon: Briefcase, permission: "bkk.read" },
      { label: "Lowongan Kerja", to: "/bkk/vacancies", icon: BriefcaseBusiness, permission: "bkk.read" },
    ],
  },
  {
    label: "LMS",
    icon: Library,
    items: [
      { label: "Materi", to: "/lms/materials", icon: Library, permission: "lms.read" },
      { label: "Tugas", to: "/lms/assignments", icon: ClipboardList, permission: "lms.read" },
      { label: "Quiz", to: "/lms/quizzes", icon: FileQuestion, permission: "lms.read" },
      { label: "Forum Diskusi", to: "/lms/forum", icon: MessageSquare, permission: "lms.read" },
      { label: "Laporan LMS", to: "/lms/report", icon: FileBarChart, permission: "lms.read" },
    ],
  },
  {
    label: "Keuangan",
    icon: Wallet,
    items: [
      { label: "Jenis Pembayaran", to: "/finance/payment-types", icon: Wallet, permission: "finance.read" },
      { label: "Tagihan", to: "/finance/invoices", icon: ReceiptText, permission: "finance.read" },
      { label: "Laporan Keuangan", to: "/finance/report", icon: FileStack, permission: "finance.read" },
    ],
  },
  {
    label: "CBT",
    icon: MonitorCheck,
    items: [
      { label: "Bank Soal", to: "/cbt/questions", icon: FileQuestion, permission: "cbt.read" },
      { label: "Paket Ujian", to: "/cbt/packages", icon: PackageOpen, permission: "cbt.read" },
      { label: "Jadwal Ujian", to: "/cbt/schedules", icon: CalendarCheck2, permission: "cbt.read" },
    ],
  },
  {
    // Manajemen User berdiri sendiri (bukan di dalam Settings).
    items: [{ label: "Manajemen User", to: "/users", icon: ShieldCheck, permission: "user.read" }],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [{ label: "Ganti Password", to: "/change-password", icon: KeyRound }],
  },
];

export default function Sidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  // State collapse (rail ikon) di desktop, dibaca sekali dari localStorage.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
  });

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, next ? "1" : "0");
  }

  return (
    <>
      {/* Sidebar desktop: bisa collapse dari 260px menjadi rail ikon 72px. */}
      <aside
        className={`relative hidden shrink-0 border-r border-hairline bg-canvas text-body transition-[width] duration-200 md:block ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div className="sticky top-0 flex h-screen flex-col">
          <div
            className={`flex h-[60px] shrink-0 items-center border-b border-hairline ${
              collapsed ? "justify-center px-2" : "gap-2.5 px-4"
            }`}
          >
            {!collapsed && (
              <>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary font-mono text-sm font-bold text-white">
                  S
                </div>
                <span className="flex-1 truncate font-semibold tracking-tight text-ink">SIM Sekolah</span>
              </>
            )}
            {/* Tombol collapse menyatu di header, bukan mengambang di tepi. */}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
              title={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
            </button>
          </div>
          <SidebarNav collapsed={collapsed} />
        </div>
      </aside>

      {/* Drawer mobile: overlay + panel geser. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-overlay"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-canvas text-body shadow-lg">
            <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-hairline px-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary font-mono text-sm font-bold text-white">
                  S
                </div>
                <span className="font-semibold tracking-tight text-ink">SIM Sekolah</span>
              </div>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-soft hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

// SidebarNav merender grup menu. Saat sidebar penuh, grup tampil sebagai
// accordion inline dengan sub-item bergaris konektor. Saat rail ikon (collapsed),
// hanya ikon grup yang tampil dan daftar item muncul sebagai flyout saat hover.
function SidebarNav({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { can } = useAuth();
  const { pathname } = useLocation();

  // Grup yang berisi route aktif selalu ikut terbuka agar user tahu posisinya.
  const activeGroup = useMemo(() => {
    for (const g of groups) {
      if (!g.label) continue;
      if (g.items.some((m) => (m.to === "/" ? pathname === "/" : pathname.startsWith(m.to)))) {
        return g.label;
      }
    }
    return null;
  }, [pathname]);

  // State terbuka dibaca sekali dari localStorage; default membuka grup aktif.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(OPEN_GROUPS_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Record<string, boolean>;
    } catch {
      /* abaikan JSON rusak */
    }
    return activeGroup ? { [activeGroup]: true } : {};
  });

  function toggle(label: string) {
    // Hitung state baru di luar updater agar updater tetap murni; efek samping
    // (menyimpan ke localStorage) dilakukan di sini, di dalam event handler.
    const next = { ...open, [label]: !open[label] };
    setOpen(next);
    localStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <nav className={`flex-1 space-y-1.5 overflow-y-auto py-4 ${collapsed ? "overflow-x-visible px-2" : "px-3"}`}>
      {groups.map((group, gi) => {
        const visible = group.items.filter((m) => !m.permission || can(m.permission));
        if (visible.length === 0) return null;

        // Grup tanpa label (Dashboard) selalu tampil sebagai item tunggal.
        if (!group.label) {
          return (
            <div key={`group-${gi}`}>
              {visible.map((m) => (
                <SidebarLink key={m.to} item={m} onNavigate={onNavigate} collapsed={collapsed} />
              ))}
            </div>
          );
        }

        // Rail ikon: grup jadi tombol ikon dengan flyout berisi item saat hover.
        if (collapsed) {
          const groupActive = group.label === activeGroup;
          return (
            <CollapsedGroup
              key={group.label}
              group={group}
              items={visible}
              active={groupActive}
              onNavigate={onNavigate}
            />
          );
        }

        const isOpen = open[group.label] ?? group.label === activeGroup;
        const GroupIcon = group.icon;
        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggle(group.label!)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition-colors hover:bg-surface-soft hover:text-body"
            >
              {GroupIcon && <GroupIcon className="h-4 w-4 shrink-0" strokeWidth={2} />}
              <span className="truncate">{group.label}</span>
              <ChevronDown
                className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="mt-1 pl-3">
                {/* Wadah dengan garis konektor vertikal untuk sub-item (seperti referensi). */}
                <div className="relative space-y-1 border-l border-hairline pl-3">
                  {visible.map((m) => (
                    <SidebarSubLink key={m.to} item={m} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// CollapsedGroup adalah satu ikon grup di rail; hover memunculkan flyout panel
// berisi judul grup dan sub-item, mengikuti pola dropdown pada referensi.
function CollapsedGroup({
  group,
  items,
  active,
  onNavigate,
}: {
  group: MenuGroup;
  items: MenuItem[];
  active: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const GroupIcon = group.icon;

  function show() {
    window.clearTimeout(closeTimer.current);
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.top, left: rect.right + 8 });
    setOpen(true);
  }

  function hideSoon() {
    // Beri jeda agar kursor bisa berpindah dari ikon ke panel tanpa panel tertutup.
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative mb-1" onMouseEnter={show} onMouseLeave={hideSoon}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={group.label}
        title={group.label}
        onFocus={show}
        onBlur={hideSoon}
        className={`relative grid h-11 w-full place-items-center rounded-md transition-colors ${
          active
            ? "bg-primary-soft text-primary"
            : "text-muted hover:bg-surface-soft hover:text-ink"
        }`}
      >
        {active && (
          <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
        )}
        {GroupIcon && <GroupIcon className="h-[18px] w-[18px]" strokeWidth={2} />}
      </button>

      {open &&
        createPortal(
          <div
            role="menu"
            onMouseEnter={show}
            onMouseLeave={hideSoon}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[60] min-w-[200px] rounded-lg border border-hairline bg-canvas p-1.5 shadow-md"
          >
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {group.label}
            </p>
            <div className="relative border-l border-hairline pl-3">
              {items.map((m) => (
                <SidebarSubLink key={m.to} item={m} onNavigate={onNavigate} />
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// SidebarLink adalah satu tautan menu dengan ikon (dipakai untuk item top-level
// seperti Dashboard). Saat rail ikon, hanya ikon yang tampil dengan tooltip.
function SidebarLink({
  item,
  onNavigate,
  collapsed = false,
}: {
  item: MenuItem;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  if (collapsed) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        title={item.label}
        className={({ isActive }) =>
          `relative grid h-11 w-full place-items-center rounded-md transition-colors ${
            isActive
              ? "bg-primary-soft text-primary"
              : "text-muted hover:bg-surface-soft hover:text-ink"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
            )}
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </>
        )}
      </NavLink>
    );
  }
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
          isActive
            ? "bg-primary-soft font-semibold text-primary"
            : "text-body hover:bg-surface-soft hover:text-ink"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

// SidebarSubLink adalah sub-item dalam grup. Chevron kanan muncul saat item
// aktif atau di-hover, mengikuti pola pada referensi.
function SidebarSubLink({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-surface-strong font-semibold text-ink"
            : "text-muted hover:bg-surface-soft hover:text-body"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="truncate">{item.label}</span>
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-opacity ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}
