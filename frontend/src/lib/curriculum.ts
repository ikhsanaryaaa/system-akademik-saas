import type { ClassRow, Major } from "./master";

// Tipe entitas kurikulum.
export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Teacher {
  id: string;
  name: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  class?: ClassRow;
  subject?: Subject;
  teacher?: Teacher;
}

export interface LessonSchedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class?: ClassRow;
  subject?: Subject;
  teacher?: Teacher;
}

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date: string;
  academic_year_id: string;
}

// Nama hari untuk day_of_week 1 sampai 7.
export const dayNames: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

// Re-export tipe master yang dipakai halaman kurikulum.
export type { ClassRow, Major };
