package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type AttendanceRecordHandler struct {
	db *gorm.DB
}

func NewAttendanceRecordHandler(db *gorm.DB) *AttendanceRecordHandler {
	return &AttendanceRecordHandler{db: db}
}

type recordEntry struct {
	PersonID uuid.UUID `json:"person_id" binding:"required"`
	Status   string    `json:"status" binding:"required,oneof=hadir terlambat izin sakit alpa"`
	Note     string    `json:"note"`
}

type markBulkRequest struct {
	SessionID uuid.UUID     `json:"session_id" binding:"required"`
	Entries   []recordEntry `json:"entries" binding:"required,dive"`
}

// List mengembalikan record per session_id, preload Student dan Teacher.
func (h *AttendanceRecordHandler) List(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		response.Error(c, http.StatusBadRequest, "Parameter session_id wajib diisi", nil)
		return
	}
	var records []model.AttendanceRecord
	if err := h.db.Where("session_id = ?", sessionID).Preload("Student").Preload("Teacher").Order("created_at asc").Find(&records).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil record absensi", nil)
		return
	}
	response.OK(c, "Daftar record absensi", records)
}

// MarkBulk upsert per (session_id, person_id), set method=manual, marked_by dari context.
// Validasi setiap siswa anggota kelas session, tolak duplicate person dalam request.
func (h *AttendanceRecordHandler) MarkBulk(c *gin.Context) {
	var req markBulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	// Cek sesi tidak closed.
	var session model.AttendanceSession
	if err := h.db.Preload("Class").First(&session, "id = ?", req.SessionID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Sesi tidak ditemukan", nil)
		return
	}
	if session.Status == model.SessionStatusClosed {
		response.Error(c, http.StatusBadRequest, "Sesi sudah ditutup, tidak bisa diubah", nil)
		return
	}

	// Cek duplicate person_id dalam request.
	personSet := make(map[uuid.UUID]bool)
	for _, e := range req.Entries {
		if personSet[e.PersonID] {
			response.Error(c, http.StatusBadRequest, "Duplicate person_id dalam request", nil)
			return
		}
		personSet[e.PersonID] = true
	}

	// Validasi membership kelas untuk student session.
	if session.SessionType == model.SessionTypeStudent && session.ClassID != nil {
		for _, e := range req.Entries {
			var student model.Student
			if err := h.db.First(&student, "id = ?", e.PersonID).Error; err != nil {
				response.Error(c, http.StatusBadRequest, "Siswa tidak ditemukan: "+e.PersonID.String(), nil)
				return
			}
			if student.ClassID == nil || *student.ClassID != *session.ClassID {
				response.Error(c, http.StatusBadRequest, "Siswa bukan anggota kelas sesi ini: "+student.Name, nil)
				return
			}
		}
	}

	userID, _ := c.Get(middleware.CtxUserID)
	markedBy := userID.(uuid.UUID)

	err := h.db.Transaction(func(tx *gorm.DB) error {
		for _, e := range req.Entries {
			var record model.AttendanceRecord
			res := tx.Where("session_id = ? AND person_id = ?", req.SessionID, e.PersonID).First(&record)
			record.SessionID = req.SessionID
			record.PersonID = e.PersonID
			record.Status = e.Status
			record.Method = model.AttendanceMethodManual
			record.MarkedBy = &markedBy
			record.Note = e.Note

			if res.Error == gorm.ErrRecordNotFound {
				if err := tx.Create(&record).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Save(&record).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan record", nil)
		return
	}
	response.OK(c, "Record absensi disimpan", gin.H{"saved": len(req.Entries)})
}

// Report mengembalikan rekap record absensi siswa dengan filter class_id, start, end, method.
// Menggabungkan session (untuk tanggal, nama sesi, kelas) dengan record (untuk status dan method).
func (h *AttendanceRecordHandler) Report(c *gin.Context) {
	q := h.db.Model(&model.AttendanceRecord{}).
		Joins("JOIN attendance_sessions ON attendance_sessions.id = attendance_records.session_id").
		Where("attendance_sessions.session_type = ?", model.SessionTypeStudent).
		Preload("Student.Class").
		Preload("Session.Class")

	if v := c.Query("class_id"); v != "" {
		q = q.Where("attendance_sessions.class_id = ?", v)
	}
	if v := c.Query("method"); v != "" {
		q = q.Where("attendance_records.method = ?", v)
	}
	if v := c.Query("scope"); v != "" {
		q = q.Where("attendance_sessions.scope = ?", v)
	}
	if s := c.Query("start"); s != "" {
		if d, err := parseDate(s); err == nil {
			q = q.Where("attendance_sessions.date >= ?", dayStart(d))
		}
	}
	if e := c.Query("end"); e != "" {
		if d, err := parseDate(e); err == nil {
			q = q.Where("attendance_sessions.date <= ?", dayStart(d))
		}
	}

	var items []model.AttendanceRecord
	if err := q.Order("attendance_sessions.date desc, attendance_sessions.created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil laporan absensi", nil)
		return
	}
	response.OK(c, "Laporan absensi siswa", items)
}

// Roster mengembalikan gabungan anggota kelas dengan record existing pada sesi student.
// Default status hadir untuk yang belum ada record.
// Roster memakai session.class_id sebagai sumber kebenaran.
func (h *AttendanceRecordHandler) Roster(c *gin.Context) {
	sessionID := c.Param("id")

	var session model.AttendanceSession
	if err := h.db.First(&session, "id = ?", sessionID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Sesi tidak ditemukan", nil)
		return
	}
	if session.SessionType != model.SessionTypeStudent {
		response.Error(c, http.StatusBadRequest, "Roster hanya untuk sesi student", nil)
		return
	}
	if session.ClassID == nil {
		response.Error(c, http.StatusBadRequest, "Sesi student tidak memiliki class_id", nil)
		return
	}

	var students []model.Student
	if err := h.db.Where("class_id = ?", session.ClassID).Order("name asc").Find(&students).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil siswa", nil)
		return
	}

	var existing []model.AttendanceRecord
	h.db.Where("session_id = ?", sessionID).Find(&existing)
	recordByPerson := make(map[uuid.UUID]model.AttendanceRecord)
	for _, r := range existing {
		recordByPerson[r.PersonID] = r
	}

	type rosterRow struct {
		StudentID uuid.UUID `json:"student_id"`
		Name      string    `json:"name"`
		NIS       string    `json:"nis"`
		Status    string    `json:"status"`
		Method    string    `json:"method"`
		Note      string    `json:"note"`
	}
	rows := make([]rosterRow, 0, len(students))
	for _, s := range students {
		row := rosterRow{StudentID: s.ID, Name: s.Name, NIS: s.NIS, Status: model.AttendancePresent, Method: ""}
		if r, ok := recordByPerson[s.ID]; ok {
			row.Status = r.Status
			row.Method = r.Method
			row.Note = r.Note
		}
		rows = append(rows, row)
	}
	response.OK(c, "Daftar absensi siswa", rows)
}
