package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type RfidTapHandler struct {
	db *gorm.DB
}

func NewRfidTapHandler(db *gorm.DB) *RfidTapHandler {
	return &RfidTapHandler{db: db}
}

type rfidTapRequest struct {
	UID string `json:"uid" binding:"required"`
}

// Tap menerima UID kartu dari perangkat pembaca, memetakan ke siswa atau guru,
// lalu mencatat waktu masuk (tap pertama hari itu) atau keluar (tap berikutnya).
func (h *RfidTapHandler) Tap(c *gin.Context) {
	var req rfidTapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var card model.RfidCard
	if err := h.db.Where("uid = ?", req.UID).First(&card).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Kartu tidak dikenali", nil)
		return
	}

	now := time.Now()
	date := dayStart(now)

	if card.StudentID != nil {
		h.tapStudent(c, *card.StudentID, date, now)
		return
	}
	if card.TeacherID != nil {
		h.tapTeacher(c, *card.TeacherID, date, now)
		return
	}
	response.Error(c, http.StatusBadRequest, "Kartu tidak terkait siswa atau pendidik", nil)
}

// tapStudent mencatat masuk pada tap pertama, atau keluar pada tap berikutnya.
func (h *RfidTapHandler) tapStudent(c *gin.Context, studentID uuid.UUID, date, now time.Time) {
	var student model.Student
	if err := h.db.First(&student, "id = ?", studentID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Siswa tidak ditemukan", nil)
		return
	}

	var att model.StudentAttendance
	err := h.db.Where("student_id = ? AND date = ?", studentID, date).First(&att).Error
	if err == gorm.ErrRecordNotFound {
		status := model.AttendancePresent
		if isLate(h.db, now) {
			status = model.AttendanceLate
		}
		att = model.StudentAttendance{
			StudentID:   studentID,
			Date:        date,
			ClassID:     student.ClassID,
			Status:      status,
			CheckInTime: &now,
		}
		if err := h.db.Create(&att).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal mencatat kehadiran", nil)
			return
		}
		response.OK(c, "Tap masuk tercatat", gin.H{"name": student.Name, "type": "masuk", "status": att.Status})
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil absensi", nil)
		return
	}

	att.CheckOutTime = &now
	h.db.Save(&att)
	response.OK(c, "Tap keluar tercatat", gin.H{"name": student.Name, "type": "keluar", "status": att.Status})
}

// tapTeacher mencatat masuk pada tap pertama, atau keluar pada tap berikutnya.
func (h *RfidTapHandler) tapTeacher(c *gin.Context, teacherID uuid.UUID, date, now time.Time) {
	var teacher model.Teacher
	if err := h.db.First(&teacher, "id = ?", teacherID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pendidik tidak ditemukan", nil)
		return
	}

	var att model.TeacherAttendance
	err := h.db.Where("teacher_id = ? AND date = ?", teacherID, date).First(&att).Error
	if err == gorm.ErrRecordNotFound {
		status := model.AttendancePresent
		if isLate(h.db, now) {
			status = model.AttendanceLate
		}
		att = model.TeacherAttendance{
			TeacherID:   teacherID,
			Date:        date,
			Status:      status,
			CheckInTime: &now,
		}
		if err := h.db.Create(&att).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal mencatat kehadiran", nil)
			return
		}
		response.OK(c, "Tap masuk tercatat", gin.H{"name": teacher.Name, "type": "masuk", "status": att.Status})
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil absensi", nil)
		return
	}

	att.CheckOutTime = &now
	h.db.Save(&att)
	response.OK(c, "Tap keluar tercatat", gin.H{"name": teacher.Name, "type": "keluar", "status": att.Status})
}
