import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface MenuItem {
  label: string;
  to: string;
  permission?: string;
}

// Daftar menu. Item dengan permission hanya tampil bila user punya permission itu.
// Menu modul lain ditambahkan seiring modul dikerjakan di tahap berikutnya.
const menu: MenuItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Manajemen User", to: "/users", permission: "user.read" },
  { label: "Ganti Password", to: "/change-password" },
];

export default function Sidebar() {
  const { can } = useAuth();

  const visible = menu.filter((m) => !m.permission || can(m.permission));

  return (
    <aside className="w-[260px] shrink-0 bg-sidebar text-on-sidebar min-h-screen">
      <div className="h-[60px] flex items-center px-4 text-white font-semibold">SIM Sekolah</div>
      <nav className="px-3 py-2">
        {visible.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.to === "/"}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2.5 text-sm ${
                isActive
                  ? "bg-primary font-semibold text-white"
                  : "text-on-sidebar-muted hover:bg-sidebar-elevated"
              }`
            }
          >
            {m.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
