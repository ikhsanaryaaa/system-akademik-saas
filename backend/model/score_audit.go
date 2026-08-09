package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditNilai mencatat tiap perubahan nilai: siapa, kapan, nilai lama, nilai baru.
// Terpisah dari AuditLog karena volumenya besar, satu baris per sel grid yang diubah,
// sehingga tidak membanjiri halaman Audit Log umum.
type AuditNilai struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	KomponenID uuid.UUID `gorm:"type:uuid;not null;index" json:"komponen_id"`
	SiswaID    uuid.UUID `gorm:"type:uuid;not null;index" json:"siswa_id"`
	NilaiLama  *float64  `json:"nilai_lama"`
	NilaiBaru  *float64  `json:"nilai_baru"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

func (AuditNilai) TableName() string { return "audit_nilai" }

func (a *AuditNilai) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
