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
  description: string;
  organizer: string;
  location: string;
  start_date?: string;
  end_date?: string;
}

export const admissionStatuses = ["pending", "accepted", "rejected"];
