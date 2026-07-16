// Tipe modul Bimbingan Konseling (BK).

export interface ViolationType {
  id: string;
  name: string;
  category: string;
  point: number;
}

export interface CounselingAgenda {
  id: string;
  title: string;
  description: string;
  location: string;
  date?: string;
}

export interface ViolationRecord {
  id: string;
  student_id: string;
  violation_type_id: string;
  class_id?: string;
  major_id?: string;
  description: string;
  date?: string;
  reporter_name: string;
  follow_up_status: string;
  follow_up_note: string;
  follow_up_date?: string;
  student?: { name: string; nis: string };
  violation_type?: { name: string; point: number };
  class?: { name: string };
  major?: { name: string };
}

export interface CounselingSession {
  id: string;
  student_id: string;
  class_id?: string;
  major_id?: string;
  type: string;
  topic: string;
  summary: string;
  result: string;
  counsel_name: string;
  date?: string;
  student?: { name: string; nis: string };
  class?: { name: string };
  major?: { name: string };
}

export interface HomeVisit {
  id: string;
  student_id: string;
  class_id?: string;
  major_id?: string;
  purpose: string;
  address: string;
  result: string;
  officer: string;
  date?: string;
  student?: { name: string; nis: string };
  class?: { name: string };
  major?: { name: string };
}

export interface Achievement {
  id: string;
  student_id: string;
  class_id?: string;
  major_id?: string;
  title: string;
  category: string;
  level: string;
  rank: string;
  organizer: string;
  date?: string;
  student?: { name: string; nis: string };
  class?: { name: string };
  major?: { name: string };
}

export interface Alumni {
  id: string;
  name: string;
  graduation_year: number;
  major_id?: string;
  track: string;
  destination: string;
  phone: string;
  email: string;
  note: string;
  major?: { name: string };
}

export interface StudentBook {
  student: { id: string; name: string; nis: string; class?: { name: string }; major?: { name: string } };
  violations: ViolationRecord[];
  achievements: Achievement[];
  sessions: CounselingSession[];
  home_visits: HomeVisit[];
  total_point: number;
}

export const followUpStatuses = ["open", "in_progress", "resolved"];
export const counselingTypes = ["pribadi", "sosial", "belajar", "karir"];
export const achievementLevels = ["sekolah", "kecamatan", "kabupaten", "provinsi", "nasional", "internasional"];
