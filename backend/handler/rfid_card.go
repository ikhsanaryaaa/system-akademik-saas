package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type RfidCardHandler struct {
	db *gorm.DB
}

func NewRfidCardHandler(db *gorm.DB) *RfidCardHandler {
	return &RfidCardHandler{db: db}
}

type rfidCardRequest struct {
	UID       string     `json:"uid" binding:"required"`
	StudentID *uuid.UUID `json:"student_id"`
	TeacherID *uuid.UUID `json:"teacher_id"`
}

func (h *RfidCardHandler) List(c *gin.Context) {
	var items []model.RfidCard
	if err := h.db.Preload("Student").Preload("Teacher").Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil kartu RFID", nil)
		return
	}
	response.OK(c, "Daftar kartu RFID", items)
}

func (h *RfidCardHandler) Create(c *gin.Context) {
	var req rfidCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	if (req.StudentID == nil) == (req.TeacherID == nil) {
		response.Error(c, http.StatusBadRequest, "Isi tepat satu dari siswa atau pendidik", nil)
		return
	}
	item := model.RfidCard{UID: req.UID, StudentID: req.StudentID, TeacherID: req.TeacherID}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kartu, pastikan UID unik", nil)
		return
	}
	response.Created(c, "Kartu RFID dibuat", item)
}

func (h *RfidCardHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.RfidCard{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus kartu", nil)
		return
	}
	response.OK(c, "Kartu RFID dihapus", nil)
}
