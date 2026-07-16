package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LessonSchedule adalah jadwal pelajaran mingguan.
// DayOfWeek memakai angka 1 (Senin) sampai 7 (Minggu).
// StartTime dan EndTime memakai format "HH:MM" 24 jam.
type LessonSchedule struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ClassID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"class_id"`
	SubjectID uuid.UUID  `gorm:"type:uuid;not null;index" json:"subject_id"`
	TeacherID *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	DayOfWeek int        `gorm:"not null;index" json:"day_of_week"`
	StartTime string     `gorm:"size:5;not null" json:"start_time"`
	EndTime   string     `gorm:"size:5;not null" json:"end_time"`

	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Subject *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (l *LessonSchedule) BeforeCreate(_ *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
