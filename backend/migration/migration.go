package migration

import (
	"log"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// models adalah daftar model GORM yang ikut auto-migrate.
// Model bisnis lain ditambahkan seiring modul dikerjakan di tahap berikutnya.
var models = []interface{}{
	&model.Permission{},
	&model.Role{},
	&model.User{},
	&model.AcademicYear{},
	&model.GradeLevel{},
	&model.Major{},
	&model.Teacher{},
	&model.Staff{},
	&model.Class{},
	&model.Student{},
	&model.Subject{},
	&model.ClassSubject{},
	&model.LessonSchedule{},
	&model.AcademicCalendar{},
	&model.AttendanceSetting{},
	&model.RfidCard{},
	&model.TeacherAttendance{},
	&model.StudentAttendance{},
	&model.Assessment{},
	&model.AssessmentScore{},
	&model.ReportCardScore{},
	&model.Admission{},
	&model.StudentCoaching{},
	&model.TalentDevelopment{},
	&model.StudentActivity{},
	&model.ViolationType{},
	&model.CounselingAgenda{},
	&model.ViolationRecord{},
	&model.CounselingSession{},
	&model.HomeVisit{},
	&model.Achievement{},
	&model.Alumni{},
	&model.DutySchedule{},
	&model.DutyLog{},
	&model.GuestBook{},
	&model.DailyViolation{},
	&model.Lateness{},
	&model.LeavePermit{},
	&model.InternshipPlace{},
	&model.Internship{},
	&model.JobVacancy{},
	&model.Material{},
	&model.Assignment{},
	&model.AssignmentSubmission{},
	&model.Quiz{},
	&model.QuizQuestion{},
	&model.ForumThread{},
	&model.ForumPost{},
	&model.PaymentType{},
	&model.Invoice{},
	&model.InvoicePayment{},
	&model.Question{},
	&model.QuestionOption{},
	&model.ExamPackage{},
	&model.ExamPackageItem{},
	&model.ExamSchedule{},
	&model.ExamRoom{},
	&model.ExamParticipant{},
	&model.ExamViolation{},
}

// Run menjalankan auto-migrate untuk seluruh model terdaftar.
func Run(db *gorm.DB) error {
	if len(models) == 0 {
		log.Println("migration: belum ada model terdaftar, dilewati")
		return nil
	}
	return db.AutoMigrate(models...)
}
