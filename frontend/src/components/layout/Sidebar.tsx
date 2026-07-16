import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface MenuItem {
  label: string;
  to: string;
  permission?: string;
}

interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

// Menu dikelompokkan. Item dengan permission hanya tampil bila user berwenang.
// Grup modul lain ditambahkan seiring modul dikerjakan di tahap berikutnya.
const groups: MenuGroup[] = [
  {
    items: [{ label: "Dashboard", to: "/" }],
  },
  {
    label: "Master Data",
    items: [
      { label: "Tahun Ajaran", to: "/master/academic-years", permission: "master.read" },
      { label: "Tingkatan", to: "/master/grade-levels", permission: "master.read" },
      { label: "Jurusan", to: "/master/majors", permission: "master.read" },
      { label: "Kelas", to: "/master/classes", permission: "master.read" },
      { label: "Pendidik", to: "/master/teachers", permission: "master.read" },
      { label: "Tenaga Non-Kependidikan", to: "/master/staff", permission: "master.read" },
      { label: "Siswa", to: "/master/students", permission: "master.read" },
    ],
  },
  {
    label: "Kurikulum",
    items: [
      { label: "Mata Pelajaran", to: "/curriculum/subjects", permission: "curriculum.read" },
      { label: "Pemetaan Kelas", to: "/curriculum/class-subjects", permission: "curriculum.read" },
      { label: "Jadwal Pelajaran", to: "/curriculum/schedules", permission: "curriculum.read" },
      { label: "Kalender Akademik", to: "/curriculum/calendar", permission: "curriculum.read" },
    ],
  },
  {
    label: "Absensi",
    items: [
      { label: "Absensi Siswa", to: "/attendance/students", permission: "attendance.read" },
      { label: "Absensi Guru", to: "/attendance/teachers", permission: "attendance.read" },
      { label: "Kartu RFID", to: "/attendance/rfid-cards", permission: "attendance.manage" },
      { label: "Laporan Absensi", to: "/attendance/report", permission: "attendance.read" },
    ],
  },
  {
    label: "Penilaian",
    items: [
      { label: "Penilaian", to: "/grading/assessments", permission: "grading.read" },
      { label: "Leger Nilai", to: "/grading/leger", permission: "grading.read" },
      { label: "e-Raport", to: "/grading/report-card", permission: "grading.read" },
    ],
  },
  {
    label: "Kesiswaan",
    items: [
      { label: "PPDB", to: "/kesiswaan/admissions", permission: "kesiswaan.read" },
      { label: "Pembinaan", to: "/kesiswaan/coaching", permission: "kesiswaan.read" },
      { label: "Bakat dan Minat", to: "/kesiswaan/talent", permission: "kesiswaan.read" },
      { label: "Kegiatan", to: "/kesiswaan/activities", permission: "kesiswaan.read" },
    ],
  },
  {
    label: "Bimbingan Konseling",
    items: [
      { label: "Jenis Pelanggaran", to: "/bk/violation-types", permission: "bk.read" },
      { label: "Agenda BK", to: "/bk/agenda", permission: "bk.read" },
      { label: "Pelanggaran", to: "/bk/violations", permission: "bk.read" },
      { label: "Sesi Konseling", to: "/bk/sessions", permission: "bk.read" },
      { label: "Home Visit", to: "/bk/home-visits", permission: "bk.read" },
      { label: "Prestasi", to: "/bk/achievements", permission: "bk.read" },
      { label: "Alumni", to: "/bk/alumni", permission: "bk.read" },
      { label: "Buku Siswa", to: "/bk/student-book", permission: "bk.read" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Manajemen User", to: "/users", permission: "user.read" },
      { label: "Ganti Password", to: "/change-password" },
    ],
  },
];

export default function Sidebar() {
  const { can } = useAuth();

  return (
    <aside className="w-[260px] shrink-0 bg-sidebar text-on-sidebar min-h-screen">
      <div className="h-[60px] flex items-center px-4 text-white font-semibold">SIM Sekolah</div>
      <nav className="px-3 py-2">
        {groups.map((group, gi) => {
          const visible = group.items.filter((m) => !m.permission || can(m.permission));
          if (visible.length === 0) return null;
          return (
            <div key={gi} className="mb-2">
              {group.label && (
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-on-sidebar-muted">
                  {group.label}
                </p>
              )}
              {visible.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.to === "/"}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2.5 text-sm ${
                      isActive
                        ? "bg-primary font-semibold text-white"
                        : "text-on-sidebar-muted hover:bg-sidebar-elevated"
                    }`
                  }
                >
                  {m.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
