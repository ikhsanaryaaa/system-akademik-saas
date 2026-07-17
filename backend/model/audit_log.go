package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditLog mencatat jejak aktivitas penting: login, logout, dan aksi tulis
// (create, update, delete) di seluruh modul. Dipakai untuk keperluan audit
// keamanan dan pelacakan perubahan data.
type AuditLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID     *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	Username   string     `gorm:"size:100;index" json:"username"`
	Action     string     `gorm:"size:20;index;not null" json:"action"`
	Resource   string     `gorm:"size:120;index" json:"resource"`
	Method     string     `gorm:"size:10" json:"method"`
	Path       string     `gorm:"size:255" json:"path"`
	StatusCode int        `gorm:"index" json:"status_code"`
	IPAddress  string     `gorm:"size:64" json:"ip_address"`
	UserAgent  string     `gorm:"size:255" json:"user_agent"`
	CreatedAt  time.Time  `gorm:"index" json:"created_at"`
}

func (a *AuditLog) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
