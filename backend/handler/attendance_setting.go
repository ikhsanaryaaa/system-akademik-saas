package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type AttendanceSettingHandler struct {
	db *gorm.DB
}

func NewAttendanceSettingHandler(db *gorm.DB) *AttendanceSettingHandler {
	return &AttendanceSettingHandler{db: db}
}

type attendanceSettingRequest struct {
	CheckInTime  string `json:"check_in_time" binding:"required"`
	CheckOutTime string `json:"check_out_time" binding:"required"`
}

// Get mengembalikan pengaturan jam absensi (satu baris). Bila belum ada, kembalikan null.
func (h *AttendanceSettingHandler) Get(c *gin.Context) {
	var setting model.AttendanceSetting
	err := h.db.First(&setting).Error
	if err == gorm.ErrRecordNotFound {
		response.OK(c, "Pengaturan absensi belum diatur", nil)
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pengaturan", nil)
		return
	}
	response.OK(c, "Pengaturan absensi", setting)
}

// Save membuat atau memperbarui satu baris pengaturan jam absensi.
func (h *AttendanceSettingHandler) Save(c *gin.Context) {
	var req attendanceSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var setting model.AttendanceSetting
	err := h.db.First(&setting).Error
	if err == gorm.ErrRecordNotFound {
		setting = model.AttendanceSetting{CheckInTime: req.CheckInTime, CheckOutTime: req.CheckOutTime}
		if err := h.db.Create(&setting).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan", nil)
			return
		}
		response.OK(c, "Pengaturan absensi disimpan", setting)
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil pengaturan", nil)
		return
	}

	setting.CheckInTime = req.CheckInTime
	setting.CheckOutTime = req.CheckOutTime
	if err := h.db.Save(&setting).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan", nil)
		return
	}
	response.OK(c, "Pengaturan absensi disimpan", setting)
}
