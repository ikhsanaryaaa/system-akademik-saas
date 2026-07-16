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

type AcademicCalendarHandler struct {
	db *gorm.DB
}

func NewAcademicCalendarHandler(db *gorm.DB) *AcademicCalendarHandler {
	return &AcademicCalendarHandler{db: db}
}

type academicCalendarRequest struct {
	Title          string    `json:"title" binding:"required"`
	Description    string    `json:"description"`
	EventType      string    `json:"event_type" binding:"required"`
	StartDate      time.Time `json:"start_date" binding:"required"`
	EndDate        time.Time `json:"end_date" binding:"required"`
	AcademicYearID uuid.UUID `json:"academic_year_id" binding:"required"`
}

// List mendukung filter per academic_year_id.
func (h *AcademicCalendarHandler) List(c *gin.Context) {
	q := h.db.Model(&model.AcademicCalendar{}).Preload("AcademicYear")
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}
	var items []model.AcademicCalendar
	if err := q.Order("start_date asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil kalender", nil)
		return
	}
	response.OK(c, "Daftar kalender akademik", items)
}

func (h *AcademicCalendarHandler) Create(c *gin.Context) {
	var req academicCalendarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	if req.EndDate.Before(req.StartDate) {
		response.Error(c, http.StatusBadRequest, "Tanggal selesai tidak boleh sebelum tanggal mulai", nil)
		return
	}
	item := model.AcademicCalendar{
		Title:          req.Title,
		Description:    req.Description,
		EventType:      req.EventType,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan agenda", nil)
		return
	}
	response.Created(c, "Agenda dibuat", item)
}

func (h *AcademicCalendarHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req academicCalendarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	if req.EndDate.Before(req.StartDate) {
		response.Error(c, http.StatusBadRequest, "Tanggal selesai tidak boleh sebelum tanggal mulai", nil)
		return
	}
	var item model.AcademicCalendar
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Agenda tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.Description = req.Description
	item.EventType = req.EventType
	item.StartDate = req.StartDate
	item.EndDate = req.EndDate
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan agenda", nil)
		return
	}
	response.OK(c, "Agenda diperbarui", item)
}

func (h *AcademicCalendarHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.AcademicCalendar{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus agenda", nil)
		return
	}
	response.OK(c, "Agenda dihapus", nil)
}
