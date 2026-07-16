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

// ---- CounselingSession (Sesi Konseling) ----

type CounselingSessionHandler struct {
	db *gorm.DB
}

func NewCounselingSessionHandler(db *gorm.DB) *CounselingSessionHandler {
	return &CounselingSessionHandler{db: db}
}

type counselingSessionRequest struct {
	StudentID   uuid.UUID  `json:"student_id" binding:"required"`
	ClassID     *uuid.UUID `json:"class_id"`
	MajorID     *uuid.UUID `json:"major_id"`
	Type        string     `json:"type"`
	Topic       string     `json:"topic" binding:"required"`
	Summary     string     `json:"summary"`
	Result      string     `json:"result"`
	CounselName string     `json:"counsel_name"`
	Date        *time.Time `json:"date"`
}

func (h *CounselingSessionHandler) List(c *gin.Context) {
	q := h.db.Model(&model.CounselingSession{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.CounselingSession
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil sesi konseling", nil)
		return
	}
	response.OK(c, "Daftar sesi konseling", items)
}

func (h *CounselingSessionHandler) Create(c *gin.Context) {
	var req counselingSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.CounselingSession{
		StudentID:   req.StudentID,
		ClassID:     req.ClassID,
		MajorID:     req.MajorID,
		Type:        req.Type,
		Topic:       req.Topic,
		Summary:     req.Summary,
		Result:      req.Result,
		CounselName: req.CounselName,
		Date:        req.Date,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan sesi konseling", nil)
		return
	}
	response.Created(c, "Sesi konseling dibuat", item)
}

func (h *CounselingSessionHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req counselingSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.CounselingSession
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Sesi konseling tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Type = req.Type
	item.Topic = req.Topic
	item.Summary = req.Summary
	item.Result = req.Result
	item.CounselName = req.CounselName
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan sesi konseling", nil)
		return
	}
	response.OK(c, "Sesi konseling diperbarui", item)
}

func (h *CounselingSessionHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.CounselingSession{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus sesi konseling", nil)
		return
	}
	response.OK(c, "Sesi konseling dihapus", nil)
}

// ---- HomeVisit (Kunjungan Rumah) ----

type HomeVisitHandler struct {
	db *gorm.DB
}

func NewHomeVisitHandler(db *gorm.DB) *HomeVisitHandler {
	return &HomeVisitHandler{db: db}
}

type homeVisitRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
	Purpose   string     `json:"purpose" binding:"required"`
	Address   string     `json:"address"`
	Result    string     `json:"result"`
	Officer   string     `json:"officer"`
	Date      *time.Time `json:"date"`
}

func (h *HomeVisitHandler) List(c *gin.Context) {
	q := h.db.Model(&model.HomeVisit{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.HomeVisit
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil home visit", nil)
		return
	}
	response.OK(c, "Daftar home visit", items)
}

func (h *HomeVisitHandler) Create(c *gin.Context) {
	var req homeVisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.HomeVisit{
		StudentID: req.StudentID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
		Purpose:   req.Purpose,
		Address:   req.Address,
		Result:    req.Result,
		Officer:   req.Officer,
		Date:      req.Date,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan home visit", nil)
		return
	}
	response.Created(c, "Home visit dibuat", item)
}

func (h *HomeVisitHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req homeVisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.HomeVisit
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Home visit tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Purpose = req.Purpose
	item.Address = req.Address
	item.Result = req.Result
	item.Officer = req.Officer
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan home visit", nil)
		return
	}
	response.OK(c, "Home visit diperbarui", item)
}

func (h *HomeVisitHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.HomeVisit{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus home visit", nil)
		return
	}
	response.OK(c, "Home visit dihapus", nil)
}
