package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type AuditLogHandler struct {
	db *gorm.DB
}

func NewAuditLogHandler(db *gorm.DB) *AuditLogHandler {
	return &AuditLogHandler{db: db}
}

// List mengembalikan jejak audit dengan filter action, resource, pencarian
// username, plus pagination. Diurutkan dari yang terbaru.
func (h *AuditLogHandler) List(c *gin.Context) {
	q := h.db.Model(&model.AuditLog{})

	if v := c.Query("action"); v != "" {
		q = q.Where("action = ?", v)
	}
	if v := c.Query("resource"); v != "" {
		q = q.Where("resource = ?", v)
	}
	if v := c.Query("search"); v != "" {
		q = q.Where("username ILIKE ?", "%"+v+"%")
	}

	page, perPage, offset := paginate(c)

	var total int64
	q.Count(&total)

	var items []model.AuditLog
	if err := q.Order("created_at desc").Limit(perPage).Offset(offset).Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jejak audit", nil)
		return
	}

	response.OK(c, "Daftar jejak audit", gin.H{
		"items": items,
		"meta":  gin.H{"page": page, "per_page": perPage, "total": total},
	})
}
