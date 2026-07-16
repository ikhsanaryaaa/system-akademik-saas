import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { http, type ApiResponse } from "./lib/http";

interface HealthData {
  status: string;
  database: string;
}

function DashboardPage() {
  const [health, setHealth] = useState<string>("memeriksa...");

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
      <div className="mt-6 rounded-lg border border-hairline bg-white p-6">
        <p className="text-sm text-muted">Status koneksi</p>
        <p className="mt-1 font-medium text-ink">{health}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell>
            <DashboardPage />
          </AppShell>
        }
      />
    </Routes>
  );
}
