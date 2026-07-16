import { Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/users/UsersPage";
import ChangePasswordPage from "./pages/ChangePassword";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/users"
        element={
          <RequireAuth permission="user.read">
            <AppShell>
              <UsersPage />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/change-password"
        element={
          <RequireAuth>
            <AppShell>
              <ChangePasswordPage />
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
