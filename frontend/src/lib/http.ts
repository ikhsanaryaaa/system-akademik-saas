import axios from "axios";

// HTTP client terpusat untuk seluruh panggilan API.
// baseURL memakai /api dan diteruskan ke backend lewat proxy Vite saat dev.
export const http = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Sisipkan Authorization header dari token tersimpan.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("sim_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bila token invalid atau kedaluwarsa, buang token dan arahkan ke login.
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("sim_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Bentuk response JSON standar dari backend.
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}
