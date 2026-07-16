package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// StudentBookHandler menyediakan rekap aktivitas BK seorang siswa (buku siswa).
type StudentBookHandler struct {
	db *gorm.DB
}

func NewStudentBookHandler(db *gorm.DB) *StudentBookHandler {
	return &StudentBookHandler{db: db}
}

// Book mengembalikan rekap pelanggaran, prestasi, sesi konseling, dan home visit satu siswa.
func (h *StudentBookHandler) Book(c *gin.Context) {
	studentID := c.Query("student_id")
	if studentID == "" {
		response.Error(c, http.StatusBadRequest, "Parameter student_id wajib diisi", nil)
		return
	}

	var student model.Student
	if err := h.db.Preload("Class").Preload("Major").First(&student, "id = ?", studentID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Siswa tidak ditemukan", nil)
		return
	}

	var violations []model.ViolationRecord
	h.db.Preload("ViolationType").Where("student_id = ?", studentID).Order("date desc").Find(&violations)

	var achievements []model.Achievement
	h.db.Where("student_id = ?", studentID).Order("date desc").Find(&achievements)

	var sessions []model.CounselingSession
	h.db.Where("student_id = ?", studentID).Order("date desc").Find(&sessions)

	var homeVisits []model.HomeVisit
	h.db.Where("student_id = ?", studentID).Order("date desc").Find(&homeVisits)

	// Total poin pelanggaran dihitung dari jenis pelanggaran terkait.
	totalPoint := 0
	for _, v := range violations {
		if v.ViolationType != nil {
			totalPoint += v.ViolationType.Point
		}
	}

	response.OK(c, "Buku siswa", gin.H{
		"student":      student,
		"violations":   violations,
		"achievements": achievements,
		"sessions":     sessions,
		"home_visits":  homeVisits,
		"total_point":  totalPoint,
	})
}
