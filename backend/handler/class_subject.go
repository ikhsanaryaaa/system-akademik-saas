package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type ClassSubjectHandler struct {
	db *gorm.DB
}

func NewClassSubjectHandler(db *gorm.DB) *ClassSubjectHandler {
	return &ClassSubjectHandler{db: db}
}

type classSubjectRequest struct {
	ClassID   uuid.UUID  `json:"class_id" binding:"required"`
	SubjectID uuid.UUID  `json:"subject_id" binding:"required"`
	TeacherID *uuid.UUID `json:"teacher_id"`
}

// List mendukung filter per class_id dan subject_id.
func (h *ClassSubjectHandler) List(c *gin.Context) {
	q := h.db.Model(&model.ClassSubject{}).
		Preload("Class").Preload("Subject").Preload("Teacher")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	var items []model.ClassSubject
	if err := q.Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pemetaan", nil)
		return
	}
	response.OK(c, "Daftar pemetaan mata pelajaran", items)
}

func (h *ClassSubjectHandler) Create(c *gin.Context) {
	var req classSubjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	// Cegah duplikat pemetaan kelas dan mata pelajaran yang sama.
	var count int64
	h.db.Model(&model.ClassSubject{}).Where("class_id = ? AND subject_id = ?", req.ClassID, req.SubjectID).Count(&count)
	if count > 0 {
		response.Error(c, http.StatusConflict, "Mata pelajaran ini sudah dipetakan ke kelas tersebut", nil)
		return
	}
	item := model.ClassSubject{ClassID: req.ClassID, SubjectID: req.SubjectID, TeacherID: req.TeacherID}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pemetaan", nil)
		return
	}
	response.Created(c, "Pemetaan dibuat", item)
}

func (h *ClassSubjectHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req classSubjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ClassSubject
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pemetaan tidak ditemukan", nil)
		return
	}
	item.ClassID = req.ClassID
	item.SubjectID = req.SubjectID
	item.TeacherID = req.TeacherID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pemetaan", nil)
		return
	}
	response.OK(c, "Pemetaan diperbarui", item)
}

func (h *ClassSubjectHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.ClassSubject{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pemetaan", nil)
		return
	}
	response.OK(c, "Pemetaan dihapus", nil)
}
