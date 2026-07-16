package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// HealthHandler menangani endpoint health check.
type HealthHandler struct {
	db *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// Check mengembalikan status aplikasi dan koneksi database.
func (h *HealthHandler) Check(c *gin.Context) {
	dbStatus := "up"
	if sqlDB, err := h.db.DB(); err != nil || sqlDB.Ping() != nil {
		dbStatus = "down"
	}

	response.OK(c, "Service berjalan normal", gin.H{
		"status":   "ok",
		"database": dbStatus,
	})
}
