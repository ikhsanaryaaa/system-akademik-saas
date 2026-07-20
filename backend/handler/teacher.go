package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type TeacherHandler struct {
	db *gorm.DB
}

func NewTeacherHandler(db *gorm.DB) *TeacherHandler {
	return &TeacherHandler{db: db}
}

type teacherRequest struct {
	Name     string `json:"name" binding:"required"`
	NIP      string `json:"nip"`
	Email    string `json:"email" binding:"omitempty,email"`
	Phone    string `json:"phone"`
	Gender   string `json:"gender" binding:"omitempty,oneof=L P"`
	PhotoURL string `json:"photo_url"`
}

func (h *TeacherHandler) List(c *gin.Context) {
	var items []model.Teacher
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pendidik", nil)
		return
	}
	response.OK(c, "Daftar pendidik", items)
}

func (h *TeacherHandler) Create(c *gin.Context) {
	var req teacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Teacher{Name: req.Name, NIP: req.NIP, Email: req.Email, Phone: req.Phone, Gender: req.Gender, PhotoURL: req.PhotoURL}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pendidik, pastikan NIP unik", nil)
		return
	}
	response.Created(c, "Pendidik dibuat", item)
}

func (h *TeacherHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req teacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Teacher
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pendidik tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.NIP = req.NIP
	item.Email = req.Email
	item.Phone = req.Phone
	item.Gender = req.Gender
	item.PhotoURL = req.PhotoURL
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pendidik", nil)
		return
	}
	response.OK(c, "Pendidik diperbarui", item)
}

func (h *TeacherHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Teacher{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pendidik", nil)
		return
	}
	response.OK(c, "Pendidik dihapus", nil)
}
