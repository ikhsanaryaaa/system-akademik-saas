package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Status kehadiran yang dipakai bersama absensi guru dan siswa.
const (
	AttendancePresent = "hadir"
	AttendanceLate    = "terlambat"
	AttendancePermit  = "izin"
	AttendanceSick    = "sakit"
	AttendanceAbsent  = "alpa"
)

// TeacherAttendance mencatat kehadiran seorang guru pada satu tanggal.
// Date disimpan sebagai awal hari (00:00) untuk menjaga keunikan per tanggal.
type TeacherAttendance struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TeacherID    uuid.UUID  `gorm:"type:uuid;not null;index:idx_teacher_date,unique" json:"teacher_id"`
	Date         time.Time  `gorm:"not null;index:idx_teacher_date,unique" json:"date"`
	Status       string     `gorm:"size:20;not null" json:"status"`
	CheckInTime  *time.Time `json:"check_in_time,omitempty"`
	CheckOutTime *time.Time `json:"check_out_time,omitempty"`
	Note         string     `gorm:"size:255" json:"note"`

	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (t *TeacherAttendance) BeforeCreate(_ *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
