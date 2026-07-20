package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Teacher adalah data pendidik (guru dan tenaga pengajar).
// Bisa ditugaskan sebagai wali kelas, pengawas CBT, dan lainnya.
type Teacher struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string     `gorm:"size:150;not null" json:"name"`
	NIP       string     `gorm:"uniqueIndex;size:30" json:"nip"`
	Email     string     `gorm:"size:150" json:"email"`
	Phone     string     `gorm:"size:30" json:"phone"`
	Gender    string     `gorm:"size:10" json:"gender"`
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	PhotoURL  string     `gorm:"size:255" json:"photo_url"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (t *Teacher) BeforeCreate(_ *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
