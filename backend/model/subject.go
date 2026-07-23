package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Subject adalah mata pelajaran, contoh "Matematika", "Bahasa Indonesia".
type Subject struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"size:150;not null" json:"name"`
	Code      string    `gorm:"uniqueIndex;size:30;not null" json:"code"`
	Category  string    `gorm:"size:20;not null;default:wajib" json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *Subject) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
