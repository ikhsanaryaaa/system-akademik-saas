package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type NilaiSiswaHandler struct {
	db      *gorm.DB
	rencana *RencanaPenilaianHandler
}

func NewNilaiSiswaHandler(db *gorm.DB) *NilaiSiswaHandler {
	return &NilaiSiswaHandler{db: db, rencana: NewRencanaPenilaianHandler(db)}
}

type nilaiEntry struct {
	KomponenID uuid.UUID `json:"komponen_id" binding:"required"`
	SiswaID    uuid.UUID `json:"siswa_id" binding:"required"`
	Nilai      *float64  `json:"nilai"`
	Catatan    string    `json:"catatan"`
}

type batchNilaiRequest struct {
	RencanaID uuid.UUID    `json:"rencana_id" binding:"required"`
	Entries   []nilaiEntry `json:"entries" binding:"required,dive"`
}

type gridSiswa struct {
	SiswaID    uuid.UUID           `json:"siswa_id"`
	Nama       string              `json:"nama"`
	NIS        string              `json:"nis"`
	Nilai      map[string]*float64 `json:"nilai"`
	NilaiAkhir float64             `json:"nilai_akhir"`
	Predikat   string              `json:"predikat"`
}

// muatRencana mengambil rencana beserta komponennya dan memeriksa hak akses user.
func (h *NilaiSiswaHandler) muatRencana(c *gin.Context) (*model.RencanaPenilaian, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return nil, false
	}
	var rencana model.RencanaPenilaian
	err = h.db.Preload("Komponen", func(db *gorm.DB) *gorm.DB { return db.Order("urutan asc") }).
		First(&rencana, "id = ?", id).Error
	if err != nil {
		response.Error(c, http.StatusNotFound, "Rencana penilaian tidak ditemukan", nil)
		return nil, false
	}
	if !h.rencana.bolehAkses(c, rencana.KelasID, rencana.MataPelajaranID) {
		response.Error(c, http.StatusForbidden, "Anda bukan pengampu konteks penilaian ini", nil)
		return nil, false
	}
	return &rencana, true
}

// Grid mengembalikan seluruh siswa pada kelas rencana beserta nilai tiap komponen
// dalam satu request, supaya frontend tidak perlu memanggil per sel.
func (h *NilaiSiswaHandler) Grid(c *gin.Context) {
	rencana, ok := h.muatRencana(c)
	if !ok {
		return
	}

	var siswa []model.Student
	if err := h.db.Where("class_id = ?", rencana.KelasID).Order("name asc").Find(&siswa).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar siswa", nil)
		return
	}

	komponenIDs := make([]uuid.UUID, 0, len(rencana.Komponen))
	for _, k := range rencana.Komponen {
		komponenIDs = append(komponenIDs, k.ID)
	}

	var nilai []model.NilaiSiswa
	if len(komponenIDs) > 0 {
		h.db.Where("komponen_id IN ?", komponenIDs).Find(&nilai)
	}
	nilaiPer := make(map[[2]uuid.UUID]*float64, len(nilai))
	for _, n := range nilai {
		nilaiPer[[2]uuid.UUID{n.KomponenID, n.SiswaID}] = n.Nilai
	}

	var akhir []model.NilaiAkhir
	h.db.Where("rencana_id = ?", rencana.ID).Find(&akhir)
	akhirPer := make(map[uuid.UUID]model.NilaiAkhir, len(akhir))
	for _, a := range akhir {
		akhirPer[a.SiswaID] = a
	}

	rows := make([]gridSiswa, 0, len(siswa))
	for _, s := range siswa {
		row := gridSiswa{
			SiswaID: s.ID,
			Nama:    s.Name,
			NIS:     s.NIS,
			Nilai:   make(map[string]*float64, len(komponenIDs)),
		}
		for _, k := range rencana.Komponen {
			row.Nilai[k.ID.String()] = nilaiPer[[2]uuid.UUID{k.ID, s.ID}]
		}
		if a, ada := akhirPer[s.ID]; ada {
			row.NilaiAkhir = a.Nilai
			row.Predikat = a.Predikat
		}
		rows = append(rows, row)
	}

	response.OK(c, "Grid nilai", gin.H{
		"rencana":  rencana,
		"terkunci": rencana.Terkunci(),
		"siswa":    rows,
	})
}

// SimpanBatch menyimpan sekumpulan perubahan nilai dalam satu transaction,
// mencatat audit tiap perubahan, lalu mengembalikan nilai akhir yang sudah dihitung ulang.
func (h *NilaiSiswaHandler) SimpanBatch(c *gin.Context) {
	var req batchNilaiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	var rencana model.RencanaPenilaian
	if err := h.db.Preload("Komponen").First(&rencana, "id = ?", req.RencanaID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Rencana penilaian tidak ditemukan", nil)
		return
	}
	if rencana.Terkunci() {
		response.Error(c, http.StatusConflict, "Nilai sudah dikunci dan tidak bisa diubah", nil)
		return
	}
	if !h.rencana.bolehAkses(c, rencana.KelasID, rencana.MataPelajaranID) {
		response.Error(c, http.StatusForbidden, "Anda bukan pengampu konteks penilaian ini", nil)
		return
	}

	// Komponen yang sah untuk rencana ini, supaya request tidak bisa menyusupkan
	// komponen milik rencana lain.
	sah := make(map[uuid.UUID]bool, len(rencana.Komponen))
	for _, k := range rencana.Komponen {
		sah[k.ID] = true
	}
	for i, e := range req.Entries {
		if !sah[e.KomponenID] {
			response.Error(c, http.StatusUnprocessableEntity, "Komponen tidak termasuk dalam rencana ini", gin.H{"baris": i + 1})
			return
		}
		if !model.NilaiValid(e.Nilai) {
			response.Error(c, http.StatusUnprocessableEntity, "Nilai harus berada pada rentang 0 sampai 100", gin.H{"baris": i + 1})
			return
		}
	}

	pelaku := userIDDariContext(c)
	siswaTersentuh := make(map[uuid.UUID]bool)

	err := h.db.Transaction(func(tx *gorm.DB) error {
		for _, e := range req.Entries {
			var lama model.NilaiSiswa
			adaLama := tx.First(&lama, "komponen_id = ? AND siswa_id = ?", e.KomponenID, e.SiswaID).Error == nil

			if adaLama {
				updates := map[string]any{"nilai": e.Nilai, "catatan": e.Catatan}
				if err := tx.Model(&model.NilaiSiswa{}).Where("id = ?", lama.ID).Updates(updates).Error; err != nil {
					return err
				}
			} else {
				baris := model.NilaiSiswa{
					KomponenID: e.KomponenID,
					SiswaID:    e.SiswaID,
					Nilai:      e.Nilai,
					Catatan:    e.Catatan,
				}
				if err := tx.Create(&baris).Error; err != nil {
					return err
				}
			}

			audit := model.AuditNilai{
				KomponenID: e.KomponenID,
				SiswaID:    e.SiswaID,
				NilaiBaru:  e.Nilai,
			}
			if adaLama {
				audit.NilaiLama = lama.Nilai
			}
			if pelaku != nil {
				audit.UserID = *pelaku
			}
			if err := tx.Create(&audit).Error; err != nil {
				return err
			}

			siswaTersentuh[e.SiswaID] = true
		}

		for siswaID := range siswaTersentuh {
			if err := hitungNilaiAkhir(tx, &rencana, siswaID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan nilai", nil)
		return
	}

	ids := make([]uuid.UUID, 0, len(siswaTersentuh))
	for id := range siswaTersentuh {
		ids = append(ids, id)
	}
	var hasil []model.NilaiAkhir
	h.db.Where("rencana_id = ? AND siswa_id IN ?", rencana.ID, ids).Find(&hasil)

	response.OK(c, "Nilai berhasil disimpan", gin.H{
		"tersimpan":   len(req.Entries),
		"nilai_akhir": hasil,
	})
}

// Rekap mengembalikan nilai akhir seluruh siswa beserta statistik ringkas.
func (h *NilaiSiswaHandler) Rekap(c *gin.Context) {
	rencana, ok := h.muatRencana(c)
	if !ok {
		return
	}

	var siswa []model.Student
	h.db.Where("class_id = ?", rencana.KelasID).Order("name asc").Find(&siswa)

	var akhir []model.NilaiAkhir
	h.db.Where("rencana_id = ?", rencana.ID).Find(&akhir)
	akhirPer := make(map[uuid.UUID]model.NilaiAkhir, len(akhir))
	for _, a := range akhir {
		akhirPer[a.SiswaID] = a
	}

	type rekapRow struct {
		SiswaID   uuid.UUID `json:"siswa_id"`
		Nama      string    `json:"nama"`
		NIS       string    `json:"nis"`
		Nilai     float64   `json:"nilai"`
		Predikat  string    `json:"predikat"`
		Deskripsi string    `json:"deskripsi"`
		Tuntas    bool      `json:"tuntas"`
	}

	rows := make([]rekapRow, 0, len(siswa))
	total, tuntas := 0.0, 0
	tertinggi, terendah := 0.0, 100.0
	for _, s := range siswa {
		row := rekapRow{SiswaID: s.ID, Nama: s.Name, NIS: s.NIS}
		if a, ada := akhirPer[s.ID]; ada {
			row.Nilai = a.Nilai
			row.Predikat = a.Predikat
			row.Deskripsi = a.Deskripsi
		}
		row.Tuntas = row.Nilai >= rencana.KKTP
		if row.Tuntas {
			tuntas++
		}
		total += row.Nilai
		if row.Nilai > tertinggi {
			tertinggi = row.Nilai
		}
		if row.Nilai < terendah {
			terendah = row.Nilai
		}
		rows = append(rows, row)
	}

	rata := 0.0
	if len(rows) > 0 {
		rata = total / float64(len(rows))
	} else {
		terendah = 0
	}

	response.OK(c, "Rekap nilai akhir", gin.H{
		"rencana":  rencana,
		"terkunci": rencana.Terkunci(),
		"siswa":    rows,
		"statistik": gin.H{
			"jumlah_siswa": len(rows),
			"rata_rata":    rata,
			"tertinggi":    tertinggi,
			"terendah":     terendah,
			"tuntas":       tuntas,
			"belum_tuntas": len(rows) - tuntas,
		},
	})
}

// hitungNilaiAkhir menghitung ulang nilai akhir seorang siswa pada satu rencana,
// lalu menulis hasilnya ke tabel nilai_akhir.
//
// Nilai kosong tidak dihitung sebagai nol. Rata-rata berbobot dinormalisasi terhadap
// bobot komponen yang sudah terisi saja, supaya grid yang baru terisi sebagian tidak
// menampilkan nilai akhir yang menyesatkan rendah.
func hitungNilaiAkhir(tx *gorm.DB, rencana *model.RencanaPenilaian, siswaID uuid.UUID) error {
	komponenIDs := make([]uuid.UUID, 0, len(rencana.Komponen))
	bobotPer := make(map[uuid.UUID]float64, len(rencana.Komponen))
	for _, k := range rencana.Komponen {
		if k.Bobot <= 0 {
			continue
		}
		komponenIDs = append(komponenIDs, k.ID)
		bobotPer[k.ID] = k.Bobot
	}

	hasil := 0.0
	if len(komponenIDs) > 0 {
		var nilai []model.NilaiSiswa
		if err := tx.Where("komponen_id IN ? AND siswa_id = ?", komponenIDs, siswaID).Find(&nilai).Error; err != nil {
			return err
		}
		jumlah, totalBobot := 0.0, 0.0
		for _, n := range nilai {
			if n.Nilai == nil {
				continue
			}
			bobot := bobotPer[n.KomponenID]
			jumlah += *n.Nilai * bobot
			totalBobot += bobot
		}
		if totalBobot > 0 {
			hasil = jumlah / totalBobot
		}
	}

	akhir := model.NilaiAkhir{
		RencanaID:    rencana.ID,
		SiswaID:      siswaID,
		Nilai:        hasil,
		Predikat:     model.PredikatDari(hasil),
		DihitungPada: time.Now(),
	}

	var lama model.NilaiAkhir
	if err := tx.First(&lama, "rencana_id = ? AND siswa_id = ?", rencana.ID, siswaID).Error; err == nil {
		updates := map[string]any{
			"nilai":         akhir.Nilai,
			"predikat":      akhir.Predikat,
			"dihitung_pada": akhir.DihitungPada,
		}
		return tx.Model(&model.NilaiAkhir{}).Where("id = ?", lama.ID).Updates(updates).Error
	}
	return tx.Create(&akhir).Error
}
