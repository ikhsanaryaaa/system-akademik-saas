import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMe, type AuthUser } from "../lib/auth";
import { AuthContext, type AuthState } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await fetchMe());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback((permission: string) => user?.permissions.includes(permission) ?? false, [user]);
  const value = useMemo<AuthState>(() => ({ user, loading, can, refresh, setUser }), [user, loading, can, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
