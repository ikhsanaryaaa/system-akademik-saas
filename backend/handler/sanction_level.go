package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// SanctionLevelHandler mengelola master tahap sanksi berbasis ambang poin.
type SanctionLevelHandler struct {
	db *gorm.DB
}

func NewSanctionLevelHandler(db *gorm.DB) *SanctionLevelHandler {
	return &SanctionLevelHandler{db: db}
}

type sanctionLevelRequest struct {
	MinPoint int    `json:"min_point" binding:"min=0"`
	Name     string `json:"name" binding:"required"`
	Action   string `json:"action"`
	Note     string `json:"note"`
}

func (h *SanctionLevelHandler) List(c *gin.Context) {
	var items []model.SanctionLevel
	if err := h.db.Order("min_point").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tahap sanksi", nil)
		return
	}
	response.OK(c, "Daftar tahap sanksi", items)
}

func (h *SanctionLevelHandler) Create(c *gin.Context) {
	var req sanctionLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	if h.minPointTaken(req.MinPoint, uuid.Nil) {
		response.Error(c, http.StatusConflict, "Ambang poin sudah dipakai tahap lain", nil)
		return
	}
	item := model.SanctionLevel{
		MinPoint: req.MinPoint,
		Name:     req.Name,
		Action:   req.Action,
		Note:     req.Note,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tahap sanksi", nil)
		return
	}
	response.Created(c, "Tahap sanksi dibuat", item)
}

func (h *SanctionLevelHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req sanctionLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.SanctionLevel
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tahap sanksi tidak ditemukan", nil)
		return
	}
	if h.minPointTaken(req.MinPoint, id) {
		response.Error(c, http.StatusConflict, "Ambang poin sudah dipakai tahap lain", nil)
		return
	}
	item.MinPoint = req.MinPoint
	item.Name = req.Name
	item.Action = req.Action
	item.Note = req.Note
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tahap sanksi", nil)
		return
	}
	response.OK(c, "Tahap sanksi diperbarui", item)
}

func (h *SanctionLevelHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.SanctionLevel{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus tahap sanksi", nil)
		return
	}
	response.OK(c, "Tahap sanksi dihapus", nil)
}

// minPointTaken memeriksa ambang poin kembar supaya pesannya jelas sebelum
// unique index di database menolaknya.
func (h *SanctionLevelHandler) minPointTaken(minPoint int, exceptID uuid.UUID) bool {
	var count int64
	q := h.db.Model(&model.SanctionLevel{}).Where("min_point = ?", minPoint)
	if exceptID != uuid.Nil {
		q = q.Where("id <> ?", exceptID)
	}
	q.Count(&count)
	return count > 0
}
