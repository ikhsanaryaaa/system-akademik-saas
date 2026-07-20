package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type StaffHandler struct {
	db *gorm.DB
}

func NewStaffHandler(db *gorm.DB) *StaffHandler {
	return &StaffHandler{db: db}
}

type staffRequest struct {
	Name     string `json:"name" binding:"required"`
	NIP      string `json:"nip"`
	Position string `json:"position"`
	Email    string `json:"email" binding:"omitempty,email"`
	Phone    string `json:"phone"`
	PhotoURL string `json:"photo_url"`
}

func (h *StaffHandler) List(c *gin.Context) {
	var items []model.Staff
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tenaga non-kependidikan", nil)
		return
	}
	response.OK(c, "Daftar tenaga non-kependidikan", items)
}

func (h *StaffHandler) Create(c *gin.Context) {
	var req staffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Staff{Name: req.Name, NIP: req.NIP, Position: req.Position, Email: req.Email, Phone: req.Phone, PhotoURL: req.PhotoURL}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan data, pastikan NIP unik", nil)
		return
	}
	response.Created(c, "Tenaga non-kependidikan dibuat", item)
}

func (h *StaffHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req staffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Staff
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Data tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.NIP = req.NIP
	item.Position = req.Position
	item.Email = req.Email
	item.Phone = req.Phone
	item.PhotoURL = req.PhotoURL
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan data", nil)
		return
	}
	response.OK(c, "Tenaga non-kependidikan diperbarui", item)
}

func (h *StaffHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Staff{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus data", nil)
		return
	}
	response.OK(c, "Tenaga non-kependidikan dihapus", nil)
}
