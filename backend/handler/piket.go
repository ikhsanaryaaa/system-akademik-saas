package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// dayNames dipakai mencocokkan jadwal piket pekanan dengan tanggal tertentu.
var dayNames = []string{"minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"}

// orNow mengembalikan waktu yang dikirim client, atau waktu sekarang bila kosong.
func orNow(t *time.Time) time.Time {
	if t != nil {
		return *t
	}
	return time.Now()
}

// dayRange mengembalikan awal dan akhir hari dari sebuah waktu.
func dayRange(t time.Time) (time.Time, time.Time) {
	start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	return start, start.AddDate(0, 0, 1)
}

// dutyOfficerID menentukan guru yang bertugas piket pada satu tanggal.
// Penugasan untuk tanggal tertentu menang atas jadwal pekanan. Bila tidak ada
// jadwal sama sekali, hasilnya kosong dan pencatatan tetap dapat berjalan.
func dutyOfficerID(db *gorm.DB, date time.Time) *uuid.UUID {
	start, end := dayRange(date)

	var sched model.DutySchedule
	if db.Where("date >= ? AND date < ?", start, end).First(&sched).Error == nil {
		return &sched.TeacherID
	}
	if db.Where("date IS NULL AND LOWER(day) = ?", dayNames[int(date.Weekday())]).First(&sched).Error == nil {
		return &sched.TeacherID
	}
	return nil
}

// PiketHandler menyusun ulang data yang sudah ada menjadi layar kerja harian
// dan laporan piket. Tidak menyimpan tabel baru.
type PiketHandler struct {
	db *gorm.DB
}

func NewPiketHandler(db *gorm.DB) *PiketHandler {
	return &PiketHandler{db: db}
}

// parseDateQuery membaca parameter tanggal, jatuh ke nilai bawaan bila kosong.
func parseDateQuery(c *gin.Context, key string, fallback time.Time) time.Time {
	v := strings.TrimSpace(c.Query(key))
	if v == "" {
		return fallback
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		if t, err := time.Parse(layout, v); err == nil {
			return t
		}
	}
	return fallback
}

// Today mengembalikan keadaan piket pada satu tanggal: petugas, siswa terlambat,
// siswa yang sedang di luar, tamu yang belum keluar, pelanggaran, dan kejadian.
func (h *PiketHandler) Today(c *gin.Context) {
	date := parseDateQuery(c, "date", time.Now())
	start, end := dayRange(date)

	var officer *model.Teacher
	if id := dutyOfficerID(h.db, date); id != nil {
		var t model.Teacher
		if h.db.First(&t, "id = ?", id).Error == nil {
			officer = &t
		}
	}

	var lateness []model.Lateness
	h.db.Preload("Student").Preload("Class").
		Where("date >= ? AND date < ?", start, end).Order("date asc").Find(&lateness)

	// Siswa yang belum tercatat kembali tetap tampil walau izinnya hari sebelumnya,
	// karena itu justru yang perlu ditindaklanjuti petugas.
	var outside []model.LeavePermit
	h.db.Preload("Student").Preload("Class").
		Where("status = ?", model.LeaveOut).Order("leave_time asc").Find(&outside)

	var guests []model.GuestBook
	h.db.Where("check_out_time IS NULL").Order("check_in_time asc").Find(&guests)

	var violations []model.ViolationRecord
	h.db.Preload("Student").Preload("ViolationType").
		Where("date >= ? AND date < ?", start, end).Order("date asc").Find(&violations)

	var logs []model.DutyLog
	h.db.Preload("Teacher").
		Where("date >= ? AND date < ?", start, end).Order("date asc").Find(&logs)

	response.OK(c, "Piket hari ini", gin.H{
		"date":       start,
		"officer":    officer,
		"lateness":   lateness,
		"outside":    outside,
		"guests":     guests,
		"violations": violations,
		"logs":       logs,
	})
}

// Report merangkum kegiatan piket pada satu rentang tanggal, untuk dilaporkan
// ke kepala sekolah dan wakil kurikulum.
func (h *PiketHandler) Report(c *gin.Context) {
	now := time.Now()
	start, _ := dayRange(parseDateQuery(c, "start", now))
	_, end := dayRange(parseDateQuery(c, "end", now))
	if end.Before(start) {
		response.Error(c, http.StatusBadRequest, "Tanggal akhir tidak boleh sebelum tanggal mulai", nil)
		return
	}

	var lateness []model.Lateness
	h.db.Preload("Student").Preload("Class").Preload("OfficerTeacher").
		Where("date >= ? AND date < ?", start, end).Order("date asc").Find(&lateness)

	var permits []model.LeavePermit
	h.db.Preload("Student").Preload("Class").Preload("OfficerTeacher").
		Where("leave_time >= ? AND leave_time < ?", start, end).Order("leave_time asc").Find(&permits)

	var violations []model.ViolationRecord
	h.db.Preload("Student").Preload("ViolationType").
		Where("date >= ? AND date < ?", start, end).Order("date asc").Find(&violations)

	var guests []model.GuestBook
	h.db.Where("check_in_time >= ? AND check_in_time < ?", start, end).
		Order("check_in_time asc").Find(&guests)

	var logs []model.DutyLog
	h.db.Preload("Teacher").
		Where("date >= ? AND date < ?", start, end).Order("date asc").Find(&logs)

	totalMinutes := 0
	for _, l := range lateness {
		totalMinutes += l.Minutes
	}
	stillOut := 0
	for _, p := range permits {
		if p.Status == model.LeaveOut {
			stillOut++
		}
	}

	response.OK(c, "Laporan piket", gin.H{
		"start":      start,
		"end":        end,
		"lateness":   lateness,
		"permits":    permits,
		"violations": violations,
		"guests":     guests,
		"logs":       logs,
		"summary": gin.H{
			"lateness_count":   len(lateness),
			"lateness_minutes": totalMinutes,
			"permit_count":     len(permits),
			"permit_still_out": stillOut,
			"violation_count":  len(violations),
			"guest_count":      len(guests),
			"duty_log_count":   len(logs),
		},
	})
}
