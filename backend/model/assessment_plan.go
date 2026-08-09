package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Status rencana penilaian.
const (
	RencanaStatusDraft    = "DRAFT"
	RencanaStatusAktif    = "AKTIF"
	RencanaStatusTerkunci = "TERKUNCI"
)

// RencanaPenilaian adalah header konteks penilaian milik satu guru pengampu
// pada satu tahun ajaran, semester, mata pelajaran, dan kelas.
// Komponen penilaian beserta bobotnya disimpan terpisah di KomponenPenilaian.
type RencanaPenilaian struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TahunAjaranID   uuid.UUID  `gorm:"type:uuid;not null;index:idx_rencana_konteks,unique" json:"tahun_ajaran_id"`
	Semester        int        `gorm:"not null;index:idx_rencana_konteks,unique" json:"semester"`
	MataPelajaranID uuid.UUID  `gorm:"type:uuid;not null;index:idx_rencana_konteks,unique" json:"mata_pelajaran_id"`
	KelasID         uuid.UUID  `gorm:"type:uuid;not null;index:idx_rencana_konteks,unique" json:"kelas_id"`
	GuruID          *uuid.UUID `gorm:"type:uuid;index" json:"guru_id,omitempty"`
	Status          string     `gorm:"size:20;not null;default:DRAFT;index" json:"status"`
	KKTP            float64    `gorm:"default:70" json:"kktp"`
	DikunciPada     *time.Time `json:"dikunci_pada,omitempty"`
	DikunciOleh     *uuid.UUID `gorm:"type:uuid" json:"dikunci_oleh,omitempty"`

	TahunAjaran   *AcademicYear       `gorm:"foreignKey:TahunAjaranID" json:"tahun_ajaran,omitempty"`
	MataPelajaran *Subject            `gorm:"foreignKey:MataPelajaranID" json:"mata_pelajaran,omitempty"`
	Kelas         *Class              `gorm:"foreignKey:KelasID" json:"kelas,omitempty"`
	Guru          *Teacher            `gorm:"foreignKey:GuruID" json:"guru,omitempty"`
	Komponen      []KomponenPenilaian `gorm:"foreignKey:RencanaID" json:"komponen,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (RencanaPenilaian) TableName() string { return "rencana_penilaian" }

func (r *RencanaPenilaian) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// Terkunci menandakan rencana sudah dikunci sehingga nilai bersifat read-only.
func (r *RencanaPenilaian) Terkunci() bool { return r.Status == RencanaStatusTerkunci }
