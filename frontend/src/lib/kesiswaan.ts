// Tipe modul Kesiswaan.

export interface Admission {
  id: string;
  name: string;
  origin_school: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  major_id?: string;
  status: string;
  note: string;
  registered_at?: string;
  academic_year_id?: string;
  // student_id terisi setelah pendaftar dikonversi, sekaligus penanda supaya
  // tombol konversi tidak muncul lagi.
  student_id?: string;
  major?: { name: string };
}

export interface StudentCoaching {
  id: string;
  student_id: string;
  class_id?: string;
  major_id?: string;
  topic: string;
  detail: string;
  coach_name: string;
  date?: string;
  student?: { name: string; nis: string };
  class?: { name: string };
  major?: { name: string };
}

export interface TalentDevelopment {
  id: string;
  student_id: string;
  class_id?: string;
  major_id?: string;
  field: string;
  category: string;
  detail: string;
  mentor: string;
  student?: { name: string; nis: string };
  class?: { name: string };
  major?: { name: string };
}

export interface StudentActivity {
  id: string;
  name: string;
  type: string;
  field: string;
  description: string;
  organizer: string;
  location: string;
  start_date?: string;
  end_date?: string;
}

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  student_id: string;
  role: string;
  note: string;
  student?: { name: string; nis: string; class?: { name: string }; major?: { name: string } };
  activity?: { name: string; type: string };
}

export const admissionStatuses = ["pending", "accepted", "rejected"];
export const participantRoles = ["anggota", "ketua", "pembina"];

// bidangOptions dipakai bersama oleh Bakat dan Minat, Kegiatan, dan Prestasi
// supaya ketiganya dapat dicocokkan. Untuk sementara berupa konstanta, dinaikkan
// jadi tabel master bila sekolah perlu mengaturnya sendiri.
export const bidangOptions = [
  "olahraga",
  "seni dan budaya",
  "keagamaan",
  "sains dan teknologi",
  "bahasa dan sastra",
  "kepemimpinan dan organisasi",
  "kewirausahaan",
  "sosial dan kemanusiaan",
  "lainnya",
];
