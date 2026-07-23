import axios from "axios";

// HTTP client terpusat untuk seluruh panggilan API.
// baseURL memakai /api dan diteruskan ke backend lewat proxy Vite saat dev.
export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Bila session invalid atau kedaluwarsa, arahkan ke login.
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      window.location.href = "/login";
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
