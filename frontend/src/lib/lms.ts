// Tipe dan konstanta modul Learning Management System (LMS).

// Label status pengumpulan tugas untuk tampilan.
export const submissionStatusLabel: Record<string, string> = {
  submitted: "Dikumpulkan",
  graded: "Dinilai",
};

// Pilihan jawaban soal quiz.
export const quizAnswers = ["a", "b", "c", "d"];

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  attachment_url: string;
  score: number | null;
  feedback: string;
  status: string;
  submitted_at?: string;
  student?: { name: string; nis: string };
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
  points: number;
  order: number;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface LmsReport {
  material_count: number;
  assignment_count: number;
  quiz_count: number;
  thread_count: number;
}
