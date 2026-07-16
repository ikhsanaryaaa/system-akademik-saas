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

type TeacherAttendanceHandler struct {
	db *gorm.DB
}

func NewTeacherAttendanceHandler(db *gorm.DB) *TeacherAttendanceHandler {
	return &TeacherAttendanceHandler{db: db}
}

type teacherAttendanceRequest struct {
	TeacherID uuid.UUID `json:"teacher_id" binding:"required"`
	Date      string    `json:"date" binding:"required"`
	Status    string    `json:"status" binding:"required"`
	Note      string    `json:"note"`
}

// List mendukung filter per tanggal (date) dan rentang (start, end) serta teacher_id.
func (h *TeacherAttendanceHandler) List(c *gin.Context) {
	q := h.db.Model(&model.TeacherAttendance{}).Preload("Teacher")
	if v := c.Query("teacher_id"); v != "" {
		q = q.Where("teacher_id = ?", v)
	}
	if v := c.Query("date"); v != "" {
		if d, err := parseDate(v); err == nil {
			q = q.Where("date = ?", dayStart(d))
		}
	}
	if s := c.Query("start"); s != "" {
		if d, err := parseDate(s); err == nil {
			q = q.Where("date >= ?", dayStart(d))
		}
	}
	if e := c.Query("end"); e != "" {
		if d, err := parseDate(e); err == nil {
			q = q.Where("date <= ?", dayStart(d))
		}
	}
	var items []model.TeacherAttendance
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil absensi guru", nil)
		return
	}
	response.OK(c, "Daftar absensi guru", items)
}

// Mark mencatat atau memperbarui absensi guru untuk satu tanggal (upsert).
// Bila status hadir, jam masuk diisi waktu sekarang dan status naik ke terlambat bila melewati jam masuk.
func (h *TeacherAttendanceHandler) Mark(c *gin.Context) {
	var req teacherAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	d, err := parseDate(req.Date)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Format tanggal harus YYYY-MM-DD", nil)
		return
	}
	date := dayStart(d)

	var att model.TeacherAttendance
	res := h.db.Where("teacher_id = ? AND date = ?", req.TeacherID, date).First(&att)
	isNew := res.Error == gorm.ErrRecordNotFound

	att.TeacherID = req.TeacherID
	att.Date = date
	att.Status = req.Status
	att.Note = req.Note

	if req.Status == model.AttendancePresent {
		now := time.Now()
		att.CheckInTime = &now
		if isLate(h.db, now) {
			att.Status = model.AttendanceLate
		}
	}

	if isNew {
		if err := h.db.Create(&att).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal menyimpan absensi", nil)
			return
		}
	} else {
		if err := h.db.Save(&att).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal menyimpan absensi", nil)
			return
		}
	}
	response.OK(c, "Absensi guru dicatat", att)
}

// Checkout mencatat jam keluar guru untuk absensi tanggal tertentu.
func (h *TeacherAttendanceHandler) Checkout(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var att model.TeacherAttendance
	if err := h.db.First(&att, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Absensi tidak ditemukan", nil)
		return
	}
	now := time.Now()
	att.CheckOutTime = &now
	if err := h.db.Save(&att).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jam keluar", nil)
		return
	}
	response.OK(c, "Jam keluar dicatat", att)
}
