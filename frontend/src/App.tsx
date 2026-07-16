import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/users/UsersPage";
import ChangePasswordPage from "./pages/ChangePassword";
import AcademicYearsPage from "./pages/master/AcademicYearsPage";
import GradeLevelsPage from "./pages/master/GradeLevelsPage";
import MajorsPage from "./pages/master/MajorsPage";
import TeachersPage from "./pages/master/TeachersPage";
import StaffPage from "./pages/master/StaffPage";
import ClassesPage from "./pages/master/ClassesPage";
import StudentsPage from "./pages/master/StudentsPage";

// masterRoute membungkus halaman master data dengan guard permission master.read.
function masterRoute(element: ReactNode) {
  return (
    <RequireAuth permission="master.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

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

      <Route path="/master/academic-years" element={masterRoute(<AcademicYearsPage />)} />
      <Route path="/master/grade-levels" element={masterRoute(<GradeLevelsPage />)} />
      <Route path="/master/majors" element={masterRoute(<MajorsPage />)} />
      <Route path="/master/teachers" element={masterRoute(<TeachersPage />)} />
      <Route path="/master/staff" element={masterRoute(<StaffPage />)} />
      <Route path="/master/classes" element={masterRoute(<ClassesPage />)} />
      <Route path="/master/students" element={masterRoute(<StudentsPage />)} />
    </Routes>
  );
}
