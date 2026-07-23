package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AttendanceSessionHandler struct{ db *gorm.DB }

func NewAttendanceSessionHandler(db *gorm.DB) *AttendanceSessionHandler {
	return &AttendanceSessionHandler{db: db}
}

type createSessionRequest struct {
	SessionType      string     `json:"session_type" binding:"required,oneof=student teacher"`
	Scope            string     `json:"scope" binding:"omitempty,oneof=daily lesson"`
	Date             string     `json:"date" binding:"required"`
	ClassID          *uuid.UUID `json:"class_id"`
	Name             string     `json:"name"`
	DefaultMethod    string     `json:"default_method" binding:"required,oneof=manual qr rfid"`
	LessonScheduleID *uuid.UUID `json:"lesson_schedule_id"`
}

type overrideSessionRequest struct {
	OverrideReason      string     `json:"override_reason" binding:"required"`
	SubstituteTeacherID *uuid.UUID `json:"substitute_teacher_id"`
}

type teachingSessionRequest struct {
	LessonScheduleID uuid.UUID `json:"lesson_schedule_id" binding:"required"`
	Date             string    `json:"date" binding:"required"`
	DefaultMethod    string    `json:"default_method" binding:"omitempty,oneof=manual qr rfid"`
}

func normalizeSessionName(name string) string { return strings.ToLower(strings.TrimSpace(name)) }

func attendancePreloads(q *gorm.DB) *gorm.DB {
	return q.Preload("Class").Preload("Subject").Preload("Teacher").Preload("ParentSession")
}

func (h *AttendanceSessionHandler) List(c *gin.Context) {
	q := h.db.Model(&model.AttendanceSession{})
	for key, column := range map[string]string{"session_type": "session_type", "scope": "scope", "class_id": "class_id", "lesson_schedule_id": "lesson_schedule_id", "status": "status"} {
		if v := c.Query(key); v != "" {
			q = q.Where(column+" = ?", v)
		}
	}
	if v := c.Query("date"); v != "" {
		if d, err := parseDate(v); err == nil {
			q = q.Where("date = ?", dayStart(d))
		}
	}
	if v := c.Query("start"); v != "" {
		if d, err := parseDate(v); err == nil {
			q = q.Where("date >= ?", dayStart(d))
		}
	}
	if v := c.Query("end"); v != "" {
		if d, err := parseDate(v); err == nil {
			q = q.Where("date <= ?", dayStart(d))
		}
	}

	var items []model.AttendanceSession
	if err := attendancePreloads(q).Order("date desc, created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil sesi absensi", nil)
		return
	}
	if len(items) > 0 {
		ids := make([]uuid.UUID, len(items))
		classIDs := make([]uuid.UUID, 0)
		for i := range items {
			ids[i] = items[i].ID
			if items[i].SessionType == model.SessionTypeStudent && items[i].ClassID != nil {
				classIDs = append(classIDs, *items[i].ClassID)
			}
		}
		type countRow struct {
			ID    uuid.UUID
			Count int64
		}
		var present, students []countRow
		h.db.Model(&model.AttendanceRecord{}).Select("session_id AS id, COUNT(*) AS count").Where("session_id IN ? AND status IN ?", ids, []string{model.AttendancePresent, model.AttendanceLate}).Group("session_id").Scan(&present)
		if len(classIDs) > 0 {
			h.db.Model(&model.Student{}).Select("class_id AS id, COUNT(*) AS count").Where("class_id IN ?", classIDs).Group("class_id").Scan(&students)
		}
		pm, sm := map[uuid.UUID]int64{}, map[uuid.UUID]int64{}
		for _, r := range present {
			pm[r.ID] = r.Count
		}
		for _, r := range students {
			sm[r.ID] = r.Count
		}
		for i := range items {
			items[i].PresentCount = pm[items[i].ID]
			if items[i].ClassID != nil {
				items[i].StudentCount = sm[*items[i].ClassID]
			}
		}
	}
	response.OK(c, "Daftar sesi absensi", items)
}

func (h *AttendanceSessionHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, 400, "ID tidak valid", nil)
		return
	}
	var session model.AttendanceSession
	if err := attendancePreloads(h.db).Preload("Records.Student").Preload("Records.Teacher").First(&session, "id = ?", id).Error; err != nil {
		response.Error(c, 404, "Sesi tidak ditemukan", nil)
		return
	}
	response.OK(c, "Detail sesi", session)
}

func weekday(t time.Time) int {
	w := int(t.Weekday())
	if w == 0 {
		return 7
	}
	return w
}

func (h *AttendanceSessionHandler) buildSession(req createSessionRequest) (model.AttendanceSession, error) {
	d, err := parseDate(req.Date)
	if err != nil {
		return model.AttendanceSession{}, errors.New("format tanggal harus YYYY-MM-DD")
	}
	scope := req.Scope
	if scope == "" {
		scope = model.AttendanceScopeDaily
	}
	s := model.AttendanceSession{SessionType: req.SessionType, Scope: scope, Date: dayStart(d), ClassID: req.ClassID, Name: strings.TrimSpace(req.Name), Status: model.SessionStatusDraft, DefaultMethod: req.DefaultMethod}
	if scope == model.AttendanceScopeDaily {
		if req.SessionType == model.SessionTypeStudent && (req.ClassID == nil || s.Name == "") {
			return s, errors.New("class_id dan name wajib untuk sesi student daily")
		}
		if req.SessionType == model.SessionTypeTeacher {
			s.ClassID = nil
		}
		return s, nil
	}
	if req.LessonScheduleID == nil {
		return s, errors.New("lesson_schedule_id wajib untuk scope lesson")
	}
	var schedule model.LessonSchedule
	if err := h.db.First(&schedule, "id = ?", req.LessonScheduleID).Error; err != nil {
		return s, errors.New("jadwal pelajaran tidak ditemukan")
	}
	if schedule.DayOfWeek != weekday(s.Date) {
		return s, errors.New("jadwal pelajaran tidak sesuai dengan hari tanggal sesi")
	}
	s.LessonScheduleID, s.SubjectID, s.TeacherID = &schedule.ID, &schedule.SubjectID, schedule.TeacherID
	s.ScheduledStart, s.ScheduledEnd = &schedule.StartTime, &schedule.EndTime
	if req.SessionType == model.SessionTypeStudent {
		s.ClassID = &schedule.ClassID
	} else {
		s.ClassID = nil
	}
	return s, nil
}

func (h *AttendanceSessionHandler) Create(c *gin.Context) {
	var req createSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Input tidak valid", err.Error())
		return
	}
	s, err := h.buildSession(req)
	if err != nil {
		response.Error(c, 400, err.Error(), nil)
		return
	}
	if s.ClassID != nil {
		var count int64
		h.db.Model(&model.Class{}).Where("id = ?", s.ClassID).Count(&count)
		if count == 0 {
			response.Error(c, 404, "Kelas tidak ditemukan", nil)
			return
		}
	}
	if err := h.db.Create(&s).Error; err != nil {
		response.Error(c, 409, "Sesi dengan scope dan jadwal tersebut sudah ada", nil)
		return
	}
	response.Created(c, "Sesi dibuat", s)
}

func (h *AttendanceSessionHandler) findOpenTeacherSession(s *model.AttendanceSession) error {
	if s.Scope != model.AttendanceScopeLesson || s.SessionType != model.SessionTypeStudent {
		return nil
	}
	var parent model.AttendanceSession
	if err := h.db.Where("session_type = ? AND scope = ? AND lesson_schedule_id = ? AND date = ? AND status = ?", model.SessionTypeTeacher, model.AttendanceScopeLesson, s.LessonScheduleID, s.Date, model.SessionStatusOpen).First(&parent).Error; err != nil {
		return errors.New("Guru belum membuka sesi mengajar")
	}
	s.ParentSessionID = &parent.ID
	return nil
}

func (h *AttendanceSessionHandler) Open(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, 400, "ID tidak valid", nil)
		return
	}
	var s model.AttendanceSession
	if err := h.db.First(&s, "id = ?", id).Error; err != nil {
		response.Error(c, 404, "Sesi tidak ditemukan", nil)
		return
	}
	if s.Status == model.SessionStatusOpen {
		response.Error(c, 409, "Sesi sudah terbuka", nil)
		return
	}
	if s.OverrideBy == nil {
		if err := h.findOpenTeacherSession(&s); err != nil {
			response.Error(c, 409, err.Error(), nil)
			return
		}
	}
	userID, _ := c.Get(middleware.CtxUserID)
	uid := userID.(uuid.UUID)
	now := time.Now()
	s.Status, s.OpenedBy, s.OpenedAt, s.ClosedBy, s.ClosedAt = model.SessionStatusOpen, &uid, &now, nil, nil
	if err := h.db.Save(&s).Error; err != nil {
		response.Error(c, 500, "Gagal membuka sesi", nil)
		return
	}
	response.OK(c, "Sesi dibuka", s)
}

func (h *AttendanceSessionHandler) OpenTeaching(c *gin.Context) {
	var req teachingSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Input tidak valid", err.Error())
		return
	}
	method := req.DefaultMethod
	if method == "" {
		method = model.AttendanceMethodManual
	}
	s, err := h.buildSession(createSessionRequest{SessionType: model.SessionTypeTeacher, Scope: model.AttendanceScopeLesson, Date: req.Date, DefaultMethod: method, LessonScheduleID: &req.LessonScheduleID})
	if err != nil {
		response.Error(c, 400, err.Error(), nil)
		return
	}
	if s.TeacherID == nil {
		response.Error(c, 400, "Jadwal belum memiliki guru", nil)
		return
	}
	userID, _ := c.Get(middleware.CtxUserID)
	uid := userID.(uuid.UUID)
	var actor model.Teacher
	if err := h.db.Where("user_id = ?", uid).First(&actor).Error; err != nil || actor.ID != *s.TeacherID {
		response.Error(c, 403, "Jadwal bukan milik guru login", nil)
		return
	}
	now := time.Now()
	s.Status, s.OpenedBy, s.OpenedAt = model.SessionStatusOpen, &uid, &now
	err = h.db.Transaction(func(tx *gorm.DB) error {
		var existing model.AttendanceSession
		res := tx.Where("session_type = ? AND scope = ? AND lesson_schedule_id = ? AND date = ?", s.SessionType, s.Scope, s.LessonScheduleID, s.Date).First(&existing)
		if res.Error == nil {
			existing.Status, existing.OpenedBy, existing.OpenedAt = s.Status, s.OpenedBy, s.OpenedAt
			s = existing
			if err := tx.Save(&s).Error; err != nil {
				return err
			}
		} else if !errors.Is(res.Error, gorm.ErrRecordNotFound) {
			return res.Error
		} else if err := tx.Create(&s).Error; err != nil {
			return err
		}
		record := model.AttendanceRecord{SessionID: s.ID, PersonID: *s.TeacherID, Status: model.AttendancePresent, Method: method, MarkedBy: &uid, CheckInTime: &now}
		return tx.Where("session_id = ? AND person_id = ?", s.ID, *s.TeacherID).Assign(record).FirstOrCreate(&record).Error
	})
	if err != nil {
		response.Error(c, 500, "Gagal membuka sesi mengajar", nil)
		return
	}
	response.OK(c, "Sesi mengajar dibuka", s)
}

func (h *AttendanceSessionHandler) TeachingSchedule(c *gin.Context) {
	date, err := parseDate(c.Query("date"))
	if err != nil {
		response.Error(c, 400, "Format tanggal harus YYYY-MM-DD", nil)
		return
	}
	userID, _ := c.Get(middleware.CtxUserID)
	var teacher model.Teacher
	if err := h.db.Where("user_id = ?", userID).First(&teacher).Error; err != nil {
		response.Error(c, 404, "Data guru login tidak ditemukan", nil)
		return
	}
	var rows []model.LessonSchedule
	if err := h.db.Where("teacher_id = ? AND day_of_week = ?", teacher.ID, weekday(date)).Preload("Class").Preload("Subject").Order("start_time asc").Find(&rows).Error; err != nil {
		response.Error(c, 500, "Gagal mengambil jadwal mengajar", nil)
		return
	}
	response.OK(c, "Jadwal mengajar", rows)
}

func (h *AttendanceSessionHandler) Override(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, 400, "ID tidak valid", nil)
		return
	}
	var req overrideSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.OverrideReason) == "" {
		response.Error(c, 400, "override_reason wajib diisi", nil)
		return
	}
	var s model.AttendanceSession
	if err := h.db.First(&s, "id = ?", id).Error; err != nil {
		response.Error(c, 404, "Sesi tidak ditemukan", nil)
		return
	}
	if s.SessionType != model.SessionTypeStudent || s.Scope != model.AttendanceScopeLesson {
		response.Error(c, 400, "Override hanya untuk sesi student lesson", nil)
		return
	}
	userID, _ := c.Get(middleware.CtxUserID)
	uid := userID.(uuid.UUID)
	now := time.Now()
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if req.SubstituteTeacherID != nil {
			var teacher model.Teacher
			if err := tx.First(&teacher, "id = ?", req.SubstituteTeacherID).Error; err != nil {
				return errors.New("guru pengganti tidak ditemukan")
			}
			parent := model.AttendanceSession{SessionType: model.SessionTypeTeacher, Scope: model.AttendanceScopeLesson, Date: s.Date, Status: model.SessionStatusOpen, DefaultMethod: model.AttendanceMethodManual, LessonScheduleID: s.LessonScheduleID, SubjectID: s.SubjectID, TeacherID: req.SubstituteTeacherID, ScheduledStart: s.ScheduledStart, ScheduledEnd: s.ScheduledEnd, OpenedBy: &uid, OpenedAt: &now, OverrideBy: &uid, OverrideReason: strings.TrimSpace(req.OverrideReason)}
			if err := tx.Create(&parent).Error; err != nil {
				return err
			}
			s.ParentSessionID = &parent.ID
		}
		s.Status, s.OpenedBy, s.OpenedAt, s.OverrideBy, s.OverrideReason = model.SessionStatusOpen, &uid, &now, &uid, strings.TrimSpace(req.OverrideReason)
		return tx.Save(&s).Error
	})
	if err != nil {
		response.Error(c, 400, "Gagal override sesi: "+err.Error(), nil)
		return
	}
	response.OK(c, "Sesi dibuka dengan override", s)
}

func (h *AttendanceSessionHandler) Close(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, 400, "ID tidak valid", nil)
		return
	}
	var s model.AttendanceSession
	if err := h.db.First(&s, "id = ?", id).Error; err != nil {
		response.Error(c, 404, "Sesi tidak ditemukan", nil)
		return
	}
	if s.Status != model.SessionStatusOpen {
		response.Error(c, 400, "Hanya sesi open yang bisa ditutup", nil)
		return
	}
	userID, _ := c.Get(middleware.CtxUserID)
	uid := userID.(uuid.UUID)
	now := time.Now()
	s.Status, s.ClosedBy, s.ClosedAt = model.SessionStatusClosed, &uid, &now
	if err := h.db.Save(&s).Error; err != nil {
		response.Error(c, 500, "Gagal menutup sesi", nil)
		return
	}
	response.OK(c, "Sesi ditutup", s)
}

func (h *AttendanceSessionHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, 400, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		var s model.AttendanceSession
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&s, "id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Where("token_id IN (?)", tx.Model(&model.QrAttendanceToken{}).Select("id").Where("session_id = ?", id)).Delete(&model.QrAttendanceScan{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", id).Delete(&model.QrAttendanceToken{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", id).Delete(&model.AttendanceRecord{}).Error; err != nil {
			return err
		}
		return tx.Delete(&s).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.Error(c, 404, "Sesi tidak ditemukan", nil)
		return
	}
	if err != nil {
		response.Error(c, 500, "Gagal menghapus sesi", nil)
		return
	}
	response.OK(c, "Sesi dihapus", nil)
}
