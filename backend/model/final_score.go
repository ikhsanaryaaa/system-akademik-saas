package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NilaiAkhir adalah hasil kalkulasi nilai seorang siswa pada satu rencana penilaian.
// Nilainya dihitung server sebagai penjumlahan berbobot komponen berbobot lebih dari nol,
// lalu ditulis ulang setiap ada perubahan nilai. Disimpan sebagai tabel supaya halaman
// leger tidak perlu mengagregasi seluruh komponen tiap kali dibuka.
type NilaiAkhir struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RencanaID    uuid.UUID `gorm:"type:uuid;not null;index:idx_nilai_akhir_rencana_siswa,unique" json:"rencana_id"`
	SiswaID      uuid.UUID `gorm:"type:uuid;not null;index:idx_nilai_akhir_rencana_siswa,unique" json:"siswa_id"`
	Nilai        float64   `gorm:"not null;default:0" json:"nilai"`
	Predikat     string    `gorm:"size:5" json:"predikat"`
	Deskripsi    string    `gorm:"type:text" json:"deskripsi"`
	DihitungPada time.Time `json:"dihitung_pada"`

	Siswa *Student `gorm:"foreignKey:SiswaID" json:"siswa,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (NilaiAkhir) TableName() string { return "nilai_akhir" }

func (n *NilaiAkhir) BeforeCreate(_ *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// PredikatDari memetakan nilai angka ke predikat huruf.
// Batas mengikuti praktik umum dan bisa disesuaikan lewat konfigurasi pada tahap berikutnya.
func PredikatDari(nilai float64) string {
	switch {
	case nilai >= 90:
		return "A"
	case nilai >= 80:
		return "B"
	case nilai >= 70:
		return "C"
	default:
		return "D"
	}
}
