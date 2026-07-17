import { useState, type FormEvent } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { http } from "../lib/http";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await http.post("/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMessage("Password berhasil diganti");
      setOldPassword("");
      setNewPassword("");
    } catch {
      setError("Gagal mengganti password, periksa password lama");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Ganti Password</h1>
        <p className="mt-1 text-sm text-muted">Perbarui password akun Anda secara berkala untuk menjaga keamanan.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-md space-y-5 rounded-lg border border-hairline bg-canvas p-6"
      >
        <div className="flex items-center gap-3 border-b border-hairline pb-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Keamanan Akun</p>
            <p className="text-xs text-muted">Minimal 6 karakter.</p>
          </div>
        </div>

        <PasswordField
          label="Password Lama"
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld((v) => !v)}
        />
        <PasswordField
          label="Password Baru"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          minLength={6}
        />

        {message && (
          <p className="flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </p>
        )}
        {error && (
          <p className="flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="h-[38px] w-full rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}

// PasswordField adalah input password dengan tombol tampil/sembunyikan.
function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-body">{label}</label>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[38px] w-full rounded-md border border-hairline bg-canvas px-3 pr-10 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
