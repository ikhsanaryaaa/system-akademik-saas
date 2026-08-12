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

// ---- Admission (PPDB) ----

type AdmissionHandler struct {
	db *gorm.DB
}

func NewAdmissionHandler(db *gorm.DB) *AdmissionHandler {
	return &AdmissionHandler{db: db}
}

type admissionRequest struct {
	Name           string     `json:"name" binding:"required"`
	OriginSchool   string     `json:"origin_school"`
	Gender         string     `json:"gender"`
	Phone          string     `json:"phone"`
	Email          string     `json:"email"`
	Address        string     `json:"address"`
	MajorID        *uuid.UUID `json:"major_id"`
	Note           string     `json:"note"`
	RegisteredAt   *time.Time `json:"registered_at"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
}

func (h *AdmissionHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Admission{}).Preload("Major")
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}
	var items []model.Admission
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pendaftar PPDB", nil)
		return
	}
	response.OK(c, "Daftar pendaftar PPDB", items)
}

func (h *AdmissionHandler) Create(c *gin.Context) {
	var req admissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	// Status awal selalu pending. Perubahannya lewat endpoint status tersendiri.
	item := model.Admission{
		Name:           req.Name,
		OriginSchool:   req.OriginSchool,
		Gender:         req.Gender,
		Phone:          req.Phone,
		Email:          req.Email,
		Address:        req.Address,
		MajorID:        req.MajorID,
		Status:         "pending",
		Note:           req.Note,
		RegisteredAt:   req.RegisteredAt,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pendaftar PPDB", nil)
		return
	}
	response.Created(c, "Pendaftar PPDB dibuat", item)
}

func (h *AdmissionHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req admissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Admission
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pendaftar PPDB tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.OriginSchool = req.OriginSchool
	item.Gender = req.Gender
	item.Phone = req.Phone
	item.Email = req.Email
	item.Address = req.Address
	item.MajorID = req.MajorID
	item.Note = req.Note
	item.RegisteredAt = req.RegisteredAt
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pendaftar PPDB", nil)
		return
	}
	response.OK(c, "Pendaftar PPDB diperbarui", item)
}

func (h *AdmissionHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Admission{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pendaftar PPDB", nil)
		return
	}
	response.OK(c, "Pendaftar PPDB dihapus", nil)
}

type admissionStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending accepted rejected"`
	Note   string `json:"note"`
}

// ChangeStatus mengubah status pendaftar sebagai aksi tersendiri, terpisah dari
// modal edit, supaya keputusan penerimaan tidak tercampur dengan koreksi data.
func (h *AdmissionHandler) ChangeStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req admissionStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Admission
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pendaftar PPDB tidak ditemukan", nil)
		return
	}
	if item.StudentID != nil && req.Status != "accepted" {
		response.Error(c, http.StatusConflict, "Pendaftar sudah dikonversi menjadi siswa, status tidak dapat diubah", nil)
		return
	}
	item.Status = req.Status
	if req.Note != "" {
		item.Note = req.Note
	}
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan status pendaftar", nil)
		return
	}
	response.OK(c, "Status pendaftar diperbarui", item)
}

// admissionConvertRequest berisi data yang tidak dimiliki pendaftar.
// NIS diisi manual karena formatnya baru ditentukan pada tahap Setting Sekolah.
// Kelas tidak diisi di sini, penempatannya dikerjakan lewat Kelas dan Rombel.
type admissionConvertRequest struct {
	NIS        string     `json:"nis" binding:"required"`
	NISN       string     `json:"nisn"`
	BirthPlace string     `json:"birth_place"`
	BirthDate  *time.Time `json:"birth_date"`
}

// Convert membuat siswa master data dari pendaftar berstatus accepted.
// StudentID pada pendaftar menjadi penanda supaya konversi tidak dapat diulang.
func (h *AdmissionHandler) Convert(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req admissionConvertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var item model.Admission
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pendaftar PPDB tidak ditemukan", nil)
		return
	}
	if item.Status != "accepted" {
		response.Error(c, http.StatusBadRequest, "Hanya pendaftar berstatus accepted yang dapat dikonversi", nil)
		return
	}
	if item.StudentID != nil {
		response.Error(c, http.StatusConflict, "Pendaftar sudah pernah dikonversi menjadi siswa", nil)
		return
	}

	yearID := item.AcademicYearID
	if yearID == nil {
		yearID = activeAcademicYearID(h.db)
	}
	student := model.Student{
		Name:           item.Name,
		NIS:            req.NIS,
		NISN:           req.NISN,
		Gender:         item.Gender,
		BirthPlace:     req.BirthPlace,
		BirthDate:      req.BirthDate,
		Address:        item.Address,
		MajorID:        item.MajorID,
		AcademicYearID: yearID,
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&student).Error; err != nil {
			return err
		}
		return tx.Model(&item).Update("student_id", student.ID).Error
	})
	if err != nil {
		response.Error(c, http.StatusConflict, "Gagal mengonversi pendaftar, pastikan NIS dan NISN belum dipakai siswa lain", nil)
		return
	}
	response.Created(c, "Pendaftar dikonversi menjadi siswa", student)
}

// ---- StudentCoaching (Pembinaan) ----

type StudentCoachingHandler struct {
	db *gorm.DB
}

func NewStudentCoachingHandler(db *gorm.DB) *StudentCoachingHandler {
	return &StudentCoachingHandler{db: db}
}

// ClassID dan MajorID tidak diterima dari client, nilainya diambil server dari
// siswa yang dipilih supaya tidak dapat bertentangan.
type studentCoachingRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	Topic     string     `json:"topic" binding:"required"`
	Detail    string     `json:"detail"`
	CoachName string     `json:"coach_name"`
	Date      *time.Time `json:"date"`
}

func (h *StudentCoachingHandler) List(c *gin.Context) {
	q := h.db.Model(&model.StudentCoaching{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.StudentCoaching
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pembinaan", nil)
		return
	}
	response.OK(c, "Daftar pembinaan", items)
}

func (h *StudentCoachingHandler) Create(c *gin.Context) {
	var req studentCoachingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	item := model.StudentCoaching{
		StudentID: req.StudentID,
		ClassID:   classID,
		MajorID:   majorID,
		Topic:     req.Topic,
		Detail:    req.Detail,
		CoachName: req.CoachName,
		Date:      req.Date,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pembinaan", nil)
		return
	}
	response.Created(c, "Pembinaan dibuat", item)
}

func (h *StudentCoachingHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req studentCoachingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.StudentCoaching
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pembinaan tidak ditemukan", nil)
		return
	}
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	// Kelas dan jurusan hanya ditulis ulang bila siswanya diganti. Catatan lama
	// tetap memegang kondisi siswa saat kejadian, karena siswa berpindah kelas
	// tiap tahun dan koreksi data tidak boleh mengubah riwayat.
	if item.StudentID != req.StudentID {
		item.ClassID = classID
		item.MajorID = majorID
	}
	item.StudentID = req.StudentID
	item.Topic = req.Topic
	item.Detail = req.Detail
	item.CoachName = req.CoachName
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pembinaan", nil)
		return
	}
	response.OK(c, "Pembinaan diperbarui", item)
}

func (h *StudentCoachingHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.StudentCoaching{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pembinaan", nil)
		return
	}
	response.OK(c, "Pembinaan dihapus", nil)
}

// ---- TalentDevelopment (Bakat dan Minat) ----

type TalentDevelopmentHandler struct {
	db *gorm.DB
}

func NewTalentDevelopmentHandler(db *gorm.DB) *TalentDevelopmentHandler {
	return &TalentDevelopmentHandler{db: db}
}

// ClassID dan MajorID diisi server dari siswa yang dipilih, sama seperti pembinaan.
type talentDevelopmentRequest struct {
	StudentID uuid.UUID `json:"student_id" binding:"required"`
	Field     string    `json:"field" binding:"required"`
	Category  string     `json:"category"`
	Detail    string     `json:"detail"`
	Mentor    string     `json:"mentor"`
}

func (h *TalentDevelopmentHandler) List(c *gin.Context) {
	q := h.db.Model(&model.TalentDevelopment{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.TalentDevelopment
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pengembangan bakat", nil)
		return
	}
	response.OK(c, "Daftar pengembangan bakat", items)
}

func (h *TalentDevelopmentHandler) Create(c *gin.Context) {
	var req talentDevelopmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	item := model.TalentDevelopment{
		StudentID: req.StudentID,
		ClassID:   classID,
		MajorID:   majorID,
		Field:     req.Field,
		Category:  req.Category,
		Detail:    req.Detail,
		Mentor:    req.Mentor,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pengembangan bakat", nil)
		return
	}
	response.Created(c, "Pengembangan bakat dibuat", item)
}

func (h *TalentDevelopmentHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req talentDevelopmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.TalentDevelopment
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pengembangan bakat tidak ditemukan", nil)
		return
	}
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	if item.StudentID != req.StudentID {
		item.ClassID = classID
		item.MajorID = majorID
	}
	item.StudentID = req.StudentID
	item.Field = req.Field
	item.Category = req.Category
	item.Detail = req.Detail
	item.Mentor = req.Mentor
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pengembangan bakat", nil)
		return
	}
	response.OK(c, "Pengembangan bakat diperbarui", item)
}

func (h *TalentDevelopmentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.TalentDevelopment{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pengembangan bakat", nil)
		return
	}
	response.OK(c, "Pengembangan bakat dihapus", nil)
}

// ---- StudentActivity (Kegiatan) ----

type StudentActivityHandler struct {
	db *gorm.DB
}

func NewStudentActivityHandler(db *gorm.DB) *StudentActivityHandler {
	return &StudentActivityHandler{db: db}
}

type studentActivityRequest struct {
	Name        string     `json:"name" binding:"required"`
	Type        string     `json:"type"`
	Field       string     `json:"field"`
	Description string     `json:"description"`
	Organizer   string     `json:"organizer"`
	Location    string     `json:"location"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
}

func (h *StudentActivityHandler) List(c *gin.Context) {
	q := h.db.Model(&model.StudentActivity{})
	if v := c.Query("type"); v != "" {
		q = q.Where("type = ?", v)
	}
	var items []model.StudentActivity
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil kegiatan", nil)
		return
	}
	response.OK(c, "Daftar kegiatan", items)
}

func (h *StudentActivityHandler) Create(c *gin.Context) {
	var req studentActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.StudentActivity{
		Name:        req.Name,
		Type:        req.Type,
		Field:       req.Field,
		Description: req.Description,
		Organizer:   req.Organizer,
		Location:    req.Location,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kegiatan", nil)
		return
	}
	response.Created(c, "Kegiatan dibuat", item)
}

func (h *StudentActivityHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req studentActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.StudentActivity
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Kegiatan tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Type = req.Type
	item.Field = req.Field
	item.Description = req.Description
	item.Organizer = req.Organizer
	item.Location = req.Location
	item.StartDate = req.StartDate
	item.EndDate = req.EndDate
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kegiatan", nil)
		return
	}
	response.OK(c, "Kegiatan diperbarui", item)
}

func (h *StudentActivityHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.StudentActivity{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus kegiatan", nil)
		return
	}
	response.OK(c, "Kegiatan dihapus", nil)
}
