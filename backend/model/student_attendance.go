package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// StudentAttendance mencatat kehadiran seorang siswa pada satu tanggal.
// ClassID disalin untuk memudahkan rekap per kelas.
type StudentAttendance struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID    uuid.UUID  `gorm:"type:uuid;not null;index:idx_student_date,unique" json:"student_id"`
	Date         time.Time  `gorm:"not null;index:idx_student_date,unique" json:"date"`
	ClassID      *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	Status       string     `gorm:"size:20;not null" json:"status"`
	CheckInTime  *time.Time `json:"check_in_time,omitempty"`
	CheckOutTime *time.Time `json:"check_out_time,omitempty"`
	Note         string     `gorm:"size:255" json:"note"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *StudentAttendance) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
