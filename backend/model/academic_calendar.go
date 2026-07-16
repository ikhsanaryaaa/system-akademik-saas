package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AcademicCalendar adalah agenda kalender akademik.
// EventType contoh: "libur", "ujian", "kegiatan".
type AcademicCalendar struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	Description    string     `gorm:"type:text" json:"description"`
	EventType      string     `gorm:"size:30;not null" json:"event_type"`
	StartDate      time.Time  `gorm:"not null" json:"start_date"`
	EndDate        time.Time  `gorm:"not null" json:"end_date"`
	AcademicYearID uuid.UUID  `gorm:"type:uuid;not null;index" json:"academic_year_id"`

	AcademicYear *AcademicYear `gorm:"foreignKey:AcademicYearID" json:"academic_year,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *AcademicCalendar) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
