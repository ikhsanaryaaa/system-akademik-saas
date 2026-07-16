import { useEffect, useState } from "react";
import { http, type ApiResponse } from "../lib/http";
import { useAuth } from "../context/AuthContext";

interface HealthData {
  status: string;
  database: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState("memeriksa...");

  useEffect(() => {
    http
      .get<ApiResponse<HealthData>>("/health")
      .then((res) => {
        const data = res.data.data;
        setHealth(`API ${data?.status}, database ${data?.database}`);
      })
      .catch(() => setHealth("gagal terhubung ke backend"));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Selamat datang, {user?.name}.</p>

      <div className="mt-6 rounded-lg border border-hairline bg-white p-6">
        <p className="text-sm text-muted">Status koneksi</p>
        <p className="mt-1 font-medium text-ink">{health}</p>
      </div>
    </div>
  );
}
