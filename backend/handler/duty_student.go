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

// ---- DailyViolation (Pelanggaran Harian) ----

type DailyViolationHandler struct {
	db *gorm.DB
}

func NewDailyViolationHandler(db *gorm.DB) *DailyViolationHandler {
	return &DailyViolationHandler{db: db}
}

type dailyViolationRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
	Category  string     `json:"category"`
	Detail    string     `json:"detail"`
	Officer   string     `json:"officer"`
	Date      *time.Time `json:"date"`
}

func (h *DailyViolationHandler) List(c *gin.Context) {
	q := h.db.Model(&model.DailyViolation{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.DailyViolation
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pelanggaran harian", nil)
		return
	}
	response.OK(c, "Daftar pelanggaran harian", items)
}

func (h *DailyViolationHandler) Create(c *gin.Context) {
	var req dailyViolationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.DailyViolation{
		StudentID: req.StudentID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
		Category:  req.Category,
		Detail:    req.Detail,
		Officer:   req.Officer,
		Date:      req.Date,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pelanggaran harian", nil)
		return
	}
	response.Created(c, "Pelanggaran harian dicatat", item)
}

func (h *DailyViolationHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req dailyViolationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.DailyViolation
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pelanggaran harian tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Category = req.Category
	item.Detail = req.Detail
	item.Officer = req.Officer
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pelanggaran harian", nil)
		return
	}
	response.OK(c, "Pelanggaran harian diperbarui", item)
}

func (h *DailyViolationHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.DailyViolation{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pelanggaran harian", nil)
		return
	}
	response.OK(c, "Pelanggaran harian dihapus", nil)
}

// ---- Lateness (Keterlambatan) ----

type LatenessHandler struct {
	db *gorm.DB
}

func NewLatenessHandler(db *gorm.DB) *LatenessHandler {
	return &LatenessHandler{db: db}
}

type latenessRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
	Minutes   int        `json:"minutes" binding:"min=0"`
	Reason    string     `json:"reason"`
	Officer   string     `json:"officer"`
	Date      *time.Time `json:"date"`
}

func (h *LatenessHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Lateness{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	var items []model.Lateness
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil keterlambatan", nil)
		return
	}
	response.OK(c, "Daftar keterlambatan", items)
}

func (h *LatenessHandler) Create(c *gin.Context) {
	var req latenessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Lateness{
		StudentID: req.StudentID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
		Minutes:   req.Minutes,
		Reason:    req.Reason,
		Officer:   req.Officer,
		Date:      req.Date,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan keterlambatan", nil)
		return
	}
	response.Created(c, "Keterlambatan dicatat", item)
}

func (h *LatenessHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req latenessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Lateness
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Keterlambatan tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Minutes = req.Minutes
	item.Reason = req.Reason
	item.Officer = req.Officer
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan keterlambatan", nil)
		return
	}
	response.OK(c, "Keterlambatan diperbarui", item)
}

func (h *LatenessHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Lateness{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus keterlambatan", nil)
		return
	}
	response.OK(c, "Keterlambatan dihapus", nil)
}

// ---- LeavePermit (Izin Keluar) ----

type LeavePermitHandler struct {
	db *gorm.DB
}

func NewLeavePermitHandler(db *gorm.DB) *LeavePermitHandler {
	return &LeavePermitHandler{db: db}
}

type leavePermitRequest struct {
	StudentID  uuid.UUID  `json:"student_id" binding:"required"`
	ClassID    *uuid.UUID `json:"class_id"`
	MajorID    *uuid.UUID `json:"major_id"`
	Reason     string     `json:"reason"`
	Status     string     `json:"status" binding:"omitempty,oneof=out returned"`
	Officer    string     `json:"officer"`
	LeaveTime  *time.Time `json:"leave_time"`
	ReturnTime *time.Time `json:"return_time"`
}

func (h *LeavePermitHandler) List(c *gin.Context) {
	q := h.db.Model(&model.LeavePermit{}).Preload("Student").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	var items []model.LeavePermit
	if err := q.Order("leave_time desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil izin keluar", nil)
		return
	}
	response.OK(c, "Daftar izin keluar", items)
}

func (h *LeavePermitHandler) Create(c *gin.Context) {
	var req leavePermitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	status := req.Status
	if status == "" {
		status = "out"
	}
	item := model.LeavePermit{
		StudentID:  req.StudentID,
		ClassID:    req.ClassID,
		MajorID:    req.MajorID,
		Reason:     req.Reason,
		Status:     status,
		Officer:    req.Officer,
		LeaveTime:  req.LeaveTime,
		ReturnTime: req.ReturnTime,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan izin keluar", nil)
		return
	}
	response.Created(c, "Izin keluar dicatat", item)
}

func (h *LeavePermitHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req leavePermitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.LeavePermit
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Izin keluar tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Reason = req.Reason
	if req.Status != "" {
		item.Status = req.Status
	}
	item.Officer = req.Officer
	item.LeaveTime = req.LeaveTime
	item.ReturnTime = req.ReturnTime
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan izin keluar", nil)
		return
	}
	response.OK(c, "Izin keluar diperbarui", item)
}

func (h *LeavePermitHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.LeavePermit{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus izin keluar", nil)
		return
	}
	response.OK(c, "Izin keluar dihapus", nil)
}
