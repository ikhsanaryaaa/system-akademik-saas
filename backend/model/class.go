package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Class adalah kelas atau rombongan belajar, terikat ke tingkatan, jurusan,
// tahun ajaran, dan wali kelas (dari data pendidik).
type Class struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name            string     `gorm:"size:100;not null" json:"name"`
	GradeLevelID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"grade_level_id"`
	MajorID         *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	AcademicYearID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"academic_year_id"`
	HomeroomID      *uuid.UUID `gorm:"type:uuid;index" json:"homeroom_id,omitempty"`

	GradeLevel   *GradeLevel   `gorm:"foreignKey:GradeLevelID" json:"grade_level,omitempty"`
	Major        *Major        `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	AcademicYear *AcademicYear `gorm:"foreignKey:AcademicYearID" json:"academic_year,omitempty"`
	Homeroom     *Teacher      `gorm:"foreignKey:HomeroomID" json:"homeroom,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (c *Class) BeforeCreate(_ *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
