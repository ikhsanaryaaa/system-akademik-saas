package handler

import (
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// ---- Question (Bank Soal) ----

type QuestionHandler struct {
	db *gorm.DB
}

func NewQuestionHandler(db *gorm.DB) *QuestionHandler {
	return &QuestionHandler{db: db}
}

type questionOptionRequest struct {
	Text      string `json:"text"`
	ImageURL  string `json:"image_url"`
	MatchText string `json:"match_text"`
	IsCorrect bool   `json:"is_correct"`
	Order     int    `json:"order"`
}

type questionRequest struct {
	SubjectID      *uuid.UUID              `json:"subject_id"`
	ClassID        *uuid.UUID              `json:"class_id"`
	MajorID        *uuid.UUID              `json:"major_id"`
	Type           string                  `json:"type" binding:"required,oneof=multiple_choice true_false essay matching"`
	Text           string                  `json:"text" binding:"required"`
	ImageURL       string                  `json:"image_url"`
	Formula        string                  `json:"formula"`
	Difficulty     string                  `json:"difficulty" binding:"omitempty,oneof=easy medium hard"`
	Points         float64                 `json:"points"`
	EssayKey       string                  `json:"essay_key"`
	AcademicYearID *uuid.UUID              `json:"academic_year_id"`
	Options        []questionOptionRequest `json:"options"`
}

func (h *QuestionHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Question{}).Preload("Subject").Preload("Class").Preload("Major").Preload("Options")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	if v := c.Query("type"); v != "" {
		q = q.Where("type = ?", v)
	}
	var items []model.Question
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil bank soal", nil)
		return
	}
	response.OK(c, "Daftar bank soal", items)
}

func (h *QuestionHandler) Create(c *gin.Context) {
	var req questionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Question{
		SubjectID:      req.SubjectID,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		Type:           req.Type,
		Text:           req.Text,
		ImageURL:       req.ImageURL,
		Formula:        req.Formula,
		Difficulty:     req.Difficulty,
		Points:         req.Points,
		EssayKey:       req.EssayKey,
		AcademicYearID: req.AcademicYearID,
	}
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		return replaceOptions(tx, item.ID, req.Options)
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan soal", nil)
		return
	}
	h.db.Preload("Options").First(&item, "id = ?", item.ID)
	response.Created(c, "Soal dibuat", item)
}

func (h *QuestionHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req questionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Question
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Soal tidak ditemukan", nil)
		return
	}
	item.SubjectID = req.SubjectID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Type = req.Type
	item.Text = req.Text
	item.ImageURL = req.ImageURL
	item.Formula = req.Formula
	item.Difficulty = req.Difficulty
	item.Points = req.Points
	item.EssayKey = req.EssayKey
	item.AcademicYearID = req.AcademicYearID
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&item).Error; err != nil {
			return err
		}
		return replaceOptions(tx, item.ID, req.Options)
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan soal", nil)
		return
	}
	h.db.Preload("Options").First(&item, "id = ?", item.ID)
	response.OK(c, "Soal diperbarui", item)
}

func (h *QuestionHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("question_id = ?", id).Delete(&model.QuestionOption{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Question{}, "id = ?", id).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus soal", nil)
		return
	}
	response.OK(c, "Soal dihapus", nil)
}

// replaceOptions mengganti seluruh opsi jawaban sebuah soal dengan daftar baru.
func replaceOptions(tx *gorm.DB, questionID uuid.UUID, opts []questionOptionRequest) error {
	if err := tx.Where("question_id = ?", questionID).Delete(&model.QuestionOption{}).Error; err != nil {
		return err
	}
	for _, o := range opts {
		opt := model.QuestionOption{
			QuestionID: questionID,
			Text:       o.Text,
			ImageURL:   o.ImageURL,
			MatchText:  o.MatchText,
			IsCorrect:  o.IsCorrect,
			Order:      o.Order,
		}
		if err := tx.Create(&opt).Error; err != nil {
			return err
		}
	}
	return nil
}

// ---- ExamPackage (Paket Ujian) ----

type ExamPackageHandler struct {
	db *gorm.DB
}

func NewExamPackageHandler(db *gorm.DB) *ExamPackageHandler {
	return &ExamPackageHandler{db: db}
}

type examPackageRequest struct {
	Title            string     `json:"title" binding:"required"`
	SubjectID        *uuid.UUID `json:"subject_id"`
	ClassID          *uuid.UUID `json:"class_id"`
	MajorID          *uuid.UUID `json:"major_id"`
	AcademicYearID   *uuid.UUID `json:"academic_year_id"`
	Description      string     `json:"description"`
	ShuffleQuestions bool       `json:"shuffle_questions"`
	ShuffleOptions   bool       `json:"shuffle_options"`
}

func (h *ExamPackageHandler) List(c *gin.Context) {
	q := h.db.Model(&model.ExamPackage{}).Preload("Subject").Preload("Class").Preload("Major")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	var items []model.ExamPackage
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil paket ujian", nil)
		return
	}
	response.OK(c, "Daftar paket ujian", items)
}

func (h *ExamPackageHandler) Create(c *gin.Context) {
	var req examPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.ExamPackage{
		Title:            req.Title,
		SubjectID:        req.SubjectID,
		ClassID:          req.ClassID,
		MajorID:          req.MajorID,
		AcademicYearID:   req.AcademicYearID,
		Description:      req.Description,
		ShuffleQuestions: req.ShuffleQuestions,
		ShuffleOptions:   req.ShuffleOptions,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan paket ujian", nil)
		return
	}
	response.Created(c, "Paket ujian dibuat", item)
}

func (h *ExamPackageHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req examPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ExamPackage
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Paket ujian tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.SubjectID = req.SubjectID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.AcademicYearID = req.AcademicYearID
	item.Description = req.Description
	item.ShuffleQuestions = req.ShuffleQuestions
	item.ShuffleOptions = req.ShuffleOptions
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan paket ujian", nil)
		return
	}
	response.OK(c, "Paket ujian diperbarui", item)
}

func (h *ExamPackageHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("package_id = ?", id).Delete(&model.ExamPackageItem{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.ExamPackage{}, "id = ?", id).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus paket ujian", nil)
		return
	}
	response.OK(c, "Paket ujian dihapus", nil)
}

// Items mengembalikan daftar soal pada sebuah paket ujian beserta detail soalnya.
func (h *ExamPackageHandler) Items(c *gin.Context) {
	packageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ExamPackage{}, "id = ?", packageID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Paket ujian tidak ditemukan", nil)
		return
	}
	var items []model.ExamPackageItem
	if err := h.db.Preload("Question").Preload("Question.Options").
		Where("package_id = ?", packageID).Order(`"order" asc, created_at asc`).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil soal paket", nil)
		return
	}
	response.OK(c, "Daftar soal paket", items)
}

type packageItemRequest struct {
	QuestionID uuid.UUID `json:"question_id" binding:"required"`
	Order      int       `json:"order"`
	Points     float64   `json:"points"`
}

// AddItem menambahkan sebuah soal ke paket ujian.
func (h *ExamPackageHandler) AddItem(c *gin.Context) {
	packageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ExamPackage{}, "id = ?", packageID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Paket ujian tidak ditemukan", nil)
		return
	}
	var req packageItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.ExamPackageItem{
		PackageID:  packageID,
		QuestionID: req.QuestionID,
		Order:      req.Order,
		Points:     req.Points,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menambah soal ke paket", nil)
		return
	}
	response.Created(c, "Soal ditambahkan ke paket", item)
}

// RemoveItem menghapus sebuah soal dari paket ujian.
func (h *ExamPackageHandler) RemoveItem(c *gin.Context) {
	itemID, err := uuid.Parse(c.Param("itemId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.ExamPackageItem{}, "id = ?", itemID).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus soal dari paket", nil)
		return
	}
	response.OK(c, "Soal dihapus dari paket", nil)
}

// ---- ExamSchedule (Penjadwalan Ujian) ----

type ExamScheduleHandler struct {
	db *gorm.DB
}

func NewExamScheduleHandler(db *gorm.DB) *ExamScheduleHandler {
	return &ExamScheduleHandler{db: db}
}

type examScheduleRequest struct {
	PackageID      uuid.UUID  `json:"package_id" binding:"required"`
	Title          string     `json:"title" binding:"required"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
	StartAt        *time.Time `json:"start_at"`
	EndAt          *time.Time `json:"end_at"`
	DurationMin    int        `json:"duration_min"`
	Status         string     `json:"status" binding:"omitempty,oneof=scheduled ongoing finished"`
}

func (h *ExamScheduleHandler) List(c *gin.Context) {
	q := h.db.Model(&model.ExamSchedule{}).Preload("Package").Preload("Class").Preload("Major")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	var items []model.ExamSchedule
	if err := q.Order("start_at desc, created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jadwal ujian", nil)
		return
	}
	response.OK(c, "Daftar jadwal ujian", items)
}

func (h *ExamScheduleHandler) Detail(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var item model.ExamSchedule
	if err := h.db.
		Preload("Package").Preload("Class").Preload("Major").
		Preload("Rooms").Preload("Rooms.Supervisor").
		First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}
	response.OK(c, "Detail jadwal ujian", item)
}

func (h *ExamScheduleHandler) Create(c *gin.Context) {
	var req examScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	status := req.Status
	if status == "" {
		status = "scheduled"
	}
	item := model.ExamSchedule{
		PackageID:      req.PackageID,
		Title:          req.Title,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		AcademicYearID: req.AcademicYearID,
		StartAt:        req.StartAt,
		EndAt:          req.EndAt,
		DurationMin:    req.DurationMin,
		Status:         status,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jadwal ujian", nil)
		return
	}
	response.Created(c, "Jadwal ujian dibuat", item)
}

func (h *ExamScheduleHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req examScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ExamSchedule
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}
	item.PackageID = req.PackageID
	item.Title = req.Title
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.AcademicYearID = req.AcademicYearID
	item.StartAt = req.StartAt
	item.EndAt = req.EndAt
	item.DurationMin = req.DurationMin
	if req.Status != "" {
		item.Status = req.Status
	}
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jadwal ujian", nil)
		return
	}
	response.OK(c, "Jadwal ujian diperbarui", item)
}

func (h *ExamScheduleHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("schedule_id = ?", id).Delete(&model.ExamRoom{}).Error; err != nil {
			return err
		}
		if err := tx.Where("schedule_id = ?", id).Delete(&model.ExamParticipant{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.ExamSchedule{}, "id = ?", id).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus jadwal ujian", nil)
		return
	}
	response.OK(c, "Jadwal ujian dihapus", nil)
}

// ReleaseToken merilis atau memperbarui token ujian untuk sebuah jadwal.
func (h *ExamScheduleHandler) ReleaseToken(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var item model.ExamSchedule
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}
	item.Token = generateToken(6)
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal merilis token", nil)
		return
	}
	response.OK(c, "Token dirilis", gin.H{"token": item.Token})
}

// generateToken menghasilkan token acak berisi huruf kapital dan angka.
func generateToken(n int) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	seed := rand.New(rand.NewSource(time.Now().UnixNano()))
	var b strings.Builder
	for i := 0; i < n; i++ {
		b.WriteByte(charset[seed.Intn(len(charset))])
	}
	return b.String()
}

// ---- ExamRoom (Ruang dan Sesi Ujian) ----

type ExamRoomHandler struct {
	db *gorm.DB
}

func NewExamRoomHandler(db *gorm.DB) *ExamRoomHandler {
	return &ExamRoomHandler{db: db}
}

type examRoomRequest struct {
	Name         string     `json:"name" binding:"required"`
	SupervisorID *uuid.UUID `json:"supervisor_id"`
	Capacity     int        `json:"capacity"`
	Session      string     `json:"session"`
}

// List mengembalikan daftar ruang pada sebuah jadwal ujian.
func (h *ExamRoomHandler) List(c *gin.Context) {
	scheduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var items []model.ExamRoom
	if err := h.db.Preload("Supervisor").Where("schedule_id = ?", scheduleID).
		Order("created_at asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil ruang ujian", nil)
		return
	}
	response.OK(c, "Daftar ruang ujian", items)
}

// Create menambahkan ruang atau sesi ujian dengan pengawas ke sebuah jadwal.
func (h *ExamRoomHandler) Create(c *gin.Context) {
	scheduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ExamSchedule{}, "id = ?", scheduleID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}
	var req examRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.ExamRoom{
		ScheduleID:   scheduleID,
		Name:         req.Name,
		SupervisorID: req.SupervisorID,
		Capacity:     req.Capacity,
		Session:      req.Session,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan ruang ujian", nil)
		return
	}
	response.Created(c, "Ruang ujian dibuat", item)
}

// Delete menghapus ruang ujian dan melepas peserta dari ruang tersebut.
func (h *ExamRoomHandler) Delete(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("roomId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.ExamParticipant{}).Where("room_id = ?", roomID).
			Update("room_id", nil).Error; err != nil {
			return err
		}
		return tx.Delete(&model.ExamRoom{}, "id = ?", roomID).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus ruang ujian", nil)
		return
	}
	response.OK(c, "Ruang ujian dihapus", nil)
}

// ---- ExamParticipant (Alokasi Peserta dan Monitoring) ----

type ExamParticipantHandler struct {
	db *gorm.DB
}

func NewExamParticipantHandler(db *gorm.DB) *ExamParticipantHandler {
	return &ExamParticipantHandler{db: db}
}

// List mengembalikan daftar peserta sebuah jadwal, dipakai untuk dashboard monitoring.
func (h *ExamParticipantHandler) List(c *gin.Context) {
	scheduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	q := h.db.Model(&model.ExamParticipant{}).Preload("Student").Preload("Room").
		Where("schedule_id = ?", scheduleID)
	if v := c.Query("room_id"); v != "" {
		q = q.Where("room_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	var items []model.ExamParticipant
	if err := q.Order("created_at asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil peserta ujian", nil)
		return
	}
	response.OK(c, "Daftar peserta ujian", items)
}

type allocateRequest struct {
	ClassID    *uuid.UUID  `json:"class_id"`
	MajorID    *uuid.UUID  `json:"major_id"`
	StudentIDs []uuid.UUID `json:"student_ids"`
	RoomID     *uuid.UUID  `json:"room_id"`
}

// Allocate mengalokasikan peserta ke jadwal, dari daftar siswa eksplisit atau seluruh
// siswa pada kelas dan jurusan tertentu. Alokasi bersifat idempoten per siswa.
func (h *ExamParticipantHandler) Allocate(c *gin.Context) {
	scheduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ExamSchedule{}, "id = ?", scheduleID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}
	var req allocateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	studentIDs := req.StudentIDs
	if len(studentIDs) == 0 && (req.ClassID != nil || req.MajorID != nil) {
		sq := h.db.Model(&model.Student{})
		if req.ClassID != nil {
			sq = sq.Where("class_id = ?", req.ClassID)
		}
		if req.MajorID != nil {
			sq = sq.Where("major_id = ?", req.MajorID)
		}
		if err := sq.Pluck("id", &studentIDs).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar siswa", nil)
			return
		}
	}
	if len(studentIDs) == 0 {
		response.Error(c, http.StatusBadRequest, "Tidak ada siswa untuk dialokasikan", nil)
		return
	}

	added := 0
	err = h.db.Transaction(func(tx *gorm.DB) error {
		for _, sid := range studentIDs {
			var count int64
			if err := tx.Model(&model.ExamParticipant{}).
				Where("schedule_id = ? AND student_id = ?", scheduleID, sid).Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				continue
			}
			p := model.ExamParticipant{
				ScheduleID: scheduleID,
				StudentID:  sid,
				RoomID:     req.RoomID,
				Status:     "not_started",
				AccessOpen: true,
			}
			if err := tx.Create(&p).Error; err != nil {
				return err
			}
			added++
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengalokasikan peserta", nil)
		return
	}
	response.OK(c, "Peserta dialokasikan", gin.H{"added": added, "total_requested": len(studentIDs)})
}

// Remove menghapus alokasi seorang peserta dari jadwal.
func (h *ExamParticipantHandler) Remove(c *gin.Context) {
	participantID, err := uuid.Parse(c.Param("participantId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("participant_id = ?", participantID).Delete(&model.ExamViolation{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.ExamParticipant{}, "id = ?", participantID).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus peserta", nil)
		return
	}
	response.OK(c, "Peserta dihapus", nil)
}

type controlRequest struct {
	Action      string `json:"action" binding:"required,oneof=reset_login open_access close_access extend_time stop resume flag"`
	ExtraMinute int    `json:"extra_minute"`
}

// Control menjalankan aksi kontrol sesi proktor terhadap seorang peserta:
// reset login, buka atau tutup akses, perpanjang waktu, hentikan, lanjutkan, atau tandai curang.
func (h *ExamParticipantHandler) Control(c *gin.Context) {
	participantID, err := uuid.Parse(c.Param("participantId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req controlRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var p model.ExamParticipant
	if err := h.db.First(&p, "id = ?", participantID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Peserta tidak ditemukan", nil)
		return
	}
	switch req.Action {
	case "reset_login":
		// Reset login: lepas kunci sehingga peserta bisa login ulang di satu perangkat.
		p.LoginLocked = false
	case "open_access":
		p.AccessOpen = true
	case "close_access":
		p.AccessOpen = false
	case "extend_time":
		if req.ExtraMinute > 0 {
			p.ExtraMinute += req.ExtraMinute
		}
	case "stop":
		p.AccessOpen = false
		if p.Status == "ongoing" {
			p.Status = "disconnected"
		}
	case "resume":
		p.AccessOpen = true
		if p.Status == "disconnected" {
			p.Status = "ongoing"
		}
	case "flag":
		p.Status = "flagged"
	}
	if err := h.db.Save(&p).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menjalankan kontrol sesi", nil)
		return
	}
	response.OK(c, "Kontrol sesi diterapkan", p)
}

// Violations mengembalikan log pelanggaran seorang peserta.
func (h *ExamParticipantHandler) Violations(c *gin.Context) {
	participantID, err := uuid.Parse(c.Param("participantId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var items []model.ExamViolation
	if err := h.db.Where("participant_id = ?", participantID).
		Order("occurred_at desc, created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil log pelanggaran", nil)
		return
	}
	response.OK(c, "Log pelanggaran", items)
}

type scoreRequest struct {
	Score float64 `json:"score" binding:"min=0"`
}

// SetScore menyimpan nilai akhir seorang peserta (hasil koreksi otomatis dan manual).
func (h *ExamParticipantHandler) SetScore(c *gin.Context) {
	participantID, err := uuid.Parse(c.Param("participantId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req scoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var p model.ExamParticipant
	if err := h.db.First(&p, "id = ?", participantID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Peserta tidak ditemukan", nil)
		return
	}
	score := req.Score
	p.Score = &score
	if err := h.db.Save(&p).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan nilai", nil)
		return
	}
	response.OK(c, "Nilai peserta disimpan", p)
}

type violationRequest struct {
	Type       string     `json:"type" binding:"required"`
	Detail     string     `json:"detail"`
	OccurredAt *time.Time `json:"occurred_at"`
}

// AddViolation mencatat satu pelanggaran peserta. Pada pelaksanaan sesungguhnya
// pelanggaran dikirim aplikasi mobile; endpoint ini juga dipakai proktor mencatat manual.
func (h *ExamParticipantHandler) AddViolation(c *gin.Context) {
	participantID, err := uuid.Parse(c.Param("participantId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ExamParticipant{}, "id = ?", participantID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Peserta tidak ditemukan", nil)
		return
	}
	var req violationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	occurred := req.OccurredAt
	if occurred == nil {
		now := time.Now()
		occurred = &now
	}
	item := model.ExamViolation{
		ParticipantID: participantID,
		Type:          req.Type,
		Detail:        req.Detail,
		OccurredAt:    occurred,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mencatat pelanggaran", nil)
		return
	}
	response.Created(c, "Pelanggaran dicatat", item)
}

// ---- Hasil, Laporan, dan Integrasi Nilai ----

type ExamResultHandler struct {
	db *gorm.DB
}

func NewExamResultHandler(db *gorm.DB) *ExamResultHandler {
	return &ExamResultHandler{db: db}
}

// Report mengembalikan rekap hasil sebuah jadwal ujian: jumlah peserta per status,
// serta nilai rata-rata, tertinggi, dan terendah dari peserta yang sudah dinilai.
func (h *ExamResultHandler) Report(c *gin.Context) {
	scheduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ExamSchedule{}, "id = ?", scheduleID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}

	var participants []model.ExamParticipant
	if err := h.db.Where("schedule_id = ?", scheduleID).Find(&participants).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil hasil ujian", nil)
		return
	}

	statusCount := map[string]int{}
	var scored int
	var sum, max, min float64
	first := true
	for _, p := range participants {
		statusCount[p.Status]++
		if p.Score != nil {
			s := *p.Score
			sum += s
			scored++
			if first || s > max {
				max = s
			}
			if first || s < min {
				min = s
			}
			first = false
		}
	}
	var avg float64
	if scored > 0 {
		avg = sum / float64(scored)
	}

	response.OK(c, "Rekap hasil ujian", gin.H{
		"total_participant": len(participants),
		"scored_count":      scored,
		"status_count":      statusCount,
		"average_score":     avg,
		"highest_score":     max,
		"lowest_score":      min,
	})
}

type gradeIntegrationRequest struct {
	SubjectID      uuid.UUID `json:"subject_id" binding:"required"`
	ClassID        uuid.UUID `json:"class_id" binding:"required"`
	AcademicYearID uuid.UUID `json:"academic_year_id" binding:"required"`
	Semester       int       `json:"semester" binding:"required,oneof=1 2"`
	Title          string    `json:"title"`
	Weight         float64   `json:"weight"`
}

// PushToGrading mengintegrasikan nilai peserta ujian ke modul Penilaian:
// membuat satu Assessment bertipe cbt lalu mengisi AssessmentScore dari nilai peserta.
func (h *ExamResultHandler) PushToGrading(c *gin.Context) {
	scheduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var schedule model.ExamSchedule
	if err := h.db.First(&schedule, "id = ?", scheduleID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jadwal ujian tidak ditemukan", nil)
		return
	}
	var req gradeIntegrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var participants []model.ExamParticipant
	if err := h.db.Where("schedule_id = ? AND score IS NOT NULL", scheduleID).Find(&participants).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil nilai peserta", nil)
		return
	}
	if len(participants) == 0 {
		response.Error(c, http.StatusBadRequest, "Belum ada nilai peserta untuk diintegrasikan", nil)
		return
	}

	title := req.Title
	if title == "" {
		title = schedule.Title
	}

	var assessment model.Assessment
	pushed := 0
	err = h.db.Transaction(func(tx *gorm.DB) error {
		assessment = model.Assessment{
			Title:          title,
			Type:           "cbt",
			Weight:         req.Weight,
			Semester:       req.Semester,
			ClassID:        req.ClassID,
			SubjectID:      req.SubjectID,
			AcademicYearID: req.AcademicYearID,
		}
		if err := tx.Create(&assessment).Error; err != nil {
			return err
		}
		for _, p := range participants {
			score := model.AssessmentScore{
				AssessmentID: assessment.ID,
				StudentID:    p.StudentID,
				Score:        *p.Score,
				Note:         "Nilai CBT",
			}
			if err := tx.Create(&score).Error; err != nil {
				return err
			}
			pushed++
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengintegrasikan nilai ke penilaian", nil)
		return
	}
	response.OK(c, "Nilai ujian diintegrasikan ke penilaian", gin.H{
		"assessment_id": assessment.ID,
		"pushed":        pushed,
	})
}
