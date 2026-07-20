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

type StudentHandler struct {
	db *gorm.DB
}

func NewStudentHandler(db *gorm.DB) *StudentHandler {
	return &StudentHandler{db: db}
}

type studentRequest struct {
	Name           string     `json:"name" binding:"required"`
	NIS            string     `json:"nis"`
	NISN           string     `json:"nisn"`
	Gender         string     `json:"gender" binding:"omitempty,oneof=L P"`
	BirthPlace     string     `json:"birth_place"`
	BirthDate      *time.Time `json:"birth_date"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
	PhotoURL       string     `json:"photo_url"`
}

// List mendukung filter per class_id, major_id, academic_year_id, pencarian nama, plus pagination.
func (h *StudentHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Student{}).
		Preload("Class").Preload("Major").Preload("AcademicYear")

	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}
	if v := c.Query("search"); v != "" {
		q = q.Where("name ILIKE ?", "%"+v+"%")
	}

	page, perPage, offset := paginate(c)

	var total int64
	q.Count(&total)

	var items []model.Student
	if err := q.Order("name asc").Limit(perPage).Offset(offset).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil siswa", nil)
		return
	}

	response.OK(c, "Daftar siswa", gin.H{
		"items": items,
		"meta":  gin.H{"page": page, "per_page": perPage, "total": total},
	})
}

func (h *StudentHandler) Create(c *gin.Context) {
	var req studentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Student{
		Name:           req.Name,
		NIS:            req.NIS,
		NISN:           req.NISN,
		Gender:         req.Gender,
		BirthPlace:     req.BirthPlace,
		BirthDate:      req.BirthDate,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		AcademicYearID: req.AcademicYearID,
		PhotoURL:       req.PhotoURL,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan siswa, pastikan NIS dan NISN unik", nil)
		return
	}
	response.Created(c, "Siswa dibuat", item)
}

func (h *StudentHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req studentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Student
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Siswa tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.NIS = req.NIS
	item.NISN = req.NISN
	item.Gender = req.Gender
	item.BirthPlace = req.BirthPlace
	item.BirthDate = req.BirthDate
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.AcademicYearID = req.AcademicYearID
	item.PhotoURL = req.PhotoURL
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan siswa", nil)
		return
	}
	response.OK(c, "Siswa diperbarui", item)
}

func (h *StudentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Student{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus siswa", nil)
		return
	}
	response.OK(c, "Siswa dihapus", nil)
}
