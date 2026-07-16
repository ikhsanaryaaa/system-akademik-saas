package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type AssessmentScoreHandler struct {
	db *gorm.DB
}

func NewAssessmentScoreHandler(db *gorm.DB) *AssessmentScoreHandler {
	return &AssessmentScoreHandler{db: db}
}

type scoreEntry struct {
	StudentID uuid.UUID `json:"student_id" binding:"required"`
	Score     float64   `json:"score" binding:"min=0,max=100"`
	Note      string    `json:"note"`
}

type bulkScoreRequest struct {
	Entries []scoreEntry `json:"entries" binding:"required,dive"`
}

// Roster mengembalikan daftar siswa pada kelas suatu assessment beserta nilai yang sudah terisi.
func (h *AssessmentScoreHandler) Roster(c *gin.Context) {
	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}

	var assessment model.Assessment
	if err := h.db.First(&assessment, "id = ?", assessmentID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Penilaian tidak ditemukan", nil)
		return
	}

	var students []model.Student
	if err := h.db.Where("class_id = ?", assessment.ClassID).Order("name asc").Find(&students).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil siswa", nil)
		return
	}

	var existing []model.AssessmentScore
	h.db.Where("assessment_id = ?", assessmentID).Find(&existing)
	scoreByStudent := make(map[uuid.UUID]model.AssessmentScore)
	for _, s := range existing {
		scoreByStudent[s.StudentID] = s
	}

	type row struct {
		StudentID uuid.UUID `json:"student_id"`
		Name      string    `json:"name"`
		NIS       string    `json:"nis"`
		Score     float64   `json:"score"`
		Note      string    `json:"note"`
	}
	rows := make([]row, 0, len(students))
	for _, s := range students {
		r := row{StudentID: s.ID, Name: s.Name, NIS: s.NIS}
		if sc, ok := scoreByStudent[s.ID]; ok {
			r.Score = sc.Score
			r.Note = sc.Note
		}
		rows = append(rows, r)
	}
	response.OK(c, "Daftar nilai", rows)
}

// SaveBulk menyimpan nilai seluruh siswa untuk satu assessment (upsert per siswa).
func (h *AssessmentScoreHandler) SaveBulk(c *gin.Context) {
	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req bulkScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	if err := h.db.First(&model.Assessment{}, "id = ?", assessmentID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Penilaian tidak ditemukan", nil)
		return
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		for _, e := range req.Entries {
			var score model.AssessmentScore
			res := tx.Where("assessment_id = ? AND student_id = ?", assessmentID, e.StudentID).First(&score)
			score.AssessmentID = assessmentID
			score.StudentID = e.StudentID
			score.Score = e.Score
			score.Note = e.Note
			if res.Error == gorm.ErrRecordNotFound {
				if err := tx.Create(&score).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Save(&score).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan nilai", nil)
		return
	}
	response.OK(c, "Nilai disimpan", gin.H{"saved": len(req.Entries)})
}
