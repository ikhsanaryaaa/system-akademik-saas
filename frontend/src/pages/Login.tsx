import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/auth";
import { useAuth } from "../context/AuthContext";

// Halaman login, satu-satunya layar publik (lihat DESIGN.md login-card).
export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      await refresh();
      navigate("/");
    } catch {
      setError("Username atau password salah");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-soft px-4">
      <div className="w-full max-w-[400px] rounded-xl border border-hairline bg-canvas p-8">
        <h1 className="text-xl font-semibold text-ink">Masuk</h1>
        <p className="mt-1 text-sm text-muted">Sistem Informasi Manajemen Sekolah</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-body">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-body">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-[38px] w-full rounded-md bg-primary text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
