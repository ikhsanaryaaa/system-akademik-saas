package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Assessment adalah penilaian sumatif pada satu kelas dan mata pelajaran,
// contoh jenis: "ulangan harian", "tugas", "uts", "uas".
type Assessment struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string    `gorm:"size:150;not null" json:"title"`
	Type           string    `gorm:"size:30;not null" json:"type"`
	Weight         float64   `gorm:"default:0" json:"weight"`
	Semester       int       `gorm:"not null;default:1" json:"semester"`
	ClassID        uuid.UUID `gorm:"type:uuid;not null;index" json:"class_id"`
	SubjectID      uuid.UUID `gorm:"type:uuid;not null;index" json:"subject_id"`
	AcademicYearID uuid.UUID `gorm:"type:uuid;not null;index" json:"academic_year_id"`

	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Subject *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *Assessment) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
