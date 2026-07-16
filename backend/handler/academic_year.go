package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type AcademicYearHandler struct {
	db *gorm.DB
}

func NewAcademicYearHandler(db *gorm.DB) *AcademicYearHandler {
	return &AcademicYearHandler{db: db}
}

type academicYearRequest struct {
	Name     string `json:"name" binding:"required"`
	IsActive *bool  `json:"is_active"`
}

func (h *AcademicYearHandler) List(c *gin.Context) {
	var years []model.AcademicYear
	if err := h.db.Order("name desc").Find(&years).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tahun ajaran", nil)
		return
	}
	response.OK(c, "Daftar tahun ajaran", years)
}

func (h *AcademicYearHandler) Create(c *gin.Context) {
	var req academicYearRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	year := model.AcademicYear{Name: req.Name}
	if req.IsActive != nil {
		year.IsActive = *req.IsActive
	}
	if err := h.saveWithActiveRule(&year); err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tahun ajaran, pastikan nama unik", nil)
		return
	}
	response.Created(c, "Tahun ajaran dibuat", year)
}

func (h *AcademicYearHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req academicYearRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var year model.AcademicYear
	if err := h.db.First(&year, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tahun ajaran tidak ditemukan", nil)
		return
	}
	year.Name = req.Name
	if req.IsActive != nil {
		year.IsActive = *req.IsActive
	}
	if err := h.saveWithActiveRule(&year); err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tahun ajaran", nil)
		return
	}
	response.OK(c, "Tahun ajaran diperbarui", year)
}

func (h *AcademicYearHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.AcademicYear{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus tahun ajaran", nil)
		return
	}
	response.OK(c, "Tahun ajaran dihapus", nil)
}

// saveWithActiveRule memastikan hanya satu tahun ajaran aktif dalam satu transaksi.
func (h *AcademicYearHandler) saveWithActiveRule(year *model.AcademicYear) error {
	return h.db.Transaction(func(tx *gorm.DB) error {
		if year.IsActive {
			if err := tx.Model(&model.AcademicYear{}).Where("id <> ?", year.ID).Update("is_active", false).Error; err != nil {
				return err
			}
		}
		return tx.Save(year).Error
	})
}
