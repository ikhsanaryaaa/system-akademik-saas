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

// ---- ViolationType (Jenis Pelanggaran) ----

type ViolationTypeHandler struct {
	db *gorm.DB
}

func NewViolationTypeHandler(db *gorm.DB) *ViolationTypeHandler {
	return &ViolationTypeHandler{db: db}
}

type violationTypeRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category"`
	Point    int    `json:"point" binding:"min=0"`
}

func (h *ViolationTypeHandler) List(c *gin.Context) {
	var items []model.ViolationType
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jenis pelanggaran", nil)
		return
	}
	response.OK(c, "Daftar jenis pelanggaran", items)
}

func (h *ViolationTypeHandler) Create(c *gin.Context) {
	var req violationTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.ViolationType{Name: req.Name, Category: req.Category, Point: req.Point}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jenis pelanggaran", nil)
		return
	}
	response.Created(c, "Jenis pelanggaran dibuat", item)
}

func (h *ViolationTypeHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req violationTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.ViolationType
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jenis pelanggaran tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Category = req.Category
	item.Point = req.Point
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jenis pelanggaran", nil)
		return
	}
	response.OK(c, "Jenis pelanggaran diperbarui", item)
}

func (h *ViolationTypeHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.ViolationType{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus jenis pelanggaran", nil)
		return
	}
	response.OK(c, "Jenis pelanggaran dihapus", nil)
}

// ---- CounselingAgenda (Agenda BK) ----

type CounselingAgendaHandler struct {
	db *gorm.DB
}

func NewCounselingAgendaHandler(db *gorm.DB) *CounselingAgendaHandler {
	return &CounselingAgendaHandler{db: db}
}

type counselingAgendaRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Location    string     `json:"location"`
	Date        *time.Time `json:"date"`
}

func (h *CounselingAgendaHandler) List(c *gin.Context) {
	var items []model.CounselingAgenda
	if err := h.db.Order("date desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil agenda BK", nil)
		return
	}
	response.OK(c, "Daftar agenda BK", items)
}

func (h *CounselingAgendaHandler) Create(c *gin.Context) {
	var req counselingAgendaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.CounselingAgenda{Title: req.Title, Description: req.Description, Location: req.Location, Date: req.Date}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan agenda BK", nil)
		return
	}
	response.Created(c, "Agenda BK dibuat", item)
}

func (h *CounselingAgendaHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req counselingAgendaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.CounselingAgenda
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Agenda BK tidak ditemukan", nil)
		return
	}
	item.Title = req.Title
	item.Description = req.Description
	item.Location = req.Location
	item.Date = req.Date
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan agenda BK", nil)
		return
	}
	response.OK(c, "Agenda BK diperbarui", item)
}

func (h *CounselingAgendaHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.CounselingAgenda{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus agenda BK", nil)
		return
	}
	response.OK(c, "Agenda BK dihapus", nil)
}
