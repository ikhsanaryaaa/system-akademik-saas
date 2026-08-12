package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Pelanggaran harian tidak lagi punya tabel sendiri. Guru piket mencatat
// langsung ke catatan pelanggaran BK supaya poinnya ikut terhitung.

// markLate menandai kehadiran siswa menjadi terlambat pada tanggal tersebut.
// Dijalankan bersama pencatatan keterlambatan supaya rekap absensi dan rekap
// piket tidak pernah berselisih angka.
func markLate(tx *gorm.DB, studentID uuid.UUID, date time.Time, classID *uuid.UUID, minutes int) error {
	day := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	att := model.StudentAttendance{
		StudentID: studentID,
		Date:      day,
		ClassID:   classID,
		Status:    model.AttendanceLate,
		Note:      fmt.Sprintf("Terlambat %d menit, dicatat guru piket", minutes),
	}
	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "student_id"}, {Name: "date"}},
		DoUpdates: clause.AssignmentColumns([]string{"status", "note", "class_id", "updated_at"}),
	}).Create(&att).Error
}

// ---- Lateness (Keterlambatan) ----

type LatenessHandler struct {
	db *gorm.DB
}

func NewLatenessHandler(db *gorm.DB) *LatenessHandler {
	return &LatenessHandler{db: db}
}

// ClassID, MajorID, dan OfficerID diisi server, masing masing dari siswa yang
// dipilih dan dari jadwal piket pada tanggal itu.
type latenessRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	Minutes   int        `json:"minutes" binding:"min=0"`
	Reason    string     `json:"reason"`
	Date      *time.Time `json:"date"`
}

func (h *LatenessHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Lateness{}).
		Preload("Student").Preload("Class").Preload("Major").Preload("OfficerTeacher")
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
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	date := orNow(req.Date)
	item := model.Lateness{
		StudentID: req.StudentID,
		ClassID:   classID,
		MajorID:   majorID,
		Minutes:   req.Minutes,
		Reason:    req.Reason,
		OfficerID: dutyOfficerID(h.db, date),
		Date:      &date,
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		return markLate(tx, req.StudentID, date, classID, req.Minutes)
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan keterlambatan", nil)
		return
	}
	response.Created(c, "Keterlambatan dicatat dan kehadiran diperbarui", item)
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
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	if item.StudentID != req.StudentID {
		item.ClassID = classID
		item.MajorID = majorID
	}
	date := orNow(req.Date)
	item.StudentID = req.StudentID
	item.Minutes = req.Minutes
	item.Reason = req.Reason
	item.Date = &date
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&item).Error; err != nil {
			return err
		}
		return markLate(tx, item.StudentID, date, item.ClassID, item.Minutes)
	})
	if err != nil {
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
	// Kehadiran hari itu tidak ikut dikembalikan, karena bisa saja sudah diubah
	// petugas absensi. Koreksi status dikerjakan dari modul absensi.
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
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	Reason    string     `json:"reason"`
	LeaveTime *time.Time `json:"leave_time"`
}

func (h *LeavePermitHandler) List(c *gin.Context) {
	q := h.db.Model(&model.LeavePermit{}).
		Preload("Student").Preload("Class").Preload("Major").Preload("OfficerTeacher")
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
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	leaveTime := orNow(req.LeaveTime)
	// Status awal selalu out. Penutupannya lewat endpoint pencatatan kembali.
	item := model.LeavePermit{
		StudentID: req.StudentID,
		ClassID:   classID,
		MajorID:   majorID,
		Reason:    req.Reason,
		Status:    model.LeaveOut,
		OfficerID: dutyOfficerID(h.db, leaveTime),
		LeaveTime: &leaveTime,
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
	classID, majorID, _, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	if item.StudentID != req.StudentID {
		item.ClassID = classID
		item.MajorID = majorID
	}
	leaveTime := orNow(req.LeaveTime)
	item.StudentID = req.StudentID
	item.Reason = req.Reason
	item.LeaveTime = &leaveTime
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan izin keluar", nil)
		return
	}
	response.OK(c, "Izin keluar diperbarui", item)
}

// Return menutup izin keluar dengan mencatat jam kembali. Dibuat sebagai aksi
// tersendiri supaya petugas tidak perlu membuka modal edit hanya untuk itu.
func (h *LeavePermitHandler) Return(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var item model.LeavePermit
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Izin keluar tidak ditemukan", nil)
		return
	}
	if item.Status == model.LeaveReturned {
		response.Error(c, http.StatusConflict, "Izin keluar ini sudah ditutup", nil)
		return
	}
	now := time.Now()
	item.Status = model.LeaveReturned
	item.ReturnTime = &now
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mencatat kembali", nil)
		return
	}
	response.OK(c, "Siswa dicatat sudah kembali", item)
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
