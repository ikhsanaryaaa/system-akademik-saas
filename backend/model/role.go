package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role adalah peran pengguna (15 role sesuai PRD).
// Setiap role memiliki sekumpulan permission.
type Role struct {
	ID          uuid.UUID    `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string       `gorm:"uniqueIndex;size:100;not null" json:"name"`
	Slug        string       `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Description string       `gorm:"size:255" json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions" json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

func (r *Role) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
