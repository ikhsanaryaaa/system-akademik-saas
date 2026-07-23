import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import { GraduationCap, ShieldCheck, LineChart, Users, Loader2, AlertCircle } from "lucide-react";
import { login } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { defaultBranding } from "../lib/branding";

// Sorotan singkat yang tampil di panel branding kiri.
const HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Akses berbasis peran, data tiap sekolah terisolasi" },
  { icon: LineChart, text: "Nilai, absensi, keuangan, dan CBT dalam satu tempat" },
  { icon: Users, text: "Dari PPDB sampai kelulusan, terpantau menyeluruh" },
];

// Halaman login, satu-satunya layar publik. Split panel: branding kiri, form kanan.
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
    <LazyMotion features={domAnimation} strict>
      <div className="grid min-h-screen bg-surface-soft lg:grid-cols-2">
        <BrandPanel />
        <FormPanel
          username={username}
          password={password}
          error={error}
          submitting={submitting}
          onUsername={setUsername}
          onPassword={setPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </LazyMotion>
  );
}

// BrandPanel adalah panel kiri gelap dengan identitas sekolah dan sorotan produk.
// Disembunyikan di layar kecil agar form tetap fokus.
function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-sidebar text-on-sidebar lg:block">
      {/* Aksen gradient halus memakai warna primary branding, tidak polos. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--color-primary) 45%, transparent), transparent 55%), radial-gradient(circle at 85% 80%, color-mix(in oklab, var(--color-primary) 28%, transparent), transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--color-on-sidebar)_1px,transparent_1px),linear-gradient(90deg,var(--color-on-sidebar)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary font-mono text-base font-bold text-white">
            S
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">SIM Sekolah</span>
        </m.div>

        <div className="max-w-md">
          <m.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-semibold leading-tight tracking-tight text-white"
          >
            Sistem Informasi Manajemen Sekolah
          </m.h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <m.li
                  key={h.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3.5 shadow-sm backdrop-blur-sm"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/25 ring-1 ring-white/10">
                    <Icon className="h-[18px] w-[18px] text-white" />
                  </span>
                  <span className="text-sm leading-snug text-on-sidebar">{h.text}</span>
                </m.li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-on-sidebar-muted">
          {defaultBranding.schoolName} &middot; Dikelola aman per sekolah
        </p>
      </div>
    </div>
  );
}

// FormPanel adalah panel kanan berisi form login.
function FormPanel({
  username,
  password,
  error,
  submitting,
  onUsername,
  onPassword,
  onSubmit,
}: {
  username: string;
  password: string;
  error: string;
  submitting: boolean;
  onUsername: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="flex items-center justify-center px-4 py-10 sm:px-8">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-[400px]"
      >
        {/* Logo kompak untuk layar kecil, tempat panel branding tersembunyi. */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-white">
            S
          </div>
          <span className="font-semibold tracking-tight text-ink">SIM Sekolah</span>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Selamat datang</h1>
        <p className="mt-1.5 text-sm text-muted">Masuk untuk melanjutkan ke dashboard sekolah Anda.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-body">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => onUsername(e.target.value)}
              className="mt-1.5 h-[42px] w-full rounded-lg border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
              placeholder="Masukkan username"
            />

          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-body">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => onPassword(e.target.value)}
              className="mt-1.5 h-[42px] w-full rounded-lg border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
              placeholder="Masukkan password"
            />
          </div>

          <AnimatePresence>
            {error && (
              <m.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </m.div>
    </div>
  );
}
