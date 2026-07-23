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
	&model.AuditLog{},
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
	&model.AttendanceSession{},
	&model.AttendanceRecord{},
	&model.QrAttendanceToken{},
	&model.QrAttendanceScan{},
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
	if err := db.AutoMigrate(models...); err != nil {
		return err
	}

	// person_id bersifat polymorphic: menunjuk student atau teacher sesuai session_type.
	// Satu kolom tidak dapat memiliki foreign key valid ke kedua tabel sekaligus.
	for _, constraint := range []string{"fk_attendance_records_student", "fk_attendance_records_teacher"} {
		if db.Migrator().HasConstraint(&model.AttendanceRecord{}, constraint) {
			if err := db.Migrator().DropConstraint(&model.AttendanceRecord{}, constraint); err != nil {
				return err
			}
		}
	}

	// Drop index lama session_type_date unique, lalu buat partial indexes.
	if err := migrateAttendanceSessionIndexes(db); err != nil {
		return err
	}

	return BackfillAttendance(db)
}

// migrateAttendanceSessionIndexes membuat uniqueness berdasarkan tipe dan scope.
func migrateAttendanceSessionIndexes(db *gorm.DB) error {
	for _, name := range []string{"idx_session_type_date", "idx_student_session_unique", "idx_teacher_session_unique", "idx_student_daily_unique", "idx_student_lesson_unique", "idx_teacher_daily_unique", "idx_teacher_lesson_unique"} {
		if err := db.Exec("DROP INDEX IF EXISTS " + name).Error; err != nil {
			return err
		}
	}
	indexes := []string{
		`CREATE UNIQUE INDEX idx_student_daily_unique ON attendance_sessions(class_id, date, LOWER(name)) WHERE session_type = 'student' AND scope = 'daily'`,
		`CREATE UNIQUE INDEX idx_student_lesson_unique ON attendance_sessions(lesson_schedule_id, date) WHERE session_type = 'student' AND scope = 'lesson'`,
		`CREATE UNIQUE INDEX idx_teacher_daily_unique ON attendance_sessions(date) WHERE session_type = 'teacher' AND scope = 'daily'`,
		`CREATE UNIQUE INDEX idx_teacher_lesson_unique ON attendance_sessions(lesson_schedule_id, date) WHERE session_type = 'teacher' AND scope = 'lesson'`,
	}
	for _, sql := range indexes {
		if err := db.Exec(sql).Error; err != nil {
			return err
		}
	}
	log.Println("migration: scope-aware attendance indexes created")
	return nil
}
