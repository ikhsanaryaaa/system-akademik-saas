package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Permission adalah hak akses granular per aksi modul,
// contoh key: "user.read", "user.create", "user.update", "user.delete".
type Permission struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Key         string    `gorm:"uniqueIndex;size:100;not null" json:"key"`
	Description string    `gorm:"size:255" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BeforeCreate mengisi UUID sebelum insert bila belum di-set.
func (p *Permission) BeforeCreate(_ *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
