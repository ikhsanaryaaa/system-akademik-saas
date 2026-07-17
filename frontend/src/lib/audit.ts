import { http, type ApiResponse } from "./http";

// AuditLog adalah satu entri jejak aktivitas dari backend.
export interface AuditLog {
  id: string;
  user_id?: string;
  username: string;
  action: string;
  resource: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; per_page: number; total: number };
}

export interface AuditFilter {
  page?: number;
  per_page?: number;
  action?: string;
  resource?: string;
  search?: string;
}

// listAuditLogs mengambil jejak audit dengan filter dan pagination.
export function listAuditLogs(params: AuditFilter) {
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") clean[k] = v;
  }
  return http
    .get<ApiResponse<Paginated<AuditLog>>>("/audit-logs", { params: clean })
    .then((r) => r.data.data as Paginated<AuditLog>);
}
