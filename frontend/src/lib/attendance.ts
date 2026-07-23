// Tipe dan util modul absensi.

export type AttendanceStatus = "hadir" | "terlambat" | "izin" | "sakit" | "alpa";
export type AttendanceMethod = "manual" | "qr" | "rfid" | "unknown";
export type SessionType = "student" | "teacher";
export type AttendanceScope = "daily" | "lesson";
export type SessionStatus = "draft" | "open" | "closed";

export const attendanceStatuses: AttendanceStatus[] = [
  "hadir",
  "terlambat",
  "izin",
  "sakit",
  "alpa",
];

export const attendanceMethods: AttendanceMethod[] = ["manual", "qr", "rfid", "unknown"];

// Kelas Tailwind untuk badge status; tidak mengandalkan warna saja karena
// teks label selalu ikut ditampilkan (aksesibilitas).
export const statusBadgeClass: Record<AttendanceStatus, string> = {
  hadir: "bg-success-soft text-success",
  terlambat: "bg-warning-soft text-warning",
  izin: "bg-info-soft text-info",
  sakit: "bg-info-soft text-info",
  alpa: "bg-danger-soft text-danger",
};

export const methodBadgeClass: Record<AttendanceMethod, string> = {
  manual: "bg-info-soft text-info",
  qr: "bg-success-soft text-success",
  rfid: "bg-warning-soft text-warning",
  unknown: "bg-muted/10 text-muted",
};

export const sessionStatusBadgeClass: Record<SessionStatus, string> = {
  draft: "bg-muted/10 text-muted",
  open: "bg-success-soft text-success",
  closed: "bg-danger-soft text-danger",
};

export interface AttendanceSession {
  id: string;
  session_type: SessionType;
  scope: AttendanceScope;
  date: string;
  status: SessionStatus;
  default_method: AttendanceMethod;
  class_id?: string;
  name?: string;
  lesson_schedule_id?: string;
  subject_id?: string;
  teacher_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  parent_session_id?: string;
  override_by?: string;
  override_reason?: string;
  opened_at?: string;
  opened_by?: string;
  closed_at?: string;
  closed_by?: string;
  opened_by_user?: { name: string };
  closed_by_user?: { name: string };
  class?: { id: string; name: string; grade_level: number; major?: { name: string } };
  subject?: { id: string; name: string };
  teacher?: { id: string; name: string };
  parent_session?: AttendanceSession;
  present_count?: number;
  student_count?: number;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  person_id: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  marked_by?: string;
  check_in_time?: string;
  check_out_time?: string;
  note: string;
  marked_by_user?: { name: string };
  student?: { name: string; nis: string };
  teacher?: { name: string };
}

export interface QrAttendanceToken {
  id: string;
  session_id: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
}

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
  session_id: string;
  date: string;
  status: AttendanceStatus;
  note: string;
  method?: AttendanceMethod;
  student?: { name: string; nis: string };
  class?: { name: string };
  session_name?: string;
  scope?: AttendanceScope;
  subject?: { name: string };
  scheduled_start?: string;
  scheduled_end?: string;
  session?: AttendanceSession;
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
