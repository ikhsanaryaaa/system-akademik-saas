package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/util/password"
	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

type createUserRequest struct {
	Name     string      `json:"name" binding:"required"`
	Username string      `json:"username" binding:"required"`
	Email    string      `json:"email" binding:"omitempty,email"`
	Password string      `json:"password" binding:"required,min=6"`
	RoleIDs  []uuid.UUID `json:"role_ids"`
}

type updateUserRequest struct {
	Name     string      `json:"name" binding:"required"`
	Email    string      `json:"email" binding:"omitempty,email"`
	IsActive *bool       `json:"is_active"`
	RoleIDs  []uuid.UUID `json:"role_ids"`
}

// List mengembalikan seluruh user beserta role-nya.
func (h *UserHandler) List(c *gin.Context) {
	var users []model.User
	if err := h.db.Preload("Roles").Order("created_at desc").Find(&users).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil data user", nil)
		return
	}
	response.OK(c, "Daftar user", users)
}

// Detail mengembalikan satu user berdasarkan id.
func (h *UserHandler) Detail(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var user model.User
	if err := h.db.Preload("Roles").First(&user, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "User tidak ditemukan", nil)
		return
	}
	response.OK(c, "Detail user", user)
}

// Create membuat user baru dan menetapkan role.
func (h *UserHandler) Create(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	hash, err := password.Hash(req.Password)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal memproses password", nil)
		return
	}

	user := model.User{
		Name:         req.Name,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hash,
		IsActive:     true,
	}

	if len(req.RoleIDs) > 0 {
		var roles []model.Role
		if err := h.db.Where("id IN ?", req.RoleIDs).Find(&roles).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal mengambil role", nil)
			return
		}
		user.Roles = roles
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal membuat user, pastikan username unik", nil)
		return
	}

	response.Created(c, "User berhasil dibuat", user)
}

// Update mengubah data user dan role-nya.
func (h *UserHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}

	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var user model.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "User tidak ditemukan", nil)
		return
	}

	user.Name = req.Name
	user.Email = req.Email
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan user", nil)
		return
	}

	// Perbarui role bila dikirim.
	if req.RoleIDs != nil {
		var roles []model.Role
		if len(req.RoleIDs) > 0 {
			if err := h.db.Where("id IN ?", req.RoleIDs).Find(&roles).Error; err != nil {
				response.Error(c, http.StatusInternalServerError, "Gagal mengambil role", nil)
				return
			}
		}
		if err := h.db.Model(&user).Association("Roles").Replace(roles); err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal memperbarui role", nil)
			return
		}
	}

	h.db.Preload("Roles").First(&user, "id = ?", id)
	response.OK(c, "User berhasil diperbarui", user)
}

// Delete menghapus user.
func (h *UserHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.User{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus user", nil)
		return
	}
	response.OK(c, "User berhasil dihapus", nil)
}
