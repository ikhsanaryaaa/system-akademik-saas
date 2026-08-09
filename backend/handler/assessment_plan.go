package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type RencanaPenilaianHandler struct {
	db *gorm.DB
}

func NewRencanaPenilaianHandler(db *gorm.DB) *RencanaPenilaianHandler {
	return &RencanaPenilaianHandler{db: db}
}

type komponenRequest struct {
	ID        *uuid.UUID `json:"id"`
	Nama      string     `json:"nama" binding:"required,max=150"`
	Jenis     string     `json:"jenis" binding:"required"`
	Bobot     float64    `json:"bobot" binding:"min=0,max=100"`
	Urutan    int        `json:"urutan"`
	Deskripsi string     `json:"deskripsi"`
}

type rencanaRequest struct {
	TahunAjaranID   uuid.UUID         `json:"tahun_ajaran_id" binding:"required"`
	Semester        int               `json:"semester" binding:"required,min=1,max=2"`
	MataPelajaranID uuid.UUID         `json:"mata_pelajaran_id" binding:"required"`
	KelasID         uuid.UUID         `json:"kelas_id" binding:"required"`
	KKTP            float64           `json:"kktp" binding:"min=0,max=100"`
	Komponen        []komponenRequest `json:"komponen" binding:"required,dive"`
}

// punyaPermission memeriksa permission user yang login langsung dari context,
// dipakai untuk aksi yang tidak bisa dijaga di level route karena bergantung data.
func punyaPermission(c *gin.Context, key string) bool {
	raw, ok := c.Get(middleware.CtxPermissions)
	if !ok {
		return false
	}
	perms, _ := raw.([]string)
	for _, p := range perms {
		if p == key {
			return true
		}
	}
	return false
}

// userIDDariContext mengambil id user yang login, nil kalau tidak tersedia.
func userIDDariContext(c *gin.Context) *uuid.UUID {
	raw, ok := c.Get(middleware.CtxUserID)
	if !ok {
		return nil
	}
	id, ok := raw.(uuid.UUID)
	if !ok {
		return nil
	}
	return &id
}

// guruDariContext mengembalikan teacher milik user yang login.
// Nil berarti user bukan guru, misalnya Administrator atau Wakil Kurikulum.
func (h *RencanaPenilaianHandler) guruDariContext(c *gin.Context) *model.Teacher {
	userID := userIDDariContext(c)
	if userID == nil {
		return nil
	}
	var guru model.Teacher
	if err := h.db.First(&guru, "user_id = ?", *userID).Error; err != nil {
		return nil
	}
	return &guru
}

// bolehAkses memastikan user berhak atas konteks penilaian tersebut.
// Guru hanya boleh mengakses konteks di mana dia terdaftar sebagai pengampu pada
// class_subjects. Pemegang grading.unlock dikecualikan karena mengawasi seluruh kelas.
func (h *RencanaPenilaianHandler) bolehAkses(c *gin.Context, kelasID, mapelID uuid.UUID) bool {
	if punyaPermission(c, "grading.unlock") {
		return true
	}
	guru := h.guruDariContext(c)
	if guru == nil {
		return false
	}
	var jumlah int64
	h.db.Model(&model.ClassSubject{}).
		Where("class_id = ? AND subject_id = ? AND teacher_id = ?", kelasID, mapelID, guru.ID).
		Count(&jumlah)
	return jumlah > 0
}

// validasiKomponen memastikan jenis dikenal dan total bobot berbobot tepat 100.
func validasiKomponen(komponen []komponenRequest) (map[string]string, bool) {
	errs := make(map[string]string)
	total := 0.0
	for i, k := range komponen {
		if !model.JenisValid(k.Jenis) {
			errs["komponen"] = fmt.Sprintf("Jenis komponen tidak dikenal pada baris ke-%d", i+1)
		}
		if k.Bobot > 0 {
			total += k.Bobot
		}
	}
	if total != 100 {
		errs["bobot"] = fmt.Sprintf("Total bobot komponen berbobot harus 100, sekarang %g", total)
	}
	return errs, len(errs) == 0
}

// Konteks mengembalikan daftar kombinasi kelas dan mata pelajaran yang boleh diakses user.
func (h *RencanaPenilaianHandler) Konteks(c *gin.Context) {
	query := h.db.Model(&model.ClassSubject{}).
		Preload("Class").Preload("Subject")

	if !punyaPermission(c, "grading.unlock") {
		guru := h.guruDariContext(c)
		if guru == nil {
			response.OK(c, "Tidak ada konteks penilaian untuk user ini", []any{})
			return
		}
		query = query.Where("teacher_id = ?", guru.ID)
	}

	var mapping []model.ClassSubject
	if err := query.Find(&mapping).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil konteks penilaian", nil)
		return
	}

	type konteksRow struct {
		KelasID         uuid.UUID `json:"kelas_id"`
		Kelas           string    `json:"kelas"`
		MataPelajaranID uuid.UUID `json:"mata_pelajaran_id"`
		MataPelajaran   string    `json:"mata_pelajaran"`
	}
	rows := make([]konteksRow, 0, len(mapping))
	for _, m := range mapping {
		row := konteksRow{KelasID: m.ClassID, MataPelajaranID: m.SubjectID}
		if m.Class != nil {
			row.Kelas = m.Class.Name
		}
		if m.Subject != nil {
			row.MataPelajaran = m.Subject.Name
		}
		rows = append(rows, row)
	}
	response.OK(c, "Daftar konteks penilaian", rows)
}

// Detail mengambil rencana penilaian berdasarkan konteks pada query string.
func (h *RencanaPenilaianHandler) Detail(c *gin.Context) {
	tahunID, err1 := uuid.Parse(c.Query("tahun_ajaran_id"))
	mapelID, err2 := uuid.Parse(c.Query("mata_pelajaran_id"))
	kelasID, err3 := uuid.Parse(c.Query("kelas_id"))
	semester, _ := strconv.Atoi(c.Query("semester"))
	if err1 != nil || err2 != nil || err3 != nil || semester == 0 {
		response.Error(c, http.StatusBadRequest, "Konteks penilaian tidak lengkap", nil)
		return
	}

	if !h.bolehAkses(c, kelasID, mapelID) {
		response.Error(c, http.StatusForbidden, "Anda bukan pengampu konteks penilaian ini", nil)
		return
	}

	var rencana model.RencanaPenilaian
	err := h.db.
		Preload("Komponen", func(db *gorm.DB) *gorm.DB { return db.Order("urutan asc") }).
		Preload("Kelas").Preload("MataPelajaran").Preload("Guru").
		First(&rencana, "tahun_ajaran_id = ? AND semester = ? AND mata_pelajaran_id = ? AND kelas_id = ?",
			tahunID, semester, mapelID, kelasID).Error
	if err != nil {
		response.Error(c, http.StatusNotFound, "Rencana penilaian belum dibuat untuk konteks ini", nil)
		return
	}
	response.OK(c, "Detail rencana penilaian", rencana)
}

// Create membuat rencana penilaian baru beserta komponennya.
func (h *RencanaPenilaianHandler) Create(c *gin.Context) {
	var req rencanaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}
	if !h.bolehAkses(c, req.KelasID, req.MataPelajaranID) {
		response.Error(c, http.StatusForbidden, "Anda bukan pengampu konteks penilaian ini", nil)
		return
	}
	if errs, ok := validasiKomponen(req.Komponen); !ok {
		response.Error(c, http.StatusUnprocessableEntity, "Komponen penilaian tidak valid", errs)
		return
	}

	var guruID *uuid.UUID
	if guru := h.guruDariContext(c); guru != nil {
		guruID = &guru.ID
	}

	rencana := model.RencanaPenilaian{
		TahunAjaranID:   req.TahunAjaranID,
		Semester:        req.Semester,
		MataPelajaranID: req.MataPelajaranID,
		KelasID:         req.KelasID,
		GuruID:          guruID,
		Status:          model.RencanaStatusAktif,
		KKTP:            req.KKTP,
	}
	if rencana.KKTP == 0 {
		rencana.KKTP = 70
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&rencana).Error; err != nil {
			return err
		}
		for i, k := range req.Komponen {
			komponen := model.KomponenPenilaian{
				RencanaID: rencana.ID,
				Nama:      k.Nama,
				Jenis:     k.Jenis,
				Bobot:     k.Bobot,
				Urutan:    i,
				Deskripsi: k.Deskripsi,
			}
			if err := tx.Create(&komponen).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusConflict, "Rencana penilaian untuk konteks ini sudah ada", nil)
		return
	}

	h.db.Preload("Komponen", func(db *gorm.DB) *gorm.DB { return db.Order("urutan asc") }).
		First(&rencana, "id = ?", rencana.ID)
	response.Created(c, "Rencana penilaian berhasil dibuat", rencana)
}

// Update mengubah komponen dan bobot pada rencana yang sudah ada.
// Komponen yang hilang dari request dihapus, dan penghapusan komponen yang sudah
// punya nilai wajib disertai query param konfirmasi=true.
func (h *RencanaPenilaianHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var rencana model.RencanaPenilaian
	if err := h.db.First(&rencana, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Rencana penilaian tidak ditemukan", nil)
		return
	}
	if rencana.Terkunci() {
		response.Error(c, http.StatusConflict, "Rencana sudah dikunci, buka kunci dulu sebelum mengubah", nil)
		return
	}
	if !h.bolehAkses(c, rencana.KelasID, rencana.MataPelajaranID) {
		response.Error(c, http.StatusForbidden, "Anda bukan pengampu konteks penilaian ini", nil)
		return
	}

	var req rencanaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}
	if errs, ok := validasiKomponen(req.Komponen); !ok {
		response.Error(c, http.StatusUnprocessableEntity, "Komponen penilaian tidak valid", errs)
		return
	}

	var lama []model.KomponenPenilaian
	h.db.Where("rencana_id = ?", id).Find(&lama)
	dipertahankan := make(map[uuid.UUID]bool)
	for _, k := range req.Komponen {
		if k.ID != nil {
			dipertahankan[*k.ID] = true
		}
	}

	// Komponen yang akan dihapus dan sudah punya nilai butuh konfirmasi eksplisit.
	konfirmasi := c.Query("konfirmasi") == "true"
	for _, k := range lama {
		if dipertahankan[k.ID] {
			continue
		}
		var jumlahNilai int64
		h.db.Model(&model.NilaiSiswa{}).Where("komponen_id = ?", k.ID).Count(&jumlahNilai)
		if jumlahNilai > 0 && !konfirmasi {
			response.Error(c, http.StatusConflict,
				"Komponen "+k.Nama+" sudah punya nilai. Ulangi dengan konfirmasi=true kalau nilai ikut dihapus", nil)
			return
		}
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		for _, k := range lama {
			if dipertahankan[k.ID] {
				continue
			}
			if err := tx.Where("komponen_id = ?", k.ID).Delete(&model.NilaiSiswa{}).Error; err != nil {
				return err
			}
			if err := tx.Delete(&model.KomponenPenilaian{}, "id = ?", k.ID).Error; err != nil {
				return err
			}
		}
		for i, k := range req.Komponen {
			if k.ID != nil {
				updates := map[string]any{
					"nama": k.Nama, "jenis": k.Jenis, "bobot": k.Bobot,
					"urutan": i, "deskripsi": k.Deskripsi,
				}
				if err := tx.Model(&model.KomponenPenilaian{}).Where("id = ?", *k.ID).Updates(updates).Error; err != nil {
					return err
				}
				continue
			}
			baru := model.KomponenPenilaian{
				RencanaID: id, Nama: k.Nama, Jenis: k.Jenis,
				Bobot: k.Bobot, Urutan: i, Deskripsi: k.Deskripsi,
			}
			if err := tx.Create(&baru).Error; err != nil {
				return err
			}
		}
		if req.KKTP > 0 {
			if err := tx.Model(&model.RencanaPenilaian{}).Where("id = ?", id).Update("kktp", req.KKTP).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan rencana penilaian", nil)
		return
	}

	h.db.Preload("Komponen", func(db *gorm.DB) *gorm.DB { return db.Order("urutan asc") }).
		First(&rencana, "id = ?", id)
	response.OK(c, "Rencana penilaian berhasil disimpan", rencana)
}

// Kunci mengunci rencana sehingga seluruh nilai jadi read-only.
func (h *RencanaPenilaianHandler) Kunci(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var rencana model.RencanaPenilaian
	if err := h.db.First(&rencana, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Rencana penilaian tidak ditemukan", nil)
		return
	}
	if !h.bolehAkses(c, rencana.KelasID, rencana.MataPelajaranID) {
		response.Error(c, http.StatusForbidden, "Anda bukan pengampu konteks penilaian ini", nil)
		return
	}
	if rencana.Terkunci() {
		response.Error(c, http.StatusConflict, "Rencana sudah dalam keadaan terkunci", nil)
		return
	}

	updates := map[string]any{
		"status":       model.RencanaStatusTerkunci,
		"dikunci_pada": time.Now(),
		"dikunci_oleh": userIDDariContext(c),
	}
	if err := h.db.Model(&model.RencanaPenilaian{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengunci nilai", nil)
		return
	}
	response.OK(c, "Nilai berhasil dikunci", nil)
}

// BukaKunci membuka kunci rencana. Route ini dijaga permission grading.unlock,
// dan aksinya tercatat di audit log lewat middleware audit yang sudah terpasang.
func (h *RencanaPenilaianHandler) BukaKunci(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var rencana model.RencanaPenilaian
	if err := h.db.First(&rencana, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Rencana penilaian tidak ditemukan", nil)
		return
	}
	if !rencana.Terkunci() {
		response.Error(c, http.StatusConflict, "Rencana tidak dalam keadaan terkunci", nil)
		return
	}

	updates := map[string]any{
		"status":       model.RencanaStatusAktif,
		"dikunci_pada": nil,
		"dikunci_oleh": nil,
	}
	if err := h.db.Model(&model.RencanaPenilaian{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal membuka kunci nilai", nil)
		return
	}
	response.OK(c, "Kunci nilai berhasil dibuka", nil)
}
