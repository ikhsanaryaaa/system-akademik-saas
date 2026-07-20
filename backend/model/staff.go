package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Staff adalah tenaga non-kependidikan (tata usaha, kebersihan, keamanan, dan lainnya).
type Staff struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"size:150;not null" json:"name"`
	NIP       string    `gorm:"uniqueIndex;size:30" json:"nip"`
	Position  string    `gorm:"size:100" json:"position"`
	Email     string    `gorm:"size:150" json:"email"`
	Phone     string    `gorm:"size:30" json:"phone"`
	PhotoURL  string    `gorm:"size:255" json:"photo_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *Staff) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
