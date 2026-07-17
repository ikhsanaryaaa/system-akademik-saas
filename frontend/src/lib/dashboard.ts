import { http, type ApiResponse } from "./http";
import type { Paginated } from "./master";
import type { FinanceReport } from "./finance";
import type { StudentAttendanceReportRow, AttendanceStatus } from "./attendance";

// DashboardData adalah rekap ringkas untuk halaman Dashboard. Nilai null
// menandakan datanya tidak tersedia (mis. user tidak punya permission modul).
export interface DashboardData {
  totalStudents: number | null;
  totalTeachers: number | null;
  totalClasses: number | null;
  attendance: AttendanceSummary | null;
  finance: FinanceReport | null;
  recentActivity: ActivityItem[];
  health: { status: string; database: string } | null;
}

export interface AttendanceSummary {
  total: number;
  present: number; // hadir + terlambat dihitung "masuk"
  rate: number; // persentase kehadiran 0..100
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  status: AttendanceStatus;
  date: string;
}

// today mengembalikan tanggal hari ini (YYYY-MM-DD) memakai waktu lokal.
function today(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

// safe menjalankan promise dan mengembalikan null bila gagal, sehingga satu
// endpoint yang error (mis. 403) tidak menggagalkan seluruh dashboard.
async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

async function countPaginated(path: string): Promise<number | null> {
  const res = await safe(
    http.get<ApiResponse<Paginated<unknown>>>(path, { params: { per_page: 1 } }),
  );
  return res?.data.data?.meta.total ?? null;
}

async function countSimpleList(path: string): Promise<number | null> {
  const res = await safe(http.get<ApiResponse<unknown[]>>(path));
  return res?.data.data?.length ?? null;
}

async function loadAttendance(): Promise<{
  summary: AttendanceSummary | null;
  activity: ActivityItem[];
}> {
  const day = today();
  const res = await safe(
    http.get<ApiResponse<StudentAttendanceReportRow[]>>("/attendance/students/report", {
      params: { start: day, end: day },
    }),
  );
  const rows = res?.data.data;
  if (!rows) return { summary: null, activity: [] };

  const present = rows.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
  const total = rows.length;
  const summary: AttendanceSummary = {
    total,
    present,
    rate: total > 0 ? Math.round((present / total) * 100) : 0,
  };

  const activity: ActivityItem[] = rows.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.student?.name ?? "Siswa",
    detail: `${r.class?.name ?? "-"}${r.student?.nis ? ` · ${r.student.nis}` : ""}`,
    status: r.status,
    date: r.date,
  }));

  return { summary, activity };
}

// loadDashboard menarik semua data ringkasan secara paralel.
export async function loadDashboard(): Promise<DashboardData> {
  const [totalStudents, totalTeachers, totalClasses, financeRes, healthRes, att] =
    await Promise.all([
      countPaginated("/students"),
      countSimpleList("/teachers"),
      countPaginated("/classes"),
      safe(http.get<ApiResponse<FinanceReport>>("/finance/report")),
      safe(http.get<ApiResponse<{ status: string; database: string }>>("/health")),
      loadAttendance(),
    ]);

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    attendance: att.summary,
    finance: financeRes?.data.data ?? null,
    recentActivity: att.activity,
    health: healthRes?.data.data ?? null,
  };
}
