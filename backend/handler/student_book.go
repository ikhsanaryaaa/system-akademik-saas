package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// StudentBookHandler menyediakan rekap riwayat seorang siswa lintas BK dan
// kesiswaan, dipakai bersama guru BK maupun Wakil Kesiswaan.
type StudentBookHandler struct {
	db *gorm.DB
}

func NewStudentBookHandler(db *gorm.DB) *StudentBookHandler {
	return &StudentBookHandler{db: db}
}

// Book mengembalikan riwayat BK dan kesiswaan satu siswa beserta akumulasi poin
// tahun ajaran berjalan dan tahap sanksi yang sedang berlaku.
func (h *StudentBookHandler) Book(c *gin.Context) {
	studentID, err := uuid.Parse(c.Query("student_id"))
	if err != nil {
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

	var coachings []model.StudentCoaching
	h.db.Where("student_id = ?", studentID).Order("date desc").Find(&coachings)

	var talents []model.TalentDevelopment
	h.db.Where("student_id = ?", studentID).Order("created_at desc").Find(&talents)

	var activities []model.ActivityParticipant
	h.db.Preload("Activity").Where("student_id = ?", studentID).Order("created_at desc").Find(&activities)

	var year model.AcademicYear
	var yearID *uuid.UUID
	var activeYear *model.AcademicYear
	if h.db.First(&year, "is_active = ?", true).Error == nil {
		yearID = &year.ID
		activeYear = &year
	}

	point, err := studentPoint(h.db, student.ID, yearID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghitung poin siswa", nil)
		return
	}

	response.OK(c, "Buku siswa", gin.H{
		"student":       student,
		"violations":    violations,
		"achievements":  achievements,
		"sessions":      sessions,
		"home_visits":   homeVisits,
		"coachings":     coachings,
		"talents":       talents,
		"activities":    activities,
		"total_point":   point,
		"sanction":      sanctionFor(h.db, point),
		"academic_year": activeYear,
	})
}
