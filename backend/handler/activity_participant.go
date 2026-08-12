package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// ActivityParticipantHandler mengelola daftar peserta pada satu kegiatan kesiswaan.
type ActivityParticipantHandler struct {
	db *gorm.DB
}

func NewActivityParticipantHandler(db *gorm.DB) *ActivityParticipantHandler {
	return &ActivityParticipantHandler{db: db}
}

type activityParticipantRequest struct {
	StudentID uuid.UUID `json:"student_id" binding:"required"`
	Role      string    `json:"role" binding:"omitempty,oneof=anggota ketua pembina"`
	Note      string    `json:"note"`
}

func (h *ActivityParticipantHandler) List(c *gin.Context) {
	activityID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID kegiatan tidak valid", nil)
		return
	}
	var items []model.ActivityParticipant
	q := h.db.Where("activity_id = ?", activityID).
		Preload("Student").Preload("Student.Class").Preload("Student.Major")
	if err := q.Order("created_at").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil peserta kegiatan", nil)
		return
	}
	response.OK(c, "Daftar peserta kegiatan", items)
}

func (h *ActivityParticipantHandler) Create(c *gin.Context) {
	activityID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID kegiatan tidak valid", nil)
		return
	}
	var req activityParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	// Dicek lebih dulu supaya pesannya jelas, unique index tetap jadi penjaga terakhir.
	var exists int64
	if err := h.db.Model(&model.ActivityParticipant{}).
		Where("activity_id = ? AND student_id = ?", activityID, req.StudentID).
		Count(&exists).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal memeriksa peserta kegiatan", nil)
		return
	}
	if exists > 0 {
		response.Error(c, http.StatusConflict, "Siswa sudah terdaftar pada kegiatan ini", nil)
		return
	}
	role := req.Role
	if role == "" {
		role = "anggota"
	}
	item := model.ActivityParticipant{
		ActivityID: activityID,
		StudentID:  req.StudentID,
		Role:       role,
		Note:       req.Note,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan peserta kegiatan", nil)
		return
	}
	h.db.Preload("Student").Preload("Student.Class").Preload("Student.Major").First(&item, "id = ?", item.ID)
	response.Created(c, "Peserta kegiatan ditambahkan", item)
}

func (h *ActivityParticipantHandler) Delete(c *gin.Context) {
	participantID, err := uuid.Parse(c.Param("participantId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID peserta tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.ActivityParticipant{}, "id = ?", participantID).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus peserta kegiatan", nil)
		return
	}
	response.OK(c, "Peserta kegiatan dihapus", nil)
}
