import { http, type ApiResponse } from "./http";

// Tipe entitas master data.
export interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

export interface GradeLevel {
  id: string;
  name: string;
  code: string;
  order: number;
}

export interface Major {
  id: string;
  name: string;
  code: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  email?: string;
  phone?: string;
  gender?: string;
  photo_url?: string;
}

export interface Staff {
  id: string;
  name: string;
  nip: string;
  position?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
}

export interface ClassRow {
  id: string;
  name: string;
  grade_level_id: string;
  major_id?: string;
  academic_year_id: string;
  homeroom_id?: string;
  grade_level?: GradeLevel;
  major?: Major;
  homeroom?: Teacher;
}

export interface StudentRow {
  id: string;
  name: string;
  nis: string;
  nisn: string;
  gender?: string;
  class_id?: string;
  major_id?: string;
  photo_url?: string;
  class?: ClassRow;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; per_page: number; total: number };
}

// Helper CRUD generik untuk entitas dengan daftar sederhana (tanpa pagination).
export function simpleList<T>(path: string) {
  return http.get<ApiResponse<T[]>>(path).then((r) => r.data.data ?? []);
}

export function createItem<T>(path: string, body: unknown) {
  return http.post<ApiResponse<T>>(path, body).then((r) => r.data.data);
}

export function updateItem<T>(path: string, id: string, body: unknown) {
  return http.put<ApiResponse<T>>(`${path}/${id}`, body).then((r) => r.data.data);
}

export function deleteItem(path: string, id: string) {
  return http.delete(`${path}/${id}`);
}

// uploadPhoto mengunggah satu file gambar dan mengembalikan URL publiknya.
export function uploadPhoto(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return http
    .post<ApiResponse<{ url: string }>>("/uploads", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => {
      if (!r.data.data?.url) throw new Error("URL foto tidak tersedia");
      return r.data.data.url;
    });
}

// photoSrc mengubah path relatif dari server jadi URL gambar untuk <img>.
export function photoSrc(url?: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${import.meta.env.VITE_API_ORIGIN ?? ""}${url}`;
}

// Helper daftar dengan pagination dan filter untuk kelas dan siswa.
export function paginatedList<T>(path: string, params: Record<string, string | number>) {
  return http
    .get<ApiResponse<Paginated<T>>>(path, { params })
    .then((r) => r.data.data as Paginated<T>);
}
