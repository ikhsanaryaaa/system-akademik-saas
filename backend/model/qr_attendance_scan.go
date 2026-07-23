package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// QrAttendanceScan mencatat siapa yang sudah scan token.
// Unique (token_id, person_id) mencegah replay attack.
type QrAttendanceScan struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	TokenID   uuid.UUID `gorm:"type:uuid;not null;index:idx_token_person,unique" json:"token_id"`
	PersonID  uuid.UUID `gorm:"type:uuid;not null;index:idx_token_person,unique" json:"person_id"`
	ScannedAt time.Time `gorm:"not null" json:"scanned_at"`

	Token *QrAttendanceToken `gorm:"foreignKey:TokenID" json:"token,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (q *QrAttendanceScan) BeforeCreate(_ *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}
