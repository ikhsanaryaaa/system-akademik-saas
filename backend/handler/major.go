package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type MajorHandler struct {
	db *gorm.DB
}

func NewMajorHandler(db *gorm.DB) *MajorHandler {
	return &MajorHandler{db: db}
}

type majorRequest struct {
	Name string `json:"name" binding:"required"`
	Code string `json:"code" binding:"required"`
}

func (h *MajorHandler) List(c *gin.Context) {
	var items []model.Major
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jurusan", nil)
		return
	}
	response.OK(c, "Daftar jurusan", items)
}

func (h *MajorHandler) Create(c *gin.Context) {
	var req majorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Major{Name: req.Name, Code: req.Code}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jurusan, pastikan kode unik", nil)
		return
	}
	response.Created(c, "Jurusan dibuat", item)
}

func (h *MajorHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req majorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Major
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jurusan tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Code = req.Code
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jurusan", nil)
		return
	}
	response.OK(c, "Jurusan diperbarui", item)
}

func (h *MajorHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Major{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus jurusan", nil)
		return
	}
	response.OK(c, "Jurusan dihapus", nil)
}
