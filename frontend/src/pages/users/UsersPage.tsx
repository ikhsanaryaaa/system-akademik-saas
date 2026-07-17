import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { http, type ApiResponse } from "../../lib/http";
import { useAuth } from "../../context/AuthContext";
import UserFormModal from "./UserFormModal";

interface Role {
  id: string;
  name: string;
}

export interface UserRow {
  id: string;
  name: string;
  username: string;
  email?: string;
  is_active: boolean;
  roles?: Role[];
}

export default function UsersPage() {
  const { can } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<UserRow[]>>("/users");
      setUsers(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus user ini?")) return;
    await http.delete(`/users/${id}`);
    load();
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setModalOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Manajemen User</h1>
          <p className="mt-1 text-sm text-muted">
            Kelola akun pengguna, role, dan status akses.
            {!loading && users.length > 0 && (
              <span className="ml-1 font-mono text-body">{users.length} user</span>
            )}
          </p>
        </div>
        {can("user.create") && (
          <button
            type="button"
            onClick={openCreate}
            className="flex h-[38px] shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="grid place-items-center">
                    <ShieldCheck className="h-7 w-7 text-muted-soft" />
                    <p className="mt-2 text-sm text-muted">Belum ada user.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-hairline transition-colors hover:bg-surface-soft">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {(u.name ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium text-ink">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">@{u.username}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).length === 0 ? (
                        <span className="text-muted">-</span>
                      ) : (
                        (u.roles ?? []).map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center rounded-full bg-surface-strong px-2 py-0.5 text-xs text-body"
                          >
                            {r.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                        u.is_active ? "bg-success-soft text-success" : "bg-surface-strong text-muted"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-success" : "bg-muted"}`} />
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {can("user.update") && (
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          aria-label="Edit user"
                          title="Edit"
                          className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {can("user.delete") && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id)}
                          aria-label="Hapus user"
                          title="Hapus"
                          className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <UserFormModal
          user={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
