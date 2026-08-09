package migration

import (
	"testing"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
)

func TestJenisDariTipeLama(t *testing.T) {
	cases := []struct {
		tipe string
		want string
	}{
		{"UAS", model.JenisSumatifAkhirSemester},
		{"pas ganjil", model.JenisSumatifAkhirSemester},
		{"Penilaian Akhir Semester", model.JenisSumatifAkhirSemester},
		{"Tugas", model.JenisFormatif},
		{"tugas harian", model.JenisFormatif},
		{"formatif", model.JenisFormatif},
		{"praktik", model.JenisFormatif},
		{"ulangan harian", model.JenisSumatifLingkupMateri},
		{"UTS", model.JenisSumatifLingkupMateri},
		{"", model.JenisSumatifLingkupMateri},
		{"  Tugas  ", model.JenisFormatif},
	}

	for _, c := range cases {
		if got := jenisDariTipeLama(c.tipe); got != c.want {
			t.Errorf("jenisDariTipeLama(%q) = %q, want %q", c.tipe, got, c.want)
		}
	}
}

func TestNilaiValid(t *testing.T) {
	nol := 0.0
	batasBawah := -0.1
	batasAtas := 100.0
	lewat := 100.1

	if !model.NilaiValid(nil) {
		t.Error("nilai kosong harus valid karena siswa boleh belum dinilai")
	}
	if !model.NilaiValid(&nol) {
		t.Error("nilai 0 harus valid dan berbeda maknanya dari kosong")
	}
	if !model.NilaiValid(&batasAtas) {
		t.Error("nilai 100 harus valid")
	}
	if model.NilaiValid(&batasBawah) {
		t.Error("nilai negatif harus ditolak")
	}
	if model.NilaiValid(&lewat) {
		t.Error("nilai di atas 100 harus ditolak")
	}
}

func TestPredikatDari(t *testing.T) {
	cases := []struct {
		nilai float64
		want  string
	}{
		{100, "A"},
		{90, "A"},
		{89.99, "B"},
		{80, "B"},
		{79.5, "C"},
		{70, "C"},
		{69.9, "D"},
		{0, "D"},
	}

	for _, c := range cases {
		if got := model.PredikatDari(c.nilai); got != c.want {
			t.Errorf("PredikatDari(%v) = %q, want %q", c.nilai, got, c.want)
		}
	}
}
