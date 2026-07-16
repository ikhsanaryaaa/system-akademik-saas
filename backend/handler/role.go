package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

type RoleHandler struct {
	db *gorm.DB
}

func NewRoleHandler(db *gorm.DB) *RoleHandler {
	return &RoleHandler{db: db}
}

// List mengembalikan seluruh role beserta permission-nya.
func (h *RoleHandler) List(c *gin.Context) {
	var roles []model.Role
	if err := h.db.Preload("Permissions").Order("name asc").Find(&roles).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil data role", nil)
		return
	}
	response.OK(c, "Daftar role", roles)
}
