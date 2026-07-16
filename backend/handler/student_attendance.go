package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type StudentAttendanceHandler struct {
	db *gorm.DB
}

func NewStudentAttendanceHandler(db *gorm.DB) *StudentAttendanceHandler {
	return &StudentAttendanceHandler{db: db}
}

type studentAttendanceEntry struct {
	StudentID uuid.UUID `json:"student_id" binding:"required"`
	Status    string    `json:"status" binding:"required"`
	Note      string    `json:"note"`
}

type bulkStudentAttendanceRequest struct {
	ClassID uuid.UUID                `json:"class_id" binding:"required"`
	Date    string                   `json:"date" binding:"required"`
	Entries []studentAttendanceEntry `json:"entries" binding:"required,dive"`
}

// Roster mengembalikan daftar siswa suatu kelas beserta status absensi
// yang sudah tercatat pada tanggal tertentu (bila ada).
func (h *StudentAttendanceHandler) Roster(c *gin.Context) {
	classID := c.Query("class_id")
	dateStr := c.Query("date")
	if classID == "" || dateStr == "" {
		response.Error(c, http.StatusBadRequest, "Parameter class_id dan date wajib diisi", nil)
		return
	}
	d, err := parseDate(dateStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Format tanggal harus YYYY-MM-DD", nil)
		return
	}
	date := dayStart(d)

	var students []model.Student
	if err := h.db.Where("class_id = ?", classID).Order("name asc").Find(&students).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil siswa", nil)
		return
	}

	var existing []model.StudentAttendance
	h.db.Where("class_id = ? AND date = ?", classID, date).Find(&existing)
	statusByStudent := make(map[uuid.UUID]model.StudentAttendance)
	for _, a := range existing {
		statusByStudent[a.StudentID] = a
	}

	type rosterRow struct {
		StudentID uuid.UUID `json:"student_id"`
		Name      string    `json:"name"`
		NIS       string    `json:"nis"`
		Status    string    `json:"status"`
		Note      string    `json:"note"`
	}
	rows := make([]rosterRow, 0, len(students))
	for _, s := range students {
		row := rosterRow{StudentID: s.ID, Name: s.Name, NIS: s.NIS, Status: model.AttendancePresent}
		if a, ok := statusByStudent[s.ID]; ok {
			row.Status = a.Status
			row.Note = a.Note
		}
		rows = append(rows, row)
	}
	response.OK(c, "Daftar absensi siswa", rows)
}

// SaveBulk menyimpan status absensi seluruh siswa suatu kelas untuk satu tanggal (upsert per siswa).
func (h *StudentAttendanceHandler) SaveBulk(c *gin.Context) {
	var req bulkStudentAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	d, err := parseDate(req.Date)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Format tanggal harus YYYY-MM-DD", nil)
		return
	}
	date := dayStart(d)
	classID := req.ClassID

	err = h.db.Transaction(func(tx *gorm.DB) error {
		for _, e := range req.Entries {
			var att model.StudentAttendance
			res := tx.Where("student_id = ? AND date = ?", e.StudentID, date).First(&att)
			att.StudentID = e.StudentID
			att.Date = date
			att.ClassID = &classID
			att.Status = e.Status
			att.Note = e.Note
			if res.Error == gorm.ErrRecordNotFound {
				if err := tx.Create(&att).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Save(&att).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan absensi", nil)
		return
	}
	response.OK(c, "Absensi kelas disimpan", gin.H{"saved": len(req.Entries)})
}

// Report mengembalikan rekap absensi siswa per kelas dan rentang tanggal.
func (h *StudentAttendanceHandler) Report(c *gin.Context) {
	q := h.db.Model(&model.StudentAttendance{}).Preload("Student").Preload("Class")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if s := c.Query("start"); s != "" {
		if d, err := parseDate(s); err == nil {
			q = q.Where("date >= ?", dayStart(d))
		}
	}
	if e := c.Query("end"); e != "" {
		if d, err := parseDate(e); err == nil {
			q = q.Where("date <= ?", dayStart(d))
		}
	}
	var items []model.StudentAttendance
	if err := q.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil laporan absensi", nil)
		return
	}
	response.OK(c, "Laporan absensi siswa", items)
}
