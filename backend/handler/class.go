package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type ClassHandler struct {
	db *gorm.DB
}

func NewClassHandler(db *gorm.DB) *ClassHandler {
	return &ClassHandler{db: db}
}

type classRequest struct {
	Name           string     `json:"name" binding:"required"`
	GradeLevelID   uuid.UUID  `json:"grade_level_id" binding:"required"`
	MajorID        *uuid.UUID `json:"major_id"`
	AcademicYearID uuid.UUID  `json:"academic_year_id" binding:"required"`
	HomeroomID     *uuid.UUID `json:"homeroom_id"`
}

// List mendukung filter per grade_level_id, major_id, academic_year_id, plus pagination.
func (h *ClassHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Class{}).
		Preload("GradeLevel").Preload("Major").Preload("AcademicYear").Preload("Homeroom")

	if v := c.Query("grade_level_id"); v != "" {
		q = q.Where("grade_level_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}

	page, perPage, offset := paginate(c)

	var total int64
	q.Count(&total)

	var items []model.Class
	q = q.Select("classes.*, (SELECT count(*) FROM students WHERE students.class_id = classes.id) AS student_count")
	if err := q.Order("name asc").Limit(perPage).Offset(offset).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil kelas", nil)
		return
	}

	response.OK(c, "Daftar kelas", gin.H{
		"items": items,
		"meta":  gin.H{"page": page, "per_page": perPage, "total": total},
	})
}

func (h *ClassHandler) Create(c *gin.Context) {
	var req classRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Class{
		Name:           req.Name,
		GradeLevelID:   req.GradeLevelID,
		MajorID:        req.MajorID,
		AcademicYearID: req.AcademicYearID,
		HomeroomID:     req.HomeroomID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kelas", nil)
		return
	}
	response.Created(c, "Kelas dibuat", item)
}

func (h *ClassHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req classRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Class
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Kelas tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.GradeLevelID = req.GradeLevelID
	item.MajorID = req.MajorID
	item.AcademicYearID = req.AcademicYearID
	item.HomeroomID = req.HomeroomID
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan kelas", nil)
		return
	}
	response.OK(c, "Kelas diperbarui", item)
}

// classDependents adalah data yang menahan penghapusan sebuah kelas, beserta
// label yang ditampilkan ke pengguna. Daftar ini dipakai untuk menjelaskan
// penolakan, bukan untuk menghapus apa pun secara berantai.
var classDependents = []struct{ table, column, label string }{
	{"students", "class_id", "siswa"},
	{"lesson_schedules", "class_id", "jadwal pelajaran"},
	{"class_subjects", "class_id", "mata pelajaran kelas"},
	{"assessments", "class_id", "penilaian"},
	{"rencana_penilaian", "kelas_id", "rencana penilaian"},
	{"attendance_sessions", "class_id", "sesi absensi"},
	{"student_attendances", "class_id", "absensi siswa"},
	{"invoices", "class_id", "tagihan"},
}

func (h *ClassHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}

	// Dihitung lebih dulu supaya penolakannya menyebutkan penyebabnya. Tanpa ini
	// pengguna hanya menerima kegagalan tanpa keterangan apa pun.
	blockers := gin.H{}
	for _, dep := range classDependents {
		var count int64
		if err := h.db.Table(dep.table).Where(dep.column+" = ?", id).Count(&count).Error; err != nil {
			continue
		}
		if count > 0 {
			blockers[dep.label] = count
		}
	}
	if len(blockers) > 0 {
		response.Error(c, http.StatusConflict, "Kelas masih dipakai data lain, pindahkan atau hapus data itu lebih dulu", blockers)
		return
	}

	if err := h.db.Delete(&model.Class{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusConflict, "Kelas masih dipakai data lain sehingga tidak dapat dihapus", nil)
		return
	}
	response.OK(c, "Kelas dihapus", nil)
}

// Students mengembalikan daftar murid satu kelas.
func (h *ClassHandler) Students(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var items []model.Student
	if err := h.db.Preload("Major").Where("class_id = ?", id).Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil murid kelas", nil)
		return
	}
	response.OK(c, "Daftar murid kelas", items)
}

type assignStudentsRequest struct {
	StudentIDs []uuid.UUID `json:"student_ids" binding:"required,min=1"`
}

// AssignStudents menempatkan siswa ke sebuah kelas. Jurusan dan tahun ajaran
// siswa ikut disamakan dengan kelasnya supaya ketiganya tidak saling bertentangan.
func (h *ClassHandler) AssignStudents(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req assignStudentsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var class model.Class
	if err := h.db.First(&class, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Kelas tidak ditemukan", nil)
		return
	}
	updates := map[string]interface{}{
		"class_id":         class.ID,
		"major_id":         class.MajorID,
		"academic_year_id": class.AcademicYearID,
	}
	if err := h.db.Model(&model.Student{}).Where("id IN ?", req.StudentIDs).Updates(updates).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menempatkan murid ke kelas", nil)
		return
	}
	response.OK(c, "Murid ditempatkan ke kelas", nil)
}

// RemoveStudent mengeluarkan siswa dari kelas tanpa menghapus data siswanya.
func (h *ClassHandler) RemoveStudent(c *gin.Context) {
	studentID, err := uuid.Parse(c.Param("studentId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID murid tidak valid", nil)
		return
	}
	if err := h.db.Model(&model.Student{}).Where("id = ?", studentID).Update("class_id", nil).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengeluarkan murid dari kelas", nil)
		return
	}
	response.OK(c, "Murid dikeluarkan dari kelas", nil)
}
