package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type ReportCardHandler struct {
	db *gorm.DB
}

func NewReportCardHandler(db *gorm.DB) *ReportCardHandler {
	return &ReportCardHandler{db: db}
}

type reportCardRequest struct {
	StudentID      uuid.UUID  `json:"student_id" binding:"required"`
	SubjectID      uuid.UUID  `json:"subject_id" binding:"required"`
	Semester       int        `json:"semester" binding:"required,oneof=1 2"`
	AcademicYearID uuid.UUID  `json:"academic_year_id" binding:"required"`
	ClassID        *uuid.UUID `json:"class_id"`
	KnowledgeScore float64    `json:"knowledge_score" binding:"min=0,max=100"`
	SkillScore     float64    `json:"skill_score" binding:"min=0,max=100"`
	Description    string     `json:"description"`
}

// Save membuat atau memperbarui nilai raport (upsert per siswa, mata pelajaran, semester, tahun ajaran).
func (h *ReportCardHandler) Save(c *gin.Context) {
	var req reportCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var score model.ReportCardScore
	res := h.db.Where(
		"student_id = ? AND subject_id = ? AND semester = ? AND academic_year_id = ?",
		req.StudentID, req.SubjectID, req.Semester, req.AcademicYearID,
	).First(&score)

	score.StudentID = req.StudentID
	score.SubjectID = req.SubjectID
	score.Semester = req.Semester
	score.AcademicYearID = req.AcademicYearID
	score.ClassID = req.ClassID
	score.KnowledgeScore = req.KnowledgeScore
	score.SkillScore = req.SkillScore
	score.Description = req.Description

	if res.Error == gorm.ErrRecordNotFound {
		if err := h.db.Create(&score).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal menyimpan nilai raport", nil)
			return
		}
	} else {
		if err := h.db.Save(&score).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal menyimpan nilai raport", nil)
			return
		}
	}
	response.OK(c, "Nilai raport disimpan", score)
}

// Leger mengembalikan rekap nilai raport seluruh siswa satu kelas pada satu semester.
func (h *ReportCardHandler) Leger(c *gin.Context) {
	classID := c.Query("class_id")
	semester := c.Query("semester")
	if classID == "" || semester == "" {
		response.Error(c, http.StatusBadRequest, "Parameter class_id dan semester wajib diisi", nil)
		return
	}
	var items []model.ReportCardScore
	if err := h.db.Preload("Student").Preload("Subject").
		Where("class_id = ? AND semester = ?", classID, semester).
		Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil leger", nil)
		return
	}
	response.OK(c, "Leger nilai kelas", items)
}

// ReportCard mengembalikan seluruh nilai raport satu siswa pada satu semester (e-Raport).
func (h *ReportCardHandler) ReportCard(c *gin.Context) {
	studentID := c.Query("student_id")
	semester := c.Query("semester")
	if studentID == "" || semester == "" {
		response.Error(c, http.StatusBadRequest, "Parameter student_id dan semester wajib diisi", nil)
		return
	}
	var items []model.ReportCardScore
	if err := h.db.Preload("Subject").
		Where("student_id = ? AND semester = ?", studentID, semester).
		Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil raport", nil)
		return
	}
	response.OK(c, "e-Raport siswa", items)
}
