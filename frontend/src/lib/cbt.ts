// Tipe dan konstanta modul CBT (Computer Based Test) untuk proktor dan pengawas.

export const questionTypes = ["multiple_choice", "true_false", "essay", "matching"];

export const questionTypeLabel: Record<string, string> = {
  multiple_choice: "Pilihan Ganda",
  true_false: "Benar/Salah",
  essay: "Esai",
  matching: "Menjodohkan",
};

export const difficulties = ["easy", "medium", "hard"];

export const difficultyLabel: Record<string, string> = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
};

export const scheduleStatuses = ["scheduled", "ongoing", "finished"];

export const scheduleStatusLabel: Record<string, string> = {
  scheduled: "Terjadwal",
  ongoing: "Berlangsung",
  finished: "Selesai",
};

// Status peserta untuk dashboard monitoring.
export const participantStatusLabel: Record<string, string> = {
  not_started: "Belum Mulai",
  ongoing: "Mengerjakan",
  submitted: "Selesai",
  disconnected: "Terputus",
  flagged: "Ditandai Curang",
};

// Kelas badge status peserta; label selalu ditampilkan sehingga tidak
// hanya mengandalkan warna (aksesibilitas).
export const participantStatusBadge: Record<string, string> = {
  not_started: "bg-gray-100 text-muted",
  ongoing: "bg-sky-100 text-info",
  submitted: "bg-green-100 text-success",
  disconnected: "bg-amber-100 text-warning",
  flagged: "bg-red-100 text-danger",
};

export interface QuestionOption {
  id?: string;
  text: string;
  image_url?: string;
  match_text?: string;
  is_correct: boolean;
  order: number;
}

export interface Question {
  id: string;
  subject_id?: string;
  class_id?: string;
  major_id?: string;
  type: string;
  text: string;
  image_url: string;
  formula: string;
  difficulty: string;
  points: number;
  essay_key: string;
  subject?: { name: string };
  class?: { name: string };
  options?: QuestionOption[];
}

export interface ExamPackage {
  id: string;
  title: string;
  subject_id?: string;
  class_id?: string;
  major_id?: string;
  description: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  subject?: { name: string };
  class?: { name: string };
}

export interface ExamPackageItem {
  id: string;
  package_id: string;
  question_id: string;
  order: number;
  points: number;
  question?: Question;
}

export interface ExamRoom {
  id: string;
  schedule_id: string;
  name: string;
  supervisor_id?: string;
  capacity: number;
  session: string;
  supervisor?: { name: string };
}

export interface ExamSchedule {
  id: string;
  package_id: string;
  title: string;
  class_id?: string;
  major_id?: string;
  start_at?: string;
  end_at?: string;
  duration_min: number;
  token: string;
  status: string;
  package?: { title: string };
  class?: { name: string };
  rooms?: ExamRoom[];
}

export interface ExamParticipant {
  id: string;
  schedule_id: string;
  student_id: string;
  room_id?: string;
  status: string;
  login_locked: boolean;
  access_open: boolean;
  extra_minute: number;
  score: number | null;
  student?: { name: string; nis: string };
  room?: { name: string };
}

export interface ExamViolation {
  id: string;
  participant_id: string;
  type: string;
  detail: string;
  occurred_at?: string;
}

export interface ExamResult {
  total_participant: number;
  scored_count: number;
  status_count: Record<string, number>;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}
