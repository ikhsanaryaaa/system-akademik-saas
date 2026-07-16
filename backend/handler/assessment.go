package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type AssessmentHandler struct {
	db *gorm.DB
}

func NewAssessmentHandler(db *gorm.DB) *AssessmentHandler {
	return &AssessmentHandler{db: db}
}

type assessmentRequest struct {
	Title          string    `json:"title" binding:"required"`
	Type           string    `json:"type" binding:"required"`
	Weight         float64   `json:"weight"`
	Semester       int       `json:"semester" binding:"required,oneof=1 2"`
	ClassID        uuid.UUID `json:"class_id" binding:"required"`
	SubjectID      uuid.UUID `json:"subject_id" binding:"required"`
	AcademicYearID uuid.UUID `json:"academic_year_id" binding:"required"`
}

// List mendukung filter per class_id, subject_id, academic_year_id, dan semester.
func (h *AssessmentHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Assessment{}).Preload("Class").Preload("Subject")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}
	if v := c.Query("semester"); v != "" {
		q = q.Where("semester = ?", v)
	}
	var items []model.Assessment
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil penilaian", nil)
		return
	}
	response.OK(c, "Daftar penilaian", items)
}

func (h *AssessmentHandler) Create(c *gin.Context) {
	var req assessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Assessment{
		Title:          req.Title,
		Type:           req.Type,
		Weight:         req.Weight,
		Semester:       req.Semester,
		ClassID:        req.ClassID,
		SubjectID:      req.SubjectID,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan penilaian", nil)
		return
	}
	response.Created(c, "Penilaian dibuat", item)
}

func (h *AssessmentHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req assessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Assessment
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Penilaian tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.Type = req.Type
	item.Weight = req.Weight
	item.Semester = req.Semester
	item.ClassID = req.ClassID
	item.SubjectID = req.SubjectID
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan penilaian", nil)
		return
	}
	response.OK(c, "Penilaian diperbarui", item)
}

func (h *AssessmentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Assessment{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus penilaian", nil)
		return
	}
	response.OK(c, "Penilaian dihapus", nil)
}
