package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Student adalah data siswa, terikat ke kelas, jurusan, dan tahun ajaran.
// Pada tahap ini siswa adalah data master, belum tentu akun login.
type Student struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name           string     `gorm:"size:150;not null" json:"name"`
	NIS            string     `gorm:"uniqueIndex;size:30" json:"nis"`
	NISN           string     `gorm:"uniqueIndex;size:30" json:"nisn"`
	Gender         string     `gorm:"size:10" json:"gender"`
	BirthPlace     string     `gorm:"size:100" json:"birth_place"`
	BirthDate      *time.Time `json:"birth_date,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`
	UserID         *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`

	Class        *Class        `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major        *Major        `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	AcademicYear *AcademicYear `gorm:"foreignKey:AcademicYearID" json:"academic_year,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *Student) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
