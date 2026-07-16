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

// ---- Achievement (Prestasi) ----

type AchievementHandler struct {
	db *gorm.DB
}

func NewAchievementHandler(db *gorm.DB) *AchievementHandler {
	return &AchievementHandler{db: db}
}

type achievementRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
	Title     string     `json:"title" binding:"required"`
	Category  string     `json:"category"`
	Level     string     `json:"level"`
	Rank      string     `json:"rank"`
	Organizer string     `json:"organizer"`
	Date      *time.Time `json:"date"`
}

func (h *AchievementHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Achievement{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.Achievement
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil prestasi", nil)
		return
	}
	response.OK(c, "Daftar prestasi", items)
}

func (h *AchievementHandler) Create(c *gin.Context) {
	var req achievementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Achievement{
		StudentID: req.StudentID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
		Title:     req.Title,
		Category:  req.Category,
		Level:     req.Level,
		Rank:      req.Rank,
		Organizer: req.Organizer,
		Date:      req.Date,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan prestasi", nil)
		return
	}
	response.Created(c, "Prestasi dibuat", item)
}

func (h *AchievementHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req achievementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Achievement
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Prestasi tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Title = req.Title
	item.Category = req.Category
	item.Level = req.Level
	item.Rank = req.Rank
	item.Organizer = req.Organizer
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan prestasi", nil)
		return
	}
	response.OK(c, "Prestasi diperbarui", item)
}

func (h *AchievementHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Achievement{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus prestasi", nil)
		return
	}
	response.OK(c, "Prestasi dihapus", nil)
}

// ---- Alumni ----

type AlumniHandler struct {
	db *gorm.DB
}

func NewAlumniHandler(db *gorm.DB) *AlumniHandler {
	return &AlumniHandler{db: db}
}

type alumniRequest struct {
	Name           string     `json:"name" binding:"required"`
	GraduationYear int        `json:"graduation_year"`
	MajorID        *uuid.UUID `json:"major_id"`
	Track          string     `json:"track"`
	Destination    string     `json:"destination"`
	Phone          string     `json:"phone"`
	Email          string     `json:"email"`
	Note           string     `json:"note"`
}

func (h *AlumniHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Alumni{}).Preload("Major")
	if v := c.Query("graduation_year"); v != "" {
		q = q.Where("graduation_year = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("track"); v != "" {
		q = q.Where("track = ?", v)
	}
	var items []model.Alumni
	if err := q.Order("graduation_year desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil alumni", nil)
		return
	}
	response.OK(c, "Daftar alumni", items)
}

func (h *AlumniHandler) Create(c *gin.Context) {
	var req alumniRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Alumni{
		Name:           req.Name,
		GraduationYear: req.GraduationYear,
		MajorID:        req.MajorID,
		Track:          req.Track,
		Destination:    req.Destination,
		Phone:          req.Phone,
		Email:          req.Email,
		Note:           req.Note,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan alumni", nil)
		return
	}
	response.Created(c, "Alumni dibuat", item)
}

func (h *AlumniHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req alumniRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Alumni
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Alumni tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.GraduationYear = req.GraduationYear
	item.MajorID = req.MajorID
	item.Track = req.Track
	item.Destination = req.Destination
	item.Phone = req.Phone
	item.Email = req.Email
	item.Note = req.Note
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan alumni", nil)
		return
	}
	response.OK(c, "Alumni diperbarui", item)
}

func (h *AlumniHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Alumni{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus alumni", nil)
		return
	}
	response.OK(c, "Alumni dihapus", nil)
}
