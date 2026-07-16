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
}

// Run menjalankan auto-migrate untuk seluruh model terdaftar.
func Run(db *gorm.DB) error {
	if len(models) == 0 {
		log.Println("migration: belum ada model terdaftar, dilewati")
		return nil
	}
	return db.AutoMigrate(models...)
}
