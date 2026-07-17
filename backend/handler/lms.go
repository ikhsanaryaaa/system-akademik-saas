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

// ---- Material (Materi) ----

type MaterialHandler struct {
	db *gorm.DB
}

func NewMaterialHandler(db *gorm.DB) *MaterialHandler {
	return &MaterialHandler{db: db}
}

type materialRequest struct {
	Title          string     `json:"title" binding:"required"`
	SubjectID      *uuid.UUID `json:"subject_id"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	TeacherID      *uuid.UUID `json:"teacher_id"`
	Semester       int        `json:"semester"`
	Content        string     `json:"content"`
	AttachmentURL  string     `json:"attachment_url"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
}

func (h *MaterialHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Material{}).Preload("Subject").Preload("Class").Preload("Major").Preload("Teacher")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	var items []model.Material
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil materi", nil)
		return
	}
	response.OK(c, "Daftar materi", items)
}

func (h *MaterialHandler) Create(c *gin.Context) {
	var req materialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Material{
		Title:          req.Title,
		SubjectID:      req.SubjectID,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		TeacherID:      req.TeacherID,
		Semester:       req.Semester,
		Content:        req.Content,
		AttachmentURL:  req.AttachmentURL,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan materi", nil)
		return
	}
	response.Created(c, "Materi dibuat", item)
}

func (h *MaterialHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req materialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Material
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Materi tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.SubjectID = req.SubjectID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.TeacherID = req.TeacherID
	item.Semester = req.Semester
	item.Content = req.Content
	item.AttachmentURL = req.AttachmentURL
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan materi", nil)
		return
	}
	response.OK(c, "Materi diperbarui", item)
}

func (h *MaterialHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Material{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus materi", nil)
		return
	}
	response.OK(c, "Materi dihapus", nil)
}

// ---- Assignment (Tugas) ----

type AssignmentHandler struct {
	db *gorm.DB
}

func NewAssignmentHandler(db *gorm.DB) *AssignmentHandler {
	return &AssignmentHandler{db: db}
}

type assignmentRequest struct {
	Title          string     `json:"title" binding:"required"`
	SubjectID      *uuid.UUID `json:"subject_id"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	TeacherID      *uuid.UUID `json:"teacher_id"`
	Semester       int        `json:"semester"`
	Description    string     `json:"description"`
	MaxScore       float64    `json:"max_score"`
	DueDate        *time.Time `json:"due_date"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
}

func (h *AssignmentHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Assignment{}).Preload("Subject").Preload("Class").Preload("Major").Preload("Teacher")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	var items []model.Assignment
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tugas", nil)
		return
	}
	response.OK(c, "Daftar tugas", items)
}

func (h *AssignmentHandler) Create(c *gin.Context) {
	var req assignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Assignment{
		Title:          req.Title,
		SubjectID:      req.SubjectID,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		TeacherID:      req.TeacherID,
		Semester:       req.Semester,
		Description:    req.Description,
		MaxScore:       req.MaxScore,
		DueDate:        req.DueDate,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tugas", nil)
		return
	}
	response.Created(c, "Tugas dibuat", item)
}

func (h *AssignmentHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req assignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Assignment
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tugas tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.SubjectID = req.SubjectID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.TeacherID = req.TeacherID
	item.Semester = req.Semester
	item.Description = req.Description
	item.MaxScore = req.MaxScore
	item.DueDate = req.DueDate
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tugas", nil)
		return
	}
	response.OK(c, "Tugas diperbarui", item)
}

func (h *AssignmentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Assignment{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus tugas", nil)
		return
	}
	response.OK(c, "Tugas dihapus", nil)
}

// Submissions mengembalikan daftar pengumpulan siswa untuk satu tugas.
func (h *AssignmentHandler) Submissions(c *gin.Context) {
	assignmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.Assignment{}, "id = ?", assignmentID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tugas tidak ditemukan", nil)
		return
	}
	var items []model.AssignmentSubmission
	if err := h.db.Preload("Student").Where("assignment_id = ?", assignmentID).Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pengumpulan tugas", nil)
		return
	}
	response.OK(c, "Daftar pengumpulan tugas", items)
}

type gradeSubmissionRequest struct {
	Score    *float64 `json:"score"`
	Feedback string   `json:"feedback"`
}

// GradeSubmission menyimpan nilai dan umpan balik untuk satu pengumpulan tugas.
func (h *AssignmentHandler) GradeSubmission(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req gradeSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var sub model.AssignmentSubmission
	if err := h.db.First(&sub, "id = ?", subID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Pengumpulan tidak ditemukan", nil)
		return
	}
	sub.Score = req.Score
	sub.Feedback = req.Feedback
	sub.Status = "graded"
	if err := h.db.Save(&sub).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan nilai tugas", nil)
		return
	}
	response.OK(c, "Nilai tugas disimpan", sub)
}

// ---- Quiz ----

type QuizHandler struct {
	db *gorm.DB
}

func NewQuizHandler(db *gorm.DB) *QuizHandler {
	return &QuizHandler{db: db}
}

type quizRequest struct {
	Title          string     `json:"title" binding:"required"`
	SubjectID      *uuid.UUID `json:"subject_id"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	TeacherID      *uuid.UUID `json:"teacher_id"`
	Semester       int        `json:"semester"`
	Description    string     `json:"description"`
	DurationMin    int        `json:"duration_min"`
	StartAt        *time.Time `json:"start_at"`
	EndAt          *time.Time `json:"end_at"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
}

func (h *QuizHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Quiz{}).Preload("Subject").Preload("Class").Preload("Major").Preload("Teacher")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	var items []model.Quiz
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil quiz", nil)
		return
	}
	response.OK(c, "Daftar quiz", items)
}

func (h *QuizHandler) Create(c *gin.Context) {
	var req quizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Quiz{
		Title:          req.Title,
		SubjectID:      req.SubjectID,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		TeacherID:      req.TeacherID,
		Semester:       req.Semester,
		Description:    req.Description,
		DurationMin:    req.DurationMin,
		StartAt:        req.StartAt,
		EndAt:          req.EndAt,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan quiz", nil)
		return
	}
	response.Created(c, "Quiz dibuat", item)
}

func (h *QuizHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req quizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Quiz
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Quiz tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.SubjectID = req.SubjectID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.TeacherID = req.TeacherID
	item.Semester = req.Semester
	item.Description = req.Description
	item.DurationMin = req.DurationMin
	item.StartAt = req.StartAt
	item.EndAt = req.EndAt
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan quiz", nil)
		return
	}
	response.OK(c, "Quiz diperbarui", item)
}

func (h *QuizHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	// Hapus soal terkait lalu quiz-nya dalam satu transaksi.
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("quiz_id = ?", id).Delete(&model.QuizQuestion{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Quiz{}, "id = ?", id).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus quiz", nil)
		return
	}
	response.OK(c, "Quiz dihapus", nil)
}

// Questions mengembalikan daftar soal pada sebuah quiz.
func (h *QuizHandler) Questions(c *gin.Context) {
	quizID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.Quiz{}, "id = ?", quizID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Quiz tidak ditemukan", nil)
		return
	}
	var items []model.QuizQuestion
	if err := h.db.Where("quiz_id = ?", quizID).Order(`"order" asc, created_at asc`).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil soal", nil)
		return
	}
	response.OK(c, "Daftar soal", items)
}

type quizQuestionRequest struct {
	Question string  `json:"question" binding:"required"`
	OptionA  string  `json:"option_a"`
	OptionB  string  `json:"option_b"`
	OptionC  string  `json:"option_c"`
	OptionD  string  `json:"option_d"`
	Answer   string  `json:"answer" binding:"omitempty,oneof=a b c d"`
	Points   float64 `json:"points"`
	Order    int     `json:"order"`
}

// AddQuestion menambahkan satu soal ke sebuah quiz.
func (h *QuizHandler) AddQuestion(c *gin.Context) {
	quizID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.Quiz{}, "id = ?", quizID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Quiz tidak ditemukan", nil)
		return
	}
	var req quizQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.QuizQuestion{
		QuizID:   quizID,
		Question: req.Question,
		OptionA:  req.OptionA,
		OptionB:  req.OptionB,
		OptionC:  req.OptionC,
		OptionD:  req.OptionD,
		Answer:   req.Answer,
		Points:   req.Points,
		Order:    req.Order,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan soal", nil)
		return
	}
	response.Created(c, "Soal dibuat", item)
}

// DeleteQuestion menghapus satu soal quiz.
func (h *QuizHandler) DeleteQuestion(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("questionId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.QuizQuestion{}, "id = ?", questionID).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus soal", nil)
		return
	}
	response.OK(c, "Soal dihapus", nil)
}

// ---- ForumThread (Forum Diskusi) ----

type ForumThreadHandler struct {
	db *gorm.DB
}

func NewForumThreadHandler(db *gorm.DB) *ForumThreadHandler {
	return &ForumThreadHandler{db: db}
}

type forumThreadRequest struct {
	Title          string     `json:"title" binding:"required"`
	SubjectID      *uuid.UUID `json:"subject_id"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	CreatedBy      string     `json:"created_by"`
	Body           string     `json:"body"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
}

func (h *ForumThreadHandler) List(c *gin.Context) {
	q := h.db.Model(&model.ForumThread{}).Preload("Subject").Preload("Class").Preload("Major")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("subject_id"); v != "" {
		q = q.Where("subject_id = ?", v)
	}
	var items []model.ForumThread
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil forum diskusi", nil)
		return
	}
	response.OK(c, "Daftar forum diskusi", items)
}

func (h *ForumThreadHandler) Create(c *gin.Context) {
	var req forumThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.ForumThread{
		Title:          req.Title,
		SubjectID:      req.SubjectID,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		CreatedBy:      req.CreatedBy,
		Body:           req.Body,
		AcademicYearID: req.AcademicYearID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan forum diskusi", nil)
		return
	}
	response.Created(c, "Forum diskusi dibuat", item)
}

func (h *ForumThreadHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req forumThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ForumThread
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Forum diskusi tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.SubjectID = req.SubjectID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.CreatedBy = req.CreatedBy
	item.Body = req.Body
	item.AcademicYearID = req.AcademicYearID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan forum diskusi", nil)
		return
	}
	response.OK(c, "Forum diskusi diperbarui", item)
}

func (h *ForumThreadHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("thread_id = ?", id).Delete(&model.ForumPost{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.ForumThread{}, "id = ?", id).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus forum diskusi", nil)
		return
	}
	response.OK(c, "Forum diskusi dihapus", nil)
}

// Posts mengembalikan seluruh balasan pada sebuah thread diskusi.
func (h *ForumThreadHandler) Posts(c *gin.Context) {
	threadID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ForumThread{}, "id = ?", threadID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Forum diskusi tidak ditemukan", nil)
		return
	}
	var items []model.ForumPost
	if err := h.db.Where("thread_id = ?", threadID).Order("created_at asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil balasan", nil)
		return
	}
	response.OK(c, "Daftar balasan", items)
}

type forumPostRequest struct {
	Author string `json:"author"`
	Body   string `json:"body" binding:"required"`
}

// AddPost menambahkan satu balasan ke thread diskusi.
func (h *ForumThreadHandler) AddPost(c *gin.Context) {
	threadID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.ForumThread{}, "id = ?", threadID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Forum diskusi tidak ditemukan", nil)
		return
	}
	var req forumPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.ForumPost{ThreadID: threadID, Author: req.Author, Body: req.Body}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan balasan", nil)
		return
	}
	response.Created(c, "Balasan dibuat", item)
}

// DeletePost menghapus satu balasan pada thread diskusi.
func (h *ForumThreadHandler) DeletePost(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.ForumPost{}, "id = ?", postID).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus balasan", nil)
		return
	}
	response.OK(c, "Balasan dihapus", nil)
}

// ---- Laporan LMS ----

type LmsReportHandler struct {
	db *gorm.DB
}

func NewLmsReportHandler(db *gorm.DB) *LmsReportHandler {
	return &LmsReportHandler{db: db}
}

// Report mengembalikan rekap jumlah materi, tugas, quiz, dan forum,
// dapat difilter per kelas dan jurusan.
func (h *LmsReportHandler) Report(c *gin.Context) {
	classID := c.Query("class_id")
	majorID := c.Query("major_id")

	applyFilter := func(q *gorm.DB) *gorm.DB {
		if classID != "" {
			q = q.Where("class_id = ?", classID)
		}
		if majorID != "" {
			q = q.Where("major_id = ?", majorID)
		}
		return q
	}

	var materialCount, assignmentCount, quizCount, threadCount int64
	applyFilter(h.db.Model(&model.Material{})).Count(&materialCount)
	applyFilter(h.db.Model(&model.Assignment{})).Count(&assignmentCount)
	applyFilter(h.db.Model(&model.Quiz{})).Count(&quizCount)
	applyFilter(h.db.Model(&model.ForumThread{})).Count(&threadCount)

	response.OK(c, "Laporan LMS", gin.H{
		"material_count":   materialCount,
		"assignment_count": assignmentCount,
		"quiz_count":       quizCount,
		"thread_count":     threadCount,
	})
}
