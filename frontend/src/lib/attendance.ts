// Tipe dan util modul absensi.

export type AttendanceStatus = "hadir" | "terlambat" | "izin" | "sakit" | "alpa";

export const attendanceStatuses: AttendanceStatus[] = [
  "hadir",
  "terlambat",
  "izin",
  "sakit",
  "alpa",
];

// Kelas Tailwind untuk badge status; tidak mengandalkan warna saja karena
// teks label selalu ikut ditampilkan (aksesibilitas).
export const statusBadgeClass: Record<AttendanceStatus, string> = {
  hadir: "bg-green-100 text-success",
  terlambat: "bg-amber-100 text-warning",
  izin: "bg-sky-100 text-info",
  sakit: "bg-sky-100 text-info",
  alpa: "bg-red-100 text-danger",
};

export interface RosterRow {
  student_id: string;
  name: string;
  nis: string;
  status: AttendanceStatus;
  note: string;
}

export interface TeacherAttendanceRow {
  id: string;
  teacher_id: string;
  date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  note: string;
  teacher?: { name: string };
}

export interface StudentAttendanceReportRow {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  note: string;
  student?: { name: string; nis: string };
  class?: { name: string };
}

export interface RfidCard {
  id: string;
  uid: string;
  student_id?: string;
  teacher_id?: string;
  student?: { name: string };
  teacher?: { name: string };
}

// today mengembalikan tanggal hari ini dalam format YYYY-MM-DD.
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
