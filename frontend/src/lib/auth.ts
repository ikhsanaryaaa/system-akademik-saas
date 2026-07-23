import { http } from "./http";

export interface AuthRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  roles?: AuthRole[];
  permissions: string[];
}

export async function login(username: string, password: string): Promise<void> {
  await http.post("/auth/login", { username, password }, { headers: { "X-Auth-Transport": "cookie" } });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await http.get("/auth/me");
  return res.data.data as AuthUser;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}
