import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { logout } from "../../lib/auth";

export default function TopBar() {
  const { user, setUser } = useAuth();
  const { years, activeId, setActiveId } = useAcademicYear();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate("/login");
  }

  return (
    <header className="h-[60px] shrink-0 bg-white border-b border-hairline flex items-center justify-between px-6">
      <div className="text-ink font-medium">Dashboard</div>
      <div className="flex items-center gap-4">
        {years.length > 0 && (
          <select
            value={activeId ?? ""}
            onChange={(e) => setActiveId(e.target.value)}
            className="h-9 rounded-md border border-hairline bg-surface-strong px-3 text-sm text-body"
            title="Tahun ajaran aktif"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.is_active ? " (aktif)" : ""}
              </option>
            ))}
          </select>
        )}
        <span className="text-sm text-body">{user?.name}</span>
        <button type="button" onClick={handleLogout} className="text-sm text-primary hover:underline">
          Keluar
        </button>
      </div>
    </header>
  );
}
