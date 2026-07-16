package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type ClassHandler struct {
	db *gorm.DB
}

func NewClassHandler(db *gorm.DB) *ClassHandler {
	return &ClassHandler{db: db}
}

type classRequest struct {
	Name           string     `json:"name" binding:"required"`
	GradeLevelID   uuid.UUID  `json:"grade_level_id" binding:"required"`
	MajorID        *uuid.UUID `json:"major_id"`
	AcademicYearID uuid.UUID  `json:"academic_year_id" binding:"required"`
	HomeroomID     *uuid.UUID `json:"homeroom_id"`
}

// List mendukung filter per grade_level_id, major_id, academic_year_id, plus pagination.
func (h *ClassHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Class{}).
		Preload("GradeLevel").Preload("Major").Preload("AcademicYear").Preload("Homeroom")

	if v := c.Query("grade_level_id"); v != "" {
		q = q.Where("grade_level_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}

	page, perPage, offset := paginate(c)

	var total int64
	q.Count(&total)

	var items []model.Class
	if err := q.Order("name asc").Limit(perPage).Offset(offset).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil kelas", nil)
		return
	}

	response.OK(c, "Daftar kelas", gin.H{
		"items": items,
		"meta":  gin.H{"page": page, "per_page": perPage, "total": total},
	})
}

func (h *ClassHandler) Create(c *gin.Context) {
	var req classRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Class{
		Name:           req.Name,
		GradeLevelID:   req.GradeLevelID,
		MajorID:        req.MajorID,
		AcademicYearID: req.AcademicYearID,
		HomeroomID:     req.HomeroomID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kelas", nil)
		return
	}
	response.Created(c, "Kelas dibuat", item)
}

func (h *ClassHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req classRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Class
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Kelas tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.GradeLevelID = req.GradeLevelID
	item.MajorID = req.MajorID
	item.AcademicYearID = req.AcademicYearID
	item.HomeroomID = req.HomeroomID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kelas", nil)
		return
	}
	response.OK(c, "Kelas diperbarui", item)
}

func (h *ClassHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Class{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus kelas", nil)
		return
	}
	response.OK(c, "Kelas dihapus", nil)
}
