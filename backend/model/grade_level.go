package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GradeLevel adalah tingkatan kelas, contoh "X", "XI", "XII".
type GradeLevel struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"size:50;not null" json:"name"`
	Code      string    `gorm:"uniqueIndex;size:20;not null" json:"code"`
	Order     int       `gorm:"default:0" json:"order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (g *GradeLevel) BeforeCreate(_ *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}
