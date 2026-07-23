package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type RfidTapHandler struct {
	db *gorm.DB
}

func NewRfidTapHandler(db *gorm.DB) *RfidTapHandler {
	return &RfidTapHandler{db: db}
}

type rfidTapRequest struct {
	UID       string     `json:"uid" binding:"required"`
	SessionID *uuid.UUID `json:"session_id"`
}

func (h *RfidTapHandler) Tap(c *gin.Context) {
	var req rfidTapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var card model.RfidCard
	if err := h.db.Where("uid = ?", req.UID).First(&card).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Kartu tidak dikenali", nil)
		return
	}

	var personID uuid.UUID
	var sessionType, name string
	var classID *uuid.UUID

	switch {
	case card.StudentID != nil:
		var student model.Student
		if err := h.db.First(&student, "id = ?", *card.StudentID).Error; err != nil {
			response.Error(c, http.StatusNotFound, "Siswa tidak ditemukan", nil)
			return
		}
		personID, sessionType, name, classID = student.ID, model.SessionTypeStudent, student.Name, student.ClassID
	case card.TeacherID != nil:
		var teacher model.Teacher
		if err := h.db.First(&teacher, "id = ?", *card.TeacherID).Error; err != nil {
			response.Error(c, http.StatusNotFound, "Pendidik tidak ditemukan", nil)
			return
		}
		personID, sessionType, name = teacher.ID, model.SessionTypeTeacher, teacher.Name
	default:
		response.Error(c, http.StatusBadRequest, "Kartu tidak terkait siswa atau pendidik", nil)
		return
	}

	now := time.Now()
	var resultType, status string
	err := h.db.Transaction(func(tx *gorm.DB) error {
		var session model.AttendanceSession

		// Jika session_id diberikan, gunakan session tersebut.
		if req.SessionID != nil {
			if err := tx.First(&session, "id = ?", req.SessionID).Error; err != nil {
				return errors.New("session tidak ditemukan")
			}
			// Validasi session type.
			if session.SessionType != sessionType {
				return errors.New("tipe session tidak sesuai dengan tipe person")
			}
			// Validasi student membership untuk student session.
			if sessionType == model.SessionTypeStudent {
				if session.ClassID == nil || classID == nil || *session.ClassID != *classID {
					return errors.New("siswa bukan anggota kelas sesi ini")
				}
			}
		} else {
			// Fallback compatibility: pilih session berdasarkan tipe dan tanggal.
			dateKey := dayStart(now)
			if sessionType == model.SessionTypeStudent {
				// Tanpa session_id, RFID hanya memilih sesi harian.
				if classID == nil {
					return errors.New("siswa tidak memiliki kelas")
				}
				// Cek apakah ada lebih dari satu session untuk kelas ini pada tanggal ini.
				var count int64
				tx.Model(&model.AttendanceSession{}).
					Where("session_type = ? AND scope = ? AND class_id = ? AND date = ?", sessionType, model.AttendanceScopeDaily, classID, dateKey).
					Count(&count)
				if count > 1 {
					return errors.New("lebih dari satu session aktif untuk kelas ini, harap tentukan session_id")
				}
				if err := tx.Where("session_type = ? AND scope = ? AND class_id = ? AND date = ?", sessionType, model.AttendanceScopeDaily, classID, dateKey).
					FirstOrCreate(&session, model.AttendanceSession{
						SessionType:   sessionType,
						Scope:         model.AttendanceScopeDaily,
						Date:          dateKey,
						ClassID:       classID,
						Name:          "RFID Auto",
						Status:        model.SessionStatusOpen,
						DefaultMethod: model.AttendanceMethodRFID,
					}).Error; err != nil {
					return err
				}
			} else {
				// Untuk teacher, tetap global per tanggal.
				if err := tx.Where("session_type = ? AND scope = ? AND date = ?", sessionType, model.AttendanceScopeDaily, dateKey).
					FirstOrCreate(&session, model.AttendanceSession{
						SessionType:   sessionType,
						Scope:         model.AttendanceScopeDaily,
						Date:          dateKey,
						Status:        model.SessionStatusOpen,
						DefaultMethod: model.AttendanceMethodRFID,
					}).Error; err != nil {
					return err
				}
			}
		}

		if session.Status == model.SessionStatusClosed {
			return errAttendanceSessionClosed
		}
		if session.SessionType == model.SessionTypeStudent && session.Scope == model.AttendanceScopeLesson && session.OverrideBy == nil {
			if session.ParentSessionID == nil {
				return errors.New("Guru belum membuka sesi mengajar")
			}
			var parent model.AttendanceSession
			if err := tx.First(&parent, "id = ? AND status = ?", session.ParentSessionID, model.SessionStatusOpen).Error; err != nil {
				return errors.New("Guru belum membuka sesi mengajar")
			}
		}
		if session.Status == model.SessionStatusDraft {
			if err := tx.Model(&session).Update("status", model.SessionStatusOpen).Error; err != nil {
				return err
			}
		}

		var record model.AttendanceRecord
		err := tx.Where("session_id = ? AND person_id = ?", session.ID, personID).First(&record).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			status = model.AttendancePresent
			if isLate(tx, now) {
				status = model.AttendanceLate
			}
			record = model.AttendanceRecord{
				SessionID:   session.ID,
				PersonID:    personID,
				Status:      status,
				Method:      model.AttendanceMethodRFID,
				CheckInTime: &now,
			}
			resultType = "masuk"
			return tx.Create(&record).Error
		}
		if err != nil {
			return err
		}
		record.CheckOutTime = &now
		status, resultType = record.Status, "keluar"
		return tx.Save(&record).Error
	})
	if errors.Is(err, errAttendanceSessionClosed) {
		response.Error(c, http.StatusBadRequest, "Sesi absensi sudah ditutup", nil)
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mencatat kehadiran: "+err.Error(), nil)
		return
	}
	response.OK(c, "Tap tercatat", gin.H{"name": name, "type": resultType, "status": status})
}

var errAttendanceSessionClosed = errors.New("attendance session closed")
