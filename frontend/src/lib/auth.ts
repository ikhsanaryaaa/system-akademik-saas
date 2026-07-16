import { http } from "./http";

const TOKEN_KEY = "sim_token";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  permissions: string[];
}

// Token disimpan di localStorage; dibaca ulang saat aplikasi dimuat.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<string> {
  const res = await http.post("/auth/login", { username, password });
  const token = res.data.data.token as string;
  setToken(token);
  return token;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await http.get("/auth/me");
  return res.data.data as AuthUser;
}

export async function logout(): Promise<void> {
  try {
    await http.post("/auth/logout");
  } finally {
    clearToken();
  }
}
