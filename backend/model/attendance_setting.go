package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AttendanceSetting menyimpan jam masuk dan keluar acuan untuk menentukan
// status terlambat. Umumnya hanya ada satu baris aktif per instance sekolah.
// CheckInTime dan CheckOutTime memakai format "HH:MM" 24 jam.
type AttendanceSetting struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	CheckInTime  string    `gorm:"size:5;not null" json:"check_in_time"`
	CheckOutTime string    `gorm:"size:5;not null" json:"check_out_time"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (a *AttendanceSetting) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
