package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type SubjectHandler struct {
	db *gorm.DB
}

func NewSubjectHandler(db *gorm.DB) *SubjectHandler {
	return &SubjectHandler{db: db}
}

type subjectRequest struct {
	Name     string `json:"name" binding:"required"`
	Code     string `json:"code" binding:"required"`
	Category string `json:"category" binding:"required,oneof=wajib peminatan mulok"`
}

func (h *SubjectHandler) List(c *gin.Context) {
	var items []model.Subject
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil mata pelajaran", nil)
		return
	}
	response.OK(c, "Daftar mata pelajaran", items)
}

func (h *SubjectHandler) Create(c *gin.Context) {
	var req subjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Subject{Name: req.Name, Code: req.Code, Category: req.Category}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan mata pelajaran, pastikan kode unik", nil)
		return
	}
	response.Created(c, "Mata pelajaran dibuat", item)
}

func (h *SubjectHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req subjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Subject
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Mata pelajaran tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Code = req.Code
	item.Category = req.Category
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan mata pelajaran", nil)
		return
	}
	response.OK(c, "Mata pelajaran diperbarui", item)
}

func (h *SubjectHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Subject{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus mata pelajaran", nil)
		return
	}
	response.OK(c, "Mata pelajaran dihapus", nil)
}
