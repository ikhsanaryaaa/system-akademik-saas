import axios from "axios";

// HTTP client terpusat untuk seluruh panggilan API.
// baseURL memakai /api dan diteruskan ke backend lewat proxy Vite saat dev.
export const http = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Bentuk response JSON standar dari backend.
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}
