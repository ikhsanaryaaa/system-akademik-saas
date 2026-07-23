package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// QrAttendanceToken menyimpan token QR yang di-generate untuk satu sesi.
// Token harus unik, punya expiry, dan dibuat dengan crypto/rand.
type QrAttendanceToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID uuid.UUID `gorm:"type:uuid;not null;index" json:"session_id"`
	Token     string    `gorm:"size:64;not null;unique" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedBy uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`

	Session *AttendanceSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	Scans   []QrAttendanceScan `gorm:"foreignKey:TokenID" json:"scans,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (q *QrAttendanceToken) BeforeCreate(_ *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}
