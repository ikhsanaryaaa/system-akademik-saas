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

// ---- InternshipPlace (Tempat PKL) ----

type InternshipPlaceHandler struct {
	db *gorm.DB
}

func NewInternshipPlaceHandler(db *gorm.DB) *InternshipPlaceHandler {
	return &InternshipPlaceHandler{db: db}
}

type internshipPlaceRequest struct {
	Name        string `json:"name" binding:"required"`
	Field       string `json:"field"`
	Address     string `json:"address"`
	ContactName string `json:"contact_name"`
	Phone       string `json:"phone"`
	Quota       int    `json:"quota" binding:"min=0"`
}

func (h *InternshipPlaceHandler) List(c *gin.Context) {
	var items []model.InternshipPlace
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tempat PKL", nil)
		return
	}
	response.OK(c, "Daftar tempat PKL", items)
}

func (h *InternshipPlaceHandler) Create(c *gin.Context) {
	var req internshipPlaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.InternshipPlace{
		Name:        req.Name,
		Field:       req.Field,
		Address:     req.Address,
		ContactName: req.ContactName,
		Phone:       req.Phone,
		Quota:       req.Quota,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tempat PKL", nil)
		return
	}
	response.Created(c, "Tempat PKL dibuat", item)
}

func (h *InternshipPlaceHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req internshipPlaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.InternshipPlace
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tempat PKL tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Field = req.Field
	item.Address = req.Address
	item.ContactName = req.ContactName
	item.Phone = req.Phone
	item.Quota = req.Quota
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tempat PKL", nil)
		return
	}
	response.OK(c, "Tempat PKL diperbarui", item)
}

func (h *InternshipPlaceHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.InternshipPlace{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus tempat PKL", nil)
		return
	}
	response.OK(c, "Tempat PKL dihapus", nil)
}

// ---- Internship (Data PKL) ----

type InternshipHandler struct {
	db *gorm.DB
}

func NewInternshipHandler(db *gorm.DB) *InternshipHandler {
	return &InternshipHandler{db: db}
}

type internshipRequest struct {
	StudentID uuid.UUID  `json:"student_id" binding:"required"`
	PlaceID   uuid.UUID  `json:"place_id" binding:"required"`
	ClassID   *uuid.UUID `json:"class_id"`
	MajorID   *uuid.UUID `json:"major_id"`
	Mentor    string     `json:"mentor"`
	Status    string     `json:"status" binding:"omitempty,oneof=ongoing done cancelled"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
}

func (h *InternshipHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Internship{}).Preload("Student").Preload("Place").Preload("Class").Preload("Major")
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("place_id"); v != "" {
		q = q.Where("place_id = ?", v)
	}
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	var items []model.Internship
	if err := q.Order("start_date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil data PKL", nil)
		return
	}
	response.OK(c, "Daftar PKL", items)
}

func (h *InternshipHandler) Create(c *gin.Context) {
	var req internshipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	status := req.Status
	if status == "" {
		status = "ongoing"
	}
	item := model.Internship{
		StudentID: req.StudentID,
		PlaceID:   req.PlaceID,
		ClassID:   req.ClassID,
		MajorID:   req.MajorID,
		Mentor:    req.Mentor,
		Status:    status,
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan data PKL", nil)
		return
	}
	response.Created(c, "Data PKL dibuat", item)
}

func (h *InternshipHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req internshipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Internship
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Data PKL tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.PlaceID = req.PlaceID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.Mentor = req.Mentor
	if req.Status != "" {
		item.Status = req.Status
	}
	item.StartDate = req.StartDate
	item.EndDate = req.EndDate
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan data PKL", nil)
		return
	}
	response.OK(c, "Data PKL diperbarui", item)
}

func (h *InternshipHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.Internship{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus data PKL", nil)
		return
	}
	response.OK(c, "Data PKL dihapus", nil)
}

// ---- JobVacancy (Lowongan Kerja) ----

type JobVacancyHandler struct {
	db *gorm.DB
}

func NewJobVacancyHandler(db *gorm.DB) *JobVacancyHandler {
	return &JobVacancyHandler{db: db}
}

type jobVacancyRequest struct {
	Position    string     `json:"position" binding:"required"`
	Company     string     `json:"company" binding:"required"`
	Description string     `json:"description"`
	Location    string     `json:"location"`
	Status      string     `json:"status" binding:"omitempty,oneof=open closed"`
	Deadline    *time.Time `json:"deadline"`
}

func (h *JobVacancyHandler) List(c *gin.Context) {
	q := h.db.Model(&model.JobVacancy{})
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	var items []model.JobVacancy
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil lowongan kerja", nil)
		return
	}
	response.OK(c, "Daftar lowongan kerja", items)
}

func (h *JobVacancyHandler) Create(c *gin.Context) {
	var req jobVacancyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	status := req.Status
	if status == "" {
		status = "open"
	}
	item := model.JobVacancy{
		Position:    req.Position,
		Company:     req.Company,
		Description: req.Description,
		Location:    req.Location,
		Status:      status,
		Deadline:    req.Deadline,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan lowongan kerja", nil)
		return
	}
	response.Created(c, "Lowongan kerja dibuat", item)
}

func (h *JobVacancyHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req jobVacancyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.JobVacancy
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Lowongan kerja tidak ditemukan", nil)
		return
	}
	item.Position = req.Position
	item.Company = req.Company
	item.Description = req.Description
	item.Location = req.Location
	if req.Status != "" {
		item.Status = req.Status
	}
	item.Deadline = req.Deadline
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan lowongan kerja", nil)
		return
	}
	response.OK(c, "Lowongan kerja diperbarui", item)
}

func (h *JobVacancyHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.JobVacancy{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus lowongan kerja", nil)
		return
	}
	response.OK(c, "Lowongan kerja dihapus", nil)
}
