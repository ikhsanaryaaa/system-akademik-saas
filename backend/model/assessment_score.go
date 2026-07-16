package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AssessmentScore adalah nilai seorang siswa pada satu assessment.
// Unik per assessment per siswa.
type AssessmentScore struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	AssessmentID uuid.UUID `gorm:"type:uuid;not null;index:idx_assessment_student,unique" json:"assessment_id"`
	StudentID    uuid.UUID `gorm:"type:uuid;not null;index:idx_assessment_student,unique" json:"student_id"`
	Score        float64   `gorm:"not null;default:0" json:"score"`
	Note         string    `gorm:"size:255" json:"note"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *AssessmentScore) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
