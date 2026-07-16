import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../lib/auth";

export default function TopBar() {
  const { user, setUser } = useAuth();
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
        <span className="text-sm text-body">{user?.name}</span>
        <button onClick={handleLogout} className="text-sm text-primary hover:underline">
          Keluar
        </button>
      </div>
    </header>
  );
}
