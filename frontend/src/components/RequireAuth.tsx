import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// RequireAuth melindungi route: mengarahkan ke /login bila belum terautentikasi.
// Bila permission diberikan, user tanpa permission itu diarahkan ke halaman utama.
export default function RequireAuth({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: string;
}) {
  const { user, loading, can } = useAuth();

  if (loading) {
    return <div className="p-8 text-muted">Memuat...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
