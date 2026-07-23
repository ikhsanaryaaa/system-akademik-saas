import { useEffect, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import type { UserRow } from "./UsersPage";

interface Role {
  id: string;
  name: string;
}

// Modal create atau edit user. Saat edit, password dikosongkan dan tidak diubah.
export default function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(user);
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>(() => (user?.roles ?? []).map((r) => r.id));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedRoles = new Set(roleIds);

  useEffect(() => {
    http.get<ApiResponse<Role[]>>("/roles").then((res) => setRoles(res.data.data ?? []));
  }, []);

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && user) {
        await http.put(`/users/${user.id}`, { name, email, role_ids: roleIds });
      } else {
        await http.post("/users", { name, username, email, password, role_ids: roleIds });
      }
      onSaved();
    } catch {
      setError("Gagal menyimpan user, periksa input dan pastikan username unik");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <div className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
        <h2 className="text-lg font-semibold text-ink">{isEdit ? "Edit User" : "Tambah User"}</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="user-name" className="block text-sm font-medium text-body">Nama</label>
            <input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="user-username" className="block text-sm font-medium text-body">Username</label>
            <input
              id="user-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isEdit}
              className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary disabled:bg-surface-strong"
              required
            />
          </div>
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-body">Email</label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          {!isEdit && (
            <div>
              <label htmlFor="user-password" className="block text-sm font-medium text-body">Password</label>
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                required
                minLength={6}
              />
            </div>
          )}
          <fieldset>
            <legend className="block text-sm font-medium text-body">Role</legend>
            <div className="mt-1 max-h-40 overflow-auto rounded-md border border-hairline p-2">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(r.id)}
                    onChange={() => toggleRole(r.id)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
