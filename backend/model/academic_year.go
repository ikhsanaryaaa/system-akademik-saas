package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AcademicYear adalah tahun ajaran, contoh nama "2025/2026".
// Hanya satu tahun ajaran yang aktif pada satu waktu.
type AcademicYear struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string     `gorm:"uniqueIndex;size:20;not null" json:"name"`
	IsActive  bool       `gorm:"default:false" json:"is_active"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (a *AcademicYear) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
