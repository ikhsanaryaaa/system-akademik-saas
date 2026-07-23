import { createContext, useContext } from "react";
import type { AuthUser } from "../lib/auth";

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return ctx;
}
