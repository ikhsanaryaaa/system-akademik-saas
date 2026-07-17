import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/users/UsersPage";
import ChangePasswordPage from "./pages/ChangePassword";
import AuditLogPage from "./pages/AuditLogPage";
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
import AdmissionsPage from "./pages/kesiswaan/AdmissionsPage";
import CoachingPage from "./pages/kesiswaan/CoachingPage";
import TalentPage from "./pages/kesiswaan/TalentPage";
import ActivitiesPage from "./pages/kesiswaan/ActivitiesPage";
import ViolationTypesPage from "./pages/bk/ViolationTypesPage";
import AgendaPage from "./pages/bk/AgendaPage";
import ViolationRecordsPage from "./pages/bk/ViolationRecordsPage";
import CounselingSessionsPage from "./pages/bk/CounselingSessionsPage";
import HomeVisitsPage from "./pages/bk/HomeVisitsPage";
import AchievementsPage from "./pages/bk/AchievementsPage";
import AlumniPage from "./pages/bk/AlumniPage";
import StudentBookPage from "./pages/bk/StudentBookPage";
import DutySchedulesPage from "./pages/piket/DutySchedulesPage";
import DutyLogsPage from "./pages/piket/DutyLogsPage";
import GuestBookPage from "./pages/piket/GuestBookPage";
import DailyViolationsPage from "./pages/piket/DailyViolationsPage";
import LatenessPage from "./pages/piket/LatenessPage";
import LeavePermitsPage from "./pages/piket/LeavePermitsPage";
import InternshipPlacesPage from "./pages/bkk/InternshipPlacesPage";
import InternshipsPage from "./pages/bkk/InternshipsPage";
import JobVacanciesPage from "./pages/bkk/JobVacanciesPage";
import MaterialsPage from "./pages/lms/MaterialsPage";
import AssignmentsPage from "./pages/lms/AssignmentsPage";
import SubmissionsPage from "./pages/lms/SubmissionsPage";
import QuizzesPage from "./pages/lms/QuizzesPage";
import QuizQuestionsPage from "./pages/lms/QuizQuestionsPage";
import ForumThreadsPage from "./pages/lms/ForumThreadsPage";
import ForumPostsPage from "./pages/lms/ForumPostsPage";
import LmsReportPage from "./pages/lms/LmsReportPage";
import PaymentTypesPage from "./pages/finance/PaymentTypesPage";
import InvoicesPage from "./pages/finance/InvoicesPage";
import InvoiceDetailPage from "./pages/finance/InvoiceDetailPage";
import FinanceReportPage from "./pages/finance/FinanceReportPage";
import QuestionsPage from "./pages/cbt/QuestionsPage";
import ExamPackagesPage from "./pages/cbt/ExamPackagesPage";
import PackageItemsPage from "./pages/cbt/PackageItemsPage";
import ExamSchedulesPage from "./pages/cbt/ExamSchedulesPage";
import ScheduleDetailPage from "./pages/cbt/ScheduleDetailPage";

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

// kesiswaanRoute membungkus halaman kesiswaan dengan guard permission kesiswaan.read.
function kesiswaanRoute(element: ReactNode) {
  return (
    <RequireAuth permission="kesiswaan.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// bkRoute membungkus halaman bimbingan konseling dengan guard permission bk.read.
function bkRoute(element: ReactNode) {
  return (
    <RequireAuth permission="bk.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// piketRoute membungkus halaman guru piket dengan guard permission piket.read.
function piketRoute(element: ReactNode) {
  return (
    <RequireAuth permission="piket.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// bkkRoute membungkus halaman bursa kerja khusus dengan guard permission bkk.read.
function bkkRoute(element: ReactNode) {
  return (
    <RequireAuth permission="bkk.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// lmsRoute membungkus halaman LMS dengan guard permission lms.read.
function lmsRoute(element: ReactNode) {
  return (
    <RequireAuth permission="lms.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// financeRoute membungkus halaman keuangan dengan guard permission finance.read.
function financeRoute(element: ReactNode) {
  return (
    <RequireAuth permission="finance.read">
      <AppShell>{element}</AppShell>
    </RequireAuth>
  );
}

// cbtRoute membungkus halaman CBT dengan guard permission cbt.read.
function cbtRoute(element: ReactNode) {
  return (
    <RequireAuth permission="cbt.read">
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
        path="/audit-logs"
        element={
          <RequireAuth permission="audit.read">
            <AppShell>
              <AuditLogPage />
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

      <Route path="/kesiswaan/admissions" element={kesiswaanRoute(<AdmissionsPage />)} />
      <Route path="/kesiswaan/coaching" element={kesiswaanRoute(<CoachingPage />)} />
      <Route path="/kesiswaan/talent" element={kesiswaanRoute(<TalentPage />)} />
      <Route path="/kesiswaan/activities" element={kesiswaanRoute(<ActivitiesPage />)} />

      <Route path="/bk/violation-types" element={bkRoute(<ViolationTypesPage />)} />
      <Route path="/bk/agenda" element={bkRoute(<AgendaPage />)} />
      <Route path="/bk/violations" element={bkRoute(<ViolationRecordsPage />)} />
      <Route path="/bk/sessions" element={bkRoute(<CounselingSessionsPage />)} />
      <Route path="/bk/home-visits" element={bkRoute(<HomeVisitsPage />)} />
      <Route path="/bk/achievements" element={bkRoute(<AchievementsPage />)} />
      <Route path="/bk/alumni" element={bkRoute(<AlumniPage />)} />
      <Route path="/bk/student-book" element={bkRoute(<StudentBookPage />)} />

      <Route path="/piket/schedules" element={piketRoute(<DutySchedulesPage />)} />
      <Route path="/piket/logs" element={piketRoute(<DutyLogsPage />)} />
      <Route path="/piket/guest-book" element={piketRoute(<GuestBookPage />)} />
      <Route path="/piket/daily-violations" element={piketRoute(<DailyViolationsPage />)} />
      <Route path="/piket/lateness" element={piketRoute(<LatenessPage />)} />
      <Route path="/piket/leave-permits" element={piketRoute(<LeavePermitsPage />)} />

      <Route path="/bkk/places" element={bkkRoute(<InternshipPlacesPage />)} />
      <Route path="/bkk/internships" element={bkkRoute(<InternshipsPage />)} />
      <Route path="/bkk/vacancies" element={bkkRoute(<JobVacanciesPage />)} />

      <Route path="/lms/materials" element={lmsRoute(<MaterialsPage />)} />
      <Route path="/lms/assignments" element={lmsRoute(<AssignmentsPage />)} />
      <Route path="/lms/assignments/:id/submissions" element={lmsRoute(<SubmissionsPage />)} />
      <Route path="/lms/quizzes" element={lmsRoute(<QuizzesPage />)} />
      <Route path="/lms/quizzes/:id/questions" element={lmsRoute(<QuizQuestionsPage />)} />
      <Route path="/lms/forum" element={lmsRoute(<ForumThreadsPage />)} />
      <Route path="/lms/forum/:id/posts" element={lmsRoute(<ForumPostsPage />)} />
      <Route path="/lms/report" element={lmsRoute(<LmsReportPage />)} />

      <Route path="/finance/payment-types" element={financeRoute(<PaymentTypesPage />)} />
      <Route path="/finance/invoices" element={financeRoute(<InvoicesPage />)} />
      <Route path="/finance/invoices/:id" element={financeRoute(<InvoiceDetailPage />)} />
      <Route path="/finance/report" element={financeRoute(<FinanceReportPage />)} />

      <Route path="/cbt/questions" element={cbtRoute(<QuestionsPage />)} />
      <Route path="/cbt/packages" element={cbtRoute(<ExamPackagesPage />)} />
      <Route path="/cbt/packages/:id/items" element={cbtRoute(<PackageItemsPage />)} />
      <Route path="/cbt/schedules" element={cbtRoute(<ExamSchedulesPage />)} />
      <Route path="/cbt/schedules/:id" element={cbtRoute(<ScheduleDetailPage />)} />
    </Routes>
  );
}
