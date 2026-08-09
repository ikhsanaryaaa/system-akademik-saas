package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Jenis komponen penilaian.
const (
	JenisFormatif             = "FORMATIF"
	JenisSumatifLingkupMateri = "SUMATIF_LINGKUP_MATERI"
	JenisSumatifAkhirSemester = "SUMATIF_AKHIR_SEMESTER"
)

// KomponenPenilaian adalah satu komponen nilai di dalam sebuah rencana penilaian,
// misalnya "Sumatif Bab 1" berbobot 25. Guru menentukan sendiri jumlah komponen
// tiap jenis beserta bobotnya, dengan total bobot berbobot wajib 100.
type KomponenPenilaian struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RencanaID uuid.UUID `gorm:"type:uuid;not null;index" json:"rencana_id"`
	Nama      string    `gorm:"size:150;not null" json:"nama"`
	Jenis     string    `gorm:"size:30;not null" json:"jenis"`
	Bobot     float64   `gorm:"not null;default:0" json:"bobot"`
	Urutan    int       `gorm:"not null;default:0" json:"urutan"`
	Deskripsi string    `gorm:"type:text" json:"deskripsi"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (KomponenPenilaian) TableName() string { return "komponen_penilaian" }

func (k *KomponenPenilaian) BeforeCreate(_ *gorm.DB) error {
	if k.ID == uuid.Nil {
		k.ID = uuid.New()
	}
	return nil
}

// JenisValid memastikan jenis komponen termasuk salah satu dari tiga jenis yang dikenal.
func JenisValid(jenis string) bool {
	switch jenis {
	case JenisFormatif, JenisSumatifLingkupMateri, JenisSumatifAkhirSemester:
		return true
	default:
		return false
	}
}
