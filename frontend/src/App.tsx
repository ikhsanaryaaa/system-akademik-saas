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
import SubjectsPage from "./pages/curriculum/SubjectsPage";
import ClassSubjectsPage from "./pages/curriculum/ClassSubjectsPage";
import LessonSchedulesPage from "./pages/curriculum/LessonSchedulesPage";
import AcademicCalendarPage from "./pages/curriculum/AcademicCalendarPage";
import StudentAttendancePage from "./pages/attendance/StudentAttendancePage";
import TeacherAttendancePage from "./pages/attendance/TeacherAttendancePage";
import RfidCardsPage from "./pages/attendance/RfidCardsPage";
import AttendanceReportPage from "./pages/attendance/AttendanceReportPage";
import AssessmentsPage from "./pages/grading/AssessmentsPage";
import AssessmentScoresPage from "./pages/grading/AssessmentScoresPage";
import LegerPage from "./pages/grading/LegerPage";
import ReportCardPage from "./pages/grading/ReportCardPage";

// masterRoute membungkus halaman master data dengan guard permission master.read.
function masterRoute(element: ReactNode) {
  return (
    <RequireAuth permission="master.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// curriculumRoute membungkus halaman kurikulum dengan guard permission curriculum.read.
function curriculumRoute(element: ReactNode) {
  return (
    <RequireAuth permission="curriculum.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// attendanceRoute membungkus halaman absensi dengan guard permission attendance.read.
function attendanceRoute(element: ReactNode) {
  return (
    <RequireAuth permission="attendance.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// gradingRoute membungkus halaman penilaian dengan guard permission grading.read.
function gradingRoute(element: ReactNode) {
  return (
    <RequireAuth permission="grading.read">
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

      <Route path="/curriculum/subjects" element={curriculumRoute(<SubjectsPage />)} />
      <Route path="/curriculum/class-subjects" element={curriculumRoute(<ClassSubjectsPage />)} />
      <Route path="/curriculum/schedules" element={curriculumRoute(<LessonSchedulesPage />)} />
      <Route path="/curriculum/calendar" element={curriculumRoute(<AcademicCalendarPage />)} />

      <Route path="/attendance/students" element={attendanceRoute(<StudentAttendancePage />)} />
      <Route path="/attendance/teachers" element={attendanceRoute(<TeacherAttendancePage />)} />
      <Route path="/attendance/rfid-cards" element={attendanceRoute(<RfidCardsPage />)} />
      <Route path="/attendance/report" element={attendanceRoute(<AttendanceReportPage />)} />

      <Route path="/grading/assessments" element={gradingRoute(<AssessmentsPage />)} />
      <Route path="/grading/assessments/:id/scores" element={gradingRoute(<AssessmentScoresPage />)} />
      <Route path="/grading/leger" element={gradingRoute(<LegerPage />)} />
      <Route path="/grading/report-card" element={gradingRoute(<ReportCardPage />)} />
    </Routes>
  );
}
