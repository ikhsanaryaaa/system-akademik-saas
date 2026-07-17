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

// ---- DutySchedule (Jadwal Piket) ----

type DutyScheduleHandler struct {
	db *gorm.DB
}

func NewDutyScheduleHandler(db *gorm.DB) *DutyScheduleHandler {
	return &DutyScheduleHandler{db: db}
}

type dutyScheduleRequest struct {
	TeacherID uuid.UUID  `json:"teacher_id" binding:"required"`
	Day       string     `json:"day" binding:"required"`
	Date      *time.Time `json:"date"`
	Note      string     `json:"note"`
}

func (h *DutyScheduleHandler) List(c *gin.Context) {
	q := h.db.Model(&model.DutySchedule{}).Preload("Teacher")
	if v := c.Query("day"); v != "" {
		q = q.Where("day = ?", v)
	}
	if v := c.Query("teacher_id"); v != "" {
		q = q.Where("teacher_id = ?", v)
	}
	var items []model.DutySchedule
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jadwal piket", nil)
		return
	}
	response.OK(c, "Daftar jadwal piket", items)
}

func (h *DutyScheduleHandler) Create(c *gin.Context) {
	var req dutyScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.DutySchedule{TeacherID: req.TeacherID, Day: req.Day, Date: req.Date, Note: req.Note}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jadwal piket", nil)
		return
	}
	response.Created(c, "Jadwal piket dibuat", item)
}

func (h *DutyScheduleHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req dutyScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.DutySchedule
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal piket tidak ditemukan", nil)
		return
	}
	item.TeacherID = req.TeacherID
	item.Day = req.Day
	item.Date = req.Date
	item.Note = req.Note
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jadwal piket", nil)
		return
	}
	response.OK(c, "Jadwal piket diperbarui", item)
}

func (h *DutyScheduleHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.DutySchedule{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus jadwal piket", nil)
		return
	}
	response.OK(c, "Jadwal piket dihapus", nil)
}

// ---- DutyLog (Buku Piket) ----

type DutyLogHandler struct {
	db *gorm.DB
}

func NewDutyLogHandler(db *gorm.DB) *DutyLogHandler {
	return &DutyLogHandler{db: db}
}

type dutyLogRequest struct {
	TeacherID *uuid.UUID `json:"teacher_id"`
	Date      *time.Time `json:"date"`
	Incident  string     `json:"incident"`
	Action    string     `json:"action"`
}

func (h *DutyLogHandler) List(c *gin.Context) {
	var items []model.DutyLog
	if err := h.db.Preload("Teacher").Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil buku piket", nil)
		return
	}
	response.OK(c, "Daftar buku piket", items)
}

func (h *DutyLogHandler) Create(c *gin.Context) {
	var req dutyLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.DutyLog{TeacherID: req.TeacherID, Date: req.Date, Incident: req.Incident, Action: req.Action}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan buku piket", nil)
		return
	}
	response.Created(c, "Buku piket dibuat", item)
}

func (h *DutyLogHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req dutyLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.DutyLog
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Buku piket tidak ditemukan", nil)
		return
	}
	item.TeacherID = req.TeacherID
	item.Date = req.Date
	item.Incident = req.Incident
	item.Action = req.Action
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan buku piket", nil)
		return
	}
	response.OK(c, "Buku piket diperbarui", item)
}

func (h *DutyLogHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.DutyLog{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus buku piket", nil)
		return
	}
	response.OK(c, "Buku piket dihapus", nil)
}

// ---- GuestBook (Buku Tamu) ----

type GuestBookHandler struct {
	db *gorm.DB
}

func NewGuestBookHandler(db *gorm.DB) *GuestBookHandler {
	return &GuestBookHandler{db: db}
}

type guestBookRequest struct {
	Name         string     `json:"name" binding:"required"`
	Institution  string     `json:"institution"`
	Purpose      string     `json:"purpose"`
	Phone        string     `json:"phone"`
	CheckInTime  *time.Time `json:"check_in_time"`
	CheckOutTime *time.Time `json:"check_out_time"`
}

func (h *GuestBookHandler) List(c *gin.Context) {
	var items []model.GuestBook
	if err := h.db.Order("check_in_time desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil buku tamu", nil)
		return
	}
	response.OK(c, "Daftar buku tamu", items)
}

func (h *GuestBookHandler) Create(c *gin.Context) {
	var req guestBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.GuestBook{
		Name:         req.Name,
		Institution:  req.Institution,
		Purpose:      req.Purpose,
		Phone:        req.Phone,
		CheckInTime:  req.CheckInTime,
		CheckOutTime: req.CheckOutTime,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan buku tamu", nil)
		return
	}
	response.Created(c, "Buku tamu dibuat", item)
}

func (h *GuestBookHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req guestBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.GuestBook
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Buku tamu tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Institution = req.Institution
	item.Purpose = req.Purpose
	item.Phone = req.Phone
	item.CheckInTime = req.CheckInTime
	item.CheckOutTime = req.CheckOutTime
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan buku tamu", nil)
		return
	}
	response.OK(c, "Buku tamu diperbarui", item)
}

func (h *GuestBookHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.GuestBook{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus buku tamu", nil)
		return
	}
	response.OK(c, "Buku tamu dihapus", nil)
}
