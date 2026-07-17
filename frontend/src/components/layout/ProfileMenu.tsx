import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, KeyRound, UserCog, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../lib/auth";

// ProfileMenu adalah tombol profil di top bar yang membuka dropdown berisi
// status role, ganti password, ubah data user, dan log out.
export default function ProfileMenu() {
  const { user, setUser, can } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar area atau menekan Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    setUser(null);
    navigate("/login");
  }

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  const initial = (user?.name ?? "?").slice(0, 1).toUpperCase();
  const roleName = user?.roles?.map((r) => r.name).join(", ") || "Tanpa role";
  const canEditUser = can("user.read");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-strong"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          {initial}
        </span>
        <span className="hidden max-w-[160px] truncate text-body sm:block">{user?.name}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-md"
        >
          {/* Header: nama, username, dan status role */}
          <div className="border-b border-hairline px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">@{user?.username}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(user?.roles && user.roles.length > 0 ? user.roles : [{ id: "none", name: roleName }]).map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>

          {/* Aksi */}
          <div className="py-1">
            <button type="button" role="menuitem" onClick={() => go("/change-password")} className={itemClass}>
              <KeyRound className="h-[18px] w-[18px] text-muted" />
              Ganti Password
            </button>
            {canEditUser && (
              <button type="button" role="menuitem" onClick={() => go("/users")} className={itemClass}>
                <UserCog className="h-[18px] w-[18px] text-muted" />
                Ubah Data User
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-surface-soft"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const itemClass =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-body transition-colors hover:bg-surface-soft";
