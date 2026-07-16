// Tipe modul Penilaian dan e-Raport.

export interface Assessment {
  id: string;
  title: string;
  type: string;
  weight: number;
  semester: number;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  class?: { name: string };
  subject?: { name: string };
}

export interface ScoreRow {
  student_id: string;
  name: string;
  nis: string;
  score: number;
  note: string;
}

export interface ReportCardScore {
  id: string;
  student_id: string;
  subject_id: string;
  semester: number;
  knowledge_score: number;
  skill_score: number;
  description: string;
  student?: { name: string; nis: string };
  subject?: { name: string };
}

export const assessmentTypes = ["ulangan harian", "tugas", "uts", "uas"];
