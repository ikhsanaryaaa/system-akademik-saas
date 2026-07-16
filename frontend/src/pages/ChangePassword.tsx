import { useState, type FormEvent } from "react";
import { http } from "../lib/http";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
      <h1 className="text-2xl font-semibold text-ink tracking-tight">Ganti Password</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded-lg border border-hairline bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-body">Password Lama</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-body">Password Baru</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
            required
            minLength={6}
          />
        </div>

        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
