package migration

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// BackfillAttendance memecah legacy student session campuran berdasarkan kelas dan tanggal.
// Teacher session tetap global per tanggal. Idempotent: cek marker sebelum menjalankan.
func BackfillAttendance(db *gorm.DB) error {
	// Cek apakah backfill sudah jalan dengan mencari session bertanda legacy (method unknown).
	var count int64
	db.Model(&model.AttendanceSession{}).Where("default_method = ?", model.AttendanceMethodUnknown).Count(&count)
	if count > 0 {
		log.Println("migration: backfill attendance sudah jalan, dilewati")
		return nil
	}

	log.Println("migration: memulai backfill attendance legacy data")

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.AttendanceSession{}).Where("scope IS NULL OR scope = ''").Update("scope", model.AttendanceScopeDaily).Error; err != nil {
			return err
		}
		// Backfill student attendance dengan pemisahan per kelas.
		var studentRecords []model.StudentAttendance
		if err := tx.Order("date asc").Find(&studentRecords).Error; err != nil {
			return err
		}

		// Kelompokkan per (date, class_id).
		type sessionKey struct {
			date    time.Time
			classID uuid.UUID
		}
		studentByKey := make(map[sessionKey][]model.StudentAttendance)
		for _, r := range studentRecords {
			dateKey := dayStart(r.Date)
			// Ambil class_id dari student saat ini sebagai fallback.
			var student model.Student
			if err := tx.First(&student, "id = ?", r.StudentID).Error; err != nil {
				log.Printf("migration: warning student %s not found, skip record", r.StudentID)
				continue
			}
			if student.ClassID == nil {
				log.Printf("migration: warning student %s has no class_id, skip record", r.StudentID)
				continue
			}
			key := sessionKey{date: dateKey, classID: *student.ClassID}
			studentByKey[key] = append(studentByKey[key], r)
		}

		for key, records := range studentByKey {
			// Nama deterministik untuk sesi lama.
			var className string
			var class model.Class
			if err := tx.First(&class, "id = ?", key.classID).Error; err == nil {
				className = class.Name
			} else {
				className = "Unknown"
			}
			sessionName := fmt.Sprintf("Legacy %s", className)

			session := model.AttendanceSession{
				SessionType:   model.SessionTypeStudent,
				Date:          key.date,
				ClassID:       &key.classID,
				Name:          sessionName,
				Status:        model.SessionStatusClosed,
				DefaultMethod: model.AttendanceMethodUnknown,
			}
			if err := tx.Create(&session).Error; err != nil {
				return err
			}

			for _, old := range records {
				record := model.AttendanceRecord{
					SessionID:    session.ID,
					PersonID:     old.StudentID,
					Status:       old.Status,
					Method:       model.AttendanceMethodUnknown,
					CheckInTime:  old.CheckInTime,
					CheckOutTime: old.CheckOutTime,
					Note:         old.Note,
				}
				if err := tx.Create(&record).Error; err != nil {
					return err
				}
			}
		}

		// Batalkan token QR sesi campuran lama: hapus semua token dan scan dari session lama.
		// Karena session belum terpecah, semua token existing dianggap invalid.
		if err := tx.Exec("DELETE FROM qr_attendance_scans").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM qr_attendance_tokens").Error; err != nil {
			return err
		}

		// Backfill teacher attendance tetap global per tanggal.
		var teacherRecords []model.TeacherAttendance
		if err := tx.Order("date asc").Find(&teacherRecords).Error; err != nil {
			return err
		}

		teacherByDate := make(map[time.Time][]model.TeacherAttendance)
		for _, r := range teacherRecords {
			dateKey := dayStart(r.Date)
			teacherByDate[dateKey] = append(teacherByDate[dateKey], r)
		}

		for date, records := range teacherByDate {
			session := model.AttendanceSession{
				SessionType:   model.SessionTypeTeacher,
				Date:          date,
				Status:        model.SessionStatusClosed,
				DefaultMethod: model.AttendanceMethodUnknown,
			}
			if err := tx.Create(&session).Error; err != nil {
				return err
			}

			for _, old := range records {
				record := model.AttendanceRecord{
					SessionID:    session.ID,
					PersonID:     old.TeacherID,
					Status:       old.Status,
					Method:       model.AttendanceMethodUnknown,
					CheckInTime:  old.CheckInTime,
					CheckOutTime: old.CheckOutTime,
					Note:         old.Note,
				}
				if err := tx.Create(&record).Error; err != nil {
					return err
				}
			}
		}

		log.Printf("migration: backfill selesai, %d student session keys, %d teacher dates\n",
			len(studentByKey), len(teacherByDate))
		return nil
	})
}

// dayStart menormalkan waktu ke awal hari (00:00 UTC).
func dayStart(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

// normalizeName menormalkan nama session (lowercase, trim) untuk perbandingan case-insensitive.
func normalizeName(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}
