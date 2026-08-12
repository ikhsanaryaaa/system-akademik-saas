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

// ---- ViolationRecord (Pencatatan Pelanggaran dan Tindak Lanjut) ----

type ViolationRecordHandler struct {
	db *gorm.DB
}

func NewViolationRecordHandler(db *gorm.DB) *ViolationRecordHandler {
	return &ViolationRecordHandler{db: db}
}

// ClassID, MajorID, dan AcademicYearID diisi server dari siswa yang dipilih dan
// tahun ajaran aktif, tidak diterima dari client.
type violationRecordRequest struct {
	StudentID       uuid.UUID  `json:"student_id" binding:"required"`
	ViolationTypeID uuid.UUID  `json:"violation_type_id" binding:"required"`
	Description     string     `json:"description"`
	Date            *time.Time `json:"date"`
	ReporterName    string     `json:"reporter_name"`
}

type followUpRequest struct {
	FollowUpStatus string     `json:"follow_up_status" binding:"required,oneof=open in_progress resolved"`
	FollowUpNote   string     `json:"follow_up_note"`
	FollowUpDate   *time.Time `json:"follow_up_date"`
}

// List mendukung filter per student_id, class_id, major_id, dan follow_up_status.
func (h *ViolationRecordHandler) List(c *gin.Context) {
	q := h.db.Model(&model.ViolationRecord{}).
		Preload("Student").Preload("ViolationType").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("follow_up_status"); v != "" {
		q = q.Where("follow_up_status = ?", v)
	}
	var items []model.ViolationRecord
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pelanggaran", nil)
		return
	}
	response.OK(c, "Daftar pelanggaran", items)
}

func (h *ViolationRecordHandler) Create(c *gin.Context) {
	var req violationRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	classID, majorID, yearID, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	item := model.ViolationRecord{
		StudentID:       req.StudentID,
		ViolationTypeID: req.ViolationTypeID,
		ClassID:         classID,
		MajorID:         majorID,
		AcademicYearID:  yearID,
		Description:     req.Description,
		Date:            req.Date,
		ReporterName:    req.ReporterName,
		FollowUpStatus:  "open",
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pelanggaran", nil)
		return
	}
	response.Created(c, "Pelanggaran dicatat", item)
}

func (h *ViolationRecordHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req violationRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ViolationRecord
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pelanggaran tidak ditemukan", nil)
		return
	}
	classID, majorID, yearID, err := studentContext(h.db, req.StudentID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan", nil)
		return
	}
	if item.StudentID != req.StudentID {
		item.ClassID = classID
		item.MajorID = majorID
	}
	item.StudentID = req.StudentID
	item.ViolationTypeID = req.ViolationTypeID
	// Tahun ajaran hanya diisi sekali supaya koreksi data tidak memindahkan
	// catatan lama ke akumulasi poin tahun berjalan.
	if item.AcademicYearID == nil {
		item.AcademicYearID = yearID
	}
	item.Description = req.Description
	item.Date = req.Date
	item.ReporterName = req.ReporterName
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pelanggaran", nil)
		return
	}
	response.OK(c, "Pelanggaran diperbarui", item)
}

// FollowUp memperbarui status, catatan, dan tanggal tindak lanjut satu pelanggaran.
func (h *ViolationRecordHandler) FollowUp(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req followUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ViolationRecord
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pelanggaran tidak ditemukan", nil)
		return
	}
	item.FollowUpStatus = req.FollowUpStatus
	item.FollowUpNote = req.FollowUpNote
	item.FollowUpDate = req.FollowUpDate
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tindak lanjut", nil)
		return
	}
	response.OK(c, "Tindak lanjut disimpan", item)
}

func (h *ViolationRecordHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.ViolationRecord{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pelanggaran", nil)
		return
	}
	response.OK(c, "Pelanggaran dihapus", nil)
}
