package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type LessonScheduleHandler struct {
	db *gorm.DB
}

func NewLessonScheduleHandler(db *gorm.DB) *LessonScheduleHandler {
	return &LessonScheduleHandler{db: db}
}

type lessonScheduleRequest struct {
	ClassID   uuid.UUID  `json:"class_id" binding:"required"`
	SubjectID uuid.UUID  `json:"subject_id" binding:"required"`
	TeacherID *uuid.UUID `json:"teacher_id"`
	DayOfWeek int        `json:"day_of_week" binding:"required,min=1,max=7"`
	StartTime string     `json:"start_time" binding:"required"`
	EndTime   string     `json:"end_time" binding:"required"`
}

// List mendukung filter per class_id dan teacher_id.
func (h *LessonScheduleHandler) List(c *gin.Context) {
	q := h.db.Model(&model.LessonSchedule{}).
		Preload("Class").Preload("Subject").Preload("Teacher")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("teacher_id"); v != "" {
		q = q.Where("teacher_id = ?", v)
	}
	var items []model.LessonSchedule
	if err := q.Order("day_of_week asc, start_time asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jadwal", nil)
		return
	}
	response.OK(c, "Daftar jadwal pelajaran", items)
}

func (h *LessonScheduleHandler) Create(c *gin.Context) {
	var req lessonScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	if req.EndTime <= req.StartTime {
		response.Error(c, http.StatusBadRequest, "Jam selesai harus lebih besar dari jam mulai", nil)
		return
	}
	if msg := h.checkConflict(req, uuid.Nil); msg != "" {
		response.Error(c, http.StatusConflict, msg, nil)
		return
	}
	item := model.LessonSchedule{
		ClassID:   req.ClassID,
		SubjectID: req.SubjectID,
		TeacherID: req.TeacherID,
		DayOfWeek: req.DayOfWeek,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jadwal", nil)
		return
	}
	response.Created(c, "Jadwal dibuat", item)
}

func (h *LessonScheduleHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req lessonScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	if req.EndTime <= req.StartTime {
		response.Error(c, http.StatusBadRequest, "Jam selesai harus lebih besar dari jam mulai", nil)
		return
	}
	var item model.LessonSchedule
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal tidak ditemukan", nil)
		return
	}
	if msg := h.checkConflict(req, id); msg != "" {
		response.Error(c, http.StatusConflict, msg, nil)
		return
	}
	item.ClassID = req.ClassID
	item.SubjectID = req.SubjectID
	item.TeacherID = req.TeacherID
	item.DayOfWeek = req.DayOfWeek
	item.StartTime = req.StartTime
	item.EndTime = req.EndTime
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jadwal", nil)
		return
	}
	response.OK(c, "Jadwal diperbarui", item)
}

func (h *LessonScheduleHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.LessonSchedule{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus jadwal", nil)
		return
	}
	response.OK(c, "Jadwal dihapus", nil)
}

// checkConflict mendeteksi bentrok jadwal berdasarkan irisan rentang jam
// pada hari yang sama untuk kelas atau pengajar yang sama. excludeID
// mengecualikan jadwal tertentu saat update. Mengembalikan pesan bila bentrok.
func (h *LessonScheduleHandler) checkConflict(req lessonScheduleRequest, excludeID uuid.UUID) string {
	// Dua rentang [a1,a2) dan [b1,b2) beririsan jika a1 < b2 dan b1 < a2.
	base := h.db.Model(&model.LessonSchedule{}).
		Where("day_of_week = ?", req.DayOfWeek).
		Where("start_time < ? AND end_time > ?", req.EndTime, req.StartTime)
	if excludeID != uuid.Nil {
		base = base.Where("id <> ?", excludeID)
	}

	var classCount int64
	base.Session(&gorm.Session{}).Where("class_id = ?", req.ClassID).Count(&classCount)
	if classCount > 0 {
		return "Jadwal bentrok dengan jadwal lain pada kelas yang sama"
	}

	if req.TeacherID != nil {
		var teacherCount int64
		base.Session(&gorm.Session{}).Where("teacher_id = ?", req.TeacherID).Count(&teacherCount)
		if teacherCount > 0 {
			return "Jadwal bentrok dengan jadwal lain pada pengajar yang sama"
		}
	}
	return ""
}
