package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReportCardScore adalah nilai raport final seorang siswa pada satu mata pelajaran
// dalam satu semester dan tahun ajaran. Unik per siswa per mata pelajaran per semester per tahun ajaran.
type ReportCardScore struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID      uuid.UUID `gorm:"type:uuid;not null;index:idx_report_unique,unique" json:"student_id"`
	SubjectID      uuid.UUID `gorm:"type:uuid;not null;index:idx_report_unique,unique" json:"subject_id"`
	Semester       int       `gorm:"not null;index:idx_report_unique,unique" json:"semester"`
	AcademicYearID uuid.UUID `gorm:"type:uuid;not null;index:idx_report_unique,unique" json:"academic_year_id"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	KnowledgeScore float64   `gorm:"default:0" json:"knowledge_score"`
	SkillScore     float64   `gorm:"default:0" json:"skill_score"`
	Description    string    `gorm:"type:text" json:"description"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Subject *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (r *ReportCardScore) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
