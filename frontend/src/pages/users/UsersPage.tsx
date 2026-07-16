import { useEffect, useState } from "react";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Manajemen User</h1>
        {can("user.create") && (
          <button
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah User
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-white">
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
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada user.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 text-ink">{u.name}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{(u.roles ?? []).map((r) => r.name).join(", ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.is_active
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-success"
                          : "rounded-full bg-surface-strong px-2 py-0.5 text-xs text-muted"
                      }
                    >
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can("user.update") && (
                      <button onClick={() => openEdit(u)} className="text-primary hover:underline">
                        Edit
                      </button>
                    )}
                    {can("user.delete") && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="ml-3 text-danger hover:underline"
                      >
                        Hapus
                      </button>
                    )}
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
