package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type GradeLevelHandler struct {
	db *gorm.DB
}

func NewGradeLevelHandler(db *gorm.DB) *GradeLevelHandler {
	return &GradeLevelHandler{db: db}
}

type gradeLevelRequest struct {
	Name  string `json:"name" binding:"required"`
	Code  string `json:"code" binding:"required"`
	Order int    `json:"order"`
}

func (h *GradeLevelHandler) List(c *gin.Context) {
	var items []model.GradeLevel
	if err := h.db.Order(`"order" asc, code asc`).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tingkatan", nil)
		return
	}
	response.OK(c, "Daftar tingkatan", items)
}

func (h *GradeLevelHandler) Create(c *gin.Context) {
	var req gradeLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.GradeLevel{Name: req.Name, Code: req.Code, Order: req.Order}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tingkatan, pastikan kode unik", nil)
		return
	}
	response.Created(c, "Tingkatan dibuat", item)
}

func (h *GradeLevelHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req gradeLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.GradeLevel
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tingkatan tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Code = req.Code
	item.Order = req.Order
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tingkatan", nil)
		return
	}
	response.OK(c, "Tingkatan diperbarui", item)
}

func (h *GradeLevelHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.GradeLevel{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus tingkatan", nil)
		return
	}
	response.OK(c, "Tingkatan dihapus", nil)
}
