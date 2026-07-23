package handler

import (
	"crypto/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type QrAttendanceHandler struct {
	db *gorm.DB
}

func NewQrAttendanceHandler(db *gorm.DB) *QrAttendanceHandler {
	return &QrAttendanceHandler{db: db}
}

type generateTokenRequest struct {
	SessionID uuid.UUID `json:"session_id" binding:"required"`
}

type scanTokenRequest struct {
	Token    string    `json:"token" binding:"required"`
	PersonID uuid.UUID `json:"person_id" binding:"required"`
}

// GenerateToken membuat token QR untuk sesi dengan expiry.
func (h *QrAttendanceHandler) GenerateToken(c *gin.Context) {
	var req generateTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var session model.AttendanceSession
	if err := h.db.First(&session, "id = ?", req.SessionID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Sesi tidak ditemukan", nil)
		return
	}
	if session.Status != model.SessionStatusOpen {
		response.Error(c, http.StatusConflict, "Sesi belum dibuka atau sudah ditutup", nil)
		return
	}

	userID, _ := c.Get(middleware.CtxUserID)
	createdBy := userID.(uuid.UUID)

	expiresAt := time.Now().Add(15 * time.Second)

	token, err := generateSecureToken(32)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal membuat token", nil)
		return
	}
	qrToken := model.QrAttendanceToken{
		SessionID: req.SessionID,
		Token:     token,
		ExpiresAt: expiresAt,
		CreatedBy: createdBy,
	}
	if err := h.db.Create(&qrToken).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal membuat token", nil)
		return
	}
	response.Created(c, "Token QR dibuat", qrToken)
}

// ScanToken memvalidasi token, cek replay, lalu upsert record dengan method=qr.
// Validasi siswa/teacher sesuai tipe session dan membership kelas.
func (h *QrAttendanceHandler) ScanToken(c *gin.Context) {
	var req scanTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var qrToken model.QrAttendanceToken
	if err := h.db.Where("token = ?", req.Token).First(&qrToken).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Token tidak ditemukan", nil)
		return
	}

	if time.Now().After(qrToken.ExpiresAt) {
		response.Error(c, http.StatusBadRequest, "Token sudah kedaluwarsa", nil)
		return
	}

	var session model.AttendanceSession
	if err := h.db.First(&session, "id = ?", qrToken.SessionID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Sesi tidak ditemukan", nil)
		return
	}
	if session.Status != model.SessionStatusOpen {
		response.Error(c, http.StatusConflict, "Sesi belum dibuka atau sudah ditutup", nil)
		return
	}
	if session.SessionType == model.SessionTypeStudent && session.Scope == model.AttendanceScopeLesson && session.OverrideBy == nil {
		if session.ParentSessionID == nil {
			response.Error(c, http.StatusConflict, "Guru belum membuka sesi mengajar", nil)
			return
		}
		var parent model.AttendanceSession
		if err := h.db.First(&parent, "id = ? AND status = ?", session.ParentSessionID, model.SessionStatusOpen).Error; err != nil {
			response.Error(c, http.StatusConflict, "Guru belum membuka sesi mengajar", nil)
			return
		}
	}

	// Validasi person sesuai session type.
	if session.SessionType == model.SessionTypeStudent {
		var student model.Student
		if err := h.db.First(&student, "id = ?", req.PersonID).Error; err != nil {
			response.Error(c, http.StatusNotFound, "Siswa tidak ditemukan", nil)
			return
		}
		// Validasi membership kelas.
		if session.ClassID == nil || student.ClassID == nil || *session.ClassID != *student.ClassID {
			response.Error(c, http.StatusBadRequest, "Siswa bukan anggota kelas sesi ini", nil)
			return
		}
	} else if session.SessionType == model.SessionTypeTeacher {
		var teacher model.Teacher
		if err := h.db.First(&teacher, "id = ?", req.PersonID).Error; err != nil {
			response.Error(c, http.StatusNotFound, "Pendidik tidak ditemukan", nil)
			return
		}
	}

	// Cek replay: unique (token_id, person_id).
	var existingScan model.QrAttendanceScan
	if err := h.db.Where("token_id = ? AND person_id = ?", qrToken.ID, req.PersonID).First(&existingScan).Error; err == nil {
		response.Error(c, http.StatusConflict, "Token sudah dipindai oleh person ini", nil)
		return
	}

	now := time.Now()
	err := h.db.Transaction(func(tx *gorm.DB) error {
		// Buat scan record.
		scan := model.QrAttendanceScan{
			TokenID:   qrToken.ID,
			PersonID:  req.PersonID,
			ScannedAt: now,
		}
		if err := tx.Create(&scan).Error; err != nil {
			return err
		}

		// Upsert attendance record.
		var record model.AttendanceRecord
		res := tx.Where("session_id = ? AND person_id = ?", session.ID, req.PersonID).First(&record)
		isNew := res.Error == gorm.ErrRecordNotFound

		status := model.AttendancePresent
		if isLate(h.db, now) {
			status = model.AttendanceLate
		}

		record.SessionID = session.ID
		record.PersonID = req.PersonID
		record.Status = status
		record.Method = model.AttendanceMethodQR
		record.MarkedBy = nil
		record.CheckInTime = &now

		if isNew {
			if err := tx.Create(&record).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Save(&record).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mencatat scan", nil)
		return
	}
	response.OK(c, "Scan QR berhasil", gin.H{"person_id": req.PersonID, "status": "hadir"})
}

// generateSecureToken membuat token acak menggunakan crypto/rand, charset tanpa karakter ambigu.
func generateSecureToken(length int) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b), nil
}
