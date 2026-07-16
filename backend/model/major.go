package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Major adalah jurusan atau program keahlian, contoh "Teknik Komputer dan Jaringan".
type Major struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"size:150;not null" json:"name"`
	Code      string    `gorm:"uniqueIndex;size:20;not null" json:"code"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (m *Major) BeforeCreate(_ *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
