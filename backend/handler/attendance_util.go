package handler

import (
	"time"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// parseDate membaca tanggal "YYYY-MM-DD" dan mengembalikan awal hari (UTC).
func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

// dayStart menormalkan waktu ke awal hari (00:00 UTC) agar keunikan per tanggal terjaga.
func dayStart(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

// isLate menentukan apakah waktu tap masuk melewati jam masuk pada pengaturan.
// Bila pengaturan belum ada, kembalikan false (tidak menandai terlambat).
func isLate(db *gorm.DB, checkIn time.Time) bool {
	var setting model.AttendanceSetting
	if err := db.First(&setting).Error; err != nil {
		return false
	}
	limit, err := time.Parse("15:04", setting.CheckInTime)
	if err != nil {
		return false
	}
	// Bandingkan hanya jam dan menit.
	checkMinutes := checkIn.Hour()*60 + checkIn.Minute()
	limitMinutes := limit.Hour()*60 + limit.Minute()
	return checkMinutes > limitMinutes
}
