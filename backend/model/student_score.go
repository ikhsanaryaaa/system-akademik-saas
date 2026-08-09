package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NilaiSiswa adalah nilai seorang siswa pada satu komponen penilaian.
// Nilai bertipe pointer supaya kosong bisa dibedakan dari nol: siswa yang
// belum dinilai bernilai nil, siswa yang memang mendapat nol bernilai 0.
type NilaiSiswa struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	KomponenID uuid.UUID `gorm:"type:uuid;not null;index:idx_nilai_komponen_siswa,unique" json:"komponen_id"`
	SiswaID    uuid.UUID `gorm:"type:uuid;not null;index:idx_nilai_komponen_siswa,unique" json:"siswa_id"`
	Nilai      *float64  `json:"nilai"`
	Catatan    string    `gorm:"size:255" json:"catatan"`

	Siswa *Student `gorm:"foreignKey:SiswaID" json:"siswa,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (NilaiSiswa) TableName() string { return "nilai_siswa" }

func (n *NilaiSiswa) BeforeCreate(_ *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// NilaiValid memastikan nilai berada pada rentang 0 sampai 100.
// Nilai kosong dianggap valid karena siswa boleh belum dinilai.
func NilaiValid(nilai *float64) bool {
	if nilai == nil {
		return true
	}
	return *nilai >= 0 && *nilai <= 100
}
