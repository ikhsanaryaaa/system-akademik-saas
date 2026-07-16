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
	Status         string     `json:"status" binding:"omitempty,oneof=pending accepted rejected"`
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
	status := req.Status
	if status == "" {
		status = "pending"
	}
	item := model.Admission{
		Name:           req.Name,
		OriginSchool:   req.OriginSchool,
		Gender:         req.Gender,
		Phone:          req.Phone,
		Email:          req.Email,
		Address:        req.Address,
		MajorID:        req.MajorID,
		Status:         status,
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
	if req.Status != "" {
		item.Status = req.Status
	}
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

// ---- StudentCoaching (Pembinaan) ----

type StudentCoachingHandler struct {
	db *gorm.DB
}

func NewStudentCoachingHandler(db *gorm.DB) *StudentCoachingHandler {
	return &StudentCoachingHandler{db: db}
}

type studentCoachingRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
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
	item := model.StudentCoaching{
		StudentID: req.StudentID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
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
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
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

type talentDevelopmentRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
	Field     string     `json:"field" binding:"required"`
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
	item := model.TalentDevelopment{
		StudentID: req.StudentID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
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
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
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
