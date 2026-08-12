// Tipe dan konstanta modul Guru Piket.

import type { ViolationRecord } from "./bk";

// Nilai hari mengikuti validasi server yang memakai huruf kecil.
export const weekdays = [
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
  { value: "sabtu", label: "Sabtu" },
  { value: "minggu", label: "Minggu" },
];

export const leaveStatuses = ["out", "returned"];

// Label status izin keluar untuk tampilan.
export const leaveStatusLabel: Record<string, string> = {
  out: "Keluar",
  returned: "Kembali",
};

type StudentRef = { name: string; nis: string };
type NamedRef = { name: string };

export interface Lateness {
  id: string;
  student_id: string;
  minutes: number;
  reason: string;
  officer_id?: string;
  officer: string;
  date?: string;
  student?: StudentRef;
  class?: NamedRef;
  officer_teacher?: NamedRef;
}

export interface LeavePermit {
  id: string;
  student_id: string;
  reason: string;
  status: string;
  officer_id?: string;
  officer: string;
  leave_time?: string;
  return_time?: string;
  student?: StudentRef;
  class?: NamedRef;
  officer_teacher?: NamedRef;
}

export interface GuestBookEntry {
  id: string;
  name: string;
  institution: string;
  purpose: string;
  phone: string;
  check_in_time?: string;
  check_out_time?: string;
}

export interface DutyLog {
  id: string;
  teacher_id?: string;
  date?: string;
  incident: string;
  action: string;
  teacher?: NamedRef;
}

export interface PiketToday {
  date: string;
  officer: NamedRef | null;
  lateness: Lateness[];
  outside: LeavePermit[];
  guests: GuestBookEntry[];
  violations: ViolationRecord[];
  logs: DutyLog[];
}

export interface PiketReport {
  start: string;
  end: string;
  lateness: Lateness[];
  permits: LeavePermit[];
  violations: ViolationRecord[];
  guests: GuestBookEntry[];
  logs: DutyLog[];
  summary: {
    lateness_count: number;
    lateness_minutes: number;
    permit_count: number;
    permit_still_out: number;
    violation_count: number;
    guest_count: number;
    duty_log_count: number;
  };
}
